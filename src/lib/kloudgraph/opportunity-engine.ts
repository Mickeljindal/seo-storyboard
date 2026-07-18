import "@tanstack/react-start/server-only";
import { CLUSTERS } from "@/lib/pillars";

/**
 * KLOUDGRAPH — Opportunity Engine.
 *
 * Raw keyword-gap rows sorted by volume are noisy (a hosting company's blog
 * ranks for plenty of off-topic keywords). This turns the raw warehouse into
 * an actionable attack list:
 *
 *   1. RELEVANCE  — score every keyword against Kloudbean's actual business
 *                   vocabulary (hosting/cloud/deploy/dev), so junk keywords
 *                   sink and real opportunities rise.
 *   2. CLUSTER    — classify each keyword into one of the 10 topical-authority
 *                   clusters already used by the content engine.
 *   3. CONSENSUS  — aggregate ACROSS all tracked competitors: a keyword that
 *                   MULTIPLE rivals rank for (and we don't) is a much stronger
 *                   signal than one competitor's outlier page.
 *   4. SCORE      — combine volume, difficulty, relevance and competitor
 *                   consensus into one number to sort the attack list by.
 */

// ---------------------------------------------------------------------------
// Relevance vocabulary
// ---------------------------------------------------------------------------

/**
 * STRONG terms are unambiguous — their presence alone confirms the keyword is
 * in Kloudbean's market (hosting/cloud/deploy/dev-platform specific).
 */
const STRONG_VOCAB = [
  "hosting",
  "vps",
  "cloud server",
  "cloud hosting",
  "web hosting",
  "app hosting",
  "site hosting",
  "wordpress hosting",
  "managed hosting",
  "dedicated server",
  "docker",
  "kubernetes",
  "deploy",
  "deployment",
  "wordpress",
  "woocommerce",
  "elementor",
  "cpanel",
  "control panel",
  "laravel",
  "node.js",
  "nodejs",
  "django",
  "next.js",
  "nextjs",
  "devops",
  "ci/cd",
  "cicd",
  "load balancer",
  "object storage",
  "self-hosted",
  "self hosted",
  "n8n",
  "supabase",
  "gitlab",
  "reseller hosting",
  "white label hosting",
  "web host",
  "domain hosting",
  "server management",
  "auto-scaling",
  "autoscaling",
  "jamstack",
  "static site hosting",
  "cloudways",
  "kinsta",
  "wp engine",
  "wpengine",
  "digitalocean",
  "vultr",
  "linode",
  "vercel",
  "netlify",
  "railway",
  "render.com",
  "fly.io",
];

/**
 * WEAK terms are generic — they occur in plenty of off-topic keywords too
 * (e.g. "storage" → "boat storage", " vs " → "stye vs pink eye"). Two or
 * more weak hits together are a reasonable signal; one alone is not.
 */
const WEAK_VOCAB = [
  "cloud",
  "server",
  "host",
  "domain",
  "ssl",
  "website",
  "web app",
  "container",
  "database",
  "backup",
  "migration",
  "migrate",
  "php",
  "python",
  "react",
  "saas",
  "git",
  "api",
  "firewall",
  "security",
  "ddos",
  "storage",
  "s3",
  "managed",
  "uptime",
  "scaling",
  "reseller",
  "white label",
  "agency",
  "enterprise",
  "compliance",
  "pricing",
  "plan",
  "free trial",
  "alternative",
  " vs ",
  "comparison",
  "cache",
  "redis",
  "mysql",
  "postgres",
  "edge",
  "serverless",
  "open source",
];

/** Per-cluster vocabulary — used to auto-classify a keyword into a content cluster. */
const CLUSTER_VOCAB: Record<number, string[]> = {
  1: ["lovable", "bolt.new", "bolt ai", "cursor", "ai app", "vibe cod", "deploy ai", "windsurf"],
  2: [
    "n8n",
    "supabase",
    "gitlab",
    "self-hosted",
    "self hosted",
    "open source",
    "ollama",
    "nextcloud",
  ],
  3: [
    "next.js",
    "nextjs",
    "node",
    "laravel",
    "python",
    "django",
    "deploy",
    "deployment",
    "react",
    "vue",
  ],
  4: [
    " vs ",
    "alternative",
    "compare",
    "comparison",
    "cloudways",
    "vercel",
    "render",
    "railway",
    "kinsta",
  ],
  5: ["agency", "white label", "multi site", "multisite", "client sites", "reseller"],
  6: ["wordpress", "woocommerce", "elementor", "wp ", "wp-"],
  7: ["database", "mysql", "postgres", "redis", "s3", "storage", "backup", "object storage"],
  8: ["price", "pricing", "cost", "cheap", "free", "plan", "budget"],
  9: ["security", "firewall", "ddos", "scaling", "load balancer", "cdn", "ssl", "autoscal", "waf"],
  10: ["enterprise", "compliance", "saudi", "ksa", "data residency", "nca", "gdpr", "hipaa"],
};

function norm(s: string): string {
  return ` ${s.toLowerCase().trim()} `;
}

/**
 * 0..1 relevance score — how "in-market" a keyword is for Kloudbean.
 * Requires at least one STRONG hit, or two+ WEAK hits, to count as relevant.
 * A single generic weak term (e.g. just "storage" or just " vs ") is not
 * enough — that's how off-topic junk like "boat storage" slips through.
 */
export function relevanceScore(keyword: string, intents?: string | null): number {
  const hay = norm(keyword);
  const strongHits = STRONG_VOCAB.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
  const weakHits = WEAK_VOCAB.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);

  let score: number;
  if (strongHits >= 2) score = 1;
  else if (strongHits === 1) score = weakHits >= 1 ? 0.95 : 0.75;
  else if (weakHits >= 3) score = 0.7;
  else if (weakHits === 2) score = 0.5;
  else if (weakHits === 1)
    score = 0.15; // one generic term alone — likely noise
  else score = 0.05;

  // Brand-navigational searches ("cloudways login", "vercel careers") aren't
  // content opportunities — nobody chooses a host because of a blog post
  // about a rival's careers page.
  const NAV_SUFFIXES = [
    "login",
    "careers",
    "jobs",
    "promo code",
    "coupon",
    "discount code",
    "sign in",
    "signin",
    "sign up",
    "status page",
    "down",
    "outage",
    "phone number",
    "customer service",
    "contact",
  ];
  if (NAV_SUFFIXES.some((s) => hay.includes(s))) score = Math.min(score, 0.2);

  if (intents) {
    const i = intents.toLowerCase();
    if ((i.includes("commercial") || i.includes("transactional")) && strongHits + weakHits > 0) {
      score = Math.min(1, score + 0.1);
    }
  }
  return Math.round(score * 100) / 100;
}

/** Classify a keyword into one of the 10 content clusters (best-guess, may be null). */
export function classifyCluster(keyword: string): { id: number; name: string } | null {
  const hay = norm(keyword);
  let best: { id: number; hits: number } | null = null;
  for (const [idStr, vocab] of Object.entries(CLUSTER_VOCAB)) {
    const id = Number(idStr);
    const hits = vocab.reduce((n, v) => (hay.includes(v) ? n + 1 : n), 0);
    if (hits > 0 && (!best || hits > best.hits)) best = { id, hits };
  }
  if (!best) return null;
  const cluster = CLUSTERS.find((c) => c.id === best!.id);
  return cluster ? { id: cluster.id, name: cluster.name } : null;
}

/** Map a topical cluster (1-10) onto the legacy pillar field (1-5) articles requires. */
export function clusterToPillar(clusterId: number | null): number {
  if (clusterId == null) return 1;
  return ((clusterId - 1) % 5) + 1;
}

// ---------------------------------------------------------------------------
// Opportunity score
// ---------------------------------------------------------------------------

export type AggregatedOpportunity = {
  keyword: string;
  volume: number;
  difficulty: number | null;
  intents: string | null;
  competitors: string[];
  competitorCount: number;
  bestCompetitorPosition: number | null;
  relevance: number;
  clusterId: number | null;
  clusterName: string | null;
  score: number;
};

/**
 * Combine volume (log-scaled), relevance, ease (inverse difficulty), and
 * competitor consensus (more rivals ranking = stronger signal) into one score.
 */
export function computeOpportunityScore(o: {
  volume: number;
  difficulty: number | null;
  relevance: number;
  competitorCount: number;
}): number {
  const volFactor = Math.log10(Math.max(o.volume, 1) + 10);
  const easeFactor = 1 - Math.min(o.difficulty ?? 50, 100) / 120; // harder KD = lower score
  const consensusFactor = 1 + 0.15 * Math.max(0, o.competitorCount - 1);
  const score = volFactor * o.relevance * Math.max(easeFactor, 0.1) * consensusFactor;
  return Math.round(score * 100) / 100;
}

/**
 * Aggregate kg_keyword_gap ACROSS every competitor: for each keyword where we
 * don't rank, how many rivals do, at their best position, with what volume.
 * Then scores + classifies + filters by relevance.
 */
export async function getAggregatedOpportunities(opts: {
  limit?: number;
  minRelevance?: number;
  maxDifficulty?: number;
}): Promise<AggregatedOpportunity[]> {
  const { getDb } = await import("@/server/db/client");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();

  const raw = await db.execute(
    sql.raw(`
      SELECT
        keyword,
        max(coalesce(volume, 0))::int AS volume,
        min(difficulty)::int AS difficulty,
        (array_agg(intents ORDER BY intents))[1] AS intents,
        array_agg(DISTINCT competitor_domain) AS competitors,
        count(DISTINCT competitor_domain)::int AS competitor_count,
        min(competitor_position)::int AS best_competitor_position
      FROM kg_keyword_gap
      WHERE (our_position IS NULL OR our_position = 0) AND competitor_position > 0
      GROUP BY keyword
      ORDER BY max(coalesce(volume, 0)) DESC
      LIMIT 5000
    `),
  );
  const rows = ((raw as unknown as { rows?: unknown[] }).rows ?? (raw as unknown[])) as {
    keyword: string;
    volume: number;
    difficulty: number | null;
    intents: string | null;
    competitors: string[];
    competitor_count: number;
    best_competitor_position: number | null;
  }[];

  const minRel = opts.minRelevance ?? 0.5;
  const out: AggregatedOpportunity[] = [];
  for (const r of rows) {
    const relevance = relevanceScore(r.keyword, r.intents);
    if (relevance < minRel) continue;
    if (opts.maxDifficulty != null && (r.difficulty ?? 0) > opts.maxDifficulty) continue;
    const cluster = classifyCluster(r.keyword);
    out.push({
      keyword: r.keyword,
      volume: r.volume,
      difficulty: r.difficulty,
      intents: r.intents,
      competitors: r.competitors,
      competitorCount: r.competitor_count,
      bestCompetitorPosition: r.best_competitor_position,
      relevance,
      clusterId: cluster?.id ?? null,
      clusterName: cluster?.name ?? null,
      score: computeOpportunityScore({
        volume: r.volume,
        difficulty: r.difficulty,
        relevance,
        competitorCount: r.competitor_count,
      }),
    });
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, opts.limit ?? 200);
}

// ---------------------------------------------------------------------------
// Link-building targets: domains that link to MULTIPLE competitors
// ---------------------------------------------------------------------------

export type LinkTarget = {
  referringDomain: string;
  competitorCount: number;
  competitors: string[];
  bestAuthority: number | null;
  totalBacklinks: number;
};

/**
 * Domains linking to 2+ of our tracked competitors are strong outreach targets
 * — they clearly link into this niche already.
 */
export async function getLinkBuildingTargets(limit = 100): Promise<LinkTarget[]> {
  const { getDb } = await import("@/server/db/client");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();

  const raw = await db.execute(
    sql.raw(`
      SELECT
        referring_domain,
        count(DISTINCT competitor_domain)::int AS competitor_count,
        array_agg(DISTINCT competitor_domain) AS competitors,
        max(domain_ascore)::int AS best_authority,
        sum(coalesce(backlinks, 0))::bigint AS total_backlinks
      FROM kg_referring_domains
      WHERE referring_domain IS NOT NULL
      GROUP BY referring_domain
      HAVING count(DISTINCT competitor_domain) >= 2
      ORDER BY competitor_count DESC, best_authority DESC NULLS LAST
      LIMIT ${Number(limit)}
    `),
  );
  const rows = ((raw as unknown as { rows?: unknown[] }).rows ?? (raw as unknown[])) as {
    referring_domain: string;
    competitor_count: number;
    competitors: string[];
    best_authority: number | null;
    total_backlinks: number;
  }[];

  return rows.map((r) => ({
    referringDomain: r.referring_domain,
    competitorCount: r.competitor_count,
    competitors: r.competitors,
    bestAuthority: r.best_authority,
    totalBacklinks: Number(r.total_backlinks ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// Competitor strength summary — feeds the knowledge graph + dashboard
// ---------------------------------------------------------------------------

export type CompetitorStrength = {
  domain: string;
  tier: number | null;
  rankingKeywords: number;
  backlinkCount: number;
  referringDomainCount: number;
  strengthScore: number;
};

export async function getCompetitorStrength(): Promise<CompetitorStrength[]> {
  const { getDb, schema } = await import("@/server/db/client");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();

  const competitors = await db.select().from(schema.kgCompetitors);
  const rankCounts = await db
    .select({ domain: schema.kgOrganicRankings.competitorDomain, c: sql<number>`count(*)::int` })
    .from(schema.kgOrganicRankings)
    .groupBy(schema.kgOrganicRankings.competitorDomain);
  const blCounts = await db
    .select({ domain: schema.kgBacklinks.competitorDomain, c: sql<number>`count(*)::int` })
    .from(schema.kgBacklinks)
    .groupBy(schema.kgBacklinks.competitorDomain);
  const refCounts = await db
    .select({ domain: schema.kgReferringDomains.competitorDomain, c: sql<number>`count(*)::int` })
    .from(schema.kgReferringDomains)
    .groupBy(schema.kgReferringDomains.competitorDomain);

  const rankMap = new Map(rankCounts.map((r) => [r.domain, Number(r.c)]));
  const blMap = new Map(blCounts.map((r) => [r.domain, Number(r.c)]));
  const refMap = new Map(refCounts.map((r) => [r.domain, Number(r.c)]));

  return competitors
    .map((c) => {
      const rankingKeywords = rankMap.get(c.domain) ?? 0;
      const backlinkCount = blMap.get(c.domain) ?? 0;
      const referringDomainCount = refMap.get(c.domain) ?? 0;
      const strengthScore =
        Math.log10(rankingKeywords + 1) * 2 +
        Math.log10(backlinkCount + 1) +
        Math.log10(referringDomainCount + 1) * 1.5;
      return {
        domain: c.domain,
        tier: c.tier ?? null,
        rankingKeywords,
        backlinkCount,
        referringDomainCount,
        strengthScore: Math.round(strengthScore * 100) / 100,
      };
    })
    .sort((a, b) => b.strengthScore - a.strengthScore);
}
