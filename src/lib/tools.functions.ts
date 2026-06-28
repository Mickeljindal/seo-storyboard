import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * TOOL PAGES — server functions orchestrating the full lifecycle:
 *
 *   discover (idea bringer) → generate (developer) → publish (draft-first)
 *   sync existing → audit → optimize (additive, slug-safe)
 *
 * SAFETY:
 *   - New tools publish as DRAFT by default (human reviews before going live).
 *   - Optimizing existing pages NEVER changes the slug or the tool widget; it
 *     adds SEO sections + meta + schema. Always audit (and offer dry-run) first.
 */

function baseUrl(): string {
  const u = process.env.WP_SITE_URL?.trim() || "https://kloudbean.com";
  return u.replace(/\/+$/, "").replace(/^(?!https?:\/\/)/, "https://");
}

/** Signup-gate configuration from env (console.kloudbean.com by default). */
function gateConfig(slug: string): {
  signupUrl: string;
  mode: "soft" | "hard";
  freeUses: number;
  toolSlug: string;
  brand: string;
} {
  const signupUrl = (
    process.env.TOOL_SIGNUP_URL?.trim() || "https://console.kloudbean.com"
  ).replace(/\/+$/, "");
  const mode = process.env.TOOL_GATE_MODE?.trim() === "hard" ? "hard" : "soft";
  const freeUses = Number(process.env.TOOL_GATE_FREE || 1);
  return { signupUrl, mode, freeUses, toolSlug: slug, brand: "Kloudbean" };
}

/** Whether NEW tools should be gated by default (TOOL_GATE_DEFAULT=1). */
function gateOnByDefault(): boolean {
  return process.env.TOOL_GATE_DEFAULT === "1";
}

/** Derive a focus keyword from a page title when none is set. */
function keywordFromTitle(title: string): string {
  return title
    .replace(/\s*[-–—|]\s*kloudbean.*$/i, "")
    .replace(/\b(tool|free|online|calculator pro|pro)\b/gi, (m) =>
      m.toLowerCase() === "calculator pro" ? "calculator" : m,
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Build related-tool internal links from already-published tools in the DB. */
async function buildRelatedLinks(
  excludeId: string | null,
  limit = 4,
): Promise<{ anchor: string; url: string }[]> {
  try {
    const toolsRepo = await import("@/server/db/repos/tools");
    const published = await toolsRepo.listTools({ status: "published", limit: 30 });
    const optimized = await toolsRepo.listTools({ status: "optimized", limit: 30 });
    const all = [...published, ...optimized];
    const out: { anchor: string; url: string }[] = [];
    const seen = new Set<string>();
    for (const t of all) {
      if (t.id === excludeId) continue;
      const url = t.published_url || (t.url_slug ? `${baseUrl()}/${t.url_slug}` : null);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ anchor: t.name, url });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

// ============================================================================
// 1. DISCOVER — the idea bringer
// ============================================================================

export const discoverToolIdeasFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      geo: z.string().default("global"),
      limit: z.number().min(1).max(30).default(10),
      persist: z.boolean().default(true),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    return discoverToolIdeasInternal(data);
  });

export async function discoverToolIdeasInternal(data: {
  geo: string;
  limit: number;
  persist: boolean;
}): Promise<{ ok: boolean; ideas: unknown[]; stats: Record<string, unknown>; saved: number }> {
  const toolsRepo = await import("@/server/db/repos/tools");
  const { discoverToolIdeas } = await import("./tool-ideas");

  const { names, slugs } = await toolsRepo.listToolNamesAndSlugs();

  // Also dedupe against live WP tool pages when the plugin is configured.
  try {
    const { hasPluginConfigured, listToolPages } = await import("./wp-plugin-client");
    if (hasPluginConfigured()) {
      const wp = await listToolPages({ perPage: 100, page: 1, status: "any" });
      for (const p of wp.items ?? []) {
        if (p.title) names.add(p.title.trim().toLowerCase());
        if (p.slug) slugs.add(p.slug.trim().toLowerCase());
      }
    }
  } catch {
    /* dedupe vs WP is best-effort */
  }

  const { ideas, stats } = await discoverToolIdeas({
    geo: data.geo,
    limit: data.limit,
    existingNames: names,
    existingSlugs: slugs,
  });

  let saved: unknown[] = [];
  if (data.persist && ideas.length) {
    saved = await toolsRepo.insertTools(
      ideas.map((i) => ({
        name: i.name,
        url_slug: i.slug,
        target_keyword: i.target_keyword,
        secondary_keywords: i.secondary_keywords,
        category: i.category,
        geo_target: data.geo,
        status: "idea",
        origin: "discovered",
        volume: i.volume,
        difficulty: i.difficulty,
        demand_score: i.demand_score,
        idea_data: i,
        engine_source: "idea-bringer",
      })),
    );
  }

  return { ok: true, ideas, stats, saved: saved.length };
}

/**
 * Search-driven UNLIMITED idea pool. Expands real queries from live search,
 * scores by demand + audience fit, dedupes vs existing + WP pages, and persists
 * as status='pool' for the admin to curate (never auto-generated).
 */
export const discoverToolPoolFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      geo: z.string().default("global"),
      limit: z.number().min(1).max(120).default(60),
      minAudience: z.number().min(0).max(100).default(25),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const toolsRepo = await import("@/server/db/repos/tools");
    const { discoverToolIdeaPool } = await import("./tool-ideas");

    const { names, slugs } = await toolsRepo.listToolNamesAndSlugs();
    try {
      const { hasPluginConfigured, listToolPages } = await import("./wp-plugin-client");
      if (hasPluginConfigured()) {
        // Pull up to ~600 existing pages so we never re-propose what already exists.
        for (let page = 1; page <= 12; page++) {
          const wp = await listToolPages({ perPage: 50, page, status: "any" });
          for (const p of wp.items ?? []) {
            if (p.title) names.add(p.title.trim().toLowerCase());
            if (p.slug) slugs.add(p.slug.trim().toLowerCase());
          }
          if (!wp.ok || page >= wp.total_pages) break;
        }
      }
    } catch {
      /* dedupe vs WP is best-effort */
    }

    const { ideas, stats } = await discoverToolIdeaPool({
      geo: data.geo,
      limit: data.limit,
      minAudience: data.minAudience,
      existingNames: names,
      existingSlugs: slugs,
    });

    let saved = 0;
    if (ideas.length) {
      const rows = await toolsRepo.insertTools(
        ideas.map((i) => ({
          name: i.name,
          url_slug: i.slug,
          target_keyword: i.target_keyword,
          secondary_keywords: i.secondary_keywords,
          category: i.category,
          geo_target: data.geo,
          status: "pool",
          origin: "discovered",
          volume: i.volume,
          difficulty: i.difficulty,
          demand_score: i.demand_score,
          idea_data: i,
          engine_source: "idea-pool",
        })),
      );
      saved = rows.length;
    }

    return { ok: true, saved, stats, found: ideas.length };
  });

/** Remove an idea from the pool (kept as 'dismissed' so it isn't re-proposed). */
export const dismissToolFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ toolId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const toolsRepo = await import("@/server/db/repos/tools");
    await toolsRepo.updateTool(data.toolId, { status: "dismissed" });
    return { ok: true };
  });

// ============================================================================
// 2. GENERATE — the developer
// ============================================================================

export async function generateToolInternal(
  toolId: string,
): Promise<{ ok: boolean; error?: string; log?: string[] }> {
  const toolsRepo = await import("@/server/db/repos/tools");
  const tool = await toolsRepo.getToolById(toolId);
  if (!tool) return { ok: false, error: "Tool not found" };
  // Never regenerate a page that was synced from WordPress — those are optimized
  // additively (slug-safe), not rebuilt.
  if (tool.origin === "existing") {
    return { ok: false, error: "This is an existing WordPress page — use Optimize, not Generate." };
  }

  const idea = (tool.idea_data ?? {}) as Record<string, unknown>;
  const { generateToolPage } = await import("./tool-engine");
  const result = await generateToolPage({
    name: tool.name,
    slug: tool.url_slug ?? "",
    target_keyword: tool.target_keyword ?? (idea.target_keyword as string) ?? tool.name,
    secondary_keywords: tool.secondary_keywords ?? [],
    description: (idea.description as string) ?? tool.name,
    spec: (idea.spec as string) ?? "",
    kloudbean_angle:
      (idea.kloudbean_angle as string) ?? "Host and scale this workload on Kloudbean.",
    tool_type: (idea.tool_type as string) ?? undefined,
    category: tool.category ?? "Developer Tools",
    baseUrl: baseUrl(),
  });

  if (!result.ok) {
    await toolsRepo.updateTool(toolId, {
      status: "error",
      notes: result.error ?? "generation failed",
    });
    return { ok: false, error: result.error, log: result.log };
  }

  const { buildToolElementorData } = await import("./elementor-builder");
  const gateOn = gateOnByDefault();
  const elementorData = buildToolElementorData({
    h1: result.h1,
    toolHtml: result.tool_html,
    gate: gateOn ? gateConfig(tool.url_slug ?? "") : null,
  });

  await toolsRepo.updateTool(toolId, {
    status: "generated",
    tool_html: result.tool_html,
    seo_content: result.seo,
    meta_title: result.meta_title,
    meta_description: result.meta_description,
    schema_jsonld: result.schema_jsonld,
    elementor_data: elementorData,
    gate_enabled: gateOn ? "yes" : "no",
    gate_mode: gateOn ? gateConfig(tool.url_slug ?? "").mode : null,
  });

  return { ok: true, log: result.log };
}

export const generateToolFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ toolId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const r = await generateToolInternal(data.toolId);
    if (!r.ok) throw new Error(r.error ?? "Tool generation failed");
    return r;
  });

// ============================================================================
// 3. PUBLISH — draft-first
// ============================================================================

export async function publishToolInternal(
  toolId: string,
  status: "draft" | "publish",
): Promise<{ ok: boolean; link?: string; postId?: number; error?: string }> {
  const toolsRepo = await import("@/server/db/repos/tools");
  const tool = await toolsRepo.getToolById(toolId);
  if (!tool) return { ok: false, error: "Tool not found" };
  if (!tool.elementor_data || !tool.tool_html) {
    return { ok: false, error: "Generate the tool before publishing." };
  }

  const { hasPluginConfigured, publishTool } = await import("./wp-plugin-client");
  if (!hasPluginConfigured()) {
    return {
      ok: false,
      error: "WordPress plugin not configured (WP_PLUGIN_URL + WP_PLUGIN_API_KEY).",
    };
  }

  const res = await publishTool({
    title: tool.name,
    slug: tool.url_slug ?? undefined,
    status,
    category: tool.category ?? "Developer Tools",
    meta_title: tool.meta_title ?? tool.name,
    meta_description: tool.meta_description ?? "",
    focus_keyword: tool.target_keyword ?? "",
    secondary_keywords: tool.secondary_keywords ?? [],
    canonical_url: tool.url_slug ? `${baseUrl()}/${tool.url_slug}` : undefined,
    schema_jsonld: tool.schema_jsonld,
    elementor_data: tool.elementor_data as unknown[],
    existing_post_id: tool.wp_post_id ?? undefined,
  });

  if (!res.ok) {
    return { ok: false, error: res.error ?? "Publish failed" };
  }

  await toolsRepo.updateTool(toolId, {
    status: status === "publish" ? "published" : "review",
    wp_post_id: res.post_id ?? tool.wp_post_id,
    published_url: res.link ?? tool.published_url,
    url_slug: res.slug ?? tool.url_slug,
    published_at: status === "publish" ? new Date() : undefined,
  });

  return { ok: true, link: res.link, postId: res.post_id };
}

export const publishToolFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ toolId: z.string().uuid(), status: z.enum(["draft", "publish"]).default("draft") })
      .parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const r = await publishToolInternal(data.toolId, data.status);
    if (!r.ok) throw new Error(r.error ?? "Publish failed");
    return r;
  });

// ============================================================================
// 4. SYNC EXISTING WP TOOL PAGES → DB
// ============================================================================

export const syncExistingToolsFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      category: z.string().default("Developer Tools"),
      maxPages: z.number().min(1).max(20).default(10),
      perPage: z.number().min(1).max(100).default(50),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    return syncExistingToolsInternal(data);
  });

export async function syncExistingToolsInternal(data: {
  category: string;
  maxPages: number;
  perPage: number;
}): Promise<{
  ok: boolean;
  imported: number;
  totalPages: number;
  avgAioseoScore: number | null;
  lowScorers: number;
}> {
  const { hasPluginConfigured, listToolPages } = await import("./wp-plugin-client");
  if (!hasPluginConfigured()) throw new Error("WordPress plugin not configured.");
  const toolsRepo = await import("@/server/db/repos/tools");

  let imported = 0;
  let totalPages = 1;
  const scores: number[] = [];
  for (let page = 1; page <= data.maxPages; page++) {
    const list = await listToolPages({
      category: data.category,
      perPage: data.perPage,
      page,
      status: "any",
    });
    if (!list.ok) throw new Error(list.error ?? "Failed to list tool pages");
    totalPages = list.total_pages;
    for (const p of list.items) {
      await toolsRepo.upsertExistingTool({
        wp_post_id: p.id,
        name: p.title,
        url_slug: p.slug,
        published_url: p.link,
        aioseo_score_before: p.aioseo_score,
        target_keyword: p.focus_keyword || keywordFromTitle(p.title),
      });
      imported++;
      if (typeof p.aioseo_score === "number") scores.push(p.aioseo_score);
    }
    if (page >= totalPages) break;
  }

  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const lowScorers = scores.filter((s) => s < 70).length;
  return { ok: true, imported, totalPages, avgAioseoScore: avg, lowScorers };
}

// ============================================================================
// 5. AUDIT — read-only diagnosis of an existing page
// ============================================================================

export async function auditToolInternal(
  toolId: string,
): Promise<{ ok: boolean; audit?: Record<string, unknown>; error?: string }> {
  const toolsRepo = await import("@/server/db/repos/tools");
  const tool = await toolsRepo.getToolById(toolId);
  if (!tool) return { ok: false, error: "Tool not found" };
  if (!tool.wp_post_id) return { ok: false, error: "Tool has no WordPress page to audit." };

  const { hasPluginConfigured, getToolPage } = await import("./wp-plugin-client");
  if (!hasPluginConfigured()) return { ok: false, error: "WordPress plugin not configured." };

  const detail = await getToolPage(tool.wp_post_id);
  if (!("elementor_data" in detail) || detail.ok === false) {
    return { ok: false, error: (detail as { error?: string }).error ?? "Failed to fetch page" };
  }

  const { analyzeElementorData } = await import("./elementor-builder");
  const analysis = analyzeElementorData(detail.elementor_data ?? []);

  const missing: string[] = [];
  if (!analysis.h1Count && !analysis.h2Count) missing.push("no headings");
  if (analysis.wordCount < 250) missing.push(`thin content (${analysis.wordCount} words)`);
  if (!analysis.hasFaq) missing.push("no FAQ");
  if (!analysis.hasJsonLd && !detail.aioseo?.score) missing.push("no schema");
  if (!detail.aioseo?.focus_keyword) missing.push("no focus keyword");

  const audit = {
    post_id: tool.wp_post_id,
    slug: detail.slug,
    has_elementor: detail.has_elementor,
    word_count: analysis.wordCount,
    h1_count: analysis.h1Count,
    h2_count: analysis.h2Count,
    has_faq: analysis.hasFaq,
    has_jsonld: analysis.hasJsonLd,
    html_widgets: analysis.htmlWidgetCount,
    aioseo_score: detail.aioseo?.score ?? null,
    focus_keyword: detail.aioseo?.focus_keyword ?? "",
    missing,
    recommendation: missing.length
      ? `Add: ${missing.join(", ")}. Optimizer will inject intro + FAQ + schema and set the focus keyword (slug unchanged).`
      : "Page looks healthy; optimizer would only refresh meta/schema.",
  };

  await toolsRepo.updateTool(toolId, {
    audit_report: audit,
    aioseo_score_before: detail.aioseo?.score ?? tool.aioseo_score_before,
    target_keyword:
      tool.target_keyword || detail.aioseo?.focus_keyword || keywordFromTitle(tool.name),
  });

  return { ok: true, audit };
}

export const auditToolFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ toolId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const r = await auditToolInternal(data.toolId);
    if (!r.ok) throw new Error(r.error ?? "Audit failed");
    return r;
  });

// ============================================================================
// 6. OPTIMIZE — additive, slug-safe
// ============================================================================

export async function optimizeToolInternal(
  toolId: string,
  dryRun: boolean,
): Promise<{ ok: boolean; report?: Record<string, unknown>; error?: string }> {
  const toolsRepo = await import("@/server/db/repos/tools");
  const tool = await toolsRepo.getToolById(toolId);
  if (!tool) return { ok: false, error: "Tool not found" };
  if (!tool.wp_post_id) return { ok: false, error: "Tool has no WordPress page." };

  // Ensure we have a fresh audit (drives injection flags).
  const auditRes = await auditToolInternal(toolId);
  if (!auditRes.ok || !auditRes.audit)
    return { ok: false, error: auditRes.error ?? "Audit failed" };
  const audit = auditRes.audit as {
    has_elementor: boolean;
    has_faq: boolean;
    has_jsonld: boolean;
    word_count: number;
    focus_keyword: string;
    slug: string;
  };

  const keyword = tool.target_keyword || audit.focus_keyword || keywordFromTitle(tool.name);

  // Generate the SEO wrapper (no tool HTML — the tool already exists).
  const { generateToolSeo } = await import("./tool-engine");
  const seoRes = await generateToolSeo({
    name: tool.name,
    slug: tool.url_slug ?? audit.slug ?? "",
    target_keyword: keyword,
    secondary_keywords: tool.secondary_keywords ?? [],
    description: `${tool.name} — a free interactive tool from Kloudbean.`,
    spec: "",
    kloudbean_angle: "Host and scale the apps that use this on Kloudbean managed cloud.",
    category: tool.category ?? "Developer Tools",
    baseUrl: baseUrl(),
  });

  const related = await buildRelatedLinks(toolId);
  const { buildInjectionPlan } = await import("./elementor-builder");

  // Schema: inject as an on-page widget only when Elementor-built AND not present.
  const injectSchema = audit.has_elementor && !audit.has_jsonld ? seoRes.schema_jsonld : undefined;
  const plan = buildInjectionPlan({
    seo: seoRes.seo,
    related,
    schemaJsonld: injectSchema,
    flags: {
      hasIntro: audit.word_count > 400,
      hasFaq: audit.has_faq,
      hasHowTo: false,
    },
  });

  const { optimizeTool } = await import("./wp-plugin-client");
  const res = await optimizeTool({
    post_id: tool.wp_post_id,
    prepend: plan.prepend,
    append: plan.append,
    meta_title: seoRes.meta_title,
    meta_description: seoRes.meta_description,
    focus_keyword: keyword,
    secondary_keywords: tool.secondary_keywords ?? [],
    canonical_url: audit.slug ? `${baseUrl()}/${audit.slug}` : undefined,
    // For non-Elementor pages the plugin appends schema to content; for Elementor
    // pages we already injected it as a widget (avoid duplicate JSON-LD).
    schema_jsonld: audit.has_elementor
      ? undefined
      : audit.has_jsonld
        ? undefined
        : seoRes.schema_jsonld,
    dry_run: dryRun,
  });

  if (!res.ok) return { ok: false, error: res.error ?? "Optimize failed" };

  if (!dryRun) {
    await toolsRepo.updateTool(toolId, {
      status: "optimized",
      seo_content: seoRes.seo,
      meta_title: seoRes.meta_title,
      meta_description: seoRes.meta_description,
      schema_jsonld: seoRes.schema_jsonld,
      target_keyword: keyword,
      optimized_at: new Date(),
      notes: `Optimized: added ${plan.added.join(", ") || "meta only"} (slug unchanged).`,
    });
  }

  return { ok: true, report: { ...res, added: plan.added, dry_run: dryRun } };
}

export const optimizeToolFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ toolId: z.string().uuid(), dryRun: z.boolean().default(true) }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const r = await optimizeToolInternal(data.toolId, data.dryRun);
    if (!r.ok) throw new Error(r.error ?? "Optimize failed");
    return r;
  });

// ============================================================================
// 6b. SIGNUP GATE — enable/disable the lead-gen gate on a tool's WP page
// ============================================================================

export async function setToolGateInternal(
  toolId: string,
  enable: boolean,
  mode: "soft" | "hard",
): Promise<{ ok: boolean; report?: Record<string, unknown>; error?: string }> {
  const toolsRepo = await import("@/server/db/repos/tools");
  const tool = await toolsRepo.getToolById(toolId);
  if (!tool) return { ok: false, error: "Tool not found" };
  if (!tool.wp_post_id) return { ok: false, error: "Tool has no published WordPress page yet." };

  const { hasPluginConfigured, optimizeTool } = await import("./wp-plugin-client");
  if (!hasPluginConfigured()) return { ok: false, error: "WordPress plugin not configured." };

  const { GATE_MARKER } = await import("./tool-gate");
  const { buildGateSection } = await import("./elementor-builder");

  // Always strip any existing gate first (idempotent), then append the new one
  // when enabling. Slug + tool widget are untouched.
  const cfg = gateConfig(tool.url_slug ?? "");
  cfg.mode = mode;
  const append = enable ? [buildGateSection(cfg)] : [];

  const res = await optimizeTool({
    post_id: tool.wp_post_id,
    append,
    strip_marker: GATE_MARKER,
    dry_run: false,
  });
  if (!res.ok) return { ok: false, error: res.error ?? "Gate update failed" };

  await toolsRepo.updateTool(toolId, {
    gate_enabled: enable ? "yes" : "no",
    gate_mode: enable ? mode : null,
    notes: enable ? `Signup gate ON (${mode}) → ${cfg.signupUrl}` : "Signup gate removed.",
  });

  return { ok: true, report: { ...res, gate_enabled: enable, gate_mode: enable ? mode : null } };
}

export const setToolGateFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      toolId: z.string().uuid(),
      enable: z.boolean(),
      mode: z.enum(["soft", "hard"]).default("soft"),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const r = await setToolGateInternal(data.toolId, data.enable, data.mode);
    if (!r.ok) throw new Error(r.error ?? "Gate update failed");
    return r;
  });

// ============================================================================
// 6c. MANUAL ADD — create a tool idea by hand (name + keyword)
// ============================================================================

export const addToolFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(2).max(120),
      targetKeyword: z.string().max(120).optional(),
      description: z.string().max(600).optional(),
      spec: z.string().max(1200).optional(),
      slug: z.string().max(90).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const toolsRepo = await import("@/server/db/repos/tools");
    const { slugify } = await import("./tool-catalog");

    const slug = (data.slug ? slugify(data.slug) : slugify(data.name)) || slugify(data.name);
    const keyword = data.targetKeyword?.trim() || keywordFromTitle(data.name);
    const idea = {
      name: data.name.trim(),
      slug,
      category: "Developer Tools",
      tool_type: "tool",
      target_keyword: keyword,
      secondary_keywords: [],
      description:
        data.description?.trim() || `${data.name.trim()} — a free interactive tool from Kloudbean.`,
      spec: data.spec?.trim() || "",
      kloudbean_angle: "Host and scale the apps that use this on Kloudbean managed cloud.",
    };

    const tool = await toolsRepo.insertTool({
      name: idea.name,
      url_slug: slug,
      target_keyword: keyword,
      category: "Developer Tools",
      status: "pool",
      origin: "manual",
      idea_data: idea,
      engine_source: "manual-add",
    });

    return { ok: true, tool };
  });

// ============================================================================
// 7. AUTOPILOT — scheduled tools cycle (discover → generate → publish → optimize)
// ============================================================================

export type ToolsCycleConfig = {
  geo: string;
  sync: boolean;
  discover: boolean;
  discoverCount: number;
  generateCount: number;
  /** "off" = don't publish, "draft" = publish as draft, "publish" = go live */
  publishStatus: "off" | "draft" | "publish";
  optimizeCount: number;
};

export type ToolsCycleResult = {
  synced: number;
  discovered: number;
  generated: number;
  published: number;
  optimized: number;
  errors: string[];
  log: string[];
};

/**
 * One autonomous tools cycle. Mirrors the article autopilot but for tool pages:
 * sync existing → discover ideas → generate → publish (draft by default) →
 * optimize the worst-scoring existing pages (additive, slug-safe).
 */
export async function runToolsCycleInternal(cfg: ToolsCycleConfig): Promise<ToolsCycleResult> {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const result: ToolsCycleResult = {
    synced: 0,
    discovered: 0,
    generated: 0,
    published: 0,
    optimized: 0,
    errors: [],
    log: [],
  };
  const log = (m: string) => result.log.push(m);

  const { hasPluginConfigured } = await import("./wp-plugin-client");
  const { hasAiCredentials } = await import("./ai-provider");
  const pluginReady = hasPluginConfigured();
  const aiReady = hasAiCredentials();
  const toolsRepo = await import("@/server/db/repos/tools");

  // 1. Sync existing WP tool pages (so optimizer has fresh targets + scores).
  if (cfg.sync && pluginReady) {
    try {
      const s = await syncExistingToolsInternal({
        category: "Developer Tools",
        maxPages: 10,
        perPage: 50,
      });
      result.synced = s.imported;
      log(
        `synced ${s.imported} existing pages (avg AIOSEO ${s.avgAioseoScore ?? "?"}, ${s.lowScorers} below 70)`,
      );
    } catch (e) {
      result.errors.push(`sync: ${String((e as Error)?.message ?? e)}`);
    }
  }

  // 2. Discover new tool ideas.
  if (cfg.discover) {
    try {
      const d = await discoverToolIdeasInternal({
        geo: cfg.geo,
        limit: cfg.discoverCount,
        persist: true,
      });
      result.discovered = d.saved;
      log(`discovered ${d.saved} new ideas`);
    } catch (e) {
      result.errors.push(`discover: ${String((e as Error)?.message ?? e)}`);
    }
  }

  // 3. Generate pending ideas into full tools.
  if (aiReady && cfg.generateCount > 0) {
    const pending = await toolsRepo.listTools({ status: "idea", limit: cfg.generateCount });
    for (const t of pending) {
      try {
        const r = await generateToolInternal(t.id);
        if (r.ok) result.generated++;
        else result.errors.push(`generate ${t.name}: ${r.error}`);
      } catch (e) {
        result.errors.push(`generate ${t.name}: ${String((e as Error)?.message ?? e)}`);
      }
    }
    if (result.generated) log(`generated ${result.generated} tools`);
  }

  // 4. Publish generated tools (DRAFT by default — human reviews before live).
  if (cfg.publishStatus !== "off" && pluginReady) {
    const ready = await toolsRepo.listTools({ status: "generated", limit: cfg.generateCount || 5 });
    for (const t of ready) {
      try {
        const r = await publishToolInternal(t.id, cfg.publishStatus);
        if (r.ok) result.published++;
        else result.errors.push(`publish ${t.name}: ${r.error}`);
      } catch (e) {
        result.errors.push(`publish ${t.name}: ${String((e as Error)?.message ?? e)}`);
      }
    }
    if (result.published) log(`published ${result.published} tools as ${cfg.publishStatus}`);
  }

  // 5. Optimize the worst-scoring existing pages (additive, slug-safe).
  if (cfg.optimizeCount > 0 && pluginReady && aiReady) {
    const candidates = await toolsRepo.listOptimizationCandidates(cfg.optimizeCount);
    for (const t of candidates) {
      try {
        const r = await optimizeToolInternal(t.id, false);
        if (r.ok) result.optimized++;
        else result.errors.push(`optimize ${t.name}: ${r.error}`);
      } catch (e) {
        result.errors.push(`optimize ${t.name}: ${String((e as Error)?.message ?? e)}`);
      }
      // gentle pacing between live writes
      await new Promise((res) => setTimeout(res, 400));
    }
    if (result.optimized) log(`optimized ${result.optimized} existing pages (slugs unchanged)`);
  }

  return result;
}

export const runToolsCycleFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      geo: z.string().default("global"),
      sync: z.boolean().default(true),
      discover: z.boolean().default(true),
      discoverCount: z.number().min(0).max(20).default(5),
      generateCount: z.number().min(0).max(10).default(2),
      publishStatus: z.enum(["off", "draft", "publish"]).default("draft"),
      optimizeCount: z.number().min(0).max(20).default(3),
    }).parse,
  )
  .handler(async ({ data }) => {
    return runToolsCycleInternal(data);
  });

// ============================================================================
// 8. DASHBOARD reads
// ============================================================================

export const listToolsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({ status: z.string().optional(), limit: z.number().min(1).max(2000).default(1000) })
      .parse,
  )
  .handler(async ({ data }) => {
    const toolsRepo = await import("@/server/db/repos/tools");
    const items = await toolsRepo.listTools({ status: data.status, limit: data.limit });
    const total = await toolsRepo.countTools();
    return { ok: true, total, items };
  });

export const toolsStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { hasPluginConfigured, pingPlugin } = await import("./wp-plugin-client");
  const { hasAiCredentials } = await import("./ai-provider");
  const pluginConfigured = hasPluginConfigured();
  let pluginOk = false;
  let aioseo = false;
  if (pluginConfigured) {
    const ping = await pingPlugin();
    pluginOk = ping.ok;
    aioseo = !!ping.aioseo;
  }
  return { pluginConfigured, pluginOk, aioseo, aiReady: hasAiCredentials() };
});
