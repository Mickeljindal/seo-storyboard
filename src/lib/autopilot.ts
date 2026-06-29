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
  toolsEnabled: false,
  toolsDiscoverPerRun: 3,
  toolsGeneratePerRun: 1,
  toolsPublishStatus: "draft",
  toolsOptimizePerRun: 3,
};

export function getAutopilotConfig(): AutopilotConfig {
  loadProjectEnv();
  return {
    enabled: process.env.AUTOPILOT_ENABLED === "1",
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
  };
}

export type AutopilotRunResult = {
  discovered: number;
  researched: number;
  briefed: number;
  written: number;
  published: number;
  refreshed: number;
  blocked: number;
  cadenceLimited: number;
  syncedPages: number;
  toolsDiscovered: number;
  toolsGenerated: number;
  toolsPublished: number;
  toolsOptimized: number;
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

/** Run one full autopilot cycle. */
export async function runAutopilotCycle(): Promise<AutopilotRunResult> {
  loadProjectEnv();
  const cfg = getAutopilotConfig();
  const result: AutopilotRunResult = {
    discovered: 0,
    researched: 0,
    briefed: 0,
    written: 0,
    published: 0,
    refreshed: 0,
    blocked: 0,
    cadenceLimited: 0,
    syncedPages: 0,
    toolsDiscovered: 0,
    toolsGenerated: 0,
    toolsPublished: 0,
    toolsOptimized: 0,
    errors: [],
    log: [],
  };

  const log = (msg: string) =>
    result.log.push(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
  log(
    `Autopilot cycle started (geo=${cfg.geo}, discover=${cfg.autoDiscover}, publish=${cfg.autoPublish})`,
  );

  const repo = await import("@/server/db/repos/articles");
  const counts = await getPublishCounts();
  log(
    `Published: ${counts.today} today, ${counts.week} this week (limits: ${cfg.maxPublishPerDay}/day, ${cfg.maxPublishPerWeek}/week)`,
  );

  // 1. DISCOVER new topics
  if (cfg.autoDiscover) {
    try {
      const { runAuthorityEngine } = await import("./authority-engine");
      const r = await runAuthorityEngine({
        geo: cfg.geo,
        topicsPerCluster: Math.ceil(cfg.topicsPerRun / 10),
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

  // 3. AUTO-PUBLISH passing articles (respecting cadence)
  if (cfg.autoPublish) {
    const publishable = (await repo.listArticles({ geo: cfg.geo, limit: 500 }))
      .filter(
        (a) =>
          a.content_draft &&
          a.quality_score &&
          a.quality_score >= cfg.minPublishScore &&
          !(a.quality_report as { blocking?: boolean })?.blocking &&
          a.status !== "published" &&
          a.status !== "promoted",
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
        if (cfg.usePlugin) {
          const { hasPluginConfigured, publishViaPlugin } = await import("./wp-plugin-client");
          const { generateHeroImage } = await import("./image-generator");
          const { renderArticleHtml, buildJsonLd } = await import("./content-render");
          const { CLUSTERS } = await import("./pillars");

          if (hasPluginConfigured()) {
            const brief = (article.brief ?? {}) as Record<string, unknown>;
            const cluster = CLUSTERS.find((c) => c.id === article.cluster_id);
            const image = await generateHeroImage(article.title, article.target_keyword ?? "");
            const nowIso = new Date().toISOString();
            const publishedIso = (article.published_at as Date | null)?.toISOString?.() ?? nowIso;
            const html = renderArticleHtml(article.content_draft!, brief, {
              clusterName: cluster?.name,
              imageUrl: image.url,
              datePublished: publishedIso,
              dateModified: nowIso,
            });
            const schema = buildJsonLd(brief, {
              title: article.title,
              clusterName: cluster?.name,
              imageUrl: image.url,
              datePublished: publishedIso,
              dateModified: nowIso,
              howTo: null,
              includeService: false,
            });

            const r = await publishViaPlugin({
              title: String(brief.h1 ?? article.title),
              content: html,
              slug: article.url_slug ?? undefined,
              status: "publish",
              meta_title: article.meta_title ?? String(brief.meta_title ?? ""),
              meta_description: article.meta_description ?? String(brief.meta_description ?? ""),
              focus_keyword: article.target_keyword ?? "",
              secondary_keywords: article.secondary_keywords ?? [],
              featured_image_url: image.url,
              og_image_url: image.url,
              category: cluster?.name ?? "Managed Cloud",
              tags: (article.secondary_keywords ?? []).slice(0, 5),
              schema_jsonld: schema,
              toc: true,
              reading_time: Math.ceil((article.word_count_target ?? 2000) / 250),
              excerpt: String(brief.meta_description ?? article.meta_description ?? ""),
              existing_post_id:
                (article.performance_data as { wordpress_post_id?: number })?.wordpress_post_id ??
                null,
            });

            if (r.ok) {
              await repo.updateArticle(article.id, {
                status: "published",
                published_url: r.link,
                published_at: new Date(),
                performance_data: {
                  ...((article.performance_data as Record<string, unknown>) ?? {}),
                  wordpress_post_id: r.post_id,
                  wordpress_last_sync: new Date().toISOString(),
                  featured_image: image.url,
                },
              });
              result.published++;
              counts.today++;
              counts.week++;
              log(`Published: "${article.title}" → ${r.link}`);

              // Record learning signal
              try {
                const signals = await import("@/server/db/repos/signals");
                const { computeReward } = await import("./learning-ranker");
                await signals.recordSignal({
                  articleId: article.id,
                  keyword: article.target_keyword,
                  clusterId: article.cluster_id,
                  geo: article.geo_target,
                  qualityScore: article.quality_score,
                  event: "published",
                  reward: computeReward({
                    event: "published",
                    qualityScore: article.quality_score,
                  }),
                });
              } catch {
                /* signal recording is optional */
              }
            } else {
              result.errors.push(`plugin publish: ${r.error}`);
            }
            continue;
          }
        }

        // Fallback: basic WP publish
        const { publishArticleInternal } = await import("./wordpress.functions");
        const r = await publishArticleInternal(article.id, "publish");
        if (r.ok) {
          result.published++;
          counts.today++;
          counts.week++;
          log(`Published (basic WP): "${article.title}"`);
        } else {
          result.errors.push(`publish ${article.id}: ${r.error}`);
        }
      } catch (e) {
        result.errors.push(`publish ${article.id}: ${String((e as Error)?.message ?? e)}`);
      }
    }
    log(
      `Publishing: ${result.published} published, ${result.cadenceLimited} cadence-limited, ${result.blocked} blocked`,
    );
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
          log(`Citations: checked ${ran} engine-answers — cited ${cited}, mentioned ${mentioned}`);
      }
    } catch (e) {
      result.errors.push(`citation tracking: ${String((e as Error)?.message ?? e)}`);
    }
  }

  log(
    `Cycle complete: ${result.discovered} discovered, ${result.written} written, ${result.published} published`,
  );
  return result;
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
      researched: 0,
      briefed: 0,
      written: 0,
      published: 0,
      refreshed: 0,
      blocked: 0,
      cadenceLimited: 0,
      syncedPages: 0,
      toolsDiscovered: 0,
      toolsGenerated: 0,
      toolsPublished: 0,
      toolsOptimized: 0,
      errors: [String((e as Error)?.message ?? e)],
      log: ["Fatal error"],
    };
    lastRunAt = new Date().toISOString();
  }
}
