import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { trendItems } = schema;

export type TrendItem = {
  id: string;
  source: string;
  source_id: string;
  url: string | null;
  discussion_url: string | null;
  title: string;
  summary: string | null;
  author: string | null;
  tags: string[];
  points: number;
  comments: number;
  published_at: string | null;
  velocity: number;
  relevance: number;
  heat: number;
  cluster_id: number | null;
  matched_terms: string[];
  covered_by_slugs: string[];
  angle: string | null;
  angle_kind: string | null;
  status: string;
  skip_reason: string | null;
  article_id: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

function toApi(row: typeof trendItems.$inferSelect): TrendItem {
  return {
    id: row.id,
    source: row.source,
    source_id: row.sourceId,
    url: row.url ?? null,
    discussion_url: row.discussionUrl ?? null,
    title: row.title,
    summary: row.summary ?? null,
    author: row.author ?? null,
    tags: row.tags ?? [],
    points: row.points ?? 0,
    comments: row.comments ?? 0,
    published_at: row.publishedAt?.toISOString?.() ?? null,
    velocity: Number(row.velocity ?? 0),
    relevance: Number(row.relevance ?? 0),
    heat: Number(row.heat ?? 0),
    cluster_id: row.clusterId ?? null,
    matched_terms: row.matchedTerms ?? [],
    covered_by_slugs: row.coveredBySlugs ?? [],
    angle: row.angle ?? null,
    angle_kind: row.angleKind ?? null,
    status: row.status,
    skip_reason: row.skipReason ?? null,
    article_id: row.articleId ?? null,
    first_seen_at: row.firstSeenAt?.toISOString?.() ?? "",
    last_seen_at: row.lastSeenAt?.toISOString?.() ?? "",
  };
}

/**
 * Insert or refresh by (source, source_id).
 *
 * A re-crawl updates the volatile numbers (points, comments, velocity, heat) and
 * bumps `last_seen_at`, which is how a story that keeps climbing gets noticed.
 * It never overwrites a human decision: once something is shortlisted, briefed,
 * written, or skipped, that status and its reason stand.
 */
export async function upsertTrend(row: {
  source: string;
  sourceId: string;
  url?: string | null;
  discussionUrl?: string | null;
  title: string;
  summary?: string | null;
  author?: string | null;
  tags?: string[];
  points?: number;
  comments?: number;
  publishedAt?: Date | null;
  velocity?: number;
  relevance?: number;
  heat?: number;
  clusterId?: number | null;
  matchedTerms?: string[];
  coveredBySlugs?: string[];
  angle?: string | null;
  angleKind?: string | null;
}): Promise<TrendItem> {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(trendItems)
    .where(and(eq(trendItems.source, row.source), eq(trendItems.sourceId, row.sourceId)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(trendItems)
      .set({
        points: row.points ?? existing.points,
        comments: row.comments ?? existing.comments,
        velocity: row.velocity != null ? String(row.velocity) : existing.velocity,
        relevance: row.relevance != null ? String(row.relevance) : existing.relevance,
        heat: row.heat != null ? String(row.heat) : existing.heat,
        matchedTerms: row.matchedTerms ?? existing.matchedTerms,
        coveredBySlugs: row.coveredBySlugs ?? existing.coveredBySlugs,
        // The angle is only refreshed while nobody has acted on it yet.
        angle: existing.status === "new" ? (row.angle ?? existing.angle) : existing.angle,
        angleKind: existing.status === "new" ? (row.angleKind ?? existing.angleKind) : existing.angleKind,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(trendItems.id, existing.id))
      .returning();
    return toApi(updated);
  }

  const [inserted] = await db
    .insert(trendItems)
    .values({
      source: row.source,
      sourceId: row.sourceId,
      url: row.url ?? null,
      discussionUrl: row.discussionUrl ?? null,
      title: row.title,
      summary: row.summary ?? null,
      author: row.author ?? null,
      tags: row.tags ?? [],
      points: row.points ?? 0,
      comments: row.comments ?? 0,
      publishedAt: row.publishedAt ?? null,
      velocity: row.velocity != null ? String(row.velocity) : "0",
      relevance: row.relevance != null ? String(row.relevance) : "0",
      heat: row.heat != null ? String(row.heat) : "0",
      clusterId: row.clusterId ?? null,
      matchedTerms: row.matchedTerms ?? [],
      coveredBySlugs: row.coveredBySlugs ?? [],
      angle: row.angle ?? null,
      angleKind: row.angleKind ?? null,
    })
    .returning();
  return toApi(inserted);
}

export async function listTrends(opts?: {
  status?: string;
  source?: string;
  clusterId?: number;
  minHeat?: number;
  /** Only items seen in the last N hours: trends go stale fast. */
  freshHours?: number;
  limit?: number;
}): Promise<TrendItem[]> {
  const db = await getDb();
  let q = db.select().from(trendItems).$dynamic();
  const where = [];
  if (opts?.status) where.push(eq(trendItems.status, opts.status));
  if (opts?.source) where.push(eq(trendItems.source, opts.source));
  if (opts?.clusterId != null) where.push(eq(trendItems.clusterId, opts.clusterId));
  if (opts?.minHeat != null) where.push(gte(trendItems.heat, String(opts.minHeat)));
  if (opts?.freshHours != null) {
    where.push(sql`${trendItems.lastSeenAt} >= now() - (${opts.freshHours} || ' hours')::interval`);
  }
  if (where.length) q = q.where(where.length === 1 ? where[0] : and(...where));
  q = q.orderBy(desc(trendItems.heat), desc(trendItems.lastSeenAt));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  return rows.map(toApi);
}

export async function getTrendById(id: string): Promise<TrendItem | null> {
  const db = await getDb();
  const [row] = await db.select().from(trendItems).where(eq(trendItems.id, id)).limit(1);
  return row ? toApi(row) : null;
}

export async function updateTrendStatus(
  id: string,
  status: string,
  extra?: { skipReason?: string; articleId?: string },
): Promise<void> {
  const db = await getDb();
  await db
    .update(trendItems)
    .set({
      status,
      skipReason: extra?.skipReason,
      articleId: extra?.articleId,
      updatedAt: new Date(),
    })
    .where(eq(trendItems.id, id));
}

export async function countTrends(status?: string): Promise<number> {
  const db = await getDb();
  try {
    let q = db.select({ c: sql<number>`count(*)::int` }).from(trendItems).$dynamic();
    if (status) q = q.where(eq(trendItems.status, status));
    const [r] = await q;
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Drop stale, never-actioned items. A trend nobody acted on within a couple of
 * weeks is not a trend any more, and keeping it makes the shortlist lie.
 */
export async function pruneStaleTrends(days = 14): Promise<number> {
  const db = await getDb();
  try {
    const rows = await db
      .delete(trendItems)
      .where(
        sql`${trendItems.status} = 'new' AND ${trendItems.lastSeenAt} < now() - (${days} || ' days')::interval`,
      )
      .returning({ id: trendItems.id });
    return rows.length;
  } catch {
    return 0;
  }
}
