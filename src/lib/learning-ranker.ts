import "@tanstack/react-start/server-only";
import type { DiscoveredTopic } from "./topic-discovery";

async function getSignalsRepo() {
  return import("@/server/db/repos/signals");
}

/**
 * SELF-LEARNING RANKER
 *
 * Closes the loop: as articles are generated, selected, and published, we store
 * reward signals (see repos/signals + topic_signals). This module reads those
 * aggregates and nudges discovery toward clusters/intents that historically
 * produced high-quality, published work — and away from ones that didn't.
 *
 * It's a transparent, explainable bandit-style adjustment (not a black box):
 *   adjusted = base * (1 + learningWeight * normalizedClusterReward)
 *                   * (1 + learningWeight * normalizedIntentReward)
 */

export type LearningModel = {
  clusterMultiplier: Record<number, number>;
  intentMultiplier: Record<string, number>;
  total: number;
  /** number of clusters with real GSC outcome data blended in */
  searchClusters: number;
};

/** Build a multiplier model from accumulated signals + real search outcomes. */
export async function buildLearningModel(learningWeight = 0.25): Promise<LearningModel> {
  const { getLearningAggregates } = await getSignalsRepo();
  const agg = await getLearningAggregates();
  const clusterMultiplier: Record<number, number> = {};
  const intentMultiplier: Record<string, number> = {};

  const clusterRewards = Object.values(agg.byCluster).map((c) => c.avgReward);
  const maxC = Math.max(0.001, ...clusterRewards.map(Math.abs), 1);
  for (const [cid, c] of Object.entries(agg.byCluster)) {
    const norm = c.avgReward / maxC; // -1..1-ish
    clusterMultiplier[Number(cid)] = 1 + learningWeight * norm;
  }

  const intentRewards = Object.values(agg.byIntent).map((i) => i.avgReward);
  const maxI = Math.max(0.001, ...intentRewards.map(Math.abs), 1);
  for (const [intent, i] of Object.entries(agg.byIntent)) {
    const norm = i.avgReward / maxI;
    intentMultiplier[intent] = 1 + learningWeight * norm;
  }

  // Blend in REAL search outcomes (GSC). These are weighted higher than internal
  // signals because they reflect what actually wins, not just what scores well.
  let searchClusters = 0;
  try {
    const { getSearchRewardByCluster } = await import("@/server/db/repos/search-performance");
    const searchByCluster = await getSearchRewardByCluster(rewardFromSearch);
    const searchRewards = Object.values(searchByCluster).map((c) => c.avgReward);
    if (searchRewards.length) {
      searchClusters = searchRewards.length;
      const maxS = Math.max(0.001, ...searchRewards.map(Math.abs), 1);
      const searchWeight = learningWeight * 1.5; // real data counts for more
      for (const [cid, c] of Object.entries(searchByCluster)) {
        const norm = c.avgReward / maxS;
        const base = clusterMultiplier[Number(cid)] ?? 1;
        clusterMultiplier[Number(cid)] = base * (1 + searchWeight * norm);
      }
    }
  } catch {
    /* search performance optional — never block discovery */
  }

  return { clusterMultiplier, intentMultiplier, total: agg.total, searchClusters };
}

/** Apply the learning model to re-rank discovered topics. No-op until signals exist. */
export function applyLearning(topics: DiscoveredTopic[], model: LearningModel): DiscoveredTopic[] {
  // Run once we have enough internal signals OR any real search outcome data.
  if (model.total < 5 && model.searchClusters === 0) return topics; // stay neutral
  const ranked = topics.map((t) => {
    const cm = model.clusterMultiplier[t.cluster_id] ?? 1;
    const im = t.intent ? model.intentMultiplier[t.intent] ?? 1 : 1;
    const adjusted = Math.round(Math.min(100, t.opportunity_score * cm * im));
    return { ...t, opportunity_score: adjusted };
  });
  ranked.sort((a, b) => b.opportunity_score - a.opportunity_score);
  return ranked;
}

/**
 * Reward function: turn an article outcome into a numeric reward for learning.
 *   published high-quality → strong positive
 *   generated but low quality / blocked → negative
 *   demand-validated → small positive
 */
export function computeReward(opts: {
  event: "generated" | "selected" | "published" | "rejected";
  qualityScore?: number | null;
  demandScore?: number | null;
  blocking?: boolean;
}): number {
  const q = (opts.qualityScore ?? 0) / 100;
  const d = (opts.demandScore ?? 0) / 100;
  if (opts.event === "published") return 1.0 + q; // 1..2
  if (opts.event === "selected") return 0.4 + 0.4 * q;
  if (opts.event === "rejected") return -0.6;
  // generated
  if (opts.blocking) return -0.5;
  return 0.2 * q + 0.3 * d;
}

/**
 * REAL-OUTCOME reward from Google Search Console data. This is the signal that
 * teaches the engine what actually *wins*, not just what scores well internally.
 *
 *   clicks    → strongest signal (log-scaled, real traffic earned)
 *   position  → ranking quality (top-3 strong, page-1 good, deep = penalty)
 *   impressions without clicks → seen but not clicked (title/intent mismatch)
 *
 * Returned reward extends the published baseline (~1–2) upward for winners and
 * can go slightly negative for content that ranks but earns nothing.
 */
export function rewardFromSearch(perf: {
  clicks: number;
  impressions: number;
  position: number;
}): number {
  const clicks = Math.max(0, perf.clicks);
  const impressions = Math.max(0, perf.impressions);
  const position = perf.position > 0 ? perf.position : 100;

  // Traffic earned (log-scaled so a few mega-pages don't dominate). 0..~3
  const clickReward = Math.min(3, Math.log10(clicks + 1) * 1.5);

  // Ranking quality.
  let posReward = 0;
  if (position <= 3) posReward = 1.0;
  else if (position <= 10) posReward = 0.5;
  else if (position <= 20) posReward = 0.1;
  else posReward = -0.2;

  // Visibility with no engagement = mild negative (something's off).
  let engagementPenalty = 0;
  if (impressions >= 100 && clicks === 0) engagementPenalty = -0.4;

  return Number((clickReward + posReward + engagementPenalty).toFixed(3));
}
