import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * GO-TO-MARKET SERVER FUNCTIONS — distribution, Reddit listening, and outreach.
 *
 * Read and draft operations are open. Every operation that can reach a real human
 * (sending mail) defaults to a dry run and additionally requires
 * EMAIL_SEND_ENABLED=1 in the environment, so no dashboard click can mail anyone
 * by accident.
 */

/* ------------------------------- distribution ----------------------------- */

/** Build every channel asset for one article from its already-reviewed copy. */
export const planDistributionFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      articleId: z.string().uuid(),
      channels: z.array(z.string()).optional(),
      withEmail: z.boolean().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { planDistribution, planEmailBroadcast } = await import("./distribution-plan");
    const plan = await planDistribution(data.articleId, { channels: data.channels });
    if (!plan.ok) throw new Error(plan.error ?? "Distribution planning failed");
    let broadcast: { broadcastId?: string; subject?: string } = {};
    if (data.withEmail) {
      const b = await planEmailBroadcast(data.articleId, { url: plan.url });
      broadcast = { broadcastId: b.broadcastId, subject: b.subject };
    }
    return { ok: true, slug: plan.slug, url: plan.url, saved: plan.saved, assets: plan.assets, ...broadcast };
  });

/** The channel catalogue, so the UI can explain each destination's rules. */
export const listChannelsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { CHANNELS } = await import("./distribution-channels");
  return { ok: true, channels: CHANNELS };
});

/* --------------------------------- email ---------------------------------- */

export const listBroadcastsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional().parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/broadcasts");
    const items = await repo.listBroadcasts({ status: data?.status, limit: data?.limit ?? 50 });
    const { activeProvider, sendingEnabled, dailyCap } = await import("./email-sender");
    return {
      ok: true,
      items,
      provider: activeProvider(),
      sendingEnabled: sendingEnabled(),
      dailyCap: dailyCap(),
    };
  });

export const approveBroadcastFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/broadcasts");
    await repo.approveBroadcast(data.id);
    return { ok: true };
  });

/* ------------------------------ reddit ------------------------------------ */

export const crawlRedditFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      subreddits: z.array(z.string()).optional(),
      minRelevance: z.number().min(0).max(100).optional(),
      limitPerSub: z.number().min(1).max(100).optional(),
    }).optional().parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { crawlRedditOpportunities } = await import("./reddit-listener");
    const r = await crawlRedditOpportunities({
      subreddits: data?.subreddits,
      minRelevance: data?.minRelevance,
      limitPerSub: data?.limitPerSub,
    });
    return { ok: true, ...r };
  });

export const listRedditOpportunitiesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      status: z.string().optional(),
      subreddit: z.string().optional(),
      minRelevance: z.number().optional(),
      limit: z.number().optional(),
    }).optional().parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/reddit");
    const items = await repo.listOpportunities({
      status: data?.status,
      subreddit: data?.subreddit,
      minRelevance: data?.minRelevance,
      limit: data?.limit ?? 100,
    });
    return { ok: true, items, total: await repo.countOpportunities() };
  });

/** Draft the reply for one thread. Never posts it. */
export const draftRedditReplyFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const repo = await import("@/server/db/repos/reddit");
    const opp = await repo.getOpportunityById(data.id);
    if (!opp) throw new Error("Opportunity not found");

    const { draftRedditReply } = await import("./reddit-reply-drafter");
    const r = await draftRedditReply({
      title: opp.title,
      body: opp.post_body ?? "",
      subreddit: opp.subreddit,
      selfPromoAllowed: opp.self_promo_allowed,
      matchedArticleSlugs: opp.matched_article_slugs,
      matchedTerms: opp.matched_terms,
      intent: opp.intent,
    });
    if (!r.ok) throw new Error(r.error ?? "Draft failed");
    await repo.saveDraftReply(data.id, r.draft, r.grounded);
    return { ok: true, draft: r.draft, grounded: r.grounded, includesLink: r.includesLink };
  });

export const updateRedditOpportunityFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      action: z.enum(["approve", "skip", "posted"]),
      reason: z.string().optional(),
      postedUrl: z.string().url().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/reddit");
    if (data.action === "approve") await repo.approveOpportunity(data.id);
    if (data.action === "skip") await repo.skipOpportunity(data.id, data.reason ?? "not a fit");
    if (data.action === "posted") {
      if (!data.postedUrl) throw new Error("postedUrl is required when marking as posted");
      await repo.markOpportunityPosted(data.id, data.postedUrl);
    }
    return { ok: true };
  });

/* ------------------------------ outreach ---------------------------------- */

export const listProspectsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({ status: z.string().optional(), segment: z.string().optional(), limit: z.number().optional() }).optional().parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/outreach");
    const [items, total, suppressed, sentToday] = await Promise.all([
      repo.listProspects({ status: data?.status, segment: data?.segment, limit: data?.limit ?? 200 }),
      repo.countProspects(),
      repo.countSuppressions(),
      repo.countSentToday(),
    ]);
    const { activeProvider, sendingEnabled, dailyCap } = await import("./email-sender");
    return {
      ok: true,
      items,
      total,
      suppressed,
      sentToday,
      provider: activeProvider(),
      sendingEnabled: sendingEnabled(),
      dailyCap: dailyCap(),
    };
  });

export const upsertProspectFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      name: z.string().optional(),
      company: z.string().optional(),
      role: z.string().optional(),
      website: z.string().optional(),
      country: z.string().optional(),
      segment: z.string().optional(),
      stackSignals: z.array(z.string()).optional(),
      painHypothesis: z.string().optional(),
      personalNote: z.string().optional(),
      source: z.string().optional(),
      consentBasis: z.string().optional(),
      notes: z.string().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/outreach");
    const { scoreProspect } = await import("./outreach-engine");
    const saved = await repo.upsertProspect({ ...data });
    await repo.upsertProspect({
      email: saved.email,
      score: scoreProspect({
        id: saved.id,
        email: saved.email,
        name: saved.name,
        company: saved.company,
        segment: saved.segment,
        stackSignals: saved.stack_signals,
        painHypothesis: saved.pain_hypothesis,
        personalNote: saved.personal_note,
      }),
    });
    return { ok: true, prospect: saved };
  });

export const draftOutreachFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ segment: z.string().optional(), limit: z.number().optional(), step: z.number().optional() }).optional().parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { draftOutreachBatch } = await import("./outreach-engine");
    const r = await draftOutreachBatch({ segment: data?.segment, limit: data?.limit, step: data?.step });
    return { ok: true, ...r };
  });

export const listOutreachMessagesFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional().parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/outreach");
    const items = await repo.listMessages({ status: data?.status, limit: data?.limit ?? 100 });
    return { ok: true, items };
  });

export const approveOutreachMessageFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/outreach");
    await repo.approveMessage(data.id);
    return { ok: true };
  });

/**
 * Send the approved outreach queue. Dry run unless the caller explicitly passes
 * dryRun:false AND the environment has EMAIL_SEND_ENABLED=1.
 */
export const sendOutreachFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ dryRun: z.boolean().optional(), max: z.number().min(1).max(200).optional() }).optional().parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { sendApprovedOutreach } = await import("./outreach-engine");
    const r = await sendApprovedOutreach({ dryRun: data?.dryRun, max: data?.max });
    return { ok: true, ...r };
  });

/** Record an unsubscribe or a do-not-contact. Honoured before every send. */
export const suppressFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email().optional(),
      domain: z.string().optional(),
      reason: z.enum(["unsubscribe", "bounce", "complaint", "manual"]).optional(),
      note: z.string().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/outreach");
    await repo.addSuppression(data);
    return { ok: true };
  });

/* ------------------------------ trend radar ------------------------------- */

/**
 * Crawl the trend sources and store what falls in our lane. Read-only against
 * every source; writes nothing anywhere but our own database.
 */
export const crawlTrendsFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sources: z
        .array(z.enum(["hackernews", "reddit", "devto", "lobsters", "github"]))
        .optional(),
      minHeat: z.number().min(0).max(100).optional(),
      hoursBack: z.number().min(1).max(336).optional(),
    }).optional().parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { crawlTrends } = await import("./trend-radar");
    const r = await crawlTrends({
      sources: data?.sources,
      minHeat: data?.minHeat,
      hoursBack: data?.hoursBack,
    });
    return { ok: true, ...r };
  });

export const listTrendsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      status: z.string().optional(),
      source: z.string().optional(),
      clusterId: z.number().optional(),
      minHeat: z.number().optional(),
      freshHours: z.number().optional(),
      limit: z.number().optional(),
    }).optional().parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/trends");
    const items = await repo.listTrends({
      status: data?.status ?? "new",
      source: data?.source,
      clusterId: data?.clusterId,
      minHeat: data?.minHeat,
      freshHours: data?.freshHours ?? 72,
      limit: data?.limit ?? 50,
    });
    return { ok: true, items, total: await repo.countTrends() };
  });

/** Shortlist, skip, or mark a trend as briefed once it becomes a real article. */
export const updateTrendFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "shortlisted", "briefed", "written", "skipped"]),
      skipReason: z.string().optional(),
      articleId: z.string().uuid().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/trends");
    await repo.updateTrendStatus(data.id, data.status, {
      skipReason: data.skipReason,
      articleId: data.articleId,
    });
    return { ok: true };
  });

/* --------------------------- community venues ----------------------------- */

/**
 * Discover which communities we should be in, read their rules, and score them.
 * Read-only: never subscribes, posts, or votes.
 */
export const crawlCommunitiesFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      queries: z.array(z.string()).optional(),
      maxPerQuery: z.number().min(1).max(25).optional(),
    }).optional().parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { crawlCommunities } = await import("./community-finder");
    const r = await crawlCommunities({ queries: data?.queries, maxPerQuery: data?.maxPerQuery });
    return { ok: true, ...r };
  });

export const listVenuesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      platform: z.string().optional(),
      recommendation: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().optional(),
    }).optional().parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/venues");
    const items = await repo.listVenues({
      platform: data?.platform ?? "reddit",
      recommendation: data?.recommendation,
      status: data?.status,
      limit: data?.limit ?? 100,
    });
    return { ok: true, items, total: await repo.countVenues() };
  });

/**
 * Approve or reject a community. Approving matters beyond bookkeeping: the thread
 * listener targets whatever is marked post or participate, so this decides what
 * gets crawled from here on.
 */
export const updateVenueFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "approved", "active", "rejected"]),
      notes: z.string().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/venues");
    await repo.updateVenueStatus(data.id, data.status, data.notes);
    return { ok: true };
  });

/* ------------------- why / how / what, per venue and trend ---------------- */

/**
 * For one community: why it was chosen, how we are allowed to post there, and
 * which of our real articles we could lead with (with a ready draft).
 */
export const planVenuePostsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const repo = await import("@/server/db/repos/venues");
    const all = await repo.listVenues({ limit: 500 });
    const venue = all.find((v) => v.id === data.id);
    if (!venue) throw new Error("Community not found");

    const { planVenuePosts } = await import("./venue-post-planner");
    const plan = planVenuePosts({
      name: venue.name,
      platform: venue.platform,
      selfPromoAllowed: venue.self_promo_allowed,
      matchedTerms: venue.matched_terms,
      topicalFit: venue.topical_fit,
      subscribers: venue.subscribers,
      activeUsers: venue.active_users,
      recommendation: venue.recommendation,
      submissionNotes: venue.submission_notes,
      description: venue.description,
      rulesCount: venue.rules?.rules?.length ?? 0,
    });
    return { ok: true, plan };
  });

/** For one trend: why it surfaced, what to write, and where it then goes. */
export const planTrendActionFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/trends");
    const trend = await repo.getTrendById(data.id);
    if (!trend) throw new Error("Trend not found");

    const { planTrendAction } = await import("./venue-post-planner");
    const plan = planTrendAction({
      title: trend.title,
      source: trend.source,
      points: trend.points,
      comments: trend.comments,
      velocity: trend.velocity,
      relevance: trend.relevance,
      heat: trend.heat,
      clusterId: trend.cluster_id,
      matchedTerms: trend.matched_terms,
      coveredBySlugs: trend.covered_by_slugs,
      angle: trend.angle,
    });
    return { ok: true, plan };
  });

/* --------------------------- growth automation ---------------------------- */

/**
 * Run every growth task now, ignoring the cadence. Backs the "Run everything now"
 * button. Queues jobs rather than doing the work inline, so the click returns
 * immediately and a slow Reddit call cannot time out the request.
 */
export const runGrowthNowFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { runGrowthCycle } = await import("./growth-autopilot");
    const r = await runGrowthCycle({ force: true });
    // Nudge the drainer so the work starts now instead of on the next tick.
    const { ensureJobRunner } = await import("./job-runner");
    ensureJobRunner();
    return { ok: true, queued: r.queued };
  });

/** What the automation has done, and what it holds right now. */
export const growthStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { growthStatus } = await import("./growth-autopilot");
  const status = await growthStatus();
  // Count pending AND running. Counting only pending reports "Up to date" the
  // moment a batch is claimed, which looks like the button did nothing.
  let pendingJobs = 0;
  let running: string[] = [];
  try {
    const jobs = await import("@/server/db/repos/jobs");
    pendingJobs = await jobs.countActiveJobs();
    // Name the task in progress, so a slow crawl looks like progress, not a hang.
    const { getDb } = await import("@/server/db/client");
    const db = await getDb();
    const res: any = await db.execute(
      `select label, type from jobs
        where status in ('pending','running')
          and type in ('crawl_trends','crawl_reddit_threads','draft_reddit_replies',
                       'crawl_communities','prune_trends','distribute_article')
        order by created_at asc limit 6`,
    );
    running = (res.rows ?? res).map((r: any) => String(r.label ?? r.type));
  } catch {
    /* queue depth is nice to have */
  }
  return { ok: true, ...status, pendingJobs, running };
});

/* -------------------------- link building (v25) --------------------------- */

/**
 * The whole link pipeline in one call: counts, what is ready, replies waiting for
 * a person, and the current sending budget with its reason.
 *
 * One round trip rather than five, because this drives a dashboard that polls.
 */
export const linkPipelineFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();

  const linkRepo = await import("@/server/db/repos/link-prospects");
  const replies = await import("@/server/db/repos/replies");
  const outreach = await import("@/server/db/repos/outreach");
  const { sendBudget } = await import("./outreach-warmup");
  const { imapConfigured } = await import("./reply-ingest");
  const { activeProvider, sendingEnabled } = await import("./email-sender");
  const { maxTouches, followUpDays } = await import("./outreach-sequence");

  const [summary, replySum, budget] = await Promise.all([
    linkRepo.linkPipelineSummary(),
    replies.replySummary(),
    sendBudget(),
  ]);

  const drafts = await outreach.listMessages({ status: "draft", limit: 500 });
  const approved = await outreach.listMessages({ status: "approved", limit: 500 });

  return {
    ok: true,
    summary,
    replies: replySum,
    budget,
    drafts: drafts.filter((d) => d.campaign === "link_building").length,
    approved: approved.filter((d) => d.campaign === "link_building").length,
    // Everything an operator needs to understand why nothing is going out.
    config: {
      provider: activeProvider(),
      sendingEnabled: sendingEnabled(),
      autoSend: process.env.OUTREACH_AUTO_SEND === "1",
      autoApprove: process.env.OUTREACH_AUTO_APPROVE === "1",
      imapConfigured: imapConfigured(),
      maxTouches: maxTouches(),
      followUpDays: followUpDays(),
      unsubscribeSecretSet: !!process.env.UNSUBSCRIBE_SECRET?.trim(),
    },
  };
});

/** The opportunity list, filtered. */
export const listLinkProspectsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        status: z.string().optional(),
        statuses: z.array(z.string()).optional(),
        opportunityType: z.string().optional(),
        minValue: z.number().optional(),
        hasContact: z.boolean().optional(),
        limit: z.number().optional(),
      })
      .optional().parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/link-prospects");
    const items = await repo.listLinkProspects({
      status: data?.status,
      // Default to the statuses a human can still act on. Without this the list is
      // dominated by the thousands of rejected rows, which are kept for
      // explainability rather than for reading.
      statuses: data?.statuses ?? (data?.status ? undefined : ["ready", "queued", "contacted", "replied", "won"]),
      opportunityType: data?.opportunityType,
      minValue: data?.minValue,
      hasContact: data?.hasContact,
      limit: data?.limit ?? 40,
    });
    return { ok: true, items };
  });

/**
 * The drafted pitch for one opportunity, so it can be read before approval.
 * Returns the plain-text body: that is what a human should judge, not the HTML.
 */
export const getLinkPitchFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ linkProspectId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const linkRepo = await import("@/server/db/repos/link-prospects");
    const outreach = await import("@/server/db/repos/outreach");
    const lp = await linkRepo.getLinkProspectById(data.linkProspectId);
    if (!lp) return { ok: false as const, error: "not found" };
    const messages = lp.prospect_id
      ? await outreach.listMessages({ prospectId: lp.prospect_id, limit: 5 })
      : [];
    return {
      ok: true as const,
      prospect: lp,
      messages: messages.map((m) => ({
        id: m.id,
        step: m.step,
        subject: m.subject,
        body: m.body_text,
        status: m.status,
        send_after: m.send_after,
        sent_at: m.sent_at,
        error: m.error,
      })),
    };
  });

/** Replies that a person needs to read. Never auto-answered. */
export const listRepliesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({ needsHuman: z.boolean().optional(), limit: z.number().optional() }).optional().parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/replies");
    const items = await repo.listReplies({
      needsHuman: data?.needsHuman ?? true,
      limit: data?.limit ?? 40,
    });
    return { ok: true, items };
  });

export const markReplyHandledFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/replies");
    await repo.markReplyHandled(data.id);
    return { ok: true };
  });

/** Drop one opportunity out of the pipeline by hand. */
export const rejectLinkProspectFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), note: z.string().optional() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/link-prospects");
    await repo.updateLinkProspectStatus(data.id, "rejected", {
      notes: data.note ?? "rejected by hand",
    });
    return { ok: true };
  });

/**
 * Run the link-building pipeline now, ignoring the cadence.
 *
 * Queues jobs rather than working inline, so the click returns immediately and a
 * twelve-minute contact crawl cannot time out the request. Sending is NOT included:
 * that stays on its own schedule behind its own switch.
 */
export const runLinkPipelineNowFn = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        only: z
          .enum([
            "mine_backlinks",
            "crawl_link_contacts",
            "draft_link_pitches",
            "schedule_followups",
            "poll_replies",
          ])
          .optional(),
      })
      .optional().parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const jobs = await import("@/server/db/repos/jobs");

    const all = [
      { type: "mine_backlinks", label: "Links: read the competitor backlink exports" },
      { type: "crawl_link_contacts", label: "Links: find who to write to" },
      { type: "draft_link_pitches", label: "Links: write the pitches" },
      { type: "schedule_followups", label: "Links: schedule the one follow-up" },
      { type: "poll_replies", label: "Links: read replies and bounces" },
    ];
    const wanted = data?.only ? all.filter((j) => j.type === data.only) : all;

    // Never stack a duplicate of a crawl that is already running.
    const inFlight = await jobs.jobTypesInFlight(wanted.map((j) => j.type));
    const toRun = wanted.filter((j) => !inFlight.has(j.type));
    if (toRun.length) {
      await jobs.enqueueJobs(toRun.map((j) => ({ type: j.type, payload: {}, label: j.label })));
      const { ensureJobRunner } = await import("./job-runner");
      ensureJobRunner();
    }
    return { ok: true, queued: toRun.map((j) => j.type), alreadyRunning: [...inFlight] };
  });

/**
 * Preview the send without sending. Always a dry run: this exists so somebody can
 * check what would go out before turning automated sending on, and the limits are
 * simulated so the numbers match reality.
 */
export const previewOutreachSendFn = createServerFn({ method: "POST" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { runOutreachSend } = await import("./outreach-warmup");
  const r = await runOutreachSend({ dryRun: true, campaign: "link_building" });
  return {
    ok: true,
    wouldSend: r.sent,
    wouldThrottle: r.domainThrottled,
    wouldCap: r.capped,
    suppressed: r.suppressed,
    budget: r.budget,
    errors: r.errors,
  };
});

/* ------------------- link workspace: interactive writes (v26) ------------------- */

/**
 * Everything below is a WRITE a person triggers from the workspace, and every one
 * records an activity row. That audit trail is what makes the destructive-looking
 * actions safe to offer: approving forty pitches in one click is only defensible if
 * it can be read back afterwards, one row per prospect, with who did it and when.
 */

/** The whole workspace in one call: metrics, verification, config, campaigns. */
export const linkWorkspaceFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ campaign: z.string().optional() }).optional().parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();

    const { linkMetrics, campaignNames } = await import("./link-metrics");
    const checks = await import("@/server/db/repos/link-checks");
    const linkRepo = await import("@/server/db/repos/link-prospects");
    const replies = await import("@/server/db/repos/replies");
    const outreach = await import("@/server/db/repos/outreach");
    const { sendBudget } = await import("./outreach-warmup");
    const { imapConfigured } = await import("./reply-ingest");
    const { activeProvider, sendingEnabled } = await import("./email-sender");
    const { maxTouches, followUpDays } = await import("./outreach-sequence");

    const [metrics, verification, summary, replySum, budget, campaigns, activity] =
      await Promise.all([
        linkMetrics({ campaign: data?.campaign }),
        checks.verificationSummary(),
        linkRepo.linkPipelineSummary(),
        replies.replySummary(),
        sendBudget(),
        campaignNames(),
        checks.listRecentActivity(25),
      ]);

    const drafts = await outreach.listMessages({ status: "draft", limit: 500 });
    const approved = await outreach.listMessages({ status: "approved", limit: 500 });

    return {
      ok: true,
      metrics,
      verification,
      summary,
      replies: replySum,
      budget,
      campaigns,
      activity,
      drafts: drafts.filter((d) => d.campaign === "link_building").length,
      approved: approved.filter((d) => d.campaign === "link_building").length,
      config: {
        provider: activeProvider(),
        sendingEnabled: sendingEnabled(),
        autoSend: process.env.OUTREACH_AUTO_SEND === "1",
        autoApprove: process.env.OUTREACH_AUTO_APPROVE === "1",
        imapConfigured: imapConfigured(),
        maxTouches: maxTouches(),
        followUpDays: followUpDays(),
        unsubscribeSecretSet: !!process.env.UNSUBSCRIBE_SECRET?.trim(),
      },
    };
  });

/** One prospect in full: pitch, thread, link checks, activity. */
export const linkProspectDetailFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const linkRepo = await import("@/server/db/repos/link-prospects");
    const outreach = await import("@/server/db/repos/outreach");
    const checks = await import("@/server/db/repos/link-checks");
    const repliesRepo = await import("@/server/db/repos/replies");

    const lp = await linkRepo.getLinkProspectById(data.id);
    if (!lp) return { ok: false as const, error: "not found" };

    const messages = lp.prospect_id
      ? await outreach.listMessages({ prospectId: lp.prospect_id, limit: 10 })
      : [];
    const prospect = lp.prospect_id ? await outreach.getProspectById(lp.prospect_id) : null;
    const inbound = lp.prospect_id
      ? (await repliesRepo.listReplies({ limit: 200 })).filter((r) => r.prospect_id === lp.prospect_id)
      : [];

    /**
     * The conversation, ours and theirs interleaved in time order. A thread read out
     * of order is worse than no thread: the whole point is seeing what we said and
     * what came back.
     */
    const thread = [
      ...messages
        .filter((m) => m.status === "sent" || m.status === "approved" || m.status === "draft")
        .map((m) => ({
          kind: "ours" as const,
          id: m.id,
          step: m.step,
          subject: m.subject,
          body: m.body_text,
          status: m.status,
          editedByHuman: (m as { edited_by_human?: boolean }).edited_by_human ?? false,
          at: m.sent_at ?? m.send_after ?? m.created_at,
        })),
      ...inbound.map((r) => ({
        kind: "theirs" as const,
        id: r.id,
        step: 0,
        subject: r.subject ?? "(no subject)",
        body: r.snippet ?? "",
        status: r.classification,
        editedByHuman: false,
        at: r.received_at,
      })),
    ].sort((a, b) => new Date(a.at || 0).getTime() - new Date(b.at || 0).getTime());

    return {
      ok: true as const,
      prospect: lp,
      contact: prospect,
      messages,
      thread,
      checks: await checks.listChecksFor(data.id, 10),
      activity: await checks.listActivityFor(data.id, 25),
    };
  });

/**
 * Save an edited pitch.
 *
 * Marks the message as human-edited, which stops any later automatic re-draft from
 * silently overwriting the wording. That flag is the whole reason this is not just
 * an update.
 */
export const saveLinkPitchFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messageId: z.string().uuid(),
      subject: z.string().min(3).max(300),
      body: z.string().min(20).max(20000),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { getDb, schema } = await import("@/server/db/client");
    const { eq } = await import("drizzle-orm");
    const checks = await import("@/server/db/repos/link-checks");
    const db = await getDb();

    const [existing] = await db
      .select()
      .from(schema.outreachMessages)
      .where(eq(schema.outreachMessages.id, data.messageId))
      .limit(1);
    if (!existing) return { ok: false as const, error: "message not found" };
    if (existing.status === "sent") {
      // Editing history is not editing: the recipient already has the old version.
      return { ok: false as const, error: "this was already sent, so it cannot be edited" };
    }

    // The send path refuses a body with no unsubscribe line, so catch it here where
    // a person can still do something about it rather than at send time.
    if (!/unsubscribe/i.test(data.body)) {
      return {
        ok: false as const,
        error:
          "the body must keep its unsubscribe line, otherwise the sender will refuse it",
      };
    }

    await db
      .update(schema.outreachMessages)
      .set({
        subject: data.subject,
        bodyText: data.body,
        // The HTML version is dropped so the two can never disagree. Plain text is
        // what a person edited and what they judged, so plain text is what goes.
        bodyHtml: null,
        editedByHuman: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.outreachMessages.id, data.messageId));

    await checks.logActivity({
      linkProspectId: existing.linkProspectId ?? null,
      prospectId: existing.prospectId,
      messageId: data.messageId,
      action: "edited",
      detail: `subject: ${data.subject.slice(0, 80)}`,
    });
    return { ok: true as const };
  });

/**
 * Fix a contact address by hand.
 *
 * Worth having because the crawler's misses are often near-misses: the right company
 * but the wrong mailbox. Re-checks the do-not-pitch list so a correction cannot
 * reintroduce support@ or accounts@, and re-checks suppression so it cannot
 * reintroduce somebody who opted out.
 */
export const updateLinkContactFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      name: z.string().max(120).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const linkRepo = await import("@/server/db/repos/link-prospects");
    const outreach = await import("@/server/db/repos/outreach");
    const checks = await import("@/server/db/repos/link-checks");
    const { isUnpitchableAddress } = await import("./contact-finder");

    if (isUnpitchableAddress(data.email)) {
      return {
        ok: false as const,
        error: "that looks like a support, sales or billing mailbox, which we do not pitch",
      };
    }
    if (await outreach.isSuppressed(data.email)) {
      return { ok: false as const, error: "that address has asked not to be contacted" };
    }

    const lp = await linkRepo.getLinkProspectById(data.id);
    if (!lp) return { ok: false as const, error: "not found" };

    await linkRepo.saveVetting(data.id, {
      contactEmail: data.email.trim().toLowerCase(),
      contactName: data.name?.trim() || null,
      contactSource: "manual",
      // A human typing an address is the strongest signal available, which is why
      // this clears the confidence gate that held the automatic guess back.
      contactConfidence: 1,
      status: lp.status === "needs_contact" ? "ready" : lp.status,
    });
    await checks.logActivity({
      linkProspectId: data.id,
      action: "contact_changed",
      detail: `${lp.contact_email ?? "(none)"} -> ${data.email}`,
    });
    return { ok: true as const };
  });

/** Approve, skip or reopen one prospect's pitch. */
export const setLinkPitchStateFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messageId: z.string().uuid(),
      state: z.enum(["approved", "skipped", "draft"]),
      reason: z.string().max(300).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { getDb, schema } = await import("@/server/db/client");
    const { eq } = await import("drizzle-orm");
    const checks = await import("@/server/db/repos/link-checks");
    const db = await getDb();

    const [m] = await db
      .select()
      .from(schema.outreachMessages)
      .where(eq(schema.outreachMessages.id, data.messageId))
      .limit(1);
    if (!m) return { ok: false as const, error: "message not found" };
    if (m.status === "sent") return { ok: false as const, error: "already sent" };

    await db
      .update(schema.outreachMessages)
      .set({
        status: data.state,
        approvedAt: data.state === "approved" ? new Date() : null,
        error: data.state === "skipped" ? (data.reason ?? "skipped by hand") : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.outreachMessages.id, data.messageId));

    await checks.logActivity({
      linkProspectId: m.linkProspectId ?? null,
      prospectId: m.prospectId,
      messageId: m.id,
      action: data.state === "approved" ? "approved" : data.state === "skipped" ? "skipped" : "reopened",
      detail: data.reason ?? null,
    });
    return { ok: true as const };
  });

/**
 * Bulk approve or skip a selection.
 *
 * Capped at 100 per call. Not an arbitrary number: a bulk action over a whole
 * unreviewed pipeline is how somebody accidentally approves two thousand emails,
 * and a cap forces that to be a deliberate, repeated act rather than one click.
 * Each row is logged individually so the batch stays reviewable afterwards.
 */
export const bulkLinkPitchStateFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messageIds: z.array(z.string().uuid()).min(1).max(100),
      state: z.enum(["approved", "skipped"]),
      reason: z.string().max(300).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { getDb, schema } = await import("@/server/db/client");
    const { eq } = await import("drizzle-orm");
    const checks = await import("@/server/db/repos/link-checks");
    const outreach = await import("@/server/db/repos/outreach");
    const { isUnpitchableAddress } = await import("./contact-finder");
    const db = await getDb();

    let changed = 0;
    const held: { id: string; why: string }[] = [];

    for (const id of data.messageIds) {
      const [m] = await db
        .select()
        .from(schema.outreachMessages)
        .where(eq(schema.outreachMessages.id, id))
        .limit(1);
      if (!m) {
        held.push({ id, why: "not found" });
        continue;
      }
      if (m.status === "sent") {
        held.push({ id, why: "already sent" });
        continue;
      }

      // Approving in bulk still applies the same checks as approving one at a time.
      // A bulk action that skips the safety checks is not a shortcut, it is a bug.
      if (data.state === "approved") {
        const prospect = await outreach.getProspectById(m.prospectId);
        if (!prospect) {
          held.push({ id, why: "contact missing" });
          continue;
        }
        if (prospect.sequence_stopped_reason) {
          held.push({ id, why: "they already replied or opted out" });
          continue;
        }
        if (isUnpitchableAddress(prospect.email) || (await outreach.isSuppressed(prospect.email))) {
          held.push({ id, why: "address is suppressed or not pitchable" });
          continue;
        }
        if (!prospect.personal_note?.trim()) {
          held.push({ id, why: "no specific page of theirs to reference" });
          continue;
        }
      }

      await db
        .update(schema.outreachMessages)
        .set({
          status: data.state,
          approvedAt: data.state === "approved" ? new Date() : null,
          error: data.state === "skipped" ? (data.reason ?? "skipped in bulk") : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.outreachMessages.id, id));

      await checks.logActivity({
        linkProspectId: m.linkProspectId ?? null,
        prospectId: m.prospectId,
        messageId: id,
        action: data.state === "approved" ? "bulk_approved" : "skipped",
        detail: data.reason ?? `bulk ${data.state}`,
      });
      changed++;
    }
    return { ok: true as const, changed, held };
  });

/**
 * Send one approved message now, bypassing the schedule but not the safety rails.
 *
 * Still a dry run unless EMAIL_SEND_ENABLED=1, still checks suppression immediately
 * before transmitting, still counts against the daily cap and the warmup ramp. The
 * only thing skipped is waiting for the send window, because a person asking for
 * this has decided the timing themselves.
 */
export const sendOneLinkPitchFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ messageId: z.string().uuid(), forReal: z.boolean().optional() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { getDb, schema } = await import("@/server/db/client");
    const { eq } = await import("drizzle-orm");
    const outreach = await import("@/server/db/repos/outreach");
    const checks = await import("@/server/db/repos/link-checks");
    const { sendOneEmail } = await import("./email-sender");
    const db = await getDb();

    const [m] = await db
      .select()
      .from(schema.outreachMessages)
      .where(eq(schema.outreachMessages.id, data.messageId))
      .limit(1);
    if (!m) return { ok: false as const, error: "message not found" };
    if (m.status === "sent") return { ok: false as const, error: "already sent" };

    const prospect = await outreach.getProspectById(m.prospectId);
    if (!prospect) return { ok: false as const, error: "contact missing" };
    if (prospect.sequence_stopped_reason) {
      return { ok: false as const, error: `stopped: ${prospect.sequence_stopped_reason}` };
    }

    const { sendBudget } = await import("./outreach-warmup");
    const budget = await sendBudget();
    const dryRun = data.forReal !== true;
    // The window is skipped for a manual send, but the volume limits are not: those
    // protect the sending domain and a person cannot see that risk from one click.
    if (!dryRun && budget.sentToday >= Math.min(budget.configuredCap, budget.warmupCap)) {
      return { ok: false as const, error: `today's sending limit is used up. ${budget.reason}` };
    }

    const result = await sendOneEmail({
      to: prospect.email,
      subject: m.subject,
      html: m.bodyHtml ?? m.bodyText,
      text: m.bodyText,
      dryRun,
      sentSoFarToday: budget.sentToday,
    });

    if (result.skipped === "suppressed") {
      await outreach.updateProspectStatus(prospect.id, "suppressed");
      return { ok: false as const, error: "that address has asked not to be contacted" };
    }
    if (!result.ok) return { ok: false as const, error: result.error ?? "send failed" };

    // A dry run leaves the queue exactly as it found it, same rule as everywhere.
    if (!result.dryRun) {
      await outreach.recordMessageSend(m.id, {
        ok: true,
        provider: result.provider,
        messageId: result.messageId,
        dryRun: false,
      });
      await outreach.updateProspectStatus(prospect.id, "contacted", { lastContactedAt: new Date() });
      await outreach.recordTouch(prospect.id);
      if (m.linkProspectId) {
        const linkRepo = await import("@/server/db/repos/link-prospects");
        await linkRepo.updateLinkProspectStatus(m.linkProspectId, "contacted");
      }
      await checks.logActivity({
        linkProspectId: m.linkProspectId ?? null,
        prospectId: prospect.id,
        messageId: m.id,
        action: "sent",
        detail: `sent by hand to ${prospect.email}`,
      });
    }

    return {
      ok: true as const,
      dryRun: result.dryRun,
      provider: result.provider,
      to: prospect.email,
    };
  });

/** Add a note. The cheapest way to keep context a score cannot hold. */
export const addLinkNoteFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), note: z.string().min(1).max(2000) }).parse)
  .handler(async ({ data }) => {
    const linkRepo = await import("@/server/db/repos/link-prospects");
    const checks = await import("@/server/db/repos/link-checks");
    const lp = await linkRepo.getLinkProspectById(data.id);
    if (!lp) return { ok: false as const, error: "not found" };
    await linkRepo.updateLinkProspectStatus(data.id, lp.status, { notes: data.note });
    await checks.logActivity({ linkProspectId: data.id, action: "note", detail: data.note.slice(0, 300) });
    return { ok: true as const };
  });

/** Move a prospect's stage by hand, for the cases the automation cannot see. */
export const setLinkStageFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["needs_contact", "ready", "queued", "contacted", "replied", "won", "lost", "rejected"]),
      wonUrl: z.string().url().optional(),
      note: z.string().max(500).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const linkRepo = await import("@/server/db/repos/link-prospects");
    const checks = await import("@/server/db/repos/link-checks");
    const lp = await linkRepo.getLinkProspectById(data.id);
    if (!lp) return { ok: false as const, error: "not found" };

    await linkRepo.updateLinkProspectStatus(data.id, data.status, {
      wonUrl: data.wonUrl ?? null,
      notes: data.note ?? null,
    });
    await checks.logActivity({
      linkProspectId: data.id,
      action: "stage_changed",
      detail: `${lp.status} -> ${data.status}${data.wonUrl ? ` (${data.wonUrl})` : ""}`,
    });
    return { ok: true as const };
  });

/** Give a prospect a campaign label, so several pushes can be measured apart. */
export const setLinkCampaignFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200), campaign: z.string().max(60) }).parse,
  )
  .handler(async ({ data }) => {
    const { getDb, schema } = await import("@/server/db/client");
    const { inArray } = await import("drizzle-orm");
    const db = await getDb();
    const name = data.campaign.trim() || null;
    await db
      .update(schema.linkProspects)
      .set({ campaignName: name, updatedAt: new Date() })
      .where(inArray(schema.linkProspects.id, data.ids));
    return { ok: true as const, changed: data.ids.length, campaign: name };
  });

/** Check one prospect's page for the link right now. */
export const verifyOneLinkFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { verifyLinks } = await import("./link-verifier");
    const r = await verifyLinks({ onlyId: data.id, limit: 1 });
    const linkRepo = await import("@/server/db/repos/link-prospects");
    const lp = await linkRepo.getLinkProspectById(data.id);
    return {
      ok: true,
      found: r.found > 0,
      newlyFound: r.newlyFound > 0,
      lost: r.lost > 0,
      nofollow: r.nofollow > 0,
      status: lp?.status ?? null,
      anchor: lp?.link_anchor ?? null,
      errors: r.errors,
    };
  });

/** Run a link check across the pipeline now, in the background. */
export const runLinkVerificationNowFn = createServerFn({ method: "POST" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const jobs = await import("@/server/db/repos/jobs");
  const inFlight = await jobs.jobTypesInFlight(["verify_links"]);
  if (inFlight.has("verify_links")) return { ok: true, queued: false, alreadyRunning: true };
  await jobs.enqueueJobs([
    { type: "verify_links", payload: {}, label: "Links: check whether the link appeared" },
  ]);
  const { ensureJobRunner } = await import("./job-runner");
  ensureJobRunner();
  return { ok: true, queued: true, alreadyRunning: false };
});

/* ========================================================================== *
 * v27 — PROSPECTING RECIPES
 * ========================================================================== */

/**
 * The recipe catalogue, plus everything the panel needs to be honest about what
 * will and will not work right now.
 *
 * `searchReady` matters more than it looks. Three of the five recipes need a search
 * account, and when that account has no credits the recipe fails in a way that is
 * easy to mistake for "no results". Telling the person up front, before they type
 * anything, is the difference between a two-second answer and half an hour spent
 * rewriting perfectly good search terms.
 */
export const listRecipesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { RECIPES, availableRivals, recentRuns } = await import("./prospect-recipes");
  const { hasSerperCredentials } = await import("./serper-client");

  const runs = await recentRuns(12);

  /**
   * A key being present is NOT the same as the account having credits, and the
   * difference is not academic: this project's search key is valid and the balance
   * is zero, so a "ready" badge would be a lie that costs somebody an afternoon.
   *
   * There is no way to check a balance without spending a query, so instead of
   * guessing, the panel LEARNS. The newest failed search-recipe run is reported, and
   * that is honest in both directions: it explains a failure that already happened
   * without claiming to know the current balance. Deliberately a warning rather than
   * a block, because the obvious response to reading it is to top the account up,
   * and the next click has to be allowed to work.
   */
  const SEARCH_RECIPES = new Set(RECIPES.filter((r) => r.needsSearch).map((r) => r.name as string));
  const lastSearchFailure =
    runs.find((r) => SEARCH_RECIPES.has(r.recipe) && r.status === "failed" && r.error) ?? null;

  return {
    ok: true,
    recipes: RECIPES,
    rivals: availableRivals(),
    /** A key exists. Says nothing about whether it can pay for a search. */
    searchReady: hasSerperCredentials(),
    searchLastError: lastSearchFailure
      ? { message: lastSearchFailure.error ?? "", at: lastSearchFailure.created_at, readout: lastSearchFailure.readout ?? "" }
      : null,
    maxQueries: Math.max(1, Math.min(Number(process.env.RECIPE_MAX_QUERIES || 12), 30)),
    runs,
  };
});

/**
 * Run one recipe now.
 *
 * Runs SYNCHRONOUSLY rather than through the job queue, deliberately. A recipe is
 * something a person just typed into a box and is waiting on, so the result belongs
 * in the response. The per-run caps keep it to seconds, and the queue's own
 * two-minute timeout would be the real risk if it were pushed through there and the
 * person then had to poll for an answer.
 */
export const runRecipeFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      recipe: z.enum(["skyscraper", "product_review", "guest_post", "podcast", "resource_page"]),
      input: z.string().min(1).max(2000),
      limit: z.number().min(1).max(200).optional(),
      withinMonths: z.number().min(1).max(120).optional(),
      campaign: z.string().max(60).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { runRecipe } = await import("./prospect-recipes");
    const r = await runRecipe(data.recipe, {
      input: data.input,
      limit: data.limit,
      withinMonths: data.withinMonths,
      campaign: data.campaign?.trim() || null,
    });

    // Anything the recipe stored is now sitting at 'needs_contact'. Nudging the
    // contact crawl means the person sees progress on the same visit rather than
    // waiting up to twelve hours for the next scheduled sweep.
    if (r.stored > 0) {
      try {
        const jobs = await import("@/server/db/repos/jobs");
        const inFlight = await jobs.jobTypesInFlight(["crawl_link_contacts"]);
        if (!inFlight.has("crawl_link_contacts")) {
          await jobs.enqueueJobs([
            { type: "crawl_link_contacts", payload: {}, label: "Links: find who to write to" },
          ]);
          const { ensureJobRunner } = await import("./job-runner");
          ensureJobRunner();
        }
      } catch {
        /* the recipe already succeeded; a queue hiccup must not undo that */
      }
    }
    return r;
  });

/* ========================================================================== *
 * v27 — SENDING ADDRESSES
 * ========================================================================== */

/** Every address, what it may send today, and why. */
export const inboxPoolFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { poolStatus } = await import("./inbox-pool");
  const { activeProvider, sendingEnabled } = await import("./email-sender");
  const status = await poolStatus();
  return {
    ok: true,
    ...status,
    provider: activeProvider(),
    sendingEnabled: sendingEnabled(),
    perInboxDefaultCap: Number(process.env.OUTREACH_INBOX_DAILY_CAP ?? 15),
    maxBounceRate: Number(process.env.OUTREACH_MAX_BOUNCE_RATE ?? 5),
  };
});

/** Read any new addresses out of the environment, and pause anything unhealthy. */
export const syncInboxesFn = createServerFn({ method: "POST" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { syncInboxesFromEnv, pauseUnhealthyInboxes } = await import("./inbox-pool");
  const synced = await syncInboxesFromEnv();
  const paused = await pauseUnhealthyInboxes();
  return { ok: true, ...synced, pausedNow: paused.paused };
});

/**
 * Add one address by hand.
 *
 * Restricted to the shared-provider case on purpose. An address that needs its own
 * SMTP host and password has to be defined in the environment, because accepting a
 * password through a form would mean storing it, and the whole point of the
 * credential-reference design is that this system never holds one.
 */
export const addInboxFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      fromEmail: z.string().email(),
      fromName: z.string().max(80).optional(),
      replyTo: z.string().email().optional(),
      dailyCap: z.number().min(1).max(200).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const repo = await import("@/server/db/repos/inboxes");
    const existing = await repo.getInboxByEmail(data.fromEmail);
    const inbox = await repo.upsertInbox({
      label: data.fromName ? `${data.fromName} <${data.fromEmail}>` : data.fromEmail,
      fromEmail: data.fromEmail,
      fromName: data.fromName ?? null,
      replyTo: data.replyTo ?? null,
      provider: "default",
      credentialRef: null,
      dailyCap: data.dailyCap ?? Number(process.env.OUTREACH_INBOX_DAILY_CAP ?? 15),
      notes: "added by hand",
    });
    return { ok: true as const, inbox, wasExisting: !!existing };
  });

export const setInboxStatusFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["active", "paused"]),
      reason: z.string().max(300).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/inboxes");
    await repo.setInboxStatus(data.id, data.status, data.reason ?? null);
    return { ok: true as const };
  });

export const updateInboxFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      dailyCap: z.number().min(1).max(200).optional(),
      fromName: z.string().max(80).optional(),
      replyTo: z.string().email().optional(),
      notes: z.string().max(300).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/inboxes");
    const { id, ...patch } = data;
    await repo.updateInbox(id, patch);
    return { ok: true as const };
  });

/**
 * Move every conversation off one address onto another.
 *
 * The escape hatch for the one downside of thread affinity: when an address is
 * paused for good, its conversations would otherwise wait forever. Moving them is a
 * deliberate act with a visible cost (those follow-ups will arrive from a new
 * address), which is exactly why it is a button somebody presses rather than
 * something the sender decides on its own.
 */
export const reassignInboxFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ fromId: z.string().uuid(), toId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    if (data.fromId === data.toId) return { ok: false as const, error: "those are the same address" };
    const repo = await import("@/server/db/repos/inboxes");
    const to = await repo.getInboxById(data.toId);
    if (!to) return { ok: false as const, error: "that address does not exist" };
    if (to.status !== "active") {
      return { ok: false as const, error: `${to.from_email} is paused, so moving them there changes nothing` };
    }
    const moved = await repo.reassignConversations(data.fromId, data.toId);
    return { ok: true as const, moved, to: to.from_email };
  });
