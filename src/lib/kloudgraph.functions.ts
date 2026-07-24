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

/**
 * The tracked competitor set, tiered by how closely they compete with
 * Kloudbean. Kept in kloudgraph/competitor-catalog.ts (single source of
 * truth, also used by the importer to auto-tag domains discovered from a
 * folder name, and by the market-map to roll strength up by segment).
 * Re-exported here for backward compatibility with any existing imports.
 */
export { COMPETITOR_CATALOG as SEED_COMPETITORS } from "./kloudgraph/competitor-catalog";

/** Seed / refresh the competitor registry with the tracked set. */
export const seedCompetitorsFn = createServerFn({ method: "POST" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { ensureCompetitor } = await import("./kloudgraph/semrush-import");
  const { COMPETITOR_CATALOG } = await import("./kloudgraph/competitor-catalog");
  for (const c of COMPETITOR_CATALOG) {
    await ensureCompetitor(c.domain, { tier: c.tier, category: c.category });
  }
  return { ok: true, seeded: COMPETITOR_CATALOG.length };
});

/**
 * Import every CSV in the export folder into the kg_* tables. Starts the
 * import in the background and returns the process_runs id IMMEDIATELY (does
 * NOT await the import), so the dashboard can start polling a live progress
 * bar ("file 12 of 87") and per-file log right away instead of only a
 * spinner until the whole (potentially multi-minute) import finishes.
 */
export const importSemrushFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ root: z.string().optional() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const runs = await import("@/server/db/repos/process-runs");
    const root = data.root || EXPORT_ROOT;

    const run = await runs.createProcessRun({
      kind: "semrush_import",
      label: `Importing Semrush exports from ${root}`,
    });

    // Fire-and-forget: the actual import runs after this handler returns the
    // run id, writing progress to process_runs as it goes. PGlite/Postgres
    // writes are visible to other reads immediately, so polling works even
    // though this HTTP request has already completed.
    void runSemrushImportInBackground(run.id, root);

    return { ok: true, processRunId: run.id };
  });

async function runSemrushImportInBackground(runId: string, root: string): Promise<void> {
  const runs = await import("@/server/db/repos/process-runs");
  const { importSemrushFolder } = await import("./kloudgraph/semrush-import");
  try {
    const result = await importSemrushFolder(root, async (file, _idx, total) => {
      await runs.appendProcessLog(
        runId,
        file.error
          ? `${file.file} (${file.competitor}) — error: ${file.error.slice(0, 150)}`
          : file.skipped
            ? `${file.file} (${file.competitor}) — skipped: ${file.reason ?? "unrecognized"}`
            : `${file.file} (${file.competitor}) — imported ${file.rows.toLocaleString()} rows`,
        file.error ? "error" : file.skipped ? "warn" : "success",
        { completed: 1, failed: file.error ? 1 : 0, total },
      );
    });

    if (!result.ok) {
      await runs.finishProcessRun(runId, { status: "error", error: result.error, result });
      return;
    }
    await runs.appendProcessLog(
      runId,
      `Done — ${result.totalRows.toLocaleString()} total rows across ${result.competitors.length} competitor(s)`,
      "success",
    );
    await runs.finishProcessRun(runId, { status: "done", result });
  } catch (e) {
    const error = String((e as Error)?.message ?? e);
    await runs.appendProcessLog(runId, `Import crashed: ${error}`, "error");
    await runs.finishProcessRun(runId, { status: "error", error });
  }
}

/** Poll one process run's live progress + log (used by the dashboard's progress panel). */
export const getProcessRunFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const runs = await import("@/server/db/repos/process-runs");
    const run = await runs.getProcessRun(data.id);
    return { ok: !!run, run };
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
 * MARKET MAP — which competitor segment (Managed cloud/WordPress, PaaS, Cloud
 * infra, etc.) is most winnable right now: real demand vs how strong the
 * incumbents in that segment actually are. The "where is there opportunity in
 * the market" view — feeds idea generation (content/tools/reels) a segment-
 * level signal on top of the keyword-level attack list.
 */
export const listMarketMapFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { getMarketMap } = await import("./kloudgraph/market-map");
  const segments = await getMarketMap();
  return { ok: true, segments };
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
 * autopilot will actually write. Exported as a plain function (not just a
 * server fn) so Autopilot can call it directly during its discovery step.
 */
export async function sendOpportunitiesToContentInternal(data: {
  limit: number;
  minRelevance: number;
  maxDifficulty?: number;
}): Promise<{ ok: boolean; created: number }> {
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
}

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
    return sendOpportunitiesToContentInternal(data);
  });
