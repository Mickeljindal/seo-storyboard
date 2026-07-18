import "@tanstack/react-start/server-only";

/**
 * UNIFIED SCORE — combines everything the engine already measures separately
 * (draft quality, real conversions, AI citation status, real GSC performance)
 * into one weighted, revenue-aware number per article. This is what "Quality
 * Scoring V2" reduces to for a company this size: don't build 11 new scoring
 * dimensions from scratch, blend the 4 real signals that already exist and are
 * trustworthy, weighted toward what actually matters — revenue first.
 *
 * Weights (sum to 100): revenue 40, citations 20, quality 25, search 15.
 * An article with zero conversions/citations/GSC data yet still gets a fair
 * score from quality alone (the other components default to neutral, not 0).
 */

export type UnifiedScoreInput = {
  qualityScore: number | null; // 0-100 from content-scorecard
  conversionValue: number; // total $ attributed to this article (lifetime)
  conversionCount: number; // signups+paid attributed
  cited: boolean; // has this article/cluster earned an AI citation
  mentioned: boolean;
  gscClicks: number;
  gscImpressions: number;
  gscPosition: number | null; // avg position, lower = better
};

export type UnifiedScoreResult = {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: {
    revenue: { score: number; weight: number; detail: string };
    citations: { score: number; weight: number; detail: string };
    quality: { score: number; weight: number; detail: string };
    search: { score: number; weight: number; detail: string };
  };
  summary: string;
};

const WEIGHTS = { revenue: 40, citations: 20, quality: 25, search: 15 };

function gradeFor(score: number): UnifiedScoreResult["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

/** Log-scaled revenue score so one $10k enterprise deal doesn't need a linear cap. */
function revenueSubscore(value: number, count: number): number {
  if (value <= 0 && count <= 0) return 40; // neutral — no data yet, don't punish
  const valueScore = Math.min(100, Math.log10(value + 1) * 25); // $100 → 50, $10k → 100
  const countScore = Math.min(100, count * 20); // 5 conversions → 100
  return Math.round(valueScore * 0.7 + countScore * 0.3);
}

function citationSubscore(cited: boolean, mentioned: boolean): number {
  if (cited) return 100;
  if (mentioned) return 55;
  return 35; // neutral-low — most articles won't be checked yet, don't punish
}

function searchSubscore(clicks: number, impressions: number, position: number | null): number {
  if (impressions <= 0) return 40; // neutral — not indexed/measured yet
  const ctr = clicks / Math.max(impressions, 1);
  const ctrScore = Math.min(100, ctr * 1000); // 10% CTR → 100
  const posScore = position ? Math.max(0, 100 - (position - 1) * 5) : 40; // pos 1 → 100, pos 20 → 5
  return Math.round(ctrScore * 0.5 + posScore * 0.5);
}

export function computeUnifiedScore(input: UnifiedScoreInput): UnifiedScoreResult {
  const qualityScore = input.qualityScore ?? 50; // neutral default if never scored
  const revenueScore = revenueSubscore(input.conversionValue, input.conversionCount);
  const citationScoreV = citationSubscore(input.cited, input.mentioned);
  const searchScoreV = searchSubscore(input.gscClicks, input.gscImpressions, input.gscPosition);

  const weighted =
    (revenueScore * WEIGHTS.revenue +
      citationScoreV * WEIGHTS.citations +
      qualityScore * WEIGHTS.quality +
      searchScoreV * WEIGHTS.search) /
    100;

  const score = Math.round(weighted);

  return {
    score,
    grade: gradeFor(score),
    breakdown: {
      revenue: {
        score: revenueScore,
        weight: WEIGHTS.revenue,
        detail:
          input.conversionCount > 0
            ? `$${input.conversionValue.toFixed(0)} from ${input.conversionCount} conversion(s)`
            : "no attributed conversions yet",
      },
      citations: {
        score: citationScoreV,
        weight: WEIGHTS.citations,
        detail: input.cited
          ? "cited by an AI engine"
          : input.mentioned
            ? "mentioned, not cited"
            : "not yet checked/cited",
      },
      quality: {
        score: qualityScore,
        weight: WEIGHTS.quality,
        detail:
          input.qualityScore != null ? `draft score ${input.qualityScore}/100` : "not scored yet",
      },
      search: {
        score: searchScoreV,
        weight: WEIGHTS.search,
        detail:
          input.gscImpressions > 0
            ? `${input.gscClicks} clicks / ${input.gscImpressions} impressions, avg pos ${input.gscPosition?.toFixed(1) ?? "?"}`
            : "no Search Console data yet",
      },
    },
    summary:
      score >= 70
        ? `Strong performer (${score}/100) — driving real revenue and/or search visibility.`
        : score >= 45
          ? `Solid but improvable (${score}/100) — check the weakest dimension below.`
          : `Underperforming (${score}/100) — likely a candidate for refresh or re-prioritization.`,
  };
}

/**
 * Compute the unified score for one article by pulling its real signals from
 * the DB (conversions, citations, GSC performance) + its stored quality_score.
 */
export async function computeUnifiedScoreForArticle(
  articleId: string,
): Promise<UnifiedScoreResult> {
  const articlesRepo = await import("@/server/db/repos/articles");
  const article = await articlesRepo.getArticleById(articleId);
  if (!article) {
    return computeUnifiedScore({
      qualityScore: null,
      conversionValue: 0,
      conversionCount: 0,
      cited: false,
      mentioned: false,
      gscClicks: 0,
      gscImpressions: 0,
      gscPosition: null,
    });
  }

  let conversionValue = 0;
  let conversionCount = 0;
  try {
    const { getDb, schema } = await import("@/server/db/client");
    const { eq, sql } = await import("drizzle-orm");
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.conversions)
      .where(eq(schema.conversions.articleId, articleId));
    conversionCount = rows.length;
    conversionValue = rows.reduce((s, r) => s + (r.value != null ? Number(r.value) : 0), 0);
    void sql;
  } catch {
    /* conversions optional */
  }

  let cited = false;
  let mentioned = false;
  try {
    const { getDb, schema } = await import("@/server/db/client");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.citations)
      .where(eq(schema.citations.articleId, articleId));
    cited = rows.some((r) => r.cited);
    mentioned = rows.some((r) => r.mentioned);
  } catch {
    /* citations optional */
  }

  let gscClicks = 0;
  let gscImpressions = 0;
  let gscPosition: number | null = null;
  try {
    const { getPerformanceForArticle } = await import("@/server/db/repos/search-performance");
    const perf = await getPerformanceForArticle(articleId);
    if (perf) {
      gscClicks = perf.clicks;
      gscImpressions = perf.impressions;
      gscPosition = perf.position || null;
    }
  } catch {
    /* GSC optional */
  }

  return computeUnifiedScore({
    qualityScore: article.quality_score ?? null,
    conversionValue,
    conversionCount,
    cited,
    mentioned,
    gscClicks,
    gscImpressions,
    gscPosition,
  });
}
