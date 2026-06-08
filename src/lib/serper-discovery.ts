import {
  serperSearch,
  serperAutocomplete,
  hasSerperCredentials,
  inferIntentFromKeyword,
  serperOpportunityScore,
  estimateCompetitorStrength,
  type SerperSearchResult,
} from "./serper-client";
import { CLUSTER_HUBS, clusterById, normalizeKeyword, titleFromKeyword } from "./cluster-seeds";
import { isKloudbeanScopedKeyword, CLUSTER_FALLBACK_KEYWORDS } from "./kloudbean-scope";
import { validateSupportedProviders, validateTopicAgainstGeoPolicy } from "./geo-provider-policy";
import { scoreKsaGcpAlignment } from "./kloudbean-knowledge";
import type { DiscoveredTopic } from "./topic-discovery";
import type { SearchIntent } from "./seo-types";

/**
 * SERPER-BASED DISCOVERY (cheap replacement for DataForSEO).
 *
 * Flow per cluster:
 *   seeds → autocomplete expansion → Kloudbean-scope + geo/provider policy filter
 *   → SERP fetch for survivors (PAA, related, competitors) → opportunity score
 *   → pick top N hub topics.
 *
 * No paid volume APIs. Opportunity is derived from SERP signals.
 */

export type SerperDiscoveryOptions = {
  topicsPerCluster: number;
  /** Max autocomplete seeds to expand per hub seed. */
  expansionsPerSeed: number;
  /** Max SERP lookups per cluster (cost control — each is 1 credit). */
  serpLookupsPerCluster: number;
  /** Min opportunity score to keep. */
  minOpportunity: number;
};

const DEFAULTS: SerperDiscoveryOptions = {
  topicsPerCluster: 5,
  expansionsPerSeed: 10,
  serpLookupsPerCluster: 6,
  minOpportunity: 35,
};

type Candidate = {
  keyword: string;
  intent: SearchIntent;
  clusterId: number;
};

async function expandSeeds(clusterId: number, geo: string, opts: SerperDiscoveryOptions): Promise<Candidate[]> {
  const hub = CLUSTER_HUBS[clusterId];
  if (!hub) return [];
  const seen = new Set<string>();
  const out: Candidate[] = [];

  for (const seed of hub.seeds) {
    let suggestions: string[] = [];
    try {
      suggestions = await serperAutocomplete(seed, geo);
    } catch {
      suggestions = [];
    }
    // include the seed itself plus suggestions
    for (const kw of [seed, ...suggestions.slice(0, opts.expansionsPerSeed)]) {
      const norm = normalizeKeyword(kw);
      if (seen.has(norm) || norm.length < 4) continue;
      // Drop awkward brand-echo plurals like "kloudbeans"
      if (/kloudbeans\b/.test(norm)) continue;
      seen.add(norm);
      // scope + policy gates
      if (!isKloudbeanScopedKeyword(kw, 3)) continue;
      if (!validateSupportedProviders(kw).ok) continue;
      if (!validateTopicAgainstGeoPolicy(kw, geo).ok) continue;
      out.push({ keyword: kw, intent: inferIntentFromKeyword(kw), clusterId });
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  return out;
}

function candidateToTopic(
  cand: Candidate,
  serp: SerperSearchResult | null,
  geo: string,
): DiscoveredTopic {
  const cluster = clusterById(cand.clusterId);
  const hub = CLUSTER_HUBS[cand.clusterId];
  const paaCount = serp?.peopleAlsoAsk.length ?? 0;
  const relatedCount = serp?.relatedSearches.length ?? 0;
  const organic = serp?.organic ?? [];
  const competitorStrength = estimateCompetitorStrength(organic);
  const ksaBoost = geo === "sa" ? scoreKsaGcpAlignment(cand.keyword) * 2 : 0;

  const opp = Math.min(
    100,
    serperOpportunityScore({
      paaCount,
      relatedCount,
      organicCount: organic.length,
      intent: cand.intent,
      competitorStrength,
    }) + ksaBoost,
  );

  // Supporting keywords = related searches that are still on-brand.
  const supporting = (serp?.relatedSearches ?? [])
    .filter((r) => isKloudbeanScopedKeyword(r, 2) && validateSupportedProviders(r).ok)
    .slice(0, 8);

  return {
    keyword: cand.keyword,
    title: titleFromKeyword(cand.keyword, cluster.name, cand.intent),
    volume: null, // Serper has no volume
    difficulty: Math.round(competitorStrength * 100),
    intent: cand.intent,
    opportunity_score: opp,
    cluster_id: cand.clusterId,
    cluster_name: cluster.name,
    pillar: hub.pillar,
    anchor: hub.anchor,
    source: "keyword_ideas",
    semantic_core_keyword: cand.keyword,
    supporting_keywords: supporting,
    cluster_total_volume: null,
    traffic_score: opp,
    keyword_count_in_cluster: supporting.length + 1,
    // PAA carried for downstream research/brief use
    paa_questions: serp?.peopleAlsoAsk.map((p) => p.question) ?? [],
    serp_competitors: organic.slice(0, 8).map((o) => o.link),
  } as DiscoveredTopic & { paa_questions?: string[]; serp_competitors?: string[] };
}

/** Discover hub topics for the given clusters using Serper. */
export async function discoverTopicsWithSerper(
  clusterIds: number[],
  geo: string,
  options: Partial<SerperDiscoveryOptions> = {},
): Promise<{ topics: DiscoveredTopic[]; stats: Record<string, number> }> {
  const opts = { ...DEFAULTS, ...options };
  const stats = { expanded: 0, scoped: 0, serp_lookups: 0, selected: 0 };

  if (!hasSerperCredentials()) {
    // Fallback: curated keywords, no SERP signals.
    const topics: DiscoveredTopic[] = [];
    for (const clusterId of clusterIds) {
      const cluster = clusterById(clusterId);
      const hub = CLUSTER_HUBS[clusterId];
      if (!hub) continue;
      for (const kw of (CLUSTER_FALLBACK_KEYWORDS[clusterId] ?? []).slice(0, opts.topicsPerCluster)) {
        const intent = inferIntentFromKeyword(kw);
        topics.push({
          keyword: kw,
          title: titleFromKeyword(kw, cluster.name, intent),
          volume: null,
          difficulty: 40,
          intent,
          opportunity_score: 50,
          cluster_id: clusterId,
          cluster_name: cluster.name,
          pillar: hub.pillar,
          anchor: hub.anchor,
          source: "keyword_ideas",
        });
      }
    }
    return { topics, stats: { ...stats, selected: topics.length } };
  }

  const allTopics: DiscoveredTopic[] = [];

  for (const clusterId of clusterIds) {
    const candidates = await expandSeeds(clusterId, geo, opts);
    stats.expanded += candidates.length;

    // Rank candidates heuristically before spending SERP credits on them.
    const ranked = candidates
      .map((c) => ({
        c,
        pre:
          (c.intent === "commercial" || c.intent === "transactional" ? 2 : 0) +
          (geo === "sa" ? scoreKsaGcpAlignment(c.keyword) : 0) +
          (c.keyword.includes("kloudbean") ? 1 : 0),
      }))
      .sort((a, b) => b.pre - a.pre)
      .map((x) => x.c);

    stats.scoped += ranked.length;

    const picked: DiscoveredTopic[] = [];
    const seen = new Set<string>();
    let lookups = 0;

    for (const cand of ranked) {
      if (picked.length >= opts.topicsPerCluster) break;
      const norm = normalizeKeyword(cand.keyword);
      if (seen.has(norm)) continue;
      seen.add(norm);

      let serp: SerperSearchResult | null = null;
      if (lookups < opts.serpLookupsPerCluster) {
        try {
          serp = await serperSearch(cand.keyword, geo);
          lookups++;
          stats.serp_lookups++;
        } catch {
          serp = null;
        }
        await new Promise((r) => setTimeout(r, 120));
      }

      const topic = candidateToTopic(cand, serp, geo);
      if (topic.opportunity_score >= opts.minOpportunity) {
        picked.push(topic);
      }
    }

    // If SERP filtering was too strict, backfill from remaining ranked candidates.
    if (picked.length < opts.topicsPerCluster) {
      for (const cand of ranked) {
        if (picked.length >= opts.topicsPerCluster) break;
        const norm = normalizeKeyword(cand.keyword);
        if (picked.some((t) => normalizeKeyword(t.keyword) === norm)) continue;
        picked.push(candidateToTopic(cand, null, geo));
      }
    }

    allTopics.push(...picked);
  }

  stats.selected = allTopics.length;
  return { topics: allTopics, stats };
}

/**
 * Lightweight per-article research using Serper (cheap alternative to DataForSEO).
 * Fetches the live SERP for the article's target keyword and updates keyword_data
 * with PAA, related searches, and SERP competitors. Returns patch fields.
 */
export async function serperResearchForKeyword(
  keyword: string,
  geo: string,
): Promise<{
  paa_questions: string[];
  related_keywords: string[];
  top_10_urls: string[];
  difficulty: number;
  intent: SearchIntent;
} | null> {
  if (!hasSerperCredentials() || !keyword.trim()) return null;
  try {
    const serp = await serperSearch(keyword, geo);
    return {
      paa_questions: serp.peopleAlsoAsk.map((p) => p.question),
      related_keywords: serp.relatedSearches.filter((r) => isKloudbeanScopedKeyword(r, 2)),
      top_10_urls: serp.organic.slice(0, 10).map((o) => o.link),
      difficulty: Math.round(estimateCompetitorStrength(serp.organic) * 100),
      intent: inferIntentFromKeyword(keyword),
    };
  } catch {
    return null;
  }
}
