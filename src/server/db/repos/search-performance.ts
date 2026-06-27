import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { searchPerformance, articles } = schema;

export type UpsertPerfRow = {
  page: string;
  topQuery?: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  dateStart: string;
  dateEnd: string;
};

/** Normalise a URL for loose matching (strip protocol/trailing slash/query). */
function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[#?].*$/, "")
    .replace(/\/+$/, "");
}

/**
 * Store GSC rows for a window. Matches each page to a published article by URL
 * so the learning loop can reward the originating cluster/intent. Idempotent:
 * re-syncing the same window updates in place.
 */
export async function upsertSearchPerformance(rows: UpsertPerfRow[]): Promise<{ stored: number; matched: number }> {
  if (!rows.length) return { stored: 0, matched: 0 };
  const db = await getDb();

  // Build a URL → articleId map from published articles.
  const arts = await db
    .select({ id: articles.id, url: articles.publishedUrl })
    .from(articles)
    .where(sql`${articles.publishedUrl} IS NOT NULL`);
  const urlMap = new Map<string, string>();
  for (const a of arts) {
    if (a.url) urlMap.set(normalizeUrl(a.url), a.id);
  }

  let stored = 0;
  let matched = 0;
  for (const r of rows) {
    const articleId = urlMap.get(normalizeUrl(r.page)) ?? null;
    if (articleId) matched++;
    try {
      await db
        .insert(searchPerformance)
        .values({
          articleId,
          page: r.page,
          topQuery: r.topQuery ?? null,
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: String(r.ctr),
          position: String(r.position),
          dateStart: r.dateStart,
          dateEnd: r.dateEnd,
        })
        .onConflictDoUpdate({
          target: [searchPerformance.page, searchPerformance.dateStart, searchPerformance.dateEnd],
          set: {
            articleId,
            topQuery: r.topQuery ?? null,
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: String(r.ctr),
            position: String(r.position),
            fetchedAt: new Date(),
          },
        });
      stored++;
    } catch {
      /* one bad row should never abort the whole sync */
    }
  }
  return { stored, matched };
}

export type PerfSummary = {
  page: string;
  articleId: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

/** Latest metrics per page (most recent window), top by clicks. */
export async function getLatestPerformance(limit = 100): Promise<PerfSummary[]> {
  const db = await getDb();
  try {
    const rows = await db
      .select()
      .from(searchPerformance)
      .orderBy(desc(searchPerformance.dateEnd), desc(searchPerformance.clicks))
      .limit(2000);
    // Keep the most recent window row per page.
    const seen = new Map<string, PerfSummary>();
    for (const r of rows) {
      if (seen.has(r.page)) continue;
      seen.set(r.page, {
        page: r.page,
        articleId: r.articleId,
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr != null ? Number(r.ctr) : 0,
        position: r.position != null ? Number(r.position) : 0,
      });
    }
    return [...seen.values()].sort((a, b) => b.clicks - a.clicks).slice(0, limit);
  } catch {
    return [];
  }
}

/** Performance for a single article (latest window). */
export async function getPerformanceForArticle(articleId: string): Promise<PerfSummary | null> {
  const db = await getDb();
  try {
    const [r] = await db
      .select()
      .from(searchPerformance)
      .where(eq(searchPerformance.articleId, articleId))
      .orderBy(desc(searchPerformance.dateEnd))
      .limit(1);
    if (!r) return null;
    return {
      page: r.page,
      articleId: r.articleId,
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr != null ? Number(r.ctr) : 0,
      position: r.position != null ? Number(r.position) : 0,
    };
  } catch {
    return null;
  }
}

/** Totals across the latest window (for digest + dashboard headline). */
export async function getPerformanceTotals(): Promise<{
  pages: number;
  clicks: number;
  impressions: number;
  avgPosition: number;
}> {
  const latest = await getLatestPerformance(5000);
  if (!latest.length) return { pages: 0, clicks: 0, impressions: 0, avgPosition: 0 };
  const clicks = latest.reduce((s, r) => s + r.clicks, 0);
  const impressions = latest.reduce((s, r) => s + r.impressions, 0);
  const weighted = latest.reduce((s, r) => s + r.position * Math.max(1, r.impressions), 0);
  const imprTotal = latest.reduce((s, r) => s + Math.max(1, r.impressions), 0);
  return {
    pages: latest.length,
    clicks,
    impressions,
    avgPosition: Number((weighted / imprTotal).toFixed(2)),
  };
}

/**
 * Real-outcome reward aggregated per cluster, computed from the latest window
 * joined to the originating article. Feeds the self-learning ranker so discovery
 * favours clusters that earn real clicks/rankings — not just high draft scores.
 * Returns the per-row reward via the caller-supplied scorer to avoid a circular
 * import with learning-ranker.
 */
export async function getSearchRewardByCluster(
  scorer: (p: { clicks: number; impressions: number; position: number }) => number,
): Promise<Record<number, { avgReward: number; n: number }>> {
  const db = await getDb();
  const out: Record<number, { avgReward: number; n: number }> = {};
  try {
    const latest = await getLatestPerformance(5000);
    const withArticle = latest.filter((r) => r.articleId);
    if (!withArticle.length) return out;

    const arts = await db.select({ id: articles.id, clusterId: articles.clusterId }).from(articles);
    const clusterOf = new Map<string, number | null>();
    for (const a of arts) clusterOf.set(a.id, a.clusterId ?? null);

    for (const r of withArticle) {
      const cid = clusterOf.get(r.articleId!);
      if (cid == null) continue;
      const reward = scorer({ clicks: r.clicks, impressions: r.impressions, position: r.position });
      const c = (out[cid] ??= { avgReward: 0, n: 0 });
      c.avgReward = (c.avgReward * c.n + reward) / (c.n + 1);
      c.n++;
    }
  } catch {
    /* table optional */
  }
  return out;
}
