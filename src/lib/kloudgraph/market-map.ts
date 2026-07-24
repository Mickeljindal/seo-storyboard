import "@tanstack/react-start/server-only";

/**
 * KLOUDGRAPH — Market Map.
 *
 * The other engines (opportunity-engine.ts) answer "which KEYWORD should we
 * attack next". This answers the level up: "which MARKET SEGMENT is winnable
 * right now, and why". A segment here is a competitor category (Managed
 * cloud/WordPress, Control panel/VPS, PaaS, Cloud infra, Broad host — see
 * competitor-catalog.ts) since the Semrush warehouse has no geo/country
 * column to segment by region.
 *
 * For each segment this rolls up:
 *   - how strong the competitors in it are (their real measured strength)
 *   - how much unclaimed keyword demand sits in it (relevance-filtered gap
 *     volume, deduped by keyword so one popular term isn't double counted)
 *   - a winnability score: lots of demand + competitors that are weaker
 *     elsewhere = the segment worth attacking first.
 *
 * This is the "idea generation → tool → reel → market" bridge: every
 * consumption point (content-engine, tool-ideas, reel-engine) can ask
 * "what segment is this keyword/tool/reel idea in, and is that a segment
 * we should be leaning into" instead of treating every opportunity as
 * equally worth pursuing.
 */

export type MarketSegment = {
  category: string;
  tier: number | null;
  competitorCount: number;
  competitors: string[];
  /** Sum of each competitor's real measured strength (log-scaled ranking+backlink+refdomain signal). */
  totalStrength: number;
  avgStrength: number;
  /** Distinct relevance-filtered opportunity keywords attributed to this segment. */
  opportunityKeywords: number;
  /** Deduped demand volume across those keywords (not summed per-competitor — summed per unique keyword). */
  opportunityVolume: number;
  /** Average opportunity score across the segment's keywords. */
  avgOpportunityScore: number;
  /** demand relative to competitor strength — high = lots of unclaimed demand vs how strong the incumbents are. */
  winnabilityScore: number;
  topKeywords: { keyword: string; volume: number; score: number }[];
};

/**
 * Build the market map: every competitor category rolled up with its real
 * strength + the relevance-filtered opportunity demand sitting in it.
 * Read-only, safe to call anytime; returns [] if KLOUDGRAPH has no data yet.
 */
export async function getMarketMap(opts: { minRelevance?: number } = {}): Promise<MarketSegment[]> {
  const { getDb, schema } = await import("@/server/db/client");
  const { getCompetitorStrength, getAggregatedOpportunities, classifyCluster } =
    await import("./opportunity-engine");
  void classifyCluster;

  let competitors: { domain: string; category: string | null; tier: number | null }[] = [];
  try {
    const db = await getDb();
    const rows = await db
      .select({
        domain: schema.kgCompetitors.domain,
        category: schema.kgCompetitors.category,
        tier: schema.kgCompetitors.tier,
      })
      .from(schema.kgCompetitors);
    competitors = rows;
  } catch {
    return [];
  }
  if (!competitors.length) return [];

  const strengths = await getCompetitorStrength();
  const strengthByDomain = new Map(strengths.map((s) => [s.domain, s.strengthScore]));

  // Segment key = category (fallback to "Uncategorized" so nothing silently vanishes).
  const domainToCategory = new Map<string, string>();
  const domainToTier = new Map<string, number | null>();
  for (const c of competitors) {
    domainToCategory.set(c.domain, c.category ?? "Uncategorized");
    domainToTier.set(c.domain, c.tier);
  }

  const segments = new Map<
    string,
    {
      tier: number | null;
      competitors: Set<string>;
      totalStrength: number;
      keywordVolume: Map<string, { volume: number; score: number }>;
    }
  >();

  for (const c of competitors) {
    const cat = domainToCategory.get(c.domain) ?? "Uncategorized";
    const seg = segments.get(cat) ?? {
      tier: c.tier,
      competitors: new Set<string>(),
      totalStrength: 0,
      keywordVolume: new Map(),
    };
    seg.competitors.add(c.domain);
    seg.totalStrength += strengthByDomain.get(c.domain) ?? 0;
    segments.set(cat, seg);
  }

  // Opportunities are per-keyword (already aggregated across ALL competitors),
  // each carrying its own competitor list — attribute a keyword to every
  // segment that has at least one of those competitors, so a keyword three
  // PaaS players rank for counts toward the PaaS segment's demand.
  const opps = await getAggregatedOpportunities({
    limit: 3000,
    minRelevance: opts.minRelevance ?? 0.5,
  });
  for (const o of opps) {
    const segCats = new Set<string>();
    for (const dom of o.competitors) {
      const cat = domainToCategory.get(dom);
      if (cat) segCats.add(cat);
    }
    for (const cat of segCats) {
      const seg = segments.get(cat);
      if (!seg) continue;
      const existing = seg.keywordVolume.get(o.keyword);
      if (!existing || o.score > existing.score) {
        seg.keywordVolume.set(o.keyword, { volume: o.volume, score: o.score });
      }
    }
  }

  const out: MarketSegment[] = [];
  for (const [category, seg] of segments) {
    const competitorList = [...seg.competitors];
    const opportunityKeywords = seg.keywordVolume.size;
    const opportunityVolume = [...seg.keywordVolume.values()].reduce((s, v) => s + v.volume, 0);
    const avgOpportunityScore = opportunityKeywords
      ? [...seg.keywordVolume.values()].reduce((s, v) => s + v.score, 0) / opportunityKeywords
      : 0;
    const avgStrength = competitorList.length ? seg.totalStrength / competitorList.length : 0;

    // Winnability: lots of demand relative to how strong the incumbents are.
    // Log-scale volume so one viral keyword doesn't dominate; divide by
    // strength+1 so a segment full of giants needs much more demand to look
    // winnable than a segment of weaker/niche players.
    const winnabilityScore =
      Math.round(
        ((Math.log10(opportunityVolume + 10) * (1 + avgOpportunityScore)) / (avgStrength + 1)) *
          100,
      ) / 100;

    const topKeywords = [...seg.keywordVolume.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5)
      .map(([keyword, v]) => ({ keyword, volume: v.volume, score: v.score }));

    out.push({
      category,
      tier: seg.tier,
      competitorCount: competitorList.length,
      competitors: competitorList,
      totalStrength: Math.round(seg.totalStrength * 100) / 100,
      avgStrength: Math.round(avgStrength * 100) / 100,
      opportunityKeywords,
      opportunityVolume,
      avgOpportunityScore: Math.round(avgOpportunityScore * 100) / 100,
      winnabilityScore,
      topKeywords,
    });
  }

  out.sort((a, b) => b.winnabilityScore - a.winnabilityScore);
  return out;
}

/**
 * The single most winnable segment right now, with a plain-English reason —
 * used as a one-line grounding fact for content/tool/reel idea prompts (e.g.
 * "lean into PaaS-comparison angles, that's the most winnable segment today").
 */
export async function getTopMarketOpportunity(): Promise<{
  segment: MarketSegment;
  reason: string;
} | null> {
  const map = await getMarketMap();
  if (!map.length) return null;
  const top = map[0];
  const reason =
    `"${top.category}" is the most winnable segment: ${top.opportunityKeywords} unclaimed keyword(s) ` +
    `(~${top.opportunityVolume.toLocaleString()} combined monthly volume) against competitors averaging ` +
    `strength ${top.avgStrength} — weaker than the demand available.`;
  return { segment: top, reason };
}

/**
 * If the given keyword/title falls inside one of the tracked market segments
 * (i.e. one of that segment's competitors ranks for it), return a one-line
 * prompt fact naming the segment's overall winnability. Returns "" when the
 * topic doesn't match any segment — never blocks generation.
 */
export async function marketMapPromptBlock(keywordOrTitle: string): Promise<string> {
  try {
    const { getTopicIntel } = await import("./opportunity-engine");
    const intel = await getTopicIntel(keywordOrTitle, 3);
    if (!intel.length) return "";
    const rankingDomains = new Set(intel.flatMap((t) => t.rankers.map((r) => r.domain)));
    if (!rankingDomains.size) return "";

    const map = await getMarketMap();
    if (!map.length) return "";

    const matched = map.find((seg) => seg.competitors.some((c) => rankingDomains.has(c)));
    if (!matched) return "";

    return (
      `MARKET CONTEXT: this topic sits in the "${matched.category}" segment (competitors: ` +
      `${matched.competitors.slice(0, 4).join(", ")}). That segment currently has a winnability ` +
      `score of ${matched.winnabilityScore} (higher = more unclaimed demand relative to how strong ` +
      `the incumbents are) — ${matched.opportunityKeywords} relevance-filtered keyword opportunities ` +
      `remain unclaimed there.`
    );
  } catch {
    return "";
  }
}
