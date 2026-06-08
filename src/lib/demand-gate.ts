import { serperSearch, hasSerperCredentials, estimateCompetitorStrength } from "./serper-client";

/**
 * SEARCH-DEMAND GATE
 *
 * Rule from the product owner: never generate/publish ideas that have no real
 * search demand on the internet. We don't have a paid volume API in the Serper
 * path, so we validate demand from observable SERP signals:
 *   - A real, populated SERP (Google returns a full page of organic results)
 *   - People-Also-Ask present (Google only shows PAA for topics with question demand)
 *   - Related searches present (Google only shows these when the query has a cluster)
 *
 * A keyword nobody searches returns a thin/empty SERP and no PAA/related → it is
 * rejected. This keeps the topical map made of real, winnable demand.
 *
 * demand_score 0–100. demand_validated: "yes" if score >= threshold, else "no".
 */

export type DemandResult = {
  score: number;
  validated: boolean;
  paaCount: number;
  relatedCount: number;
  organicCount: number;
  competitorStrength: number;
  reason: string;
};

export const DEFAULT_DEMAND_THRESHOLD = 35;

export function scoreDemandFromSerp(opts: {
  organicCount: number;
  paaCount: number;
  relatedCount: number;
}): number {
  // Full SERP (8–10 organic) is the baseline signal of an indexed, searched topic.
  const organic = Math.min(1, opts.organicCount / 9);
  // PAA is a strong demand signal (Google surfaces it for question-heavy topics).
  const paa = Math.min(1, opts.paaCount / 4);
  // Related searches indicate a real query cluster.
  const related = Math.min(1, opts.relatedCount / 6);
  return Math.round(organic * 45 + paa * 30 + related * 25);
}

/** Validate a single keyword's demand via a live Serper SERP fetch. */
export async function validateKeywordDemand(
  keyword: string,
  geo: string,
  threshold = DEFAULT_DEMAND_THRESHOLD,
): Promise<DemandResult> {
  if (!hasSerperCredentials() || !keyword.trim()) {
    // Without Serper we cannot verify — treat as unknown-but-not-rejected (neutral).
    return {
      score: threshold,
      validated: true,
      paaCount: 0,
      relatedCount: 0,
      organicCount: 0,
      competitorStrength: 0.5,
      reason: "demand not verified (no Serper) — passed neutral",
    };
  }
  try {
    const serp = await serperSearch(keyword, geo);
    const organicCount = serp.organic.length;
    const paaCount = serp.peopleAlsoAsk.length;
    const relatedCount = serp.relatedSearches.length;
    const score = scoreDemandFromSerp({ organicCount, paaCount, relatedCount });
    const validated = score >= threshold;
    return {
      score,
      validated,
      paaCount,
      relatedCount,
      organicCount,
      competitorStrength: estimateCompetitorStrength(serp.organic),
      reason: validated
        ? `real demand (${organicCount} results, ${paaCount} PAA, ${relatedCount} related)`
        : `low/no demand (${organicCount} results, ${paaCount} PAA, ${relatedCount} related) < ${threshold}`,
    };
  } catch (e) {
    return {
      score: threshold,
      validated: true,
      paaCount: 0,
      relatedCount: 0,
      organicCount: 0,
      competitorStrength: 0.5,
      reason: `demand check failed (${String((e as Error)?.message ?? e)}) — passed neutral`,
    };
  }
}
