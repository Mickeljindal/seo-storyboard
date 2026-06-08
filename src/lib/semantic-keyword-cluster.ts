/**
 * Data-first semantic keyword clustering via DataForSEO.
 * Flow: harvest live keywords → bulk validate volume/intent → group by core_keyword → pick hub topics.
 */
import {
  dfsPost,
  hasDataForSeoCredentials,
  locCode,
  opportunityScore,
  parseIntent,
  trafficPriorityScore,
} from "./dataforseo-client";
import { scoreKsaGcpAlignment } from "./kloudbean-knowledge";
import {
  CLUSTER_FALLBACK_KEYWORDS,
  isKloudbeanScopedKeyword,
} from "./kloudbean-scope";
import { CLUSTER_HUBS, clusterById, normalizeKeyword, titleFromKeyword } from "./cluster-seeds";
import type { DiscoveredTopic } from "./topic-discovery";
import type { SearchIntent } from "./seo-types";

export type KeywordCandidate = {
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  intent: SearchIntent | null;
  core_keyword: string | null;
  clustering_algorithm: string | null;
  source: "keyword_ideas" | "related" | "competitor";
  source_seed: string;
  editorial_cluster_id: number;
};

export type SemanticClusterGroup = {
  core_keyword: string;
  editorial_cluster_id: number;
  keywords: KeywordCandidate[];
  hub_keyword: string;
  supporting_keywords: string[];
  total_volume: number;
  avg_difficulty: number | null;
  dominant_intent: SearchIntent | null;
  traffic_score: number;
};

export type DataFirstDiscoveryOptions = {
  topicsPerCluster: number;
  /** Min verified monthly searches — filters low-traffic noise */
  minMonthlyVolume: number;
  /** Min traffic priority score (0–100) after volume + intent weighting */
  minTrafficScore: number;
  relatedDepth: number;
  ideasPerSeed: number;
};

const DEFAULT_OPTS: DataFirstDiscoveryOptions = {
  topicsPerCluster: 5,
  minMonthlyVolume: 50,
  minTrafficScore: 25,
  relatedDepth: 1,
  ideasPerSeed: 20,
};

export function defaultMinVolumeForGeo(geo: string): number {
  switch (geo) {
    case "sa":
      return 30;
    case "ae":
      return 50;
    case "in":
      return 100;
    case "global":
      return 200;
    default:
      return 50;
  }
}

function parseKeywordItem(
  it: Record<string, unknown>,
  source: KeywordCandidate["source"],
  sourceSeed: string,
  editorialClusterId: number,
): KeywordCandidate | null {
  const kd = it.keyword_data as Record<string, unknown> | undefined;
  const ki = kd?.keyword_info as { search_volume?: number } | undefined;
  const kp = kd?.keyword_properties as { keyword_difficulty?: number; core_keyword?: string } | undefined;
  const kw = String(kd?.keyword ?? it.keyword ?? "").trim();
  if (kw.length < 3) return null;

  const core =
    String(kp?.core_keyword ?? kd?.core_keyword ?? it.core_keyword ?? "").trim() || null;
  const algo = String(
    kp?.synonym_clustering_algorithm ?? kd?.synonym_clustering_algorithm ?? it.synonym_clustering_algorithm ?? "",
  ).trim() || null;

  return {
    keyword: kw,
    volume: ki?.search_volume ?? null,
    difficulty: kp?.keyword_difficulty ?? null,
    intent: parseIntent(it.search_intent ?? kd)?.intent ?? null,
    core_keyword: core,
    clustering_algorithm: algo,
    source,
    source_seed: sourceSeed,
    editorial_cluster_id: editorialClusterId,
  };
}

async function fetchRelatedTree(seed: string, geo: string, depth: number, editorialClusterId: number) {
  const res = await dfsPost("/v3/dataforseo_labs/google/related_keywords/live", [
    {
      keyword: seed,
      location_code: locCode(geo),
      language_code: "en",
      depth,
      limit: 100,
      include_seed_keyword: true,
      replace_with_core_keyword: false,
    },
  ]);
  const items = res?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items
    .map((it: Record<string, unknown>) => parseKeywordItem(it, "related", seed, editorialClusterId))
    .filter(Boolean) as KeywordCandidate[];
}

async function fetchIdeas(seed: string, geo: string, limit: number, editorialClusterId: number) {
  const res = await dfsPost("/v3/dataforseo_labs/google/keyword_ideas/live", [
    {
      keywords: [seed],
      location_code: locCode(geo),
      language_code: "en",
      limit,
      include_serp_info: true,
    },
  ]);
  const items = res?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items
    .map((it: Record<string, unknown>) => parseKeywordItem(it, "keyword_ideas", seed, editorialClusterId))
    .filter(Boolean) as KeywordCandidate[];
}

/** Bulk Google Ads search volume — fills gaps where Labs returned null volume. */
export async function bulkFetchSearchVolumes(
  keywords: string[],
  geo: string,
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  if (!keywords.length || !hasDataForSeoCredentials()) return out;

  const unique = [...new Set(keywords.map(normalizeKeyword))].filter(Boolean);
  const CHUNK = 700;

  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    try {
      const res = await dfsPost("/v3/keywords_data/google_ads/search_volume/live", [
        { keywords: chunk, location_code: locCode(geo), language_code: "en" },
      ]);
      const results = res?.tasks?.[0]?.result ?? [];
      for (const row of results) {
        const kw = String(row?.keyword ?? "").trim();
        if (!kw) continue;
        const vol = row?.search_volume ?? null;
        out.set(normalizeKeyword(kw), vol);
        // Also store original casing key for lookup mismatches
        if (kw.toLowerCase() !== kw) out.set(normalizeKeyword(kw.toLowerCase()), vol);
      }
    } catch {
      /* partial failure ok */
    }
    await new Promise((r) => setTimeout(r, 180));
  }
  return out;
}

async function bulkFetchDifficulty(keywords: string[], geo: string): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  if (!keywords.length || !hasDataForSeoCredentials()) return out;

  const unique = [...new Set(keywords.map(normalizeKeyword))].filter(Boolean);
  const CHUNK = 100;

  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    try {
      const res = await dfsPost("/v3/dataforseo_labs/google/bulk_keyword_difficulty/live", [
        { keywords: chunk, location_code: locCode(geo), language_code: "en" },
      ]);
      const items = res?.tasks?.[0]?.result?.[0]?.items ?? [];
      for (const it of items) {
        const kw = String(it?.keyword ?? "").trim();
        if (kw) out.set(normalizeKeyword(kw), it?.keyword_difficulty ?? null);
      }
    } catch {
      /* skip */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return out;
}

async function bulkFetchIntent(keywords: string[], geo: string): Promise<Map<string, SearchIntent | null>> {
  const out = new Map<string, SearchIntent | null>();
  if (!keywords.length || !hasDataForSeoCredentials()) return out;

  const unique = [...new Set(keywords.map(normalizeKeyword))].filter(Boolean);
  const CHUNK = 100;

  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    try {
      const res = await dfsPost("/v3/dataforseo_labs/google/search_intent/live", [
        { keywords: chunk, location_code: locCode(geo), language_code: "en" },
      ]);
      const items = res?.tasks?.[0]?.result?.[0]?.items ?? [];
      for (const it of items) {
        const kw = String(it?.keyword ?? "").trim();
        if (kw) out.set(normalizeKeyword(kw), parseIntent(it)?.intent ?? null);
      }
    } catch {
      /* skip */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return out;
}

function clusterKey(c: KeywordCandidate): string {
  const core = c.core_keyword ? normalizeKeyword(c.core_keyword) : normalizeKeyword(c.keyword);
  return `${c.editorial_cluster_id}::${core}`;
}

function dominantIntent(keywords: KeywordCandidate[]): SearchIntent | null {
  const counts = new Map<SearchIntent, number>();
  for (const k of keywords) {
    if (!k.intent) continue;
    counts.set(k.intent, (counts.get(k.intent) ?? 0) + 1);
  }
  let best: SearchIntent | null = null;
  let max = 0;
  for (const [intent, n] of counts) {
    if (n > max) {
      max = n;
      best = intent;
    }
  }
  return best;
}

/** Group candidates by DataForSEO core_keyword (semantic synonym clusters). */
export function buildSemanticClusters(candidates: KeywordCandidate[]): SemanticClusterGroup[] {
  const groups = new Map<string, KeywordCandidate[]>();

  for (const c of candidates) {
    const key = clusterKey(c);
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  const clusters: SemanticClusterGroup[] = [];

  for (const [, keywords] of groups) {
    if (!keywords.length) continue;

    const sorted = [...keywords].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
    const hub = sorted[0];
    const core = hub.core_keyword ?? hub.keyword;
    const supporting = sorted.slice(1, 8).map((k) => k.keyword);
    const totalVolume = sorted.reduce((s, k) => s + (k.volume ?? 0), 0);
    const diffs = sorted.map((k) => k.difficulty).filter((d): d is number => d != null);
    const avgDiff = diffs.length ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : null;
    const intent = dominantIntent(sorted);

    clusters.push({
      core_keyword: core,
      editorial_cluster_id: hub.editorial_cluster_id,
      keywords: sorted,
      hub_keyword: hub.keyword,
      supporting_keywords: supporting,
      total_volume: totalVolume,
      avg_difficulty: avgDiff,
      dominant_intent: intent,
      traffic_score: trafficPriorityScore(hub.volume, avgDiff, intent, totalVolume),
    });
  }

  return clusters.sort((a, b) => b.traffic_score - a.traffic_score);
}

function mockCandidates(clusterId: number, geo: string): KeywordCandidate[] {
  const fallbacks = CLUSTER_FALLBACK_KEYWORDS[clusterId] ?? ["kloudbean managed hosting"];
  return fallbacks.map((kw, i) => ({
    keyword: kw,
    volume: 800 + i * 400,
    difficulty: 30 + i * 5,
    intent: "informational" as SearchIntent,
    core_keyword: normalizeKeyword(kw),
    clustering_algorithm: "mock",
    source: "keyword_ideas" as const,
    source_seed: "mock",
    editorial_cluster_id: clusterId,
  }));
}

/** Harvest raw keyword candidates from DataForSEO for one editorial cluster. */
export async function harvestClusterKeywords(
  clusterId: number,
  geo: string,
  opts: Pick<DataFirstDiscoveryOptions, "relatedDepth" | "ideasPerSeed">,
): Promise<KeywordCandidate[]> {
  const hub = CLUSTER_HUBS[clusterId];
  if (!hub) return [];

  if (!hasDataForSeoCredentials()) {
    return mockCandidates(clusterId, geo);
  }

  const seen = new Set<string>();
  const raw: KeywordCandidate[] = [];

  for (const seed of hub.seeds) {
    const [related, ideas] = await Promise.all([
      fetchRelatedTree(seed, geo, opts.relatedDepth, clusterId),
      fetchIdeas(seed, geo, opts.ideasPerSeed, clusterId),
    ]);
    for (const row of [...related, ...ideas]) {
      const norm = normalizeKeyword(row.keyword);
      if (seen.has(norm)) continue;
      if (!isKloudbeanScopedKeyword(row.keyword, 3)) continue;
      seen.add(norm);
      raw.push(row);
    }
    await new Promise((r) => setTimeout(r, 220));
  }

  return raw;
}

/** Enrich candidates with verified volume, difficulty, intent from DataForSEO bulk APIs. */
export async function enrichCandidates(
  candidates: KeywordCandidate[],
  geo: string,
): Promise<KeywordCandidate[]> {
  if (!candidates.length) return [];

  const needVolume = candidates.filter((c) => c.volume == null).map((c) => c.keyword);
  const needDiff = candidates.filter((c) => c.difficulty == null).map((c) => c.keyword);
  const needIntent = candidates.filter((c) => !c.intent).map((c) => c.keyword);

  const [volumes, diffs, intents] = await Promise.all([
    needVolume.length ? bulkFetchSearchVolumes(needVolume, geo) : Promise.resolve(new Map()),
    needDiff.length ? bulkFetchDifficulty(needDiff, geo) : Promise.resolve(new Map()),
    needIntent.length ? bulkFetchIntent(needIntent, geo) : Promise.resolve(new Map()),
  ]);

  return candidates.map((c) => {
    const norm = normalizeKeyword(c.keyword);
    return {
      ...c,
      volume: c.volume ?? volumes.get(norm) ?? null,
      difficulty: c.difficulty ?? diffs.get(norm) ?? null,
      intent: c.intent ?? intents.get(norm) ?? null,
    };
  });
}

function clusterToTopic(group: SemanticClusterGroup, geo: string): DiscoveredTopic {
  const cluster = clusterById(group.editorial_cluster_id);
  const hub = CLUSTER_HUBS[group.editorial_cluster_id];
  const hubKw = group.keywords.find((k) => k.keyword === group.hub_keyword) ?? group.keywords[0];
  const intent = hubKw?.intent ?? group.dominant_intent;
  const volume = hubKw?.volume ?? null;
  const difficulty = hubKw?.difficulty ?? group.avg_difficulty;

  const ksaBoost = geo === "sa" ? scoreKsaGcpAlignment(group.hub_keyword) * 2 : 0;
  const opp = opportunityScore(volume, difficulty, intent);
  const traffic = group.traffic_score;

  return {
    keyword: group.hub_keyword,
    title: titleFromKeyword(group.hub_keyword, cluster.name, intent),
    volume,
    difficulty,
    intent,
    opportunity_score: Math.min(100, Math.round(opp * 0.4 + traffic * 0.6 + ksaBoost)),
    cluster_id: group.editorial_cluster_id,
    cluster_name: cluster.name,
    pillar: hub.pillar,
    anchor: hub.anchor,
    source: hubKw?.source ?? "related",
    semantic_core_keyword: group.core_keyword,
    supporting_keywords: group.supporting_keywords,
    cluster_total_volume: group.total_volume,
    traffic_score: group.traffic_score,
    keyword_count_in_cluster: group.keywords.length,
  };
}

/** Data-first discovery: harvest → enrich → semantic cluster → traffic filter → hub topics. */
export async function discoverTopicsDataFirst(
  clusterIds: number[],
  geo: string,
  options: Partial<DataFirstDiscoveryOptions> = {},
): Promise<{ topics: DiscoveredTopic[]; stats: Record<string, number> }> {
  const opts = { ...DEFAULT_OPTS, ...options };
  if (options.minMonthlyVolume == null) {
    opts.minMonthlyVolume = defaultMinVolumeForGeo(geo);
  }

  const stats = {
    harvested: 0,
    after_scope: 0,
    after_volume: 0,
    semantic_groups: 0,
    selected: 0,
  };

  let allCandidates: KeywordCandidate[] = [];

  for (const clusterId of clusterIds) {
    const batch = await harvestClusterKeywords(clusterId, geo, opts);
    allCandidates.push(...batch);
  }

  stats.harvested = allCandidates.length;

  const scoped: KeywordCandidate[] = [];
  const seen = new Set<string>();
  for (const c of allCandidates) {
    const norm = normalizeKeyword(c.keyword);
    if (seen.has(norm)) continue;
    if (!isKloudbeanScopedKeyword(c.keyword, 4)) continue;
    seen.add(norm);
    scoped.push(c);
  }
  allCandidates = scoped;
  stats.after_scope = allCandidates.length;

  allCandidates = await enrichCandidates(allCandidates, geo);

  const volumeFiltered = allCandidates.filter((c) => (c.volume ?? 0) >= opts.minMonthlyVolume);
  stats.after_volume = volumeFiltered.length;

  // If volume filter too aggressive, re-enrich fallbacks per cluster
  if (volumeFiltered.length < clusterIds.length * 2 && !hasDataForSeoCredentials()) {
    for (const clusterId of clusterIds) {
      volumeFiltered.push(...mockCandidates(clusterId, geo));
    }
  } else if (volumeFiltered.length < clusterIds.length) {
    for (const clusterId of clusterIds) {
      for (const kw of CLUSTER_FALLBACK_KEYWORDS[clusterId] ?? []) {
        if (volumeFiltered.some((c) => normalizeKeyword(c.keyword) === normalizeKeyword(kw))) continue;
        volumeFiltered.push({
          keyword: kw,
          volume: opts.minMonthlyVolume + 200,
          difficulty: 35,
          intent: "informational",
          core_keyword: normalizeKeyword(kw),
          clustering_algorithm: "fallback",
          source: "keyword_ideas",
          source_seed: "fallback",
          editorial_cluster_id: clusterId,
        });
      }
    }
  }

  const semanticGroups = buildSemanticClusters(volumeFiltered);
  stats.semantic_groups = semanticGroups.length;

  function pickTopics(
    groups: SemanticClusterGroup[],
    minTraffic: number,
    minVol: number,
  ): DiscoveredTopic[] {
    const picked: DiscoveredTopic[] = [];
    const perClusterCount = new Map<number, number>();

    for (const group of groups) {
      const hubVol = group.keywords[0]?.volume ?? 0;
      if (hubVol > 0 && hubVol < minVol) continue;
      if (group.traffic_score < minTraffic) continue;

      const count = perClusterCount.get(group.editorial_cluster_id) ?? 0;
      if (count >= opts.topicsPerCluster) continue;

      picked.push(clusterToTopic(group, geo));
      perClusterCount.set(group.editorial_cluster_id, count + 1);
    }

    picked.sort(
      (a, b) =>
        (b.traffic_score ?? 0) - (a.traffic_score ?? 0) + (b.opportunity_score - a.opportunity_score),
    );
    return picked;
  }

  let topics = pickTopics(semanticGroups, opts.minTrafficScore, opts.minMonthlyVolume);

  // Relax filters if nothing passed — niche Kloudbean keywords often have low SA volume
  if (topics.length === 0 && volumeFiltered.length > 0) {
    topics = pickTopics(semanticGroups, 15, Math.max(10, Math.floor(opts.minMonthlyVolume / 3)));
    stats.selected = topics.length;
    if (topics.length > 0) return { topics, stats: { ...stats, selected: topics.length, relaxed: 1 } };
  }

  // Last resort: top hub per editorial cluster by volume (still Kloudbean-scoped)
  if (topics.length === 0 && volumeFiltered.length > 0) {
    const byCluster = new Map<number, KeywordCandidate>();
    for (const c of volumeFiltered) {
      const prev = byCluster.get(c.editorial_cluster_id);
      if (!prev || (c.volume ?? 0) > (prev.volume ?? 0)) byCluster.set(c.editorial_cluster_id, c);
    }
    for (const c of byCluster.values()) {
      const group = buildSemanticClusters([c])[0];
      if (group) topics.push(clusterToTopic(group, geo));
    }
    return { topics, stats: { ...stats, selected: topics.length, relaxed: 2 } };
  }

  stats.selected = topics.length;
  return { topics, stats };
}
