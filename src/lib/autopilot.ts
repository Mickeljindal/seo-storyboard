import "@tanstack/react-start/server-only";

/**
 * AUTOPILOT — the fully autonomous scheduling + progression engine.
 *
 * This runs inside the app on a configurable interval and performs ALL steps
 * of the SEO pipeline without human intervention:
 *
 *   1. DISCOVER — find N new topics per cycle (respects cadence limit)
 *   2. PROGRESS — advance existing articles through the pipeline:
 *      idea → research → brief → write+score → publish (if score passes)
 *   3. REFRESH — check old published articles and update stale ones
 *   4. REPORT — log what happened for the weekly digest
 *
 * Cadence control: max N publishes per day/week (configurable).
 * Safety: never publishes if quality score < threshold or blocking claims exist.
 */

import { loadProjectEnv } from "./load-env";

export type AutopilotConfig = {
  enabled: boolean;
  /** Interval between runs in milliseconds (default: 6 hours) */
  intervalMs: number;
  /** Max articles to publish per day */
  maxPublishPerDay: number;
  /** Max articles to publish per week */
  maxPublishPerWeek: number;
  /** Min quality score to auto-publish */
  minPublishScore: number;
  /** New topics to discover per run */
  topicsPerRun: number;
  /** Articles to progress (research/brief/write) per run */
  progressPerRun: number;
  /** Geo focus */
  geo: string;
  /** Auto-discover new topics each cycle */
  autoDiscover: boolean;
  /** Auto-publish passing articles */
  autoPublish: boolean;
  /** Use the plugin endpoint (vs basic WP) */
  usePlugin: boolean;
  /** Refresh articles older than N days */
  refreshAfterDays: number;
  // --- Pre-publish review queue ---
  /** Hours a finished article sits in the review queue before it's eligible for auto-publish */
  reviewHoldHours: number;
  /** If true, Autopilot itself approves+publishes anything whose hold has fully elapsed. If false, queued items wait for a human forever. */
  autoApproveAfterHold: boolean;
  // --- Tool pages (Elementor) ---
  /** Master switch for the tool-pages phase */
  toolsEnabled: boolean;
  /** Discover + persist this many new tool ideas per run (0 = off) */
  toolsDiscoverPerRun: number;
  /** Generate this many pending tool ideas per run */
  toolsGeneratePerRun: number;
  /** How to publish generated tools: "off" | "draft" | "publish" */
  toolsPublishStatus: "off" | "draft" | "publish";
  /** Optimize this many worst-scoring existing pages per run (additive, slug-safe) */
  toolsOptimizePerRun: number;
  // --- KLOUDGRAPH (competitor intelligence) ---
  /** Master switch — pull competitor-proven opportunities into discovery */
  kloudgraphEnabled: boolean;
  /** Send this many top-scored, competitor-proven keywords per run */
  kloudgraphPerRun: number;
  /** Minimum relevance (0-1) an opportunity must clear to be sent */
  kloudgraphMinRelevance: number;
  // --- Site-wide auto internal linking ---
  /** Master switch — off by default; scanning is safe, applying edits live is not */
  siteLinksEnabled: boolean;
  /** Re-sync + re-score the whole site this often (every run, since it's read-only) */
  siteLinksScanPerRun: boolean;
  /** Apply this many top-scoring pending suggestions live per run (0 = scan only, never write) */
  siteLinksApplyPerRun: number;
};

const DEFAULT_CONFIG: AutopilotConfig = {
  enabled: false,
  intervalMs: 6 * 60 * 60 * 1000, // 6 hours
  maxPublishPerDay: 2,
  maxPublishPerWeek: 7,
  minPublishScore: 85,
  topicsPerRun: 5,
  progressPerRun: 3,
  geo: "global",
  autoDiscover: true,
  autoPublish: true,
  usePlugin: true,
  refreshAfterDays: 90,
  reviewHoldHours: 24,
  autoApproveAfterHold: false,
  toolsEnabled: false,
  toolsDiscoverPerRun: 3,
  toolsGeneratePerRun: 1,
  toolsPublishStatus: "draft",
  toolsOptimizePerRun: 3,
  kloudgraphEnabled: true,
  kloudgraphPerRun: 5,
  kloudgraphMinRelevance: 0.6,
  siteLinksEnabled: false,
  siteLinksScanPerRun: true,
  siteLinksApplyPerRun: 0,
};

export function getAutopilotConfig(): AutopilotConfig {
  loadProjectEnv();
  return {
    enabled: process.env.AUTOPILOT_ENABLED === "1",
    kloudgraphEnabled: process.env.AUTOPILOT_KLOUDGRAPH !== "0",
    kloudgraphPerRun: Number(
      process.env.AUTOPILOT_KLOUDGRAPH_PER_RUN || DEFAULT_CONFIG.kloudgraphPerRun,
    ),
    kloudgraphMinRelevance: Number(
      process.env.AUTOPILOT_KLOUDGRAPH_MIN_RELEVANCE || DEFAULT_CONFIG.kloudgraphMinRelevance,
    ),
    intervalMs: Number(process.env.AUTOPILOT_INTERVAL_MS || DEFAULT_CONFIG.intervalMs),
    maxPublishPerDay: Number(process.env.AUTOPILOT_MAX_PER_DAY || DEFAULT_CONFIG.maxPublishPerDay),
    maxPublishPerWeek: Number(
      process.env.AUTOPILOT_MAX_PER_WEEK || DEFAULT_CONFIG.maxPublishPerWeek,
    ),
    minPublishScore: Number(process.env.AUTOPILOT_MIN_SCORE || DEFAULT_CONFIG.minPublishScore),
    topicsPerRun: Number(process.env.AUTOPILOT_TOPICS_PER_RUN || DEFAULT_CONFIG.topicsPerRun),
    progressPerRun: Number(process.env.AUTOPILOT_PROGRESS_PER_RUN || DEFAULT_CONFIG.progressPerRun),
    geo: process.env.AUTOPILOT_GEO || DEFAULT_CONFIG.geo,
    autoDiscover: process.env.AUTOPILOT_DISCOVER !== "0",
    autoPublish: process.env.AUTOPILOT_PUBLISH !== "0",
    usePlugin: process.env.AUTOPILOT_USE_PLUGIN !== "0",
    refreshAfterDays: Number(process.env.AUTOPILOT_REFRESH_DAYS || DEFAULT_CONFIG.refreshAfterDays),
    reviewHoldHours: Number(
      process.env.AUTOPILOT_REVIEW_HOLD_HOURS || DEFAULT_CONFIG.reviewHoldHours,
    ),
    autoApproveAfterHold: process.env.AUTOPILOT_AUTO_APPROVE_AFTER_HOLD === "1",
    toolsEnabled: process.env.AUTOPILOT_TOOLS === "1",
    toolsDiscoverPerRun: Number(
      process.env.AUTOPILOT_TOOLS_DISCOVER || DEFAULT_CONFIG.toolsDiscoverPerRun,
    ),
    toolsGeneratePerRun: Number(
      process.env.AUTOPILOT_TOOLS_GENERATE || DEFAULT_CONFIG.toolsGeneratePerRun,
    ),
    toolsPublishStatus:
      (process.env.AUTOPILOT_TOOLS_PUBLISH as "off" | "draft" | "publish") ||
      DEFAULT_CONFIG.toolsPublishStatus,
    toolsOptimizePerRun: Number(
      process.env.AUTOPILOT_TOOLS_OPTIMIZE || DEFAULT_CONFIG.toolsOptimizePerRun,
    ),
    siteLinksEnabled: process.env.AUTOPILOT_SITE_LINKS === "1",
    siteLinksScanPerRun: process.env.AUTOPILOT_SITE_LINKS_SCAN !== "0",
    siteLinksApplyPerRun: Number(
      process.env.AUTOPILOT_SITE_LINKS_APPLY || DEFAULT_CONFIG.siteLinksApplyPerRun,
    ),
  };
}

export type AutopilotRunResult = {
  discovered: number;
  kloudgraphSent: number;
  researched: number;
  briefed: number;
  written: number;
  queued: number;
  published: number;
  refreshed: number;
  blocked: number;
  cadenceLimited: number;
  syncedPages: number;
  toolsDiscovered: number;
  toolsGenerated: number;
  toolsPublished: number;
  toolsOptimized: number;
  siteLinksFound: number;
  siteLinksApplied: number;
  errors: string[];
  log: string[];
};

/** Count articles published today and this week. */
async function getPublishCounts(): Promise<{ today: number; week: number }> {
  const repo = await import("@/server/db/repos/articles");
  const all = await repo.listArticles({ limit: 5000 });
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = dayStart - 6 * 86400_000;
  let today = 0;
  let week = 0;
  for (const a of all) {
    const pubAt = a.published_at ? new Date(a.published_at).getTime() : 0;
    if (pubAt >= dayStart) today++;
    if (pubAt >= weekStart) week++;
  }
  return { today, week };
}

/**
 * Run one full autopilot cycle. Tracked as a process_runs row (kind =
 * "autopilot_cycle") for the Activity Center: every log() call mirrors into
 * that run in real time, and the run persists across a page reload or even a
 * server restart — unlike the old in-memory-only lastRunResult, which vanished
 * completely if the process crashed mid-cycle, leaving no trace anything had
 * even started. A cycle that throws still finishes the run as "error" (with
 * the crash message) before re-throwing, so callers keep seeing identical
 * error behavior to before this change.
 */
export async function runAutopilotCycle(): Promise<AutopilotRunResult> {
  loadProjectEnv();
  const cfg = getAutopilotConfig();
  const runs = await import("@/server/db/repos/process-runs");
  const run = await runs.createProcessRun({
    kind: "autopilot_cycle",
    label: `Autopilot cycle — geo=${cfg.geo}`,
    total: 1,
    input: { geo: cfg.geo },
  });
  const result: AutopilotRunResult = {
    discovered: 0,
    kloudgraphSent: 0,
    researched: 0,
    briefed: 0,
    written: 0,
    queued: 0,
    published: 0,
    refreshed: 0,
    blocked: 0,
    cadenceLimited: 0,
    syncedPages: 0,
    toolsDiscovered: 0,
    toolsGenerated: 0,
    toolsPublished: 0,
    toolsOptimized: 0,
    siteLinksFound: 0,
    siteLinksApplied: 0,
    errors: [],
    log: [],
  };

  const log = (msg: string) => {
    result.log.push(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
    // Fire-and-forget mirror into the tracked run — never let a DB hiccup on
    // the log line itself derail the actual cycle.
    void runs.appendProcessLog(run.id, msg, "info").catch(() => {});
  };

  try {
    log(
      `Autopilot cycle started (geo=${cfg.geo}, discover=${cfg.autoDiscover}, publish=${cfg.autoPublish})`,
    );

    const repo = await import("@/server/db/repos/articles");

    // 0. RECONCILE PUBLISH STATE against live WordPress, before anything reads it.
    // The engine's database is ephemeral and the committed manifest was refreshed
    // by hand, so publish state drifted (it once reported 21 published when 38
    // were live). Every step below, and the internal-link ledger in particular,
    // makes decisions based on what is published, so correctness here comes
    // first. Talks only to WordPress and our own DB; never edits site content.
    if (process.env.AUTOPILOT_RECONCILE_PUBLISH !== "0") {
      try {
        const { reconcilePublishState, hasWordPressConfigured } = await import(
          "./publish-state-sync"
        );
        if (hasWordPressConfigured()) {
          const rec = await reconcilePublishState({ log });
          if (!rec.ok && rec.error) log(`publish state: skipped (${rec.error})`);
        }
      } catch (e) {
        result.errors.push(`publish state sync: ${String((e as Error)?.message ?? e)}`);
      }
    }

    const counts = await getPublishCounts();
    log(
      `Published: ${counts.today} today, ${counts.week} this week (limits: ${cfg.maxPublishPerDay}/day, ${cfg.maxPublishPerWeek}/week)`,
    );

    // 1a. KLOUDGRAPH — competitor-proven opportunities first. These are backed
    // by real Semrush data (rivals already rank for them, we don't), so they're
    // a stronger discovery signal than generic keyword research and get priority.
    if (cfg.kloudgraphEnabled) {
      try {
        const { sendOpportunitiesToContentInternal } = await import("./kloudgraph.functions");
        const r = await sendOpportunitiesToContentInternal({
          limit: cfg.kloudgraphPerRun,
          minRelevance: cfg.kloudgraphMinRelevance,
        });
        result.kloudgraphSent = r.created;
        if (r.created)
          log(`KLOUDGRAPH: sent ${r.created} competitor-proven keyword(s) to pipeline`);
      } catch (e) {
        result.errors.push(`kloudgraph: ${String((e as Error)?.message ?? e)}`);
      }
    }

    // 1b. DISCOVER new topics (generic keyword research — fills the rest of the quota)
    if (cfg.autoDiscover) {
      try {
        const { runAuthorityEngine } = await import("./authority-engine");
        const remaining = Math.max(0, cfg.topicsPerRun - result.kloudgraphSent);
        const r = await runAuthorityEngine({
          geo: cfg.geo,
          topicsPerCluster: Math.max(1, Math.ceil(remaining / 10)),
          includeCompetitorGap: false,
          competitorDomain: "cloudways.com",
          generateBriefs: false,
          generateContent: false,
          discoverySource: "serper",
          validateDemand: true,
          useLearning: true,
        });
        result.discovered = r.stats.articles_created;
        log(`Discovery: ${r.stats.articles_created} new topics`);
      } catch (e) {
        result.errors.push(`discover: ${String((e as Error)?.message ?? e)}`);
      }
    }

    // 2. PROGRESS articles through the pipeline
    const { hasAiCredentials } = await import("./ai-provider");
    if (!hasAiCredentials()) {
      log("Skipping progression — no AI key configured");
    } else {
      const { generateBriefInternal, generateContentInternal } = await import("./ai.functions");
      const { hasSerperCredentials } = await import("./serper-client");
      const { applyResearchToArticleInternal } = await import("./dataforseo.functions");

      const all = await repo.listArticles({ geo: cfg.geo, limit: 500 });
      const needsWork = all
        .filter((a) => !a.content_draft || !a.quality_score)
        .sort((a, b) => {
          const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return (
            (priorityOrder[a.priority ?? "medium"] ?? 1) -
            (priorityOrder[b.priority ?? "medium"] ?? 1)
          );
        })
        .slice(0, cfg.progressPerRun);

      for (const article of needsWork) {
        try {
          // Research if missing
          if (!article.keyword_data && article.target_keyword) {
            if (hasSerperCredentials()) {
              await applyResearchToArticleInternal(article.id, cfg.geo);
              result.researched++;
            }
          }

          // Brief if missing
          const fresh1 = await repo.getArticleById(article.id);
          if (!fresh1?.brief) {
            const r = await generateBriefInternal(article.id);
            if (r.ok) result.briefed++;
            else result.errors.push(`brief ${article.id}: ${r.error}`);
          }

          // Write + score if no draft
          const fresh2 = await repo.getArticleById(article.id);
          if (fresh2?.brief && !fresh2.content_draft) {
            const r = await generateContentInternal(article.id);
            if (r.ok) result.written++;
            else result.errors.push(`write ${article.id}: ${r.error}`);
          }
        } catch (e) {
          result.errors.push(`progress ${article.id}: ${String((e as Error)?.message ?? e)}`);
        }
      }
      log(
        `Progressed: ${result.researched} researched, ${result.briefed} briefed, ${result.written} written`,
      );
    }

    // 3. QUEUE FOR REVIEW — finished, passing articles no longer go straight to
    // WordPress. They're queued with a scheduled_publish_at (now + hold hours)
    // so everything is visible in the /publish-queue dashboard for a full day
    // (by default) before anyone — human or Autopilot itself — publishes it.
    if (cfg.autoPublish) {
      const publishable = (await repo.listArticles({ geo: cfg.geo, limit: 500 }))
        .filter(
          (a) =>
            a.content_draft &&
            a.quality_score &&
            a.quality_score >= cfg.minPublishScore &&
            !(a.quality_report as { blocking?: boolean })?.blocking &&
            a.status !== "published" &&
            a.status !== "promoted" &&
            a.approval_status !== "queued" &&
            a.approval_status !== "approved" &&
            a.approval_status !== "published",
        )
        .sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0));

      for (const article of publishable) {
        if (counts.today >= cfg.maxPublishPerDay) {
          result.cadenceLimited++;
          break;
        }
        if (counts.week >= cfg.maxPublishPerWeek) {
          result.cadenceLimited++;
          break;
        }
        try {
          const { queueForReview } = await import("./publish-queue");
          const r = await queueForReview(article.id, cfg.reviewHoldHours);
          if (r.ok) {
            result.queued++;
            // Reserve today's/week's cadence slot now so we don't over-queue
            // more than the publish limit even though nothing is live yet.
            counts.today++;
            counts.week++;
            log(
              `Queued for review: "${article.title}" — publishes ${r.scheduledPublishAt} unless reviewed sooner`,
            );
          } else {
            result.errors.push(`queue ${article.id}: ${r.error}`);
          }
        } catch (e) {
          result.errors.push(`queue ${article.id}: ${String((e as Error)?.message ?? e)}`);
        }
      }
      log(
        `Review queue: ${result.queued} queued, ${result.cadenceLimited} cadence-limited, ${result.blocked} blocked`,
      );
    }

    // 3b. PROCESS REVIEW QUEUE — publish anything whose hold window has fully
    // elapsed, but ONLY if auto-approve-after-hold is turned on. Otherwise
    // queued articles wait for a human to approve/reject, no matter how long.
    try {
      const { processReviewQueue } = await import("./publish-queue");
      const q = await processReviewQueue(cfg.autoApproveAfterHold);
      result.published += q.autoPublished;
      for (const e of q.errors) result.errors.push(`queue-release: ${e}`);
      if (q.autoPublished)
        log(`Review queue: auto-published ${q.autoPublished} whose hold elapsed`);
      if (q.stillQueued)
        log(
          `Review queue: ${q.stillQueued} still waiting (${cfg.autoApproveAfterHold ? "hold not yet elapsed" : "waiting for manual approval"})`,
        );
    } catch (e) {
      result.errors.push(`queue processing: ${String((e as Error)?.message ?? e)}`);
    }

    // 4. REFRESH stale articles — prioritised review queue (freshness/decay).
    if (cfg.refreshAfterDays > 0) {
      try {
        const { listStaleArticles, markArticleReviewed } = await import("./freshness");
        const stale = await listStaleArticles(10);
        // Refresh the highest-priority few; stamp review so we don't re-flag them
        // next cycle (and they regenerate via the normal pipeline).
        for (const a of stale.slice(0, 2)) {
          await markArticleReviewed(a.id, { rewrite: true });
          result.refreshed++;
        }
        if (result.refreshed)
          log(
            `Refresh: queued ${result.refreshed} stale articles for review (${stale.length} due, top: ${stale[0]?.reason ?? "n/a"})`,
          );
      } catch (e) {
        result.errors.push(`refresh: ${String((e as Error)?.message ?? e)}`);
      }
    }

    // 5. SYNC ANALYTICS — pull real Google Search Console data into the learning loop.
    try {
      const { hydrateEnvFromSettings } = await import("./app-settings");
      await hydrateEnvFromSettings();
      const { hasGscCredentials, querySearchAnalytics, isoDaysAgo } = await import("./gsc-client");
      if (hasGscCredentials()) {
        const startDate = isoDaysAgo(30);
        const endDate = isoDaysAgo(2);
        const rows = await querySearchAnalytics({
          startDate,
          endDate,
          dimensions: ["page"],
          rowLimit: 1000,
        });
        const { upsertSearchPerformance } = await import("@/server/db/repos/search-performance");
        const { stored } = await upsertSearchPerformance(
          rows.map((r) => ({
            page: r.page,
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: r.ctr,
            position: r.position,
            dateStart: startDate,
            dateEnd: endDate,
          })),
        );
        result.syncedPages = stored;
        if (stored)
          log(
            `Analytics: synced ${stored} pages from Search Console (real ranking data → learning loop)`,
          );
      }
    } catch (e) {
      result.errors.push(`analytics sync: ${String((e as Error)?.message ?? e)}`);
    }

    // 5b. SYNC CONVERSIONS — pull console signup/paid events + attribute to pages.
    try {
      const { hasPluginConfigured } = await import("./wp-plugin-client");
      if (hasPluginConfigured()) {
        const { syncConversionsInternal } = await import("./conversions.functions");
        const cv = await syncConversionsInternal();
        if (cv.stored)
          log(
            `Conversions: ingested ${cv.stored} (${cv.signups} signups, ${cv.paid} paid, ${cv.value} value)`,
          );
      }
    } catch (e) {
      result.errors.push(`conversion sync: ${String((e as Error)?.message ?? e)}`);
    }

    // 6. TOOL PAGES — discover/generate/publish new tools + optimize existing ones.
    if (cfg.toolsEnabled) {
      try {
        const { runToolsCycleInternal } = await import("./tools.functions");
        const t = await runToolsCycleInternal({
          geo: cfg.geo,
          sync: true,
          discover: cfg.toolsDiscoverPerRun > 0,
          discoverCount: cfg.toolsDiscoverPerRun,
          generateCount: cfg.toolsGeneratePerRun,
          publishStatus: cfg.toolsPublishStatus,
          optimizeCount: cfg.toolsOptimizePerRun,
        });
        result.toolsDiscovered = t.discovered;
        result.toolsGenerated = t.generated;
        result.toolsPublished = t.published;
        result.toolsOptimized = t.optimized;
        for (const e of t.errors) result.errors.push(`tools: ${e}`);
        log(
          `Tools: ${t.discovered} ideas, ${t.generated} generated, ${t.published} published (${cfg.toolsPublishStatus}), ${t.optimized} pages optimized`,
        );
      } catch (e) {
        result.errors.push(`tools phase: ${String((e as Error)?.message ?? e)}`);
      }
    }

    // 6a. SITE-WIDE AUTO INTERNAL LINKING — off by default. Scanning is
    // read-only (safe); applying links live is gated separately since it
    // edits existing WordPress content. Both require siteLinksEnabled=true.
    if (cfg.siteLinksEnabled) {
      try {
        const { runSiteLinkScan, applyTopSuggestions } = await import("./site-link-graph");
        if (cfg.siteLinksScanPerRun) {
          const scan = await runSiteLinkScan({ maxPages: 30, minScore: 0.12, limit: 300 });
          result.siteLinksFound = scan.saved;
          if (scan.saved) log(`Site links: scanned site, found ${scan.saved} new opportunities`);
        }
        if (cfg.siteLinksApplyPerRun > 0) {
          const applied = await applyTopSuggestions(cfg.siteLinksApplyPerRun);
          result.siteLinksApplied = applied.applied;
          for (const e of applied.errors) result.errors.push(`site-links: ${e}`);
          if (applied.applied) log(`Site links: applied ${applied.applied} link(s) live`);
        }
      } catch (e) {
        result.errors.push(`site links: ${String((e as Error)?.message ?? e)}`);
      }
    }

    // 6c. PENDING INTERNAL LINKS — repair links that were deferred at publish
    // time because their target was not live yet. The publisher heals inbound
    // links the moment an article goes live; this is the catch-up pass for
    // anything published outside the engine, interrupted mid-run, or backfilled.
    if (process.env.AUTOPILOT_HEAL_LINKS !== "0") {
      try {
        const { drainPendingLinks } = await import("./internal-link-healer");
        const healed = await drainPendingLinks({
          limit: Number(process.env.AUTOPILOT_HEAL_LINKS_PER_RUN || 40),
          log,
        });
        for (const e of healed.errors.slice(0, 5)) result.errors.push(`link heal: ${e}`);
      } catch (e) {
        result.errors.push(`link healing: ${String((e as Error)?.message ?? e)}`);
      }
    }

    // 6a. GROWTH — queue trend, thread, community and reply-drafting work that is
    // due. Enqueues only; the jobs themselves are drained just below. Gathering and
    // drafting are automated here, posting and emailing never are.
    try {
      const { runGrowthCycle } = await import("./growth-autopilot");
      const g = await runGrowthCycle();
      if (g.queued.length) log(`Growth: queued ${g.queued.join(", ")}`);
    } catch (e) {
      result.errors.push(`growth cycle: ${String((e as Error)?.message ?? e)}`);
    }

    // 6b. JOB QUEUE — drain durable bulk jobs (build/optimize/publish) server-side.
    try {
      const { drainJobs } = await import("./job-queue");
      const jq = await drainJobs(Number(process.env.AUTOPILOT_JOBS_PER_RUN || 10));
      if (jq.processed)
        log(`Jobs: processed ${jq.processed} (${jq.done} done, ${jq.failed} failed/retry)`);
    } catch (e) {
      result.errors.push(`job queue: ${String((e as Error)?.message ?? e)}`);
    }

    // 7. KNOWLEDGE GRAPH — keep the system's understanding fresh + learning.
    try {
      const { rebuildKnowledgeGraph } = await import("./knowledge-graph");
      const kgRes = await rebuildKnowledgeGraph();
      log(
        `Knowledge graph: ${kgRes.totals.nodes} entities, ${kgRes.totals.edges} links (learned ${kgRes.learned.clustersRewarded} clusters)`,
      );
    } catch (e) {
      result.errors.push(`knowledge graph: ${String((e as Error)?.message ?? e)}`);
    }

    // 7b. AI CITATION TRACKING — measure whether we're cited in AI answers (GEO/AIO).
    if (process.env.AUTOPILOT_CITATIONS === "1") {
      try {
        const { hasCitationTracking } = await import("./citation-tracker");
        if (hasCitationTracking()) {
          const { buildDefaultCitationQueries, runCitationCheckInternal } =
            await import("./citations.functions");
          const perRun = Number(process.env.AUTOPILOT_CITATIONS_PER_RUN || 5);
          const queries = await buildDefaultCitationQueries(perRun);
          let cited = 0;
          let mentioned = 0;
          let ran = 0;
          for (const q of queries) {
            const r = await runCitationCheckInternal({
              queries: [q.query],
              geo: q.geo,
              clusterId: q.clusterId,
            });
            cited += r.cited;
            mentioned += r.mentioned;
            ran += r.ran;
          }
          if (ran)
            log(
              `Citations: checked ${ran} engine-answers — cited ${cited}, mentioned ${mentioned}`,
            );
        }
      } catch (e) {
        result.errors.push(`citation tracking: ${String((e as Error)?.message ?? e)}`);
      }
    }

    log(
      `Cycle complete: ${result.kloudgraphSent} from KLOUDGRAPH, ${result.discovered} discovered, ${result.written} written, ${result.queued} queued for review, ${result.published} published`,
    );
    // A cycle that reaches here completed all its phases — individual phases
    // can log a soft error (e.g. one API hiccup) without the whole cycle
    // being "stuck" or "failed". Status is "done" either way; any soft errors
    // stay visible in the log + the run's error field so nothing is hidden.
    await runs.finishProcessRun(run.id, {
      status: "done",
      error: result.errors.length
        ? `${result.errors.length} soft error(s): ${result.errors.slice(0, 3).join("; ")}`
        : undefined,
      result,
    });
    return result;
  } catch (e) {
    const error = String((e as Error)?.message ?? e);
    result.errors.push(`fatal: ${error}`);
    await runs.appendProcessLog(run.id, `Cycle crashed: ${error}`, "error").catch(() => {});
    await runs.finishProcessRun(run.id, { status: "error", error, result }).catch(() => {});
    throw e;
  }
}

/* ====================== BUILT-IN SCHEDULER ====================== */

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let lastRunResult: AutopilotRunResult | null = null;
let lastRunAt: string | null = null;

export function startAutopilot(): boolean {
  const cfg = getAutopilotConfig();
  if (!cfg.enabled) return false;
  if (schedulerTimer) return true; // already running

  console.log(
    `[autopilot] Starting scheduler (interval: ${Math.round(cfg.intervalMs / 60000)}min)`,
  );

  // Run once immediately, then on interval
  runCycleWrapped();
  schedulerTimer = setInterval(runCycleWrapped, cfg.intervalMs);
  return true;
}

export function stopAutopilot(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log("[autopilot] Stopped");
  }
}

export function isAutopilotRunning(): boolean {
  return schedulerTimer !== null;
}

export function getLastRun(): { result: AutopilotRunResult | null; at: string | null } {
  return { result: lastRunResult, at: lastRunAt };
}

async function runCycleWrapped() {
  try {
    lastRunResult = await runAutopilotCycle();
    lastRunAt = new Date().toISOString();
    console.log(
      `[autopilot] Cycle done: ${lastRunResult.published} published, ${lastRunResult.discovered} discovered`,
    );
  } catch (e) {
    console.error("[autopilot] Cycle failed:", e);
    lastRunResult = {
      discovered: 0,
      kloudgraphSent: 0,
      researched: 0,
      briefed: 0,
      written: 0,
      queued: 0,
      published: 0,
      refreshed: 0,
      blocked: 0,
      cadenceLimited: 0,
      syncedPages: 0,
      toolsDiscovered: 0,
      toolsGenerated: 0,
      toolsPublished: 0,
      toolsOptimized: 0,
      siteLinksFound: 0,
      siteLinksApplied: 0,
      errors: [String((e as Error)?.message ?? e)],
      log: ["Fatal error"],
    };
    lastRunAt = new Date().toISOString();
  }
}
