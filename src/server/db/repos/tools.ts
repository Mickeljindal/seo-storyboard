import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiTool, type ApiTool } from "../map";

const { tools } = schema;

type ToolPatch = Record<string, unknown>;

const COL_MAP: Record<string, keyof typeof tools.$inferInsert> = {
  name: "name",
  url_slug: "urlSlug",
  target_keyword: "targetKeyword",
  secondary_keywords: "secondaryKeywords",
  category: "category",
  geo_target: "geoTarget",
  status: "status",
  origin: "origin",
  wp_post_id: "wpPostId",
  published_url: "publishedUrl",
  meta_title: "metaTitle",
  meta_description: "metaDescription",
  word_count: "wordCount",
  tool_html: "toolHtml",
  seo_content: "seoContent",
  schema_jsonld: "schemaJsonld",
  elementor_data: "elementorData",
  idea_data: "ideaData",
  volume: "volume",
  difficulty: "difficulty",
  demand_score: "demandScore",
  quality_score: "qualityScore",
  quality_report: "qualityReport",
  aioseo_score_before: "aioseoScoreBefore",
  aioseo_score_after: "aioseoScoreAfter",
  gsc_clicks: "gscClicks",
  gsc_impressions: "gscImpressions",
  gsc_position: "gscPosition",
  gate_clicks: "gateClicks",
  perf_synced_at: "perfSyncedAt",
  audit_report: "auditReport",
  optimize_report: "optimizeReport",
  elementor_snapshot: "elementorSnapshot",
  gate_enabled: "gateEnabled",
  gate_mode: "gateMode",
  notes: "notes",
  engine_source: "engineSource",
  published_at: "publishedAt",
  optimized_at: "optimizedAt",
};

function toInsert(data: ToolPatch): typeof tools.$inferInsert {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    const col = COL_MAP[k];
    if (col) row[col] = v;
  }
  // name is required
  if (!row.name) row.name = (data.name as string) ?? "Untitled tool";
  return row as typeof tools.$inferInsert;
}

export async function countTools(): Promise<number> {
  const db = await getDb();
  const [r] = await db.select({ c: count() }).from(tools);
  return Number(r?.c ?? 0);
}

export async function listTools(opts?: {
  status?: string;
  origin?: string;
  limit?: number;
  orderBy?: "updated_at" | "created_at" | "aioseo";
}): Promise<ApiTool[]> {
  const db = await getDb();
  let q = db.select().from(tools).$dynamic();
  const conds = [];
  if (opts?.status) conds.push(eq(tools.status, opts.status));
  if (opts?.origin) conds.push(eq(tools.origin, opts.origin));
  if (conds.length) q = q.where(and(...conds));
  if (opts?.orderBy === "aioseo") q = q.orderBy(asc(tools.aioseoScoreBefore));
  else if (opts?.orderBy === "created_at") q = q.orderBy(desc(tools.createdAt));
  else q = q.orderBy(desc(tools.updatedAt));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  return rows.map(toApiTool);
}

export async function getToolById(id: string): Promise<ApiTool | null> {
  const db = await getDb();
  const [row] = await db.select().from(tools).where(eq(tools.id, id)).limit(1);
  return row ? toApiTool(row) : null;
}

/** Bulk name lookup (id -> name) — for labeling batch job logs without N queries. */
export async function getToolNamesByIds(ids: string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map();
  const db = await getDb();
  const { inArray } = await import("drizzle-orm");
  const rows = await db
    .select({ id: tools.id, name: tools.name })
    .from(tools)
    .where(inArray(tools.id, ids));
  return new Map(rows.map((r) => [r.id, r.name]));
}

export async function getToolByWpPostId(wpPostId: number): Promise<ApiTool | null> {
  const db = await getDb();
  const [row] = await db.select().from(tools).where(eq(tools.wpPostId, wpPostId)).limit(1);
  return row ? toApiTool(row) : null;
}

export async function getToolBySlug(slug: string): Promise<ApiTool | null> {
  const db = await getDb();
  const [row] = await db.select().from(tools).where(eq(tools.urlSlug, slug)).limit(1);
  return row ? toApiTool(row) : null;
}

/** Existing names/slugs to dedupe discovery against. */
export async function listToolNamesAndSlugs(): Promise<{ names: Set<string>; slugs: Set<string> }> {
  const db = await getDb();
  const rows = await db.select({ name: tools.name, slug: tools.urlSlug }).from(tools);
  const names = new Set<string>();
  const slugs = new Set<string>();
  for (const r of rows) {
    if (r.name) names.add(r.name.trim().toLowerCase());
    if (r.slug) slugs.add(r.slug.trim().toLowerCase());
  }
  return { names, slugs };
}

export async function insertTool(data: ToolPatch): Promise<ApiTool> {
  const db = await getDb();
  const [row] = await db.insert(tools).values(toInsert(data)).returning();
  return toApiTool(row);
}

export async function insertTools(rows: ToolPatch[]): Promise<ApiTool[]> {
  if (!rows.length) return [];
  const db = await getDb();
  const inserted = await db.insert(tools).values(rows.map(toInsert)).returning();
  return inserted.map(toApiTool);
}

export async function updateTool(id: string, patch: ToolPatch): Promise<ApiTool | null> {
  const db = await getDb();
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    const col = COL_MAP[k];
    if (col) set[col] = v;
  }
  if (Object.keys(set).length === 0) return null;
  set.updatedAt = new Date();
  const [row] = await db.update(tools).set(set).where(eq(tools.id, id)).returning();
  return row ? toApiTool(row) : null;
}

/**
 * Adopt an existing WordPress tool page into the tools table (origin=existing).
 * Matches on wp_post_id, then falls back to url_slug so duplicate pages that
 * share a slug (e.g. a Draft + a Published version) collapse to one row instead
 * of hitting the unique-slug constraint. Never overwrites the slug once set.
 */
export async function upsertExistingTool(data: {
  wp_post_id: number;
  name: string;
  url_slug: string;
  published_url?: string | null;
  aioseo_score_before?: number | null;
  audit_report?: unknown;
  target_keyword?: string | null;
  category?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  word_count?: number | null;
}): Promise<ApiTool> {
  // Pages without a real WordPress slug (drafts, ?page_id URLs) can't share
  // the empty-string slug — the unique index would collide. Store NULL so the
  // partial unique index (WHERE url_slug IS NOT NULL) ignores them.
  const slug = data.url_slug?.trim() ? data.url_slug.trim() : null;
  const existing =
    (await getToolByWpPostId(data.wp_post_id)) || (slug ? await getToolBySlug(slug) : null);
  if (existing) {
    const patch: ToolPatch = {
      name: data.name,
      wp_post_id: data.wp_post_id,
      url_slug: slug ?? existing.url_slug,
      published_url: data.published_url ?? existing.published_url,
      aioseo_score_before: data.aioseo_score_before ?? existing.aioseo_score_before,
      audit_report: data.audit_report ?? existing.audit_report,
      meta_title: data.meta_title ?? existing.meta_title,
      meta_description: data.meta_description ?? existing.meta_description,
      word_count: data.word_count ?? existing.word_count,
    };
    if (data.category) patch.category = data.category;
    if (data.target_keyword && !existing.target_keyword) patch.target_keyword = data.target_keyword;
    const updated = await updateTool(existing.id, patch);
    return updated ?? existing;
  }
  return insertTool({
    name: data.name,
    url_slug: slug,
    wp_post_id: data.wp_post_id,
    published_url: data.published_url ?? null,
    aioseo_score_before: data.aioseo_score_before ?? null,
    audit_report: data.audit_report ?? null,
    target_keyword: data.target_keyword ?? null,
    category: data.category ?? "Developer Tools",
    meta_title: data.meta_title ?? null,
    meta_description: data.meta_description ?? null,
    word_count: data.word_count ?? null,
    origin: "existing",
    status: "published",
  });
}

/**
 * Existing WP tool pages that are candidates for additive optimization, worst
 * AIOSEO score first. Skips ones already optimized this engine.
 */
export async function listOptimizationCandidates(limit = 5): Promise<ApiTool[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(tools)
    .where(and(eq(tools.origin, "existing"), ne(tools.status, "optimized")))
    .orderBy(asc(tools.aioseoScoreBefore))
    .limit(limit);
  return rows.map(toApiTool);
}

/** All origin=existing rows currently stamped with the given category. */
export async function listExistingToolsByCategory(category: string): Promise<ApiTool[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(tools)
    .where(and(eq(tools.origin, "existing"), eq(tools.category, category)));
  return rows.map(toApiTool);
}

export async function deleteToolById(id: string) {
  const db = await getDb();
  await db.delete(tools).where(eq(tools.id, id));
}

export async function deleteAllTools() {
  const db = await getDb();
  await db.delete(tools).where(ne(tools.id, "00000000-0000-0000-0000-000000000000"));
}
