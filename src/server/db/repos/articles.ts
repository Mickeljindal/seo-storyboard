import { and, asc, count, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiArticle, type ApiArticle } from "../map";

const { articles } = schema;

function rowToInsert(data: Record<string, unknown>) {
  return {
    title: data.title as string,
    targetKeyword: (data.target_keyword as string) ?? null,
    secondaryKeywords: (data.secondary_keywords as string[]) ?? [],
    pillar: data.pillar as number,
    status: (data.status as string) ?? "idea",
    scheduledWeek: (data.scheduled_week as number) ?? null,
    metaTitle: (data.meta_title as string) ?? null,
    metaDescription: (data.meta_description as string) ?? null,
    urlSlug: (data.url_slug as string) ?? null,
    brief: data.brief ?? null,
    keywordData: data.keyword_data ?? null,
    serpData: data.serp_data ?? null,
    geoTarget: (data.geo_target as string) ?? "sa",
    language: (data.language as string) ?? "en",
    priority: (data.priority as string) ?? "medium",
    notes: (data.notes as string) ?? null,
    clusterId: (data.cluster_id as number) ?? null,
    clusterName: (data.cluster_name as string) ?? null,
    anchor: (data.anchor as string) ?? null,
    ideaIndex: (data.idea_index as number) ?? null,
    entities: (data.entities as string[]) ?? [],
    faq: data.faq ?? null,
    aiOverview: data.ai_overview ?? null,
    schemaJsonld: data.schema_jsonld ?? null,
    internalLinkTargets: (data.internal_link_targets as string[]) ?? [],
    contentDraft: (data.content_draft as string) ?? null,
    engineSource: (data.engine_source as string) ?? null,
    publishedUrl: (data.published_url as string) ?? null,
    wordCountTarget: (data.word_count_target as number) ?? 2500,
  };
}

export async function countArticles(): Promise<number> {
  const db = await getDb();
  const [r] = await db.select({ c: count() }).from(articles);
  return Number(r?.c ?? 0);
}

export async function listArticles(opts?: {
  geo?: string;
  orderBy?: "scheduled_week" | "updated_at";
  clusterId?: number;
  status?: string;
  briefNull?: boolean;
  limit?: number;
}): Promise<ApiArticle[]> {
  const db = await getDb();
  let q = db.select().from(articles).$dynamic();
  const conds = [];
  if (opts?.geo) conds.push(eq(articles.geoTarget, opts.geo));
  if (opts?.clusterId != null) conds.push(eq(articles.clusterId, opts.clusterId));
  if (opts?.status) conds.push(eq(articles.status, opts.status));
  if (opts?.briefNull) conds.push(isNull(articles.brief));
  if (conds.length) q = q.where(and(...conds));
  if (opts?.orderBy === "updated_at") q = q.orderBy(desc(articles.updatedAt));
  else q = q.orderBy(asc(articles.scheduledWeek), asc(articles.priority));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  return rows.map(toApiArticle);
}

export async function listArticleIds(opts?: {
  briefNull?: boolean;
  clusterId?: number;
  statusOrNullKeyword?: boolean;
  limit?: number;
}): Promise<{ id: string }[]> {
  const db = await getDb();
  let q = db.select({ id: articles.id }).from(articles).$dynamic();
  const conds = [];
  if (opts?.briefNull) conds.push(isNull(articles.brief));
  if (opts?.clusterId != null) conds.push(eq(articles.clusterId, opts.clusterId));
  if (opts?.statusOrNullKeyword) {
    conds.push(or(eq(articles.status, "idea"), isNull(articles.keywordData))!);
  }
  if (conds.length) q = q.where(and(...conds));
  if (opts?.limit) q = q.limit(opts.limit);
  return q;
}

export async function getArticleById(id: string): Promise<ApiArticle | null> {
  const db = await getDb();
  const [row] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return row ? toApiArticle(row) : null;
}

export async function insertArticles(rows: Record<string, unknown>[]) {
  const db = await getDb();
  const values = rows.map(rowToInsert);
  const inserted = await db.insert(articles).values(values).returning();
  return inserted.map(toApiArticle);
}

export async function insertArticle(row: Record<string, unknown>) {
  const [a] = await insertArticles([row]);
  return a;
}

export async function updateArticle(id: string, patch: Record<string, unknown>) {
  const db = await getDb();
  const set: Record<string, unknown> = {};
  const map: Record<string, keyof typeof articles.$inferInsert> = {
    title: "title",
    target_keyword: "targetKeyword",
    secondary_keywords: "secondaryKeywords",
    status: "status",
    scheduled_week: "scheduledWeek",
    meta_title: "metaTitle",
    meta_description: "metaDescription",
    url_slug: "urlSlug",
    brief: "brief",
    keyword_data: "keywordData",
    serp_data: "serpData",
    priority: "priority",
    notes: "notes",
    faq: "faq",
    ai_overview: "aiOverview",
    schema_jsonld: "schemaJsonld",
    entities: "entities",
    internal_link_targets: "internalLinkTargets",
    content_draft: "contentDraft",
    content_html: "contentHtml",
    quality_score: "qualityScore",
    quality_report: "qualityReport",
    silo_role: "siloRole",
    hub_article_id: "hubArticleId",
    demand_score: "demandScore",
    demand_validated: "demandValidated",
    published_at: "publishedAt",
    last_reviewed_at: "lastReviewedAt",
    next_review_at: "nextReviewAt",
    review_count: "reviewCount",
    published_url: "publishedUrl",
    performance_data: "performanceData",
    word_count_target: "wordCountTarget",
  };
  for (const [k, v] of Object.entries(patch)) {
    const col = map[k];
    if (col) set[col] = v;
  }
  if (Object.keys(set).length === 0) return null;
  const [row] = await db.update(articles).set(set).where(eq(articles.id, id)).returning();
  return row ? toApiArticle(row) : null;
}

export async function deleteAllArticles() {
  const db = await getDb();
  await db.delete(articles).where(ne(articles.id, "00000000-0000-0000-0000-000000000000"));
}

export async function deleteArticleById(id: string) {
  const db = await getDb();
  await db.delete(articles).where(eq(articles.id, id));
}

/** Assign cluster + anchor to rows seeded before cluster fields existed. */
export async function backfillMissingClusters(): Promise<number> {
  const db = await getDb();
  const rows = await db
    .select({
      id: articles.id,
      pillar: articles.pillar,
      clusterId: articles.clusterId,
    })
    .from(articles)
    .where(isNull(articles.clusterId));

  if (!rows.length) return 0;

  const { CLUSTER_HUBS } = await import("@/lib/cluster-seeds");
  const { CLUSTERS } = await import("@/lib/pillars");
  const PILLAR_CLUSTER_IDS: Record<number, number[]> = {
    1: [1, 4, 9, 10],
    2: [2],
    3: [6],
    4: [5],
    5: [3, 7, 8],
  };
  const counters: Record<number, number> = {};
  let updated = 0;

  for (const row of rows) {
    const pillar = row.pillar ?? 1;
    const ids = PILLAR_CLUSTER_IDS[pillar] ?? [1];
    const n = counters[pillar] ?? 0;
    counters[pillar] = n + 1;
    const clusterId = ids[n % ids.length];
    const cluster = CLUSTERS.find((c) => c.id === clusterId);
    const anchor = CLUSTER_HUBS[clusterId]?.anchor ?? "Managed Cloud";
    await db
      .update(articles)
      .set({
        clusterId,
        clusterName: cluster?.name ?? null,
        anchor,
      })
      .where(eq(articles.id, row.id));
    updated++;
  }
  return updated;
}

export async function listRafflePool(filters: {
  clusterId?: number;
  anchor?: string;
  statusIdea?: boolean;
}) {
  const db = await getDb();
  const conds = [];
  if (filters.clusterId != null) conds.push(eq(articles.clusterId, filters.clusterId));
  if (filters.anchor) conds.push(eq(articles.anchor, filters.anchor));
  if (filters.statusIdea) conds.push(eq(articles.status, "idea"));
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      clusterId: articles.clusterId,
      clusterName: articles.clusterName,
      anchor: articles.anchor,
      status: articles.status,
      priority: articles.priority,
      ideaIndex: articles.ideaIndex,
    })
    .from(articles)
    .where(conds.length ? and(...conds) : undefined)
    .limit(2000);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    cluster_id: r.clusterId,
    cluster_name: r.clusterName,
    anchor: r.anchor,
    status: r.status,
    priority: r.priority,
    idea_index: r.ideaIndex,
  }));
}

export async function listTargetKeywords(geo: string): Promise<Set<string>> {
  const db = await getDb();
  const artRows = await db
    .select({ kw: articles.targetKeyword })
    .from(articles)
    .where(eq(articles.geoTarget, geo));
  const { keywords: kwTable } = schema;
  const kwRows = await db
    .select({ kw: kwTable.keyword })
    .from(kwTable)
    .where(eq(kwTable.geoTarget, geo));
  const set = new Set<string>();
  for (const r of artRows) if (r.kw) set.add(r.kw.trim().toLowerCase());
  for (const r of kwRows) if (r.kw) set.add(r.kw.trim().toLowerCase());
  return set;
}
