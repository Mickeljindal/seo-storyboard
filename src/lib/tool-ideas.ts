import "@tanstack/react-start/server-only";
import { dfsPost, hasDataForSeoCredentials, locCode, opportunityScore } from "./dataforseo-client";
import {
  hasSerperCredentials,
  serperSearch,
  serperAutocomplete,
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
  /** How well this tool's user fits Kloudbean's hosting audience (0–100). */
  audience_score: number;
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
      audience_score: scoreToolAudience(t.targetKeyword),
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

// ===========================================================================
// SEARCH-DRIVEN UNLIMITED IDEA POOL
// ===========================================================================

/**
 * Tool-intent terms (what makes a query a "tool" the user wants to USE now) and
 * the Kloudbean-aligned topic domains they combine with. Expanded via live
 * search autocomplete into a large pool of REAL queries with demand.
 */
const TOOL_INTENT_TERMS = [
  "calculator",
  "generator",
  "converter",
  "checker",
  "validator",
  "formatter",
  "tester",
  "estimator",
  "analyzer",
  "minifier",
  "beautifier",
  "parser",
];

/** Domains where the searcher is plausibly a future Kloudbean hosting customer. */
const TOOL_TOPIC_SEEDS = [
  // cloud / hosting / cost
  "cloud hosting cost",
  "server cost",
  "server sizing",
  "bandwidth cost",
  "egress cost",
  "vps",
  "uptime",
  "sla",
  "website speed",
  "ttfb",
  "downtime cost",
  // devops / infra
  "cron",
  "nginx config",
  "dockerfile",
  "docker compose",
  "kubernetes",
  "ssl certificate",
  "dns",
  "subnet",
  "cidr",
  "htaccess redirect",
  "load balancer",
  "regex",
  // dev utilities (builders / vibe-coders / SaaS founders)
  "json",
  "base64",
  "jwt",
  "uuid",
  "hash",
  "password",
  "api key",
  "yaml",
  "sql",
  "markdown",
  "color",
  "css",
  "cron to human readable",
  "epoch timestamp",
  // web / wordpress / app
  "wordpress",
  "meta tag",
  "schema markup",
  "robots txt",
  "sitemap",
  "url encode",
  "image compression",
  // money / saas
  "saas pricing",
  "roi",
  "hosting price",
];

const TYPE_BY_TERM: Record<string, ToolCatalogEntry["toolType"]> = {
  calculator: "calculator",
  estimator: "calculator",
  generator: "generator",
  converter: "converter",
  checker: "validator",
  validator: "validator",
  tester: "validator",
  formatter: "formatter",
  minifier: "formatter",
  beautifier: "formatter",
  parser: "converter",
  analyzer: "analyzer",
};

function toolTypeFromKeyword(kw: string): ToolCatalogEntry["toolType"] {
  const k = kw.toLowerCase();
  for (const term of Object.keys(TYPE_BY_TERM)) {
    if (k.includes(term)) return TYPE_BY_TERM[term];
  }
  return "calculator";
}

function hasToolIntent(kw: string): boolean {
  const k = kw.toLowerCase();
  return TOOL_INTENT_TERMS.some((t) => k.includes(t));
}

function titleCase(kw: string): string {
  return kw
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) =>
      w.length <= 3 && /^(a|an|to|of|the|for|in|on)$/i.test(w)
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

function nameFromKeyword(kw: string): string {
  const t = titleCase(kw);
  // Ensure it reads like a tool name.
  return /tool$/i.test(t) ? t : t;
}

/**
 * AUDIENCE FIT (0–100): how likely the person searching this tool could become a
 * Kloudbean hosting customer (developers, founders, agencies, people building
 * apps / sites / AI SaaS that need hosting). Built on the Kloudbean scope scorer
 * plus tool/builder signals, with penalties for clearly off-audience topics.
 */
const AUDIENCE_POSITIVE = [
  "server",
  "hosting",
  "cloud",
  "deploy",
  "vps",
  "docker",
  "kubernetes",
  "nginx",
  "devops",
  "api",
  "database",
  "ssl",
  "dns",
  "domain",
  "wordpress",
  "app",
  "saas",
  "website",
  "node",
  "python",
  "laravel",
  "next",
  "bandwidth",
  "egress",
  "load balancer",
  "uptime",
  "latency",
  "backend",
  "developer",
  "self host",
];
const AUDIENCE_NEGATIVE = [
  "loan",
  "mortgage",
  "bmi",
  "calorie",
  "pregnancy",
  "horoscope",
  "lottery",
  "gpa",
  "tip ",
  "age calculator",
  "love",
  "salary tax",
  "recipe",
];

export function scoreToolAudience(keyword: string): number {
  const k = keyword.toLowerCase();
  let score = scoreKloudbeanRelevance(keyword) * 3; // base on-brand relevance
  for (const p of AUDIENCE_POSITIVE) if (k.includes(p)) score += 10;
  for (const n of AUDIENCE_NEGATIVE) if (k.includes(n)) score -= 40;
  if (hasToolIntent(k)) score += 8;
  return Math.max(0, Math.min(100, score));
}

export type IdeaPoolOptions = {
  geo?: string;
  /** Max ideas to return in the pool. */
  limit?: number;
  existingNames?: Set<string>;
  existingSlugs?: Set<string>;
  /** Min audience-fit score to keep an idea (default 25). */
  minAudience?: number;
  /** Cap autocomplete expansions (credit control). */
  maxSeeds?: number;
};

/**
 * Build a large pool of REAL, demand-validated tool ideas from live search.
 *
 *   seeds (intent × topic) → Serper autocomplete expansion → keep tool-intent +
 *   audience-aligned queries → DataForSEO batch volume → score → dedupe → rank.
 *
 * Falls back to the curated catalog when no search APIs are configured.
 */
export async function discoverToolIdeaPool(options: IdeaPoolOptions = {}): Promise<{
  ideas: ToolIdea[];
  stats: { expanded: number; kept: number; withVolume: number; source: string };
}> {
  const geo = options.geo ?? "global";
  const limit = options.limit ?? 60;
  const minAudience = options.minAudience ?? 25;
  const existingNames = options.existingNames ?? new Set<string>();
  const existingSlugs = options.existingSlugs ?? new Set<string>();
  const maxSeeds = options.maxSeeds ?? 28;

  // No search creds → fall back to the catalog-based discovery (still useful).
  if (!hasSerperCredentials() && !hasDataForSeoCredentials()) {
    const fallback = await discoverToolIdeas({ geo, limit, existingNames, existingSlugs });
    return {
      ideas: fallback.ideas,
      stats: { expanded: 0, kept: fallback.ideas.length, withVolume: 0, source: "catalog" },
    };
  }

  // 1. Build seeds (intent × topic), then expand via autocomplete.
  const seeds = new Set<string>();
  for (const topic of TOOL_TOPIC_SEEDS) {
    for (const term of ["calculator", "generator", "converter", "checker"]) {
      seeds.add(`${topic} ${term}`);
    }
  }
  const seedList = [...seeds].slice(0, maxSeeds);

  const candidates = new Set<string>();
  if (hasSerperCredentials()) {
    for (const seed of seedList) {
      try {
        const sugg = await serperAutocomplete(seed, geo);
        for (const s of sugg) candidates.add(s.toLowerCase().trim());
      } catch {
        /* skip seed */
      }
      candidates.add(seed);
      await new Promise((r) => setTimeout(r, 80));
    }
  } else {
    for (const s of seedList) candidates.add(s);
  }

  const expanded = candidates.size;

  // 2. Keep only tool-intent + audience-aligned + not-already-built.
  const kept: { keyword: string; audience: number }[] = [];
  for (const kw of candidates) {
    if (kw.length < 5 || kw.length > 70) continue;
    if (!hasToolIntent(kw)) continue;
    const audience = scoreToolAudience(kw);
    if (audience < minAudience) continue;
    const slug = slugify(kw);
    if (!slug || existingSlugs.has(slug) || existingNames.has(kw)) continue;
    kept.push({ keyword: kw, audience });
  }

  // 3. Real volumes (one batch call).
  const volumes = hasDataForSeoCredentials()
    ? await fetchKeywordVolumes(
        kept.map((k) => k.keyword),
        geo,
      )
    : new Map<string, VolumeRow>();
  const source = volumes.size ? "dataforseo" : hasSerperCredentials() ? "serper" : "catalog";

  // 4. Build + score ideas; dedupe by slug.
  const seenSlug = new Set<string>();
  const ideas: ToolIdea[] = [];
  let withVolume = 0;

  for (const { keyword, audience } of kept) {
    const slug = slugify(keyword);
    if (seenSlug.has(slug)) continue;
    seenSlug.add(slug);

    const v = volumes.get(keyword);
    const volume = v?.volume ?? null;
    const cpc = v?.cpc ?? null;
    const difficulty = v?.competition != null ? Math.round(v.competition) : null;
    if (volume != null) withVolume++;

    const demand = volume != null ? demandScoreFromVolume(volume, difficulty) : 0;
    const intent = inferIntentFromKeyword(keyword);
    const opp = opportunityScore(volume, difficulty, intent);
    const scope = scoreKloudbeanRelevance(keyword);

    // Combined: real demand + audience fit lead; opportunity + scope refine.
    const combined = Math.round(
      demand * 0.45 + audience * 0.35 + opp * 0.1 + Math.min(scope, 20) * 0.5,
    );

    const type = toolTypeFromKeyword(keyword);
    ideas.push({
      name: nameFromKeyword(keyword),
      slug,
      category: "Developer Tools",
      tool_type: type,
      target_keyword: keyword,
      secondary_keywords: [],
      description: `A free ${keyword} for developers, founders and teams — instant, browser-based results.`,
      spec: `Build a ${type} for "${keyword}" with the standard inputs and outputs users expect; validate inputs and show results instantly, client-side.`,
      kloudbean_angle:
        "The people using this tool build and run apps, sites or AI SaaS — pitch hosting/deploying them on Kloudbean.",
      volume,
      cpc,
      difficulty,
      demand_score: demand,
      scope_score: scope,
      audience_score: audience,
      opportunity_score: combined,
      demand_source: (volume != null ? "dataforseo" : "serper") as ToolIdea["demand_source"],
    });
  }

  // Prefer ideas with real volume, then by combined score.
  ideas.sort((a, b) => {
    const av = a.volume ?? -1;
    const bv = b.volume ?? -1;
    if ((bv > 0 ? 1 : 0) !== (av > 0 ? 1 : 0)) return (bv > 0 ? 1 : 0) - (av > 0 ? 1 : 0);
    return b.opportunity_score - a.opportunity_score;
  });

  return {
    ideas: ideas.slice(0, limit),
    stats: { expanded, kept: kept.length, withVolume, source },
  };
}
