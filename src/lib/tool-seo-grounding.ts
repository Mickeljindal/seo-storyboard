import "@tanstack/react-start/server-only";

/**
 * TOOL SEO GROUNDING
 *
 * The tool optimizer used to generate SEO copy blind — a generic intro + FAQ
 * with no real data behind it. That fails on the three things that actually
 * matter now: E-E-A-T, topical authority, and semantic depth.
 *
 * This module gathers REAL grounding for a tool's keyword out of the data we
 * already own, so the AI writes something specific and defensible instead of
 * filler:
 *
 *   - SEMANTIC   — related keywords real competitors rank for around this topic
 *                  (from the Semrush warehouse: kg_organic_rankings +
 *                  kg_keyword_gap). These become the subtopics the page should
 *                  cover and the secondary keywords it should target.
 *   - COMPETITOR — who ranks for this and where (proof the demand is real), via
 *                  the KLOUDGRAPH opportunity engine.
 *   - TOPICAL    — the content cluster this tool belongs to + our own published
 *                  articles in that cluster, so the page links UP into the silo
 *                  instead of sitting orphaned.
 *   - EXPERIENCE — a real operational lesson (E-E-A-T "Experience") to weave in.
 *
 * Everything is best-effort and resilient: any piece that has no data returns
 * empty and never blocks optimization.
 */

export type ToolGrounding = {
  clusterId: number | null;
  clusterName: string | null;
  /** Related keywords competitors rank for around this topic (semantic subtopics). */
  relatedKeywords: string[];
  /** Prompt-ready block: real competitor ranking positions for this topic. */
  competitorBlock: string;
  /** Prompt-ready block: which market segment this sits in + how winnable it is. */
  marketBlock: string;
  /** Prompt-ready block: a genuine operational lesson to weave in (E-E-A-T). */
  experienceBlock: string;
  /** Our own published articles in the same cluster — internal-link targets. */
  relatedGuides: { anchor: string; url: string }[];
  /** The full assembled grounding text handed to the writer prompt. */
  promptBlock: string;
};

const EMPTY: ToolGrounding = {
  clusterId: null,
  clusterName: null,
  relatedKeywords: [],
  competitorBlock: "",
  marketBlock: "",
  experienceBlock: "",
  relatedGuides: [],
  promptBlock: "",
};

const STOP = new Set([
  "free",
  "online",
  "tool",
  "the",
  "a",
  "an",
  "to",
  "of",
  "for",
  "and",
  "or",
  "with",
  "your",
  "my",
  // tool-intent words describe the tool TYPE, not the topic — drop them so we
  // match on the subject ("docker", "ssl") not the format ("calculator").
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
  "counter",
]);

/** Significant topic tokens from a tool name/keyword (drops stopwords + tool-type words). */
function topicTokens(text: string): string[] {
  const words = (text.toLowerCase().match(/[a-z0-9.+-]{2,}/g) ?? []).filter(
    (w) => !STOP.has(w) && w.length >= 2,
  );
  // Dedupe, keep order, cap so the ILIKE query stays small.
  return [...new Set(words)].slice(0, 4);
}

const ADULT_OR_JUNK = [
  "xnxx",
  "porn",
  "xxx",
  "xvideos",
  " sex ",
  "nude",
  "escort",
  "casino",
  "gambling",
];

/**
 * Competitor warehouses are noisy — a rival's blog ranks for adult-site error
 * strings, other brands' login pages, and pasted error messages. None of that
 * belongs in Kloudbean's on-page content. Keep only clean, generic topic
 * phrases: no specific-site queries (a bare domain in the phrase), no adult/
 * gambling terms, nothing that's really a pasted error dump.
 */
function isCleanRelated(kw: string): boolean {
  const k = ` ${kw.toLowerCase()} `;
  if (kw.length < 3 || kw.length > 55) return false;
  // A domain TLD mid-phrase => a specific-site query, not a generic subtopic.
  if (/[a-z0-9-]+\.(com|net|org|io|co|app|xxx|ru|info)\b/.test(k)) return false;
  if (ADULT_OR_JUNK.some((a) => k.includes(a))) return false;
  return true;
}

/**
 * Related keywords the tracked competitors actually rank for around this topic.
 * Pulls from BOTH warehouse tables (rankings = what they rank for; gap = what
 * they rank for and we don't), merges by keyword keeping max volume, and returns
 * the highest-volume neighbors — real search demand, not guesses.
 */
async function warehouseRelatedKeywords(keyword: string, limit = 12): Promise<string[]> {
  const tokens = topicTokens(keyword);
  if (!tokens.length) return [];
  try {
    const { getDb, schema } = await import("@/server/db/client");
    const { sql, or, and, ne, ilike } = await import("drizzle-orm");
    const db = await getDb();
    const target = keyword.trim().toLowerCase();

    const rankLike = tokens.map((t) => ilike(schema.kgOrganicRankings.keyword, `%${t}%`));
    const gapLike = tokens.map((t) => ilike(schema.kgKeywordGap.keyword, `%${t}%`));

    const [rankRows, gapRows] = await Promise.all([
      db
        .select({
          keyword: schema.kgOrganicRankings.keyword,
          volume: sql<number>`max(coalesce(${schema.kgOrganicRankings.volume}, 0))::int`,
        })
        .from(schema.kgOrganicRankings)
        .where(and(or(...rankLike), ne(sql`lower(${schema.kgOrganicRankings.keyword})`, target)))
        .groupBy(schema.kgOrganicRankings.keyword)
        .orderBy(sql`max(coalesce(${schema.kgOrganicRankings.volume}, 0)) desc`)
        .limit(limit * 3),
      db
        .select({
          keyword: schema.kgKeywordGap.keyword,
          volume: sql<number>`max(coalesce(${schema.kgKeywordGap.volume}, 0))::int`,
        })
        .from(schema.kgKeywordGap)
        .where(and(or(...gapLike), ne(sql`lower(${schema.kgKeywordGap.keyword})`, target)))
        .groupBy(schema.kgKeywordGap.keyword)
        .orderBy(sql`max(coalesce(${schema.kgKeywordGap.volume}, 0)) desc`)
        .limit(limit * 3),
    ]);

    const byKw = new Map<string, number>();
    for (const r of [...rankRows, ...gapRows]) {
      const kw = (r.keyword ?? "").trim();
      if (!kw || !isCleanRelated(kw)) continue;
      const v = Number(r.volume ?? 0);
      byKw.set(kw, Math.max(byKw.get(kw) ?? 0, v));
    }
    return [...byKw.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([kw]) => kw);
  } catch {
    return [];
  }
}

/** Our own published articles in the same cluster — internal-link targets for topical authority. */
async function relatedClusterGuides(
  clusterId: number | null,
  limit = 4,
): Promise<{ anchor: string; url: string }[]> {
  if (clusterId == null) return [];
  try {
    const articlesRepo = await import("@/server/db/repos/articles");
    const published = await articlesRepo.listArticles({
      clusterId,
      status: "published",
      limit: 20,
    });
    const out: { anchor: string; url: string }[] = [];
    const seen = new Set<string>();
    for (const a of published) {
      const url = a.published_url;
      const anchor = (a.title ?? "").trim();
      if (!url || !anchor || seen.has(url)) continue;
      seen.add(url);
      out.push({ anchor, url });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Gather all grounding for a tool keyword. Resilient: each piece degrades to
 * empty independently, so a tool with no warehouse coverage still optimizes
 * (just with less grounding).
 */
export async function gatherToolGrounding(keyword: string, name: string): Promise<ToolGrounding> {
  const topic = `${name} ${keyword}`.trim();
  if (!topic) return EMPTY;

  let clusterId: number | null = null;
  let clusterName: string | null = null;
  let competitorBlock = "";
  let marketBlock = "";
  let experienceBlock = "";

  try {
    const { classifyCluster, kloudgraphPromptBlock } =
      await import("./kloudgraph/opportunity-engine");
    const cluster = classifyCluster(keyword) ?? classifyCluster(name);
    clusterId = cluster?.id ?? null;
    clusterName = cluster?.name ?? null;
    competitorBlock = await kloudgraphPromptBlock(keyword).catch(() => "");
  } catch {
    /* opportunity engine optional */
  }

  try {
    const { marketMapPromptBlock } = await import("./kloudgraph/market-map");
    marketBlock = await marketMapPromptBlock(keyword).catch(() => "");
  } catch {
    /* market map optional */
  }

  try {
    const { experiencePromptBlock } = await import("./experience-engine");
    experienceBlock = await experiencePromptBlock(topic, clusterId).catch(() => "");
  } catch {
    /* experience optional */
  }

  const [relatedKeywords, relatedGuides] = await Promise.all([
    warehouseRelatedKeywords(keyword, 12),
    relatedClusterGuides(clusterId, 4),
  ]);

  // Assemble the writer-facing grounding block.
  const parts: string[] = [];
  if (relatedKeywords.length) {
    parts.push(
      `SEMANTIC COVERAGE (real related searches from our competitor SEO warehouse — cover these subtopics naturally so the page is topically complete; use the closest ones as secondary keywords, do NOT keyword-stuff): ${relatedKeywords
        .slice(0, 12)
        .join("; ")}.`,
    );
  }
  if (clusterName) {
    parts.push(
      `TOPICAL CLUSTER: this tool belongs to the "${clusterName}" content cluster — keep the framing consistent with that theme and, where natural, reference the related Kloudbean guides provided as internal links.`,
    );
  }
  if (competitorBlock) parts.push(competitorBlock);
  if (marketBlock) parts.push(marketBlock);
  if (experienceBlock) parts.push(experienceBlock);
  if (relatedGuides.length) {
    parts.push(
      `RELATED KLOUDBEAN GUIDES (link to 1-2 of these by their exact title where genuinely relevant, as internal links for topical authority): ${relatedGuides
        .map((g) => `"${g.anchor}"`)
        .join(", ")}.`,
    );
  }

  return {
    clusterId,
    clusterName,
    relatedKeywords,
    competitorBlock,
    marketBlock,
    experienceBlock,
    relatedGuides,
    promptBlock: parts.join("\n\n"),
  };
}
