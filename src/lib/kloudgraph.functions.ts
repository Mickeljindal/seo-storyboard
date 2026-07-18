import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * KLOUDGRAPH — server functions.
 *
 *   seed competitors → import Semrush exports → scored attack list, link
 *   targets, competitor strength → send opportunities into the content
 *   pipeline as article ideas.
 *
 * The importer reads the `kloudgraph-semrush-export/<competitor>/*.csv` folder
 * the user exports from Semrush and normalizes it into the kg_* tables.
 */

const EXPORT_ROOT = "kloudgraph-semrush-export";

/** The tracked competitor set, tiered by how closely they compete with Kloudbean. */
export const SEED_COMPETITORS: {
  domain: string;
  tier: number;
  category: string;
}[] = [
  // Tier 1 — direct: managed cloud / premium managed WordPress
  { domain: "cloudways.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "kinsta.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "wpengine.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "rocket.net", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "pressable.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "nexcess.net", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "convesio.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "servebolt.com", tier: 1, category: "Managed cloud / WordPress" },
  { domain: "getflywheel.com", tier: 1, category: "Managed cloud / WordPress" },
  // Tier 2 — control panels / managed VPS
  { domain: "runcloud.io", tier: 2, category: "Control panel / managed VPS" },
  { domain: "gridpane.com", tier: 2, category: "Control panel / managed VPS" },
  { domain: "spinupwp.com", tier: 2, category: "Control panel / managed VPS" },
  { domain: "ploi.io", tier: 2, category: "Control panel / managed VPS" },
  { domain: "serveravatar.com", tier: 2, category: "Control panel / managed VPS" },
  // Tier 3 — modern PaaS / app deploy
  { domain: "vercel.com", tier: 3, category: "PaaS / app deploy" },
  { domain: "netlify.com", tier: 3, category: "PaaS / app deploy" },
  { domain: "render.com", tier: 3, category: "PaaS / app deploy" },
  { domain: "railway.app", tier: 3, category: "PaaS / app deploy" },
  { domain: "fly.io", tier: 3, category: "PaaS / app deploy" },
  // Tier 4 — raw cloud infrastructure
  { domain: "digitalocean.com", tier: 4, category: "Cloud infrastructure" },
  { domain: "vultr.com", tier: 4, category: "Cloud infrastructure" },
  { domain: "linode.com", tier: 4, category: "Cloud infrastructure" },
  { domain: "kamatera.com", tier: 4, category: "Cloud infrastructure" },
  // Tier 5 — big hosts with broad overlap
  { domain: "hostinger.com", tier: 5, category: "Broad host" },
  { domain: "siteground.com", tier: 5, category: "Broad host" },
];

/** Seed / refresh the competitor registry with the tracked set. */
export const seedCompetitorsFn = createServerFn({ method: "POST" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { ensureCompetitor } = await import("./kloudgraph/semrush-import");
  for (const c of SEED_COMPETITORS) {
    await ensureCompetitor(c.domain, { tier: c.tier, category: c.category });
  }
  return { ok: true, seeded: SEED_COMPETITORS.length };
});

/** Import every CSV in the export folder into the kg_* tables. */
export const importSemrushFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ root: z.string().optional() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { importSemrushFolder } = await import("./kloudgraph/semrush-import");
    return importSemrushFolder(data.root || EXPORT_ROOT);
  });

/** Overall KLOUDGRAPH stats — row counts per table + tracked competitors. */
export const kloudgraphStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { getDb } = await import("@/server/db/client");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();

  async function count(table: string): Promise<number> {
    try {
      const r = await db.execute(sql.raw(`SELECT count(*)::int AS c FROM ${table}`));
      // drizzle pglite returns { rows: [...] }; postgres-js returns array-like
      const rows = (r as unknown as { rows?: { c: number }[] }).rows ?? (r as { c: number }[]);
      return Number(rows?.[0]?.c ?? 0);
    } catch {
      return 0;
    }
  }

  const [competitors, rankings, gap, orgCompetitors, backlinks, anchors, blPages, subdomains] =
    await Promise.all([
      count("kg_competitors"),
      count("kg_organic_rankings"),
      count("kg_keyword_gap"),
      count("kg_organic_competitors"),
      count("kg_backlinks"),
      count("kg_backlink_anchors"),
      count("kg_backlink_pages"),
      count("kg_subdomains"),
    ]);

  return {
    ok: true,
    counts: {
      competitors,
      rankings,
      gap,
      orgCompetitors,
      backlinks,
      anchors,
      backlinkPages: blPages,
      subdomains,
    },
  };
});

/** The tracked competitors with a data-coverage summary. */
export const listKgCompetitorsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { getDb, schema } = await import("@/server/db/client");
  const { sql, desc } = await import("drizzle-orm");
  const db = await getDb();

  const competitors = await db
    .select()
    .from(schema.kgCompetitors)
    .orderBy(schema.kgCompetitors.tier, schema.kgCompetitors.domain);

  // Row coverage per competitor (rankings + gap), computed in one grouped query each.
  const rankCounts = await db
    .select({
      domain: schema.kgOrganicRankings.competitorDomain,
      c: sql<number>`count(*)::int`,
    })
    .from(schema.kgOrganicRankings)
    .groupBy(schema.kgOrganicRankings.competitorDomain);
  const gapCounts = await db
    .select({
      domain: schema.kgKeywordGap.competitorDomain,
      c: sql<number>`count(*)::int`,
    })
    .from(schema.kgKeywordGap)
    .groupBy(schema.kgKeywordGap.competitorDomain);
  const blCounts = await db
    .select({
      domain: schema.kgBacklinks.competitorDomain,
      c: sql<number>`count(*)::int`,
    })
    .from(schema.kgBacklinks)
    .groupBy(schema.kgBacklinks.competitorDomain);

  const rankMap = new Map(rankCounts.map((r) => [r.domain, Number(r.c)]));
  const gapMap = new Map(gapCounts.map((r) => [r.domain, Number(r.c)]));
  const blMap = new Map(blCounts.map((r) => [r.domain, Number(r.c)]));

  return {
    ok: true,
    competitors: competitors.map((c) => ({
      domain: c.domain,
      name: c.name,
      tier: c.tier,
      category: c.category,
      tracked: c.tracked,
      rankings: rankMap.get(c.domain) ?? 0,
      gapKeywords: gapMap.get(c.domain) ?? 0,
      backlinks: blMap.get(c.domain) ?? 0,
    })),
  };

  // (desc imported for future sorted views)
  void desc;
});

/**
 * Top opportunities — the RAW view (single competitor rows, sorted by volume).
 * Kept for reference; the scored/aggregated view below is what the dashboard
 * actually leads with (it filters out off-topic noise).
 */
export const listOpportunitiesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(500).default(100),
      maxDifficulty: z.number().min(0).max(100).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { getDb, schema } = await import("@/server/db/client");
    const { and, or, isNull, eq, gt, lte, desc, sql } = await import("drizzle-orm");
    const db = await getDb();

    const g = schema.kgKeywordGap;
    const notRanking = or(isNull(g.ourPosition), eq(g.ourPosition, 0));
    const conds = [notRanking, gt(g.competitorPosition, 0)];
    if (data.maxDifficulty != null) conds.push(lte(g.difficulty, data.maxDifficulty));

    const rows = await db
      .select({
        keyword: g.keyword,
        competitorDomain: g.competitorDomain,
        volume: g.volume,
        difficulty: g.difficulty,
        cpc: g.cpc,
        intents: g.intents,
        competitorPosition: g.competitorPosition,
        competitorUrl: g.competitorUrl,
      })
      .from(g)
      .where(and(...conds))
      .orderBy(desc(sql`coalesce(${g.volume}, 0)`))
      .limit(data.limit);

    return { ok: true, opportunities: rows };
  });

/**
 * SCORED opportunities — the "become king" view. Aggregates every competitor's
 * keyword gap into one attack list: relevance-filtered, cluster-classified,
 * and ranked by a score that rewards volume + ease + how many rivals already
 * rank for it (consensus = the niche has proven the demand is real).
 */
export const listScoredOpportunitiesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(500).default(150),
      minRelevance: z.number().min(0).max(1).default(0.5),
      maxDifficulty: z.number().min(0).max(100).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { getAggregatedOpportunities } = await import("./kloudgraph/opportunity-engine");
    const opportunities = await getAggregatedOpportunities(data);
    return { ok: true, opportunities };
  });

/** Domains linking to 2+ tracked competitors — the sharpest link-building targets. */
export const listLinkTargetsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ limit: z.number().min(1).max(300).default(80) }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { getLinkBuildingTargets } = await import("./kloudgraph/opportunity-engine");
    const targets = await getLinkBuildingTargets(data.limit);
    return { ok: true, targets };
  });

/** Competitor strength ranking (rankings + backlinks + referring domains, log-scaled). */
export const listCompetitorStrengthFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { getCompetitorStrength } = await import("./kloudgraph/opportunity-engine");
  const competitors = await getCompetitorStrength();
  return { ok: true, competitors };
});

/**
 * Stored competitor rankings for one domain — reads straight from the
 * KLOUDGRAPH warehouse (already imported from Semrush), so it's instant and
 * free to call, unlike the live DataForSEO lookup on the Keywords page.
 */
export const getStoredCompetitorRankingsFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      domain: z.string().min(3),
      limit: z.number().min(1).max(200).default(60),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { getDb, schema } = await import("@/server/db/client");
    const { eq, asc, sql } = await import("drizzle-orm");
    const db = await getDb();

    const domain = data.domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "");
    const r = schema.kgOrganicRankings;
    const rows = await db
      .select({
        keyword: r.keyword,
        position: r.position,
        volume: r.volume,
        difficulty: r.difficulty,
        url: r.url,
      })
      .from(r)
      .where(eq(r.competitorDomain, domain))
      .orderBy(asc(sql`coalesce(${r.position}, 999)`))
      .limit(data.limit);

    return { ok: true, domain, keywords: rows, stored: true };
  });

/**
 * Send the top-scored opportunities straight into the content pipeline as
 * article ideas — pre-filled with keyword, cluster, and competitor proof.
 * This is the bridge that turns competitor intelligence into content the
 * autopilot will actually write.
 */
export const sendOpportunitiesToContentFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(100).default(20),
      minRelevance: z.number().min(0).max(1).default(0.6),
      maxDifficulty: z.number().min(0).max(100).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { getAggregatedOpportunities, clusterToPillar } =
      await import("./kloudgraph/opportunity-engine");
    const { clusterMeta } = await import("./pillars");
    const articlesRepo = await import("@/server/db/repos/articles");

    const opps = await getAggregatedOpportunities(data);
    if (!opps.length) return { ok: true, created: 0 };

    // Dedupe against existing target keywords so re-running never duplicates.
    const existing = await articlesRepo.listArticles({ limit: 5000 });
    const existingKeywords = new Set(
      existing.map((a) => (a.target_keyword ?? "").trim().toLowerCase()).filter(Boolean),
    );

    const toCreate = opps.filter((o) => !existingKeywords.has(o.keyword.trim().toLowerCase()));
    if (!toCreate.length) return { ok: true, created: 0 };

    const rows = toCreate.map((o) => {
      const clusterInfo = o.clusterId != null ? clusterMeta(o.clusterId) : null;
      return {
        title: `${o.keyword[0].toUpperCase()}${o.keyword.slice(1)}`,
        target_keyword: o.keyword,
        pillar: clusterToPillar(o.clusterId),
        cluster_id: o.clusterId ?? null,
        cluster_name: clusterInfo?.name ?? null,
        status: "idea",
        priority: o.score >= 3 ? "high" : o.score >= 1.5 ? "medium" : "low",
        engine_source: "kloudgraph",
        notes: `KLOUDGRAPH opportunity — ranked by ${o.competitorCount} competitor(s) incl. ${o.competitors
          .slice(0, 3)
          .join(
            ", ",
          )} (best position ${o.bestCompetitorPosition ?? "?"}). Volume ${o.volume.toLocaleString()}, KD ${o.difficulty ?? "?"}, relevance ${o.relevance}.`,
        keyword_data: {
          source: "kloudgraph",
          volume: o.volume,
          difficulty: o.difficulty,
          intents: o.intents,
          competitors: o.competitors,
          competitorCount: o.competitorCount,
          bestCompetitorPosition: o.bestCompetitorPosition,
          relevance: o.relevance,
          opportunityScore: o.score,
        },
      };
    });

    const inserted = await articlesRepo.insertArticles(rows);
    return { ok: true, created: inserted.length };
  });
