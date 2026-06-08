import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Topical map (silo structure) for the strategy view. */
export const getTopicalMapFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ geo: z.string().optional() }).parse)
  .handler(async ({ data }) => {
    const { getTopicalMap } = await import("./silo-map");
    return getTopicalMap(data.geo);
  });

/** Rebuild silo roles + hub assignments across all articles. */
export const rebuildSiloFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ geo: z.string().optional() }).parse)
  .handler(async ({ data }) => {
    const { rebuildSilo } = await import("./silo-map");
    return rebuildSilo(data.geo);
  });

/** Re-cluster all existing articles into the current 10-cluster scheme. */
export const reclusterArticlesFn = createServerFn({ method: "POST" }).handler(async () => {
  const { reclusterArticles } = await import("./silo-map");
  return reclusterArticles();
});

/** Self-learning dashboard stats. */
export const getLearningStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  const signalsRepo = await import("@/server/db/repos/signals");
  const { buildLearningModel } = await import("./learning-ranker");
  const [agg, model, total, recent] = await Promise.all([
    signalsRepo.getLearningAggregates(),
    buildLearningModel(),
    signalsRepo.countSignals(),
    signalsRepo.listRecentSignals(20),
  ]);
  return {
    total,
    byCluster: agg.byCluster,
    byIntent: agg.byIntent,
    clusterMultiplier: model.clusterMultiplier,
    intentMultiplier: model.intentMultiplier,
    active: model.total >= 5,
    recent: recent.map((r) => ({
      keyword: r.keyword,
      cluster_id: r.clusterId,
      event: r.event,
      reward: r.reward != null ? Number(r.reward) : null,
      quality_score: r.qualityScore,
      demand_score: r.demandScore,
      created_at: r.createdAt?.toISOString?.() ?? null,
    })),
  };
});
