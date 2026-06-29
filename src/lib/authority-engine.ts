import "@tanstack/react-start/server-only";
import * as articlesRepo from "@/server/db/repos/articles";
import * as engineRepo from "@/server/db/repos/engine";
import { applyResearchToArticleInternal } from "@/lib/dataforseo.functions";
import { generateBriefInternal, generateContentInternal } from "@/lib/ai.functions";
import { hasAiCredentials } from "@/lib/ai-provider";
import { CLUSTERS } from "@/lib/pillars";
import {
  CLUSTER_HUBS,
  DEFAULT_COMPETITOR_DOMAIN,
  normalizeKeyword,
  slugFromKeyword,
  titleFromKeyword,
} from "@/lib/cluster-seeds";
import { isKloudbeanScopedKeyword } from "@/lib/kloudbean-scope";
import {
  validateTopicAgainstGeoPolicy,
  validateSupportedProviders,
} from "@/lib/geo-provider-policy";
import { validateCapability } from "@/lib/kloudbean-capabilities";
import { scopeOverrides } from "@/lib/scope-config";
import {
  discoverTopicsForCluster,
  fetchCompetitorTopics,
  type DiscoveredTopic,
} from "@/lib/topic-discovery";
import {
  discoverTopicsDataFirst,
  defaultMinVolumeForGeo,
  bulkFetchSearchVolumes,
} from "@/lib/semantic-keyword-cluster";
import { hasDataForSeoCredentials } from "@/lib/dataforseo-client";
import { discoverTopicsWithSerper } from "@/lib/serper-discovery";
import { hasSerperCredentials } from "@/lib/serper-client";
import { validateKeywordDemand, DEFAULT_DEMAND_THRESHOLD } from "@/lib/demand-gate";
import { buildLearningModel, applyLearning, computeReward } from "@/lib/learning-ranker";
import * as signalsRepo from "@/server/db/repos/signals";

export type EngineConfig = {
  geo: string;
  clusterIds?: number[];
  topicsPerCluster: number;
  minMonthlyVolume?: number;
  minTrafficScore?: number;
  useSemanticClustering?: boolean;
  includeCompetitorGap: boolean;
  competitorDomain: string;
  generateBriefs: boolean;
  generateContent: boolean;
  /** Discovery source: "serper" (cheap, default) or "dataforseo" (volume data). */
  discoverySource?: "serper" | "dataforseo" | "auto";
  /** Reject ideas with no real search demand (SERP-signal gate). Default true. */
  validateDemand?: boolean;
  /** Demand score threshold (0–100). */
  demandThreshold?: number;
  /** Apply the self-learning ranker to prioritize winning patterns. Default true. */
  useLearning?: boolean;
};

export type EngineLogEntry = { at: string; phase: string; message: string };

export type EngineStats = {
  topics_discovered: number;
  articles_created: number;
  keywords_researched: number;
  briefs_generated: number;
  content_generated: number;
  demand_rejected: number;
  errors: string[];
};

async function appendLog(runId: string, log: EngineLogEntry[], phase: string, message: string) {
  const entry = { at: new Date().toISOString(), phase, message };
  log.push(entry);
  await engineRepo.updateEngineRun(runId, { log });
}

async function saveStats(runId: string, stats: EngineStats) {
  await engineRepo.updateEngineRun(runId, { stats });
}

async function getExistingKeywords(geo: string): Promise<Set<string>> {
  return articlesRepo.listTargetKeywords(geo);
}

function assignWeek(clusterIndex: number, topicIndex: number): number {
  return Math.min(12, ((clusterIndex * 3 + topicIndex) % 12) + 1);
}

/** Full autonomous pipeline: discover → save articles → DataForSEO → AI brief → AI content. */
export async function runAuthorityEngine(config: EngineConfig): Promise<{
  runId: string;
  stats: EngineStats;
  log: EngineLogEntry[];
}> {
  const log: EngineLogEntry[] = [];
  const stats: EngineStats = {
    topics_discovered: 0,
    articles_created: 0,
    keywords_researched: 0,
    briefs_generated: 0,
    content_generated: 0,
    demand_rejected: 0,
    errors: [],
  };

  const runId = crypto.randomUUID();
  await engineRepo.createEngineRun({
    id: runId,
    geo: config.geo,
    config,
    stats,
    log: [],
  });

  await appendLog(
    runId,
    log,
    "start",
    `Engine started · geo=${config.geo} · DataForSEO=${hasDataForSeoCredentials() ? "live" : "mock"}`,
  );

  const clusterIds = config.clusterIds?.length ? config.clusterIds : CLUSTERS.map((c) => c.id);

  const existing = await getExistingKeywords(config.geo);
  const allTopics: DiscoveredTopic[] = [];

  // Choose discovery source. Default: Serper (cheap) when configured, else DataForSEO.
  const source =
    config.discoverySource && config.discoverySource !== "auto"
      ? config.discoverySource
      : hasSerperCredentials()
        ? "serper"
        : "dataforseo";

  await appendLog(
    runId,
    log,
    "discover",
    `Discovery source: ${source}${source === "serper" && hasSerperCredentials() ? " (Serper live)" : ""}`,
  );

  if (source === "serper") {
    // Phase 1 (Serper): autocomplete expansion + SERP-signal scoring — no volume APIs.
    try {
      const { topics, stats } = await discoverTopicsWithSerper(clusterIds, config.geo, {
        topicsPerCluster: config.topicsPerCluster,
      });
      for (const t of topics) {
        if (!existing.has(normalizeKeyword(t.keyword))) allTopics.push(t);
      }
      await appendLog(
        runId,
        log,
        "discover",
        `Serper: ${stats.expanded} expanded → ${stats.scoped} scoped → ${stats.serp_lookups} SERP lookups → ${stats.selected} hubs`,
      );
    } catch (e: unknown) {
      const msg = String((e as Error)?.message ?? e);
      stats.errors.push(`serper discover: ${msg}`);
      await appendLog(runId, log, "discover", `Serper discovery failed: ${msg}`);
    }
  } else {
    // Phase 1 (DataForSEO): Data-first semantic keyword discovery (volume-validated).
    const useSemantic = config.useSemanticClustering !== false;
    await appendLog(
      runId,
      log,
      "discover",
      useSemantic
        ? `Harvesting live keywords + semantic clustering across ${clusterIds.length} editorial clusters…`
        : `Discovering topics across ${clusterIds.length} clusters…`,
    );

    if (useSemantic) {
      try {
        const minVol = config.minMonthlyVolume ?? defaultMinVolumeForGeo(config.geo);
        const { topics, stats: dfsStats } = await discoverTopicsDataFirst(clusterIds, config.geo, {
          topicsPerCluster: config.topicsPerCluster,
          minMonthlyVolume: minVol,
          minTrafficScore: config.minTrafficScore ?? 25,
        });
        for (const t of topics) {
          if (!existing.has(normalizeKeyword(t.keyword))) allTopics.push(t);
        }
        const relaxed = (dfsStats as { relaxed?: number }).relaxed;
        await appendLog(
          runId,
          log,
          "discover",
          `DataForSEO: ${dfsStats.harvested} harvested → ${dfsStats.after_volume} vol≥${minVol} → ${dfsStats.semantic_groups} groups → ${dfsStats.selected} hubs${relaxed ? ` (relaxed tier ${relaxed})` : ""}`,
        );
      } catch (e: unknown) {
        const msg = String((e as Error)?.message ?? e);
        stats.errors.push(`semantic discover: ${msg}`);
        await appendLog(runId, log, "discover", `Semantic discovery failed, falling back: ${msg}`);
      }
    }
  }

  // Fill gaps: legacy discovery per cluster that still has no topics
  const coveredClusters = new Set(allTopics.map((t) => t.cluster_id));
  const needsLegacy =
    allTopics.length === 0 || coveredClusters.size < Math.min(clusterIds.length, 3);
  if (needsLegacy) {
    for (let ci = 0; ci < clusterIds.length; ci++) {
      const clusterId = clusterIds[ci];
      if (!CLUSTER_HUBS[clusterId]) continue;
      if (allTopics.length > 0 && coveredClusters.has(clusterId)) continue;
      try {
        const topics = await discoverTopicsForCluster(
          clusterId,
          config.geo,
          config.topicsPerCluster,
        );
        for (const t of topics) {
          if (!existing.has(normalizeKeyword(t.keyword))) allTopics.push(t);
        }
        await appendLog(
          runId,
          log,
          "discover",
          `Cluster ${clusterId}: ${topics.length} ideas (legacy fill)`,
        );
      } catch (e: unknown) {
        const msg = String((e as Error)?.message ?? e);
        stats.errors.push(`cluster ${clusterId}: ${msg}`);
        await appendLog(runId, log, "discover", `Cluster ${clusterId} error: ${msg}`);
      }
    }
  }

  // Optional: competitor gap topics (assign to cluster 4 by default)
  if (config.includeCompetitorGap) {
    try {
      const minVol = config.minMonthlyVolume ?? defaultMinVolumeForGeo(config.geo);
      const comp = await fetchCompetitorTopics(config.competitorDomain, config.geo, 25);
      const hub = CLUSTER_HUBS[4];
      const cluster = CLUSTERS.find((c) => c.id === 4)!;
      const compFiltered = comp.filter((r: { keyword: string }) =>
        isKloudbeanScopedKeyword(r.keyword, 3),
      );
      const volMap = await bulkFetchSearchVolumes(
        compFiltered.map((r: { keyword: string }) => r.keyword),
        config.geo,
      );
      for (const row of compFiltered) {
        const norm = normalizeKeyword(row.keyword);
        if (existing.has(norm) || allTopics.some((t) => normalizeKeyword(t.keyword) === norm))
          continue;
        const verifiedVol = volMap.get(norm) ?? row.volume;
        if ((verifiedVol ?? 0) < minVol) continue;
        const score = Math.min(100, Math.round(((verifiedVol ?? 0) / 10000) * 60 + 40));
        allTopics.push({
          keyword: row.keyword,
          title: titleFromKeyword(row.keyword, cluster.name, row.intent),
          volume: verifiedVol,
          difficulty: row.difficulty,
          intent: row.intent,
          opportunity_score: score,
          cluster_id: 4,
          cluster_name: cluster.name,
          pillar: hub.pillar,
          anchor: hub.anchor,
          source: "competitor",
        });
      }
      await appendLog(
        runId,
        log,
        "discover",
        `Competitor gap: ${comp.length} keywords from ${config.competitorDomain} (volume-validated)`,
      );
    } catch (e: unknown) {
      stats.errors.push(`competitor: ${String((e as Error)?.message ?? e)}`);
    }
  }

  stats.topics_discovered = allTopics.length;
  await saveStats(runId, stats);
  await appendLog(runId, log, "discover", `${allTopics.length} new topics ready to create`);

  // Geo-policy guard: drop topics that recommend a provider Kloudbean cannot
  // deliver in this market (e.g. "aws saudi arabia hosting" — KSA is GCP Dammam only),
  // or that present an unsupported provider as a Kloudbean offering (e.g. "managed Azure hosting").
  const policyKept: DiscoveredTopic[] = [];
  let policyDropped = 0;
  const overrides = scopeOverrides();
  for (const t of allTopics) {
    const geoVerdict = validateTopicAgainstGeoPolicy(t.keyword, config.geo);
    const provVerdict = validateSupportedProviders(t.keyword);
    const capVerdict = validateCapability(t.keyword, overrides);
    if (geoVerdict.ok && provVerdict.ok && capVerdict.ok) {
      policyKept.push(t);
    } else {
      policyDropped++;
      stats.errors.push(
        `policy drop "${t.keyword}": ${geoVerdict.reason ?? provVerdict.reason ?? capVerdict.reason}`,
      );
    }
  }
  if (policyDropped > 0) {
    allTopics.length = 0;
    allTopics.push(...policyKept);
    stats.topics_discovered = allTopics.length;
    await saveStats(runId, stats);
    await appendLog(
      runId,
      log,
      "discover",
      `Geo policy (${config.geo}): dropped ${policyDropped} off-policy topic(s) → ${allTopics.length} valid`,
    );
  }

  // Demand gate: reject ideas with no real search demand (SERP-signal validated).
  if (config.validateDemand !== false && hasSerperCredentials()) {
    const threshold = config.demandThreshold ?? DEFAULT_DEMAND_THRESHOLD;
    const demandKept: DiscoveredTopic[] = [];
    let rejected = 0;
    for (const t of allTopics) {
      try {
        const d = await validateKeywordDemand(t.keyword, config.geo, threshold);
        (t as DiscoveredTopic & { demand_score?: number }).demand_score = d.score;
        if (d.validated) {
          demandKept.push(t);
        } else {
          rejected++;
          stats.errors.push(`demand reject "${t.keyword}": ${d.reason}`);
          await signalsRepo.recordSignal({
            keyword: t.keyword,
            clusterId: t.cluster_id,
            geo: config.geo,
            intent: t.intent ?? null,
            demandScore: d.score,
            event: "rejected",
            reward: computeReward({ event: "rejected" }),
          });
        }
      } catch {
        demandKept.push(t); // never block on a failed check
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    stats.demand_rejected = rejected;
    allTopics.length = 0;
    allTopics.push(...demandKept);
    stats.topics_discovered = allTopics.length;
    await saveStats(runId, stats);
    await appendLog(
      runId,
      log,
      "discover",
      `Demand gate: rejected ${rejected} no-demand idea(s) → ${allTopics.length} with real search demand`,
    );
  }

  // Self-learning re-rank: prioritize clusters/intents that historically won.
  if (config.useLearning !== false) {
    try {
      const model = await buildLearningModel();
      if (model.total >= 5 || model.searchClusters > 0 || model.conversionClusters > 0) {
        const reranked = applyLearning(allTopics, model);
        allTopics.length = 0;
        allTopics.push(...reranked);
        await appendLog(
          runId,
          log,
          "discover",
          `Learning ranker applied (${model.total} signals, ${model.searchClusters} GSC + ${model.conversionClusters} conversion clusters) — topics re-prioritized by real wins`,
        );
      }
    } catch (e) {
      stats.errors.push(`learning: ${String((e as Error)?.message ?? e)}`);
    }
  }

  // Phase 2: Create & save articles
  const createdIds: string[] = [];
  let weekOffset = 0;
  for (const topic of allTopics) {
    try {
      const inserted = await articlesRepo.insertArticle({
        title: topic.title,
        target_keyword: topic.keyword,
        pillar: topic.pillar,
        cluster_id: topic.cluster_id,
        cluster_name: topic.cluster_name,
        anchor: topic.anchor,
        geo_target: config.geo,
        language: "en",
        status: "idea",
        priority:
          topic.opportunity_score >= 65 ? "high" : topic.opportunity_score >= 45 ? "medium" : "low",
        scheduled_week: assignWeek(topic.cluster_id - 1, weekOffset++),
        url_slug: slugFromKeyword(topic.keyword),
        engine_source: `authority_engine:${topic.source}`,
        keyword_data: {
          keyword: topic.keyword,
          monthly_volume: topic.volume,
          difficulty: topic.difficulty,
          search_intent: topic.intent,
          opportunity_score: topic.opportunity_score,
          geo_target: config.geo,
          discovered_at: new Date().toISOString(),
          semantic_core_keyword: topic.semantic_core_keyword ?? null,
          supporting_keywords: topic.supporting_keywords ?? [],
          cluster_total_volume: topic.cluster_total_volume ?? null,
          traffic_score: topic.traffic_score ?? null,
          keyword_count_in_cluster: topic.keyword_count_in_cluster ?? null,
          // Serper-derived signals (available when discoverySource=serper)
          paa_questions: (topic as { paa_questions?: string[] }).paa_questions ?? [],
          top_10_urls: (topic as { serp_competitors?: string[] }).serp_competitors ?? [],
          related_keywords: (topic.supporting_keywords ?? []).map((k) => ({
            keyword: k,
            volume: null,
            difficulty: null,
            intent: null,
          })),
          discovery_source: source,
        },
        secondary_keywords: topic.supporting_keywords?.slice(0, 8) ?? [],
        demand_score: (topic as { demand_score?: number }).demand_score ?? null,
        demand_validated: config.validateDemand !== false && hasSerperCredentials() ? "yes" : null,
      });
      createdIds.push(inserted.id);
      existing.add(normalizeKeyword(topic.keyword));
      stats.articles_created++;
      await signalsRepo.recordSignal({
        articleId: inserted.id,
        keyword: topic.keyword,
        clusterId: topic.cluster_id,
        geo: config.geo,
        intent: topic.intent ?? null,
        demandScore: (topic as { demand_score?: number }).demand_score ?? null,
        event: "generated",
        reward: computeReward({
          event: "generated",
          demandScore: (topic as { demand_score?: number }).demand_score ?? null,
        }),
        features: { source: topic.source, opportunity: topic.opportunity_score },
      });
    } catch (e: unknown) {
      stats.errors.push(`insert ${topic.keyword}: ${String((e as Error)?.message ?? e)}`);
    }
  }
  await saveStats(runId, stats);
  await appendLog(runId, log, "create", `Saved ${stats.articles_created} articles to database`);

  // Rebuild the semantic silo so new articles get hub/supporting roles + links.
  try {
    const { rebuildSilo } = await import("@/lib/silo-map");
    const silo = await rebuildSilo(config.geo);
    await appendLog(
      runId,
      log,
      "create",
      `Silo rebuilt: ${silo.hubs} hubs, ${silo.supporting} supporting`,
    );
  } catch (e) {
    stats.errors.push(`silo: ${String((e as Error)?.message ?? e)}`);
  }

  // Phase 3: Research per article. With Serper, discovery already captured PAA +
  // SERP competitors, so we skip the expensive DataForSEO calls. With DataForSEO
  // source, run full research (keywords table + meta).
  if (source === "dataforseo") {
    await appendLog(
      runId,
      log,
      "research",
      `Running DataForSEO research on ${createdIds.length} articles…`,
    );
    for (const id of createdIds) {
      try {
        await applyResearchToArticleInternal(id, config.geo);
        stats.keywords_researched++;
        await saveStats(runId, stats);
      } catch (e: unknown) {
        stats.errors.push(`research ${id}: ${String((e as Error)?.message ?? e)}`);
      }
      await new Promise((r) => setTimeout(r, 350));
    }
    await appendLog(
      runId,
      log,
      "research",
      `Researched ${stats.keywords_researched} keywords (saved to keywords + articles)`,
    );
  } else {
    stats.keywords_researched = createdIds.length;
    await saveStats(runId, stats);
    await appendLog(
      runId,
      log,
      "research",
      `Serper source: SERP/PAA/competitors captured during discovery — skipped DataForSEO research`,
    );
  }

  // Phase 4: AI briefs
  if (config.generateBriefs) {
    if (!hasAiCredentials()) {
      stats.errors.push("AI not configured — set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env");
      await appendLog(runId, log, "briefs", "Skipped briefs — configure AI in .env");
    } else {
      await appendLog(
        runId,
        log,
        "briefs",
        `Generating AI briefs for ${createdIds.length} articles…`,
      );
      for (const id of createdIds) {
        const r = await generateBriefInternal(id);
        if (r.ok) stats.briefs_generated++;
        else if (r.error) stats.errors.push(`brief ${id}: ${r.error}`);
        await saveStats(runId, stats);
        await new Promise((r) => setTimeout(r, 800));
      }
      await appendLog(runId, log, "briefs", `Generated ${stats.briefs_generated} briefs`);
    }
  }

  if (config.generateContent && config.generateBriefs && hasAiCredentials()) {
    await appendLog(runId, log, "content", `Writing draft content…`);
    for (const id of createdIds) {
      const r = await generateContentInternal(id);
      if (r.ok) stats.content_generated++;
      else if (r.error) stats.errors.push(`content ${id}: ${r.error}`);
      await saveStats(runId, stats);
      await new Promise((r) => setTimeout(r, 1200));
    }
    await appendLog(runId, log, "content", `Generated ${stats.content_generated} draft articles`);
  }

  await engineRepo.updateEngineRun(runId, {
    status: "completed",
    stats,
    log,
    finishedAt: new Date(),
  });
  await appendLog(runId, log, "done", "Engine run completed");

  return { runId, stats, log };
}
