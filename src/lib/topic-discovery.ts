import { dfsPost, hasDataForSeoCredentials, locCode, opportunityScore, parseIntent } from "./dataforseo-client";
import { scoreKsaGcpAlignment } from "./kloudbean-knowledge";
import {
  CLUSTER_FALLBACK_KEYWORDS,
  filterToKloudbeanTopics,
  isKloudbeanScopedKeyword,
} from "./kloudbean-scope";
import { CLUSTER_HUBS, clusterById, normalizeKeyword, titleFromKeyword } from "./cluster-seeds";
import type { SearchIntent } from "./seo-types";

export type DiscoveredTopic = {
  keyword: string;
  title: string;
  volume: number | null;
  difficulty: number | null;
  intent: SearchIntent | null;
  opportunity_score: number;
  cluster_id: number;
  cluster_name: string;
  pillar: number;
  anchor: string;
  source: "keyword_ideas" | "related" | "competitor";
  /** DataForSEO semantic cluster hub (core_keyword) */
  semantic_core_keyword?: string;
  supporting_keywords?: string[];
  cluster_total_volume?: number;
  traffic_score?: number;
  keyword_count_in_cluster?: number;
};

async function fetchIdeasFromSeed(seed: string, geo: string, limit: number) {
  if (!hasDataForSeoCredentials()) {
    return Array.from({ length: 8 }, (_, i) => ({
      keyword: `kloudbean ${seed} ${["pricing", "deploy", "saudi", "enterprise", "vs cloudways", "managed", "setup", "alternative"][i % 8]}`,
      volume: Math.floor(Math.random() * 2500) + 150,
      difficulty: Math.floor(Math.random() * 55) + 15,
      intent: (seed.match(/price|vs|alternative/i) ? "commercial" : "informational") as SearchIntent,
    }));
  }
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
    .map((it: Record<string, unknown>) => {
      const kd = it.keyword_data as Record<string, unknown> | undefined;
      const ki = kd?.keyword_info as { search_volume?: number } | undefined;
      const kp = kd?.keyword_properties as { keyword_difficulty?: number } | undefined;
      const kw = String(kd?.keyword ?? it.keyword ?? "");
      const intent = parseIntent(it.search_intent)?.intent ?? null;
      return {
        keyword: kw,
        volume: ki?.search_volume ?? null,
        difficulty: kp?.keyword_difficulty ?? null,
        intent,
      };
    })
    .filter((x) => x.keyword.length > 2 && isKloudbeanScopedKeyword(x.keyword, 3));
}

async function fetchRelatedFromSeed(seed: string, geo: string, limit: number) {
  if (!hasDataForSeoCredentials()) return [];
  try {
    const res = await dfsPost("/v3/dataforseo_labs/google/related_keywords/live", [
      { keyword: seed, location_code: locCode(geo), language_code: "en", limit, include_seed_keyword: false },
    ]);
    const items = res?.tasks?.[0]?.result?.[0]?.items ?? [];
    return items
      .map((it: Record<string, unknown>) => {
        const kd = it.keyword_data as Record<string, unknown> | undefined;
        const ki = kd?.keyword_info as { search_volume?: number } | undefined;
        const kp = kd?.keyword_properties as { keyword_difficulty?: number } | undefined;
        return {
          keyword: String(kd?.keyword ?? it.keyword ?? ""),
          volume: ki?.search_volume ?? null,
          difficulty: kp?.keyword_difficulty ?? null,
          intent: parseIntent(it.search_intent)?.intent ?? null,
        };
      })
      .filter((x) => x.keyword.length > 2 && isKloudbeanScopedKeyword(x.keyword, 3));
  } catch {
    return [];
  }
}

export async function fetchCompetitorTopics(domain: string, geo: string, limit: number) {
  if (!hasDataForSeoCredentials()) {
    return [
      { keyword: "managed cloud hosting", volume: 2400, difficulty: 45, intent: "commercial" as SearchIntent },
      { keyword: "wordpress managed hosting", volume: 1800, difficulty: 52, intent: "commercial" as SearchIntent },
    ];
  }
  const target = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const res = await dfsPost("/v3/dataforseo_labs/google/ranked_keywords/live", [
    {
      target,
      location_code: locCode(geo),
      language_code: "en",
      limit,
      order_by: ["keyword_data.keyword_info.search_volume,desc"],
    },
  ]);
  const items = res?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items.map((it: Record<string, unknown>) => {
    const kd = it.keyword_data as Record<string, unknown> | undefined;
    const ki = kd?.keyword_info as { search_volume?: number } | undefined;
    const kp = kd?.keyword_properties as { keyword_difficulty?: number } | undefined;
    return {
      keyword: String(kd?.keyword ?? ""),
      volume: ki?.search_volume ?? null,
      difficulty: kp?.keyword_difficulty ?? null,
      intent: "commercial" as SearchIntent,
    };
  })
    .filter((x) => x.keyword.length > 2)
    .filter((x) => isKloudbeanScopedKeyword(x.keyword, 3));
}

/** Discover topic candidates for one cluster via DataForSEO hub seeds. */
export async function discoverTopicsForCluster(
  clusterId: number,
  geo: string,
  topicsPerCluster: number,
  ideasPerSeed = 12,
): Promise<DiscoveredTopic[]> {
  const hub = CLUSTER_HUBS[clusterId];
  if (!hub) return [];
  const cluster = clusterById(clusterId);
  const seen = new Set<string>();
  const raw: Array<{
    keyword: string;
    volume: number | null;
    difficulty: number | null;
    intent: SearchIntent | null;
    source: DiscoveredTopic["source"];
  }> = [];

  for (const seed of hub.seeds) {
    const [ideas, related] = await Promise.all([
      fetchIdeasFromSeed(seed, geo, ideasPerSeed),
      fetchRelatedFromSeed(seed, geo, 8),
    ]);
    for (const row of ideas) raw.push({ ...row, source: "keyword_ideas" });
    for (const row of related) raw.push({ ...row, source: "related" });
    await new Promise((r) => setTimeout(r, 200));
  }

  const scopedRaw = filterToKloudbeanTopics(raw, 4);
  if (scopedRaw.length < topicsPerCluster) {
    const fallbacks = CLUSTER_FALLBACK_KEYWORDS[clusterId] ?? [];
    for (const kw of fallbacks) {
      if (scopedRaw.length >= topicsPerCluster) break;
      const norm = normalizeKeyword(kw);
      if (seen.has(norm)) continue;
      seen.add(norm);
      scopedRaw.push({
        keyword: kw,
        volume: 500,
        difficulty: 35,
        intent: "informational" as SearchIntent,
        source: "keyword_ideas",
      });
    }
  }

  const topics: DiscoveredTopic[] = [];
  for (const row of scopedRaw) {
    const norm = normalizeKeyword(row.keyword);
    if (seen.has(norm) || norm.length < 4) continue;
    seen.add(norm);
    const score = opportunityScore(row.volume, row.difficulty, row.intent);
    topics.push({
      keyword: row.keyword,
      title: titleFromKeyword(row.keyword, cluster.name, row.intent),
      volume: row.volume,
      difficulty: row.difficulty,
      intent: row.intent,
      opportunity_score: score,
      cluster_id: clusterId,
      cluster_name: cluster.name,
      pillar: hub.pillar,
      anchor: hub.anchor,
      source: row.source,
    });
  }

  topics.sort((a, b) => {
    const ksaBoost =
      geo === "sa" ? (scoreKsaGcpAlignment(b.keyword) - scoreKsaGcpAlignment(a.keyword)) * 3 : 0;
    return b.opportunity_score - a.opportunity_score + ksaBoost;
  });
  return topics.slice(0, topicsPerCluster);
}
