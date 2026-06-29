import { createServerFn } from "@tanstack/react-start";

/**
 * LEARNING DASHBOARD aggregator (roadmap #5).
 *
 * One call that surfaces how the self-learning loop is doing: which clusters and
 * intents earn the best reward, real Search Console outcomes, AI-citation rate,
 * and content freshness. This is the visibility layer over signals the engine
 * already collects (topic_signals, search_performance, citations, freshness).
 */

export const learningDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();

  const { CLUSTERS } = await import("./pillars");
  const signalsRepo = await import("@/server/db/repos/signals");

  const aggregates = await signalsRepo.getLearningAggregates();
  const totalSignals = await signalsRepo.countSignals();

  const clusterName = (id: number) => CLUSTERS.find((c) => c.id === id)?.short ?? `Cluster ${id}`;

  const byCluster = Object.entries(aggregates.byCluster)
    .map(([id, v]) => ({
      cluster_id: Number(id),
      name: clusterName(Number(id)),
      avg_reward: Number(v.avgReward.toFixed(3)),
      n: v.n,
      published: v.published,
    }))
    .sort((a, b) => b.avg_reward - a.avg_reward);

  const byIntent = Object.entries(aggregates.byIntent)
    .map(([intent, v]) => ({
      intent,
      avg_reward: Number(v.avgReward.toFixed(3)),
      n: v.n,
    }))
    .sort((a, b) => b.avg_reward - a.avg_reward);

  // Real Search Console outcomes (best-effort).
  let performance = { pages: 0, clicks: 0, impressions: 0, avgPosition: 0 };
  let topPages: { page: string; clicks: number; impressions: number; position: number }[] = [];
  try {
    const perfRepo = await import("@/server/db/repos/search-performance");
    performance = await perfRepo.getPerformanceTotals();
    const latest = await perfRepo.getLatestPerformance(10);
    topPages = latest.map((r) => ({
      page: r.page,
      clicks: r.clicks,
      impressions: r.impressions,
      position: r.position,
    }));
  } catch {
    /* performance optional */
  }

  // AI citation rate (best-effort).
  let citations = {
    total: 0,
    cited: 0,
    mentioned: 0,
    citationRate: 0,
    byEngine: [] as { engine: string; total: number; cited: number; mentioned: number }[],
  };
  try {
    const citRepo = await import("@/server/db/repos/citations");
    const s = await citRepo.citationSummary(30);
    citations = {
      total: s.total,
      cited: s.cited,
      mentioned: s.mentioned,
      citationRate: s.citationRate,
      byEngine: s.byEngine,
    };
  } catch {
    /* citations optional */
  }

  // Content freshness (best-effort).
  let freshness = { totalLive: 0, fresh: 0, due: 0, intervalDays: 90, oldestDays: 0 };
  try {
    const { freshnessSummary } = await import("./freshness");
    freshness = await freshnessSummary();
  } catch {
    /* freshness optional */
  }

  return {
    totalSignals,
    byCluster,
    byIntent,
    performance,
    topPages,
    citations,
    freshness,
  };
});
