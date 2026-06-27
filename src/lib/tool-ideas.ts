import "@tanstack/react-start/server-only";
import { dfsPost, hasDataForSeoCredentials, locCode, opportunityScore } from "./dataforseo-client";
import {
  hasSerperCredentials,
  serperSearch,
  estimateCompetitorStrength,
  inferIntentFromKeyword,
} from "./serper-client";
import { scoreKloudbeanRelevance } from "./kloudbean-scope";
import { TOOL_CATALOG, slugify, type ToolCatalogEntry } from "./tool-catalog";

/**
 * IDEA BRINGER — discovers and ranks NEW free-tool ideas for Kloudbean.
 *
 * Pipeline:
 *   1. Seed from the curated catalog (always on-brand).
 *   2. Drop ideas that already exist (in our DB or live on WordPress).
 *   3. Enrich with real search demand (DataForSEO volume → Serper SERP signals →
 *      fallback to curated priority).
 *   4. Score = demand + Kloudbean scope relevance, then rank.
 *
 * Returns ranked ideas the generator can turn into full tool pages.
 */

export type ToolIdea = {
  name: string;
  slug: string;
  category: string;
  tool_type: ToolCatalogEntry["toolType"];
  target_keyword: string;
  secondary_keywords: string[];
  description: string;
  spec: string;
  kloudbean_angle: string;
  // demand signals
  volume: number | null;
  cpc: number | null;
  difficulty: number | null;
  demand_score: number;
  scope_score: number;
  opportunity_score: number;
  demand_source: "dataforseo" | "serper" | "curated";
};

export type DiscoverToolIdeasOptions = {
  geo?: string;
  limit?: number;
  /** Names/slugs already taken (from DB + live WP pages) — case-insensitive. */
  existingNames?: Set<string>;
  existingSlugs?: Set<string>;
  /** Disable paid/SERP demand lookups (catalog-only). */
  useDemand?: boolean;
};

type VolumeRow = { volume: number | null; cpc: number | null; competition: number | null };

/** Batch search volume from DataForSEO Google Ads (1 call for many keywords). */
async function fetchKeywordVolumes(
  keywords: string[],
  geo: string,
): Promise<Map<string, VolumeRow>> {
  const out = new Map<string, VolumeRow>();
  if (!keywords.length || !hasDataForSeoCredentials()) return out;
  try {
    const res = (await dfsPost("/v3/keywords_data/google_ads/search_volume/live", [
      { keywords: keywords.slice(0, 700), location_code: locCode(geo), language_code: "en" },
    ])) as { tasks?: Array<{ result?: Record<string, unknown>[] }> };
    const items = res?.tasks?.[0]?.result ?? [];
    for (const it of items as Record<string, unknown>[]) {
      const kw = String(it.keyword ?? "").toLowerCase();
      if (!kw) continue;
      out.set(kw, {
        volume: (it.search_volume as number) ?? null,
        cpc: (it.cpc as number) ?? null,
        competition: (it.competition_index as number) ?? null,
      });
    }
  } catch {
    /* fall through to other demand sources */
  }
  return out;
}

/** Cheap SERP-based demand signal when no volume API is available. */
async function serperDemandFor(
  keyword: string,
  geo: string,
): Promise<{ difficulty: number; opp: number } | null> {
  if (!hasSerperCredentials()) return null;
  try {
    const serp = await serperSearch(keyword, geo);
    const difficulty = Math.round(estimateCompetitorStrength(serp.organic) * 100);
    const signal = (serp.peopleAlsoAsk?.length ?? 0) * 6 + (serp.relatedSearches?.length ?? 0) * 4;
    const opp = Math.min(100, 30 + signal);
    return { difficulty, opp };
  } catch {
    return null;
  }
}

function demandScoreFromVolume(volume: number | null, difficulty: number | null): number {
  if (volume == null) return 0;
  const volScore = Math.min(70, (Math.log10(Math.max(volume, 1)) / 5) * 70);
  const diffScore = difficulty != null ? (1 - Math.min(difficulty, 100) / 100) * 30 : 18;
  return Math.round(volScore + diffScore);
}

export async function discoverToolIdeas(options: DiscoverToolIdeasOptions = {}): Promise<{
  ideas: ToolIdea[];
  stats: { catalog: number; deduped: number; enriched: number; source: string };
}> {
  const geo = options.geo ?? "global";
  const limit = options.limit ?? 10;
  const useDemand = options.useDemand !== false;
  const existingNames = options.existingNames ?? new Set<string>();
  const existingSlugs = options.existingSlugs ?? new Set<string>();

  // 1 + 2. Seed from catalog, drop taken ideas.
  const fresh = TOOL_CATALOG.filter((t) => {
    const name = t.name.trim().toLowerCase();
    const slug = (t.slug || slugify(t.name)).toLowerCase();
    return !existingNames.has(name) && !existingSlugs.has(slug);
  });

  // 3. Demand enrichment.
  let source: ToolIdea["demand_source"] = "curated";
  const volumes =
    useDemand && hasDataForSeoCredentials()
      ? await fetchKeywordVolumes(
          fresh.map((t) => t.targetKeyword),
          geo,
        )
      : new Map<string, VolumeRow>();
  if (volumes.size) source = "dataforseo";

  const ideas: ToolIdea[] = [];
  let enriched = 0;

  for (const t of fresh) {
    const kw = t.targetKeyword.toLowerCase();
    const scopeScore = scoreKloudbeanRelevance(t.targetKeyword);

    let volume: number | null = null;
    let cpc: number | null = null;
    let difficulty: number | null = null;
    let demand = 0;
    let demandSource: ToolIdea["demand_source"] = "curated";

    const v = volumes.get(kw);
    if (v && v.volume != null) {
      volume = v.volume;
      cpc = v.cpc;
      difficulty = v.competition != null ? Math.round(v.competition) : null;
      demand = demandScoreFromVolume(volume, difficulty);
      demandSource = "dataforseo";
      enriched++;
    } else if (useDemand && source !== "dataforseo") {
      // Only spend Serper credits when no volume API; cap to top-priority ideas.
      const s = t.priority >= 4 ? await serperDemandFor(t.targetKeyword, geo) : null;
      if (s) {
        difficulty = s.difficulty;
        demand = Math.round(s.opp);
        demandSource = "serper";
        if (source === "curated") source = "serper";
        enriched++;
      }
    }

    if (demand === 0) {
      // Curated fallback: priority drives demand proxy.
      demand = t.priority * 10;
      demandSource = "curated";
    }

    const opportunity = opportunityScore(
      volume,
      difficulty,
      inferIntentFromKeyword(t.targetKeyword),
    );
    // Combined rank: demand is king, scope keeps it on-brand, opportunity breaks ties.
    const combined = Math.round(
      demand * 0.6 + Math.min(scopeScore, 20) * 1.5 + opportunity * 0.2 + t.priority,
    );

    ideas.push({
      name: t.name,
      slug: t.slug || slugify(t.name),
      category: t.category,
      tool_type: t.toolType,
      target_keyword: t.targetKeyword,
      secondary_keywords: t.secondaryKeywords,
      description: t.description,
      spec: t.spec,
      kloudbean_angle: t.kloudbeanAngle,
      volume,
      cpc,
      difficulty,
      demand_score: demand,
      scope_score: scopeScore,
      opportunity_score: combined,
      demand_source: demandSource,
    });
  }

  ideas.sort((a, b) => b.opportunity_score - a.opportunity_score);

  return {
    ideas: ideas.slice(0, limit),
    stats: { catalog: TOOL_CATALOG.length, deduped: fresh.length, enriched, source },
  };
}
