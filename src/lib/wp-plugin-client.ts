import "@tanstack/react-start/server-only";
import { loadProjectEnv } from "./load-env";

/**
 * CLIENT for the Kloudbean SEO Engine WordPress plugin.
 *
 * Talks to /wp-json/kbseo/v1/* on the WP site. Handles publishing with full
 * on-page SEO (AIOSEO meta, featured image, categories, TOC, internal link
 * backfill, sitemap ping) in ONE call.
 *
 * Falls back to the basic WP REST API if the plugin isn't installed.
 */

export type PluginPublishPayload = {
  title: string;
  content: string;
  slug?: string;
  status: "draft" | "publish" | "future";
  publish_date?: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  secondary_keywords?: string[];
  canonical_url?: string;
  featured_image_url?: string;
  og_image_url?: string;
  category?: string;
  tags?: string[];
  schema_jsonld?: unknown;
  toc?: boolean;
  reading_time?: number;
  excerpt?: string;
  existing_post_id?: number | null;
};

export type PluginPublishResult = {
  ok: boolean;
  post_id?: number;
  link?: string;
  status?: string;
  created?: boolean;
  error?: string;
};

function getPluginConfig(): { url: string; key: string } | null {
  loadProjectEnv();
  const base = process.env.WP_PLUGIN_URL?.trim() || process.env.WP_SITE_URL?.trim();
  const key = process.env.WP_PLUGIN_API_KEY?.trim();
  if (!base || !key) return null;
  // Normalize: if base doesn't include /wp-json/kbseo/v1, add it
  const url = base.includes("kbseo/v1")
    ? base.replace(/\/$/, "")
    : `${base.replace(/\/$/, "")}/wp-json/kbseo/v1`;
  return { url, key };
}

export function hasPluginConfigured(): boolean {
  return !!getPluginConfig();
}

/** Check if the plugin is reachable and active. */
export async function pingPlugin(): Promise<{
  ok: boolean;
  aioseo?: boolean;
  version?: string;
  error?: string;
}> {
  const cfg = getPluginConfig();
  if (!cfg) return { ok: false, error: "WP_PLUGIN_URL and WP_PLUGIN_API_KEY not set in .env" };
  try {
    const res = await fetch(`${cfg.url}/health`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const json = (await res.json()) as { ok?: boolean; aioseo?: boolean; version?: string };
    return { ok: !!json.ok, aioseo: json.aioseo, version: json.version };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/** Publish/update a post via the plugin endpoint (full on-page SEO in one call). */
export async function publishViaPlugin(
  payload: PluginPublishPayload,
): Promise<PluginPublishResult> {
  const cfg = getPluginConfig();
  if (!cfg) return { ok: false, error: "Plugin not configured" };

  try {
    const res = await fetch(`${cfg.url}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KB-API-Key": cfg.key,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    });
    const text = await res.text();
    if (!res.ok) {
      let detail = text.slice(0, 300);
      try {
        detail = (JSON.parse(text) as { message?: string }).message ?? detail;
      } catch {
        /* keep raw text */
      }
      return { ok: false, error: `Plugin HTTP ${res.status}: ${detail}` };
    }
    const json = JSON.parse(text) as PluginPublishResult;
    return { ok: true, ...json };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/** Trigger an on-page SEO audit via the plugin. */
export async function auditPost(postId: number): Promise<Record<string, unknown> | null> {
  const cfg = getPluginConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/audit/${postId}`, {
      headers: { "X-KB-API-Key": cfg.key },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Trigger internal link injection via the plugin. */
export async function injectLinks(
  links: { target_post_id: number; anchor: string; inject_into_post_ids: number[] }[],
): Promise<boolean> {
  const cfg = getPluginConfig();
  if (!cfg || !links.length) return false;
  try {
    const res = await fetch(`${cfg.url}/inject-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-KB-API-Key": cfg.key },
      body: JSON.stringify({ links }),
      signal: AbortSignal.timeout(30_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// TOOL PAGES (Elementor-native) — list / audit / publish / optimize
// ============================================================================

export type ToolPageListItem = {
  id: number;
  title: string;
  slug: string;
  link: string;
  status: string;
  modified: string;
  has_elementor: boolean;
  aioseo_score: number | null;
  focus_keyword: string;
  meta_title: string;
};

export type ToolPageList = {
  ok: boolean;
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  items: ToolPageListItem[];
  category?: string;
  category_found?: boolean;
  taxonomy?: string | null;
  error?: string;
};

export type WpCategory = {
  id: number;
  name: string;
  slug: string;
  taxonomy?: string;
  page_count: number;
};

export type ToolPageDetail = {
  ok: boolean;
  id: number;
  title: string;
  slug: string;
  link: string;
  status: string;
  edit_mode: string;
  has_elementor: boolean;
  elementor_data: unknown[] | null;
  post_content: string;
  aioseo: { score: number | null; focus_keyword: string; title: string; description: string };
  error?: string;
};

async function pluginGet<T>(path: string): Promise<T | { ok: false; error: string }> {
  const cfg = getPluginConfig();
  if (!cfg) return { ok: false, error: "Plugin not configured" };
  try {
    const res = await fetch(`${cfg.url}${path}`, {
      headers: { "X-KB-API-Key": cfg.key },
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    if (!res.ok) {
      let detail = text.slice(0, 300);
      try {
        detail = (JSON.parse(text) as { message?: string }).message ?? detail;
      } catch {
        /* keep raw text */
      }
      return { ok: false, error: `Plugin HTTP ${res.status}: ${detail}` };
    }
    return JSON.parse(text) as T;
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

async function pluginPost<T>(
  path: string,
  body: unknown,
): Promise<T | { ok: false; error: string }> {
  const cfg = getPluginConfig();
  if (!cfg) return { ok: false, error: "Plugin not configured" };
  try {
    const res = await fetch(`${cfg.url}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-KB-API-Key": cfg.key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
    const text = await res.text();
    if (!res.ok) {
      let detail = text.slice(0, 400);
      try {
        detail = (JSON.parse(text) as { message?: string }).message ?? detail;
      } catch {
        /* keep raw text */
      }
      return { ok: false, error: `Plugin HTTP ${res.status}: ${detail}` };
    }
    return JSON.parse(text) as T;
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/** List existing tool pages in a category (with AIOSEO score + Elementor info). */
export async function listToolPages(
  opts: {
    category?: string;
    categoryId?: number;
    perPage?: number;
    page?: number;
    status?: string;
  } = {},
): Promise<ToolPageList> {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  if (opts.categoryId) params.set("category_id", String(opts.categoryId));
  params.set("per_page", String(opts.perPage ?? 50));
  params.set("page", String(opts.page ?? 1));
  if (opts.status) params.set("status", opts.status);
  const r = await pluginGet<ToolPageList>(`/tools/list?${params.toString()}`);
  if (!("items" in r)) {
    return {
      ok: false,
      total: 0,
      page: 1,
      per_page: 0,
      total_pages: 0,
      items: [],
      error: (r as { error: string }).error,
    };
  }
  return r;
}

/** List WordPress categories that contain pages (for the category picker). */
export async function listToolCategories(): Promise<WpCategory[]> {
  const r = await pluginGet<{ ok?: boolean; categories?: WpCategory[] }>("/categories");
  return "categories" in r && Array.isArray(r.categories) ? r.categories : [];
}

/** Fetch one tool page's full Elementor data + meta (audit, no writes). */
export async function getToolPage(
  postId: number,
): Promise<ToolPageDetail | { ok: false; error: string }> {
  return pluginGet<ToolPageDetail>(`/tools/get/${postId}`);
}

export type PublishToolPayload = {
  title: string;
  slug?: string;
  status: "draft" | "publish";
  category?: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  secondary_keywords?: string[];
  canonical_url?: string;
  schema_jsonld?: unknown;
  elementor_data: unknown[];
  existing_post_id?: number | null;
};

export type PublishToolResult = {
  ok: boolean;
  post_id?: number;
  link?: string;
  slug?: string;
  status?: string;
  created?: boolean;
  error?: string;
};

/** Create/update a tool PAGE (Elementor-native). */
export async function publishTool(payload: PublishToolPayload): Promise<PublishToolResult> {
  const r = await pluginPost<PublishToolResult>("/publish-tool", payload);
  return "post_id" in r || "ok" in r
    ? (r as PublishToolResult)
    : { ok: false, error: (r as { error: string }).error };
}

export type OptimizeToolPayload = {
  post_id: number;
  prepend?: unknown[];
  append?: unknown[];
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  secondary_keywords?: string[];
  canonical_url?: string;
  schema_jsonld?: unknown;
  strip_marker?: string;
  dry_run?: boolean;
};

export type OptimizeToolResult = {
  ok: boolean;
  post_id?: number;
  slug?: string;
  link?: string;
  has_elementor?: boolean;
  existing_sections?: number;
  existing_sections_after?: number;
  stripped_widgets?: number;
  will_prepend?: number;
  will_append?: number;
  injected_elementor?: boolean;
  updated_meta?: boolean;
  appended_schema_to_content?: boolean;
  dry_run?: boolean;
  error?: string;
};

/** Additively optimize an existing tool page (slug-preserving). */
export async function optimizeTool(payload: OptimizeToolPayload): Promise<OptimizeToolResult> {
  const r = await pluginPost<OptimizeToolResult>("/optimize-tool", payload);
  return "ok" in r
    ? (r as OptimizeToolResult)
    : { ok: false, error: (r as { error: string }).error };
}

/** Per-slug gate-hit counters (signup-CTA clicks). */
export async function getGateStats(): Promise<Record<string, number>> {
  const r = await pluginGet<{ ok?: boolean; hits?: Record<string, number> }>("/gate-stats");
  return "hits" in r && r.hits ? r.hits : {};
}

/** Restore a page's Elementor data to a snapshot (rollback an optimize). */
export async function restoreTool(
  postId: number,
  elementorData: unknown[],
): Promise<{ ok: boolean; error?: string }> {
  const r = await pluginPost<{ ok?: boolean }>("/tools/restore", {
    post_id: postId,
    elementor_data: elementorData,
  });
  return "ok" in r
    ? { ok: !!(r as { ok?: boolean }).ok }
    : { ok: false, error: (r as { error: string }).error };
}

/**
 * Fetch the IndexNow key the plugin owns + hosts. The plugin auto-generates one
 * on first call and serves it as a plain key file, so the engine just reuses it.
 */
export async function getIndexNowKey(): Promise<{ key: string; keyLocation: string } | null> {
  const r = await pluginGet<{ ok?: boolean; key?: string; key_location?: string }>(
    "/indexnow-key?format=json",
  );
  if ("key" in r && r.key) {
    return { key: r.key, keyLocation: r.key_location ?? "" };
  }
  return null;
}

export type PluginConversion = {
  event?: string;
  source_slug?: string | null;
  source_url?: string | null;
  surface?: string | null;
  ref?: string | null;
  plan?: string | null;
  value?: number | null;
  currency?: string | null;
  external_id?: string | null;
  occurred_at?: string | null;
};

/** Pull buffered conversion events from the plugin webhook. */
export async function getConversions(since?: string): Promise<PluginConversion[]> {
  const q = since ? `?since=${encodeURIComponent(since)}` : "";
  const r = await pluginGet<{ ok?: boolean; conversions?: PluginConversion[] }>(`/conversions${q}`);
  return "conversions" in r && Array.isArray(r.conversions) ? r.conversions : [];
}
