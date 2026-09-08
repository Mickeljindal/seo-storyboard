import "@tanstack/react-start/server-only";

/**
 * JOB QUEUE PROCESSOR
 *
 * Drains the durable `jobs` table: claims runnable jobs, runs the matching tool
 * action, and records done/error (with retry + backoff). The autopilot calls
 * drainJobs() each cycle so bulk work runs server-side and survives a closed tab.
 */

export type JobType =
  | "generate_tool"
  | "optimize_tool"
  | "publish_tool"
  | "fix_tool_html"
  /**
   * Build the per-channel distribution drafts for an article that just went live.
   * Runs as a job rather than inline so a slow or failed draft can never break a
   * successful publish, and so it inherits the queue's timeout and retry.
   */
  | "distribute_article"
  /**
   * Growth autopilot work. All of it is gathering, scoring and drafting: none of
   * these jobs can post to a community or send an email. See growth-autopilot.ts.
   */
  | "crawl_trends"
  | "crawl_reddit_threads"
  | "draft_reddit_replies"
  | "crawl_communities"
  | "prune_trends"
  /**
   * Link-building outreach. Everything here is research, drafting, scheduling and
   * reading the inbox. The ONE job that can transmit is `send_outreach`, and it
   * still runs dry unless BOTH dryRun:false and EMAIL_SEND_ENABLED=1 agree, stays
   * inside the sending window, and obeys the warmup ramp and per-domain limit.
   */
  | "mine_backlinks"
  | "crawl_link_contacts"
  | "draft_link_pitches"
  | "schedule_followups"
  | "poll_replies"
  | "send_outreach"
  /**
   * Did the link actually appear, and is it still there? The only job that measures
   * an outcome rather than an activity.
   */
  | "verify_links"
  /**
   * Keep the sending addresses honest: read any new ones out of the environment,
   * and pause any whose bounce rate says it is in trouble. Sends nothing itself.
   */
  | "tend_inboxes"
  /**
   * Marketing command steps (see marketing-command.ts). A plain-English request
   * is planned into these and fanned out here. All of them DRAFT only: articles
   * land in the review pipeline, social/video/images are drafts. Nothing here
   * publishes or transmits on its own.
   */
  | "mc_create_article"
  | "mc_generate_social"
  | "mc_generate_video"
  | "mc_hero_image"
  /**
   * ACTING steps: these can transmit publicly (post to social, send email).
   * They DRAFT/SIMULATE by default and only go live when the owner has armed
   * the matching switch (SOCIAL_AUTOPOST_ENABLED + SOCIAL_WEBHOOK_URL, or
   * EMAIL_SEND_ENABLED + a provider). See marketing-outbound.ts.
   */
  | "mc_post_social"
  | "mc_send_email";

/** True when an error is a WordPress rate-limit response (HTTP 429). */
export function isRateLimitError(msg: string): boolean {
  return /\b429\b|too many requests|rate[\s-]?limit/i.test(msg);
}

async function processJob(job: { id: string; type: string; payload: unknown }): Promise<unknown> {
  const p = (job.payload ?? {}) as {
    toolId?: string;
    status?: "draft" | "publish";
    articleId?: string;
    url?: string;
    channels?: string[];
    withEmail?: boolean;
  };

  // Growth jobs are self-contained and need no tools module, so handle them first.
  switch (job.type as JobType) {
    case "crawl_trends": {
      const { crawlTrends } = await import("./trend-radar");
      const r = await crawlTrends({ minHeat: Number(process.env.GROWTH_MIN_HEAT || 22) });
      return { ok: true, fetched: r.fetched, stored: r.stored, offTopic: r.rejectedOffTopic };
    }
    case "crawl_reddit_threads": {
      const { crawlRedditOpportunities } = await import("./reddit-listener");
      const r = await crawlRedditOpportunities({
        minRelevance: Number(process.env.GROWTH_MIN_RELEVANCE || 35),
      });
      return { ok: true, scanned: r.scanned, stored: r.stored, errors: r.errors.slice(0, 3) };
    }
    case "draft_reddit_replies": {
      const { draftPendingRedditReplies } = await import("./growth-autopilot");
      const r = await draftPendingRedditReplies();
      return { ok: true, drafted: r.drafted, skipped: r.skipped, errors: r.errors.slice(0, 3) };
    }
    case "crawl_communities": {
      const { crawlCommunities } = await import("./community-finder");
      const r = await crawlCommunities({});
      return { ok: true, evaluated: r.evaluated, stored: r.stored, errors: r.errors.slice(0, 3) };
    }
    case "prune_trends": {
      const repo = await import("@/server/db/repos/trends");
      const removed = await repo.pruneStaleTrends(14);
      return { ok: true, removed };
    }

    /* ------------------- marketing command steps ------------------------ */
    // A natural-language marketing request (marketing-command.ts) is fanned out
    // into these. All draft-only: nothing here publishes or transmits.

    case "mc_create_article": {
      const mp = (job.payload ?? {}) as {
        topic?: string;
        keyword?: string;
        geo?: string;
        runId?: string;
      };
      const { marketingCommandLog } = await import("./marketing-command");
      const topic = (mp.topic ?? "").trim();
      if (!topic) throw new Error("create_article: no topic");
      const geo = mp.geo || "global";

      const { insertArticle, getArticleById } = await import("@/server/db/repos/articles");
      const article = await insertArticle({
        title: topic,
        target_keyword: mp.keyword || topic,
        pillar: 1,
        status: "idea",
        geo_target: geo,
        priority: "high",
        engine_source: "command",
      });

      // Research (best-effort — brief/content still run without it).
      try {
        const { hasSerperCredentials } = await import("./serper-client");
        if (hasSerperCredentials()) {
          const { applyResearchToArticleInternal } = await import("./dataforseo.functions");
          await applyResearchToArticleInternal(article.id, geo);
        }
      } catch {
        /* research optional */
      }

      const { generateBriefInternal, generateContentInternal } = await import("./ai.functions");
      const rb = await generateBriefInternal(article.id);
      if (!rb.ok) throw new Error(`brief failed: ${rb.error}`);
      const rc = await generateContentInternal(article.id);
      if (!rc.ok) throw new Error(`content failed: ${rc.error}`);

      const fresh = await getArticleById(article.id);
      const score = fresh?.quality_score ?? null;
      await marketingCommandLog(
        mp.runId,
        `Article ready: "${article.title}" — quality ${score ?? "n/a"}/100. It's in the review pipeline for approval.`,
        "success",
      );
      return { ok: true, articleId: article.id, title: article.title, score };
    }

    case "mc_generate_social": {
      const mp = (job.payload ?? {}) as { topic?: string; count?: number; geo?: string; runId?: string };
      const { marketingCommandLog } = await import("./marketing-command");
      const { generateStudioContent } = await import("./studio-engine");
      const r = await generateStudioContent({
        kind: "social",
        count: Math.min(12, Math.max(1, mp.count ?? 4)),
        geo: mp.geo,
      });
      const heads = (r.posts ?? [])
        .map((post) => (post.headline ?? "").replace(/\n/g, " ").trim())
        .filter(Boolean)
        .slice(0, 3);
      await marketingCommandLog(
        mp.runId,
        `Drafted ${r.posts?.length ?? 0} social post(s) for "${mp.topic ?? ""}" (view + refine on Media Studio).${heads.length ? " e.g. " + heads.join(" · ") : ""}`,
        "success",
      );
      return { ok: true, posts: r.posts?.length ?? 0 };
    }

    case "mc_generate_video": {
      const mp = (job.payload ?? {}) as { topic?: string; count?: number; geo?: string; runId?: string };
      const { marketingCommandLog } = await import("./marketing-command");
      const { generateStudioContent } = await import("./studio-engine");
      const r = await generateStudioContent({
        kind: "video",
        count: Math.min(8, Math.max(1, mp.count ?? 3)),
        geo: mp.geo,
      });
      const titles = (r.videos ?? [])
        .map((v) => (v.title ?? "").trim())
        .filter(Boolean)
        .slice(0, 3);
      await marketingCommandLog(
        mp.runId,
        `Drafted ${r.videos?.length ?? 0} video script(s) for "${mp.topic ?? ""}" (view + refine on Media Studio).${titles.length ? " e.g. " + titles.join(" · ") : ""}`,
        "success",
      );
      return { ok: true, videos: r.videos?.length ?? 0 };
    }

    case "mc_hero_image": {
      const mp = (job.payload ?? {}) as { topic?: string; keyword?: string; runId?: string };
      const { marketingCommandLog } = await import("./marketing-command");
      const { generateHeroImage } = await import("./image-generator");
      const img = await generateHeroImage(mp.topic ?? "", mp.keyword ?? "");
      await marketingCommandLog(
        mp.runId,
        `Hero image ready for "${mp.topic ?? ""}" (source: ${img.source}).`,
        "success",
      );
      return { ok: true, url: img.url, source: img.source };
    }

    case "mc_post_social": {
      const mp = (job.payload ?? {}) as { topic?: string; channel?: string; runId?: string };
      const { marketingCommandLog } = await import("./marketing-command");
      const { composeSocialPost, postToSocial } = await import("./marketing-outbound");
      const channel = (mp.channel || "linkedin").toLowerCase();
      const text = await composeSocialPost(mp.topic ?? "", channel);
      const r = await postToSocial({ channel, text });
      if (r.dryRun) {
        await marketingCommandLog(
          mp.runId,
          `Drafted a ${channel} post for "${mp.topic ?? ""}" (DRY-RUN — auto-post is off). Preview: "${text.slice(0, 90)}${text.length > 90 ? "…" : ""}"`,
          "warn",
        );
      } else if (r.posted) {
        await marketingCommandLog(mp.runId, `Posted to ${channel} via webhook: "${text.slice(0, 80)}${text.length > 80 ? "…" : ""}"`, "success");
      } else {
        throw new Error(`post to ${channel} failed: ${r.error ?? "unknown"}`);
      }
      return { ok: true, channel, posted: r.posted, dryRun: r.dryRun };
    }

    case "mc_send_email": {
      const mp = (job.payload ?? {}) as { topic?: string; runId?: string };
      const { marketingCommandLog } = await import("./marketing-command");
      const { sendMarketingBroadcast } = await import("./marketing-outbound");
      const r = await sendMarketingBroadcast(mp.topic ?? "");
      if (r.error) {
        await marketingCommandLog(mp.runId, `Email skipped: ${r.error}`, "warn");
      } else if (r.dryRun) {
        await marketingCommandLog(
          mp.runId,
          `Composed a marketing email for "${mp.topic ?? ""}" to ${r.recipients} recipient(s) (DRY-RUN — email sending is off).`,
          "warn",
        );
      } else {
        await marketingCommandLog(
          mp.runId,
          `Sent email about "${mp.topic ?? ""}": ${r.sent} sent, ${r.failed} failed, ${r.skipped} skipped (${r.provider}).`,
          "success",
        );
      }
      return { ok: true, ...r };
    }

    /* ---------------------- link-building outreach ----------------------- */

    case "mine_backlinks": {
      const { mineBacklinks } = await import("./backlink-miner");
      const r = await mineBacklinks({});
      return {
        ok: true,
        domainsSeen: r.domainsSeen,
        stored: r.stored,
        rejected: r.rejected,
        byType: r.byType,
      };
    }
    case "crawl_link_contacts": {
      const { crawlContacts } = await import("./contact-finder");
      const r = await crawlContacts({});
      return {
        ok: true,
        attempted: r.attempted,
        withContact: r.withContact,
        guestPosts: r.acceptsGuestPosts,
        blocked: r.blocked,
        dead: r.dead,
        errors: r.errors.slice(0, 3),
      };
    }
    case "draft_link_pitches": {
      const { draftLinkPitchBatch } = await import("./link-pitch-drafter");
      const r = await draftLinkPitchBatch({});
      // Auto-approval is a separate, off-by-default decision.
      const { autoApproveLinkPitches } = await import("./outreach-sequence");
      const a = await autoApproveLinkPitches({});
      return {
        ok: true,
        drafted: r.drafted,
        skipped: r.skipped,
        lowConfidence: r.lowConfidence,
        approved: a.approved,
        heldForReview: a.held,
        errors: r.errors.slice(0, 3),
      };
    }
    case "schedule_followups": {
      const { scheduleFollowUps } = await import("./outreach-sequence");
      const r = await scheduleFollowUps({});
      return {
        ok: true,
        considered: r.considered,
        scheduled: r.scheduled,
        closed: r.stoppedInstead,
        errors: r.errors.slice(0, 3),
      };
    }
    case "poll_replies": {
      const { pollInbox } = await import("./reply-ingest");
      const r = await pollInbox({});
      return {
        ok: true,
        available: r.available,
        fetched: r.fetched,
        ingested: r.ingested,
        stopped: r.stopped,
        suppressed: r.suppressed,
        needsHuman: r.needsHuman,
        note: r.note,
        errors: r.errors.slice(0, 3),
      };
    }
    case "verify_links": {
      const { verifyLinks } = await import("./link-verifier");
      const r = await verifyLinks({});
      return {
        ok: true,
        checked: r.checked,
        found: r.found,
        newlyFound: r.newlyFound,
        lost: r.lost,
        nofollow: r.nofollow,
        blocked: r.blocked,
        errors: r.errors.slice(0, 3),
      };
    }
    case "tend_inboxes": {
      const { loadProjectEnv } = await import("./load-env");
      loadProjectEnv();
      const { syncInboxesFromEnv, pauseUnhealthyInboxes, poolStatus } = await import("./inbox-pool");
      // Sync first: an address added to the environment should be usable on the
      // same cycle rather than waiting six hours for the next one.
      const synced = await syncInboxesFromEnv();
      const paused = await pauseUnhealthyInboxes();
      const status = await poolStatus();
      return {
        ok: true,
        addresses: synced.total,
        added: synced.added,
        pausedNow: paused.paused,
        missingCredentials: synced.missingCredentials.slice(0, 5),
        stranded: status.stranded,
        readout: status.reason,
      };
    }
    case "send_outreach": {
      /**
       * The only job that can put mail on the wire, and it still cannot do so by
       * accident. dryRun defaults to true here regardless of the payload, so
       * enabling automated sending takes a deliberate environment change
       * (OUTREACH_AUTO_SEND=1) on top of EMAIL_SEND_ENABLED=1.
       */
      const autoSend = process.env.OUTREACH_AUTO_SEND === "1";
      const { runOutreachSend } = await import("./outreach-warmup");
      const r = await runOutreachSend({ dryRun: !autoSend });
      return {
        ok: true,
        dryRun: r.dryRun,
        autoSendEnabled: autoSend,
        attempted: r.attempted,
        sent: r.sent,
        failed: r.failed,
        suppressed: r.suppressed,
        capped: r.capped,
        domainThrottled: r.domainThrottled,
        budget: r.budget.reason,
        errors: r.errors.slice(0, 3),
      };
    }
    default:
      break;
  }

  // Distribution needs no tools module, so handle it before that import.
  if ((job.type as JobType) === "distribute_article") {
    if (!p.articleId) throw new Error("missing articleId");
    const { planDistribution, planEmailBroadcast } = await import("./distribution-plan");
    const r = await planDistribution(p.articleId, { channels: p.channels, url: p.url });
    if (!r.ok) throw new Error(r.error ?? "distribution failed");
    // The email draft is opt-in: an article is not always newsletter material.
    let broadcastId: string | undefined;
    if (p.withEmail !== false) {
      const b = await planEmailBroadcast(p.articleId, { url: p.url });
      broadcastId = b.broadcastId;
    }
    return { ok: true, channels: r.saved, slug: r.slug, url: r.url, broadcastId };
  }

  const tools = await import("./tools.functions");
  switch (job.type as JobType) {
    case "generate_tool": {
      if (!p.toolId) throw new Error("missing toolId");
      const r = await tools.generateToolInternal(p.toolId);
      if (!r.ok) throw new Error(r.error ?? "generate failed");
      return r;
    }
    case "optimize_tool": {
      if (!p.toolId) throw new Error("missing toolId");
      // Skip pages already optimized by this engine — no point re-optimizing
      // (and it would waste a rate-limited WordPress write). This is the
      // bulk/queue path only; the per-row "Optimize" button calls
      // optimizeToolInternal directly and can still force a re-run on demand.
      const toolsRepo = await import("@/server/db/repos/tools");
      const t = await toolsRepo.getToolById(p.toolId);
      if (t?.status === "optimized") {
        return { ok: true, skipped: true, reason: "already optimized" };
      }
      const r = await tools.optimizeToolInternal(p.toolId, false);
      if (!r.ok) throw new Error(r.error ?? "optimize failed");
      return r;
    }
    case "publish_tool": {
      if (!p.toolId) throw new Error("missing toolId");
      const r = await tools.publishToolInternal(p.toolId, p.status ?? "draft");
      if (!r.ok) throw new Error(r.error ?? "publish failed");
      return r;
    }
    case "fix_tool_html": {
      if (!p.toolId) throw new Error("missing toolId");
      const r = await tools.fixToolHtmlInternal(p.toolId, false);
      if (!r.ok) throw new Error(r.error ?? "fix failed");
      return r;
    }
    default:
      throw new Error(`unknown job type: ${job.type}`);
  }
}

/** Hard ceiling on a single job so one hung WP/AI call can't freeze the whole
 * queue. The WP client already times out at 30-60s; this is a belt-and-suspenders
 * outer bound so drainJobs (and the background runner's in-flight guard) can
 * never get stuck forever on a pathological job. */
const JOB_TIMEOUT_MS = Number(process.env.JOB_TIMEOUT_MS || 120_000);

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`job timed out after ${Math.round(ms / 1000)}s (${label})`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * How long to hold a rate-limited job before retrying. The plugin's window is
 * hourly, so retrying sooner just 429s again (harmlessly); ~20 min keeps the
 * queue moving without hammering WordPress.
 */
const RATE_LIMIT_DEFER_MS = Number(process.env.JOB_RATE_LIMIT_DEFER_MS || 20 * 60_000);

export async function drainJobs(
  max = 5,
): Promise<{ processed: number; done: number; failed: number; deferred: number }> {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const repo = await import("@/server/db/repos/jobs");
  const claimed = await repo.claimJobs(max);
  let done = 0;
  let failed = 0;
  let deferred = 0;
  for (const job of claimed) {
    try {
      // Timeout-guarded so a single stuck job fails (and can retry) instead of
      // blocking every other job behind it forever.
      const result = await withTimeout(processJob(job), JOB_TIMEOUT_MS, `${job.type}`);
      await repo.completeJob(job.id, result ?? { ok: true });
      done++;
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      if (isRateLimitError(msg)) {
        // WordPress rate-limited us. Don't burn a retry attempt — hold the job
        // and retry after the window, so a big bulk run paces itself instead of
        // erroring out en masse.
        await repo.deferJob(
          job.id,
          RATE_LIMIT_DEFER_MS,
          `WordPress rate limit hit — retrying in ~${Math.round(RATE_LIMIT_DEFER_MS / 60_000)} min.`,
        );
        deferred++;
      } else {
        await repo.failJob(job.id, msg);
        failed++;
      }
    }
    // pace live writes
    await new Promise((r) => setTimeout(r, 300));
  }
  if (done + failed > 0) {
    try {
      await repo.purgeFinishedJobs();
    } catch {
      /* housekeeping optional */
    }
  }
  return { processed: claimed.length, done, failed, deferred };
}

/**
 * Drain repeatedly until the queue is empty OR a wall-clock budget is hit —
 * lets the UI clear a large backlog (e.g. 1200+ jobs) in one action instead of
 * 10-at-a-time. Time-boxed so the HTTP request that calls it can't run forever.
 */
export async function drainUntilEmpty(
  opts: { batch?: number; maxMs?: number } = {},
): Promise<{
  processed: number;
  done: number;
  failed: number;
  deferred: number;
  timedOut: boolean;
}> {
  const batch = opts.batch ?? 8;
  const maxMs = opts.maxMs ?? 50_000;
  const started = Date.now();
  let processed = 0;
  let done = 0;
  let failed = 0;
  let deferred = 0;
  const repo = await import("@/server/db/repos/jobs");
  while (Date.now() - started < maxMs) {
    const pending = await repo.countPendingJobs().catch(() => 0);
    if (pending <= 0) return { processed, done, failed, deferred, timedOut: false };
    const r = await drainJobs(batch);
    processed += r.processed;
    done += r.done;
    failed += r.failed;
    deferred += r.deferred;
    // If a pass claimed nothing (everything left is in backoff / deferred),
    // stop looping instead of spinning.
    if (r.processed === 0) return { processed, done, failed, deferred, timedOut: false };
  }
  return { processed, done, failed, deferred, timedOut: true };
}
