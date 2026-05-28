import "@tanstack/react-start/server-only";
import * as articlesRepo from "@/server/db/repos/articles";
import * as engineRepo from "@/server/db/repos/engine";
import { applyResearchToArticleInternal } from "@/lib/dataforseo.functions";
import { generateBriefInternal, generateContentInternal } from "@/lib/ai.functions";
import { hasAiCredentials } from "@/lib/ai-provider";
import { CLUSTERS } from "@/lib/pillars";
import { CLUSTER_HUBS, DEFAULT_COMPETITOR_DOMAIN, normalizeKeyword, slugFromKeyword, titleFromKeyword } from "@/lib/cluster-seeds";
import { isKloudbeanScopedKeyword } from "@/lib/kloudbean-scope";
import { discoverTopicsForCluster, fetchCompetitorTopics, type DiscoveredTopic } from "@/lib/topic-discovery";
import { discoverTopicsDataFirst, defaultMinVolumeForGeo, bulkFetchSearchVolumes } from "@/lib/semantic-keyword-cluster";
import { hasDataForSeoCredentials } from "@/lib/dataforseo-client";

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
};

export type EngineLogEntry = { at: string; phase: string; message: string };

export type EngineStats = {
  topics_discovered: number;
  articles_created: number;
  keywords_researched: number;
  briefs_generated: number;
  content_generated: number;
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

  const clusterIds = config.clusterIds?.length
    ? config.clusterIds
    : CLUSTERS.map((c) => c.id);

  const existing = await getExistingKeywords(config.geo);
  const allTopics: DiscoveredTopic[] = [];

  // Phase 1: Data-first semantic keyword discovery (DataForSEO → cluster → traffic filter)
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
      const { topics, stats } = await discoverTopicsDataFirst(clusterIds, config.geo, {
        topicsPerCluster: config.topicsPerCluster,
        minMonthlyVolume: minVol,
        minTrafficScore: config.minTrafficScore ?? 35,
      });
      for (const t of topics) {
        if (!existing.has(normalizeKeyword(t.keyword))) allTopics.push(t);
      }
      await appendLog(
        runId,
        log,
        "discover",
        `DataForSEO: ${stats.harvested} harvested → ${stats.after_volume} with volume ≥${minVol} → ${stats.semantic_groups} semantic groups → ${stats.selected} hub topics`,
      );
    } catch (e: unknown) {
      const msg = String((e as Error)?.message ?? e);
      stats.errors.push(`semantic discover: ${msg}`);
      await appendLog(runId, log, "discover", `Semantic discovery failed, falling back: ${msg}`);
    }
  }

  if (allTopics.length === 0) {
    for (let ci = 0; ci < clusterIds.length; ci++) {
      const clusterId = clusterIds[ci];
      if (!CLUSTER_HUBS[clusterId]) continue;
      try {
        const topics = await discoverTopicsForCluster(clusterId, config.geo, config.topicsPerCluster);
        for (const t of topics) {
          if (!existing.has(normalizeKeyword(t.keyword))) allTopics.push(t);
        }
        await appendLog(runId, log, "discover", `Cluster ${clusterId}: ${topics.length} ideas (legacy path)`);
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
      const compFiltered = comp.filter((r) => isKloudbeanScopedKeyword(r.keyword, 3));
      const volMap = await bulkFetchSearchVolumes(
        compFiltered.map((r) => r.keyword),
        config.geo,
      );
      for (const row of compFiltered) {
        const norm = normalizeKeyword(row.keyword);
        if (existing.has(norm) || allTopics.some((t) => normalizeKeyword(t.keyword) === norm)) continue;
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
      await appendLog(runId, log, "discover", `Competitor gap: ${comp.length} keywords from ${config.competitorDomain} (volume-validated)`);
    } catch (e: unknown) {
      stats.errors.push(`competitor: ${String((e as Error)?.message ?? e)}`);
    }
  }

  stats.topics_discovered = allTopics.length;
  await saveStats(runId, stats);
  await appendLog(runId, log, "discover", `${allTopics.length} new topics ready to create`);

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
        priority: topic.opportunity_score >= 65 ? "high" : topic.opportunity_score >= 45 ? "medium" : "low",
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
        },
        secondary_keywords: topic.supporting_keywords?.slice(0, 8) ?? [],
      });
      createdIds.push(inserted.id);
      existing.add(normalizeKeyword(topic.keyword));
      stats.articles_created++;
    } catch (e: unknown) {
      stats.errors.push(`insert ${topic.keyword}: ${String((e as Error)?.message ?? e)}`);
    }
  }
  await saveStats(runId, stats);
  await appendLog(runId, log, "create", `Saved ${stats.articles_created} articles to database`);

  // Phase 3: Full DataForSEO research per article (keywords table + meta)
  await appendLog(runId, log, "research", `Running DataForSEO research on ${createdIds.length} articles…`);
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
  await appendLog(runId, log, "research", `Researched ${stats.keywords_researched} keywords (saved to keywords + articles)`);

  // Phase 4: AI briefs
  if (config.generateBriefs) {
    if (!hasAiCredentials()) {
      stats.errors.push("AI not configured — set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env");
      await appendLog(runId, log, "briefs", "Skipped briefs — configure AI in .env");
    } else {
      await appendLog(runId, log, "briefs", `Generating AI briefs for ${createdIds.length} articles…`);
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
