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
};

/** Build a multiplier model from accumulated signals. */
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

  return { clusterMultiplier, intentMultiplier, total: agg.total };
}

/** Apply the learning model to re-rank discovered topics. No-op until signals exist. */
export function applyLearning(topics: DiscoveredTopic[], model: LearningModel): DiscoveredTopic[] {
  if (model.total < 5) return topics; // not enough signal yet — stay neutral
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
