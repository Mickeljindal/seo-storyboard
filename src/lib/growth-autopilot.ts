import "@tanstack/react-start/server-only";

/**
 * GROWTH AUTOPILOT — keeps the Growth page full without anyone pressing a button.
 *
 * Before this, four buttons had to be pressed by hand: find trends, find threads,
 * write replies, discover communities. So the page was only ever as fresh as the
 * last time someone remembered. This runs the same work on a cadence inside the
 * existing job queue, so opening the page shows current topics and replies that
 * are already written.
 *
 * WHAT IT AUTOMATES: gathering, scoring, and drafting.
 * WHAT IT NEVER AUTOMATES: posting and emailing.
 *
 * That line is deliberate and it is not timidity. A wrong article can be edited
 * and a wrong email cannot be recalled; a bot comment gets an account banned and
 * the domain blacklisted across communities. The expensive part of this work is
 * finding the thread and writing the answer, and both are now automatic. Pasting
 * it takes ten seconds and keeps a human accountable for what goes out under the
 * brand's name.
 *
 * Cadences are conservative on purpose: these are other people's APIs, and Reddit
 * in particular rate limits hard.
 */

type Task = {
  key: string;
  /** Minimum hours between runs. */
  everyHours: number;
  jobType: string;
  label: string;
  payload?: Record<string, unknown>;
};

/**
 * The schedule. Trends move fastest, communities barely change, so they are
 * checked at very different rates rather than all together.
 */
const TASKS: Task[] = [
  {
    key: "growth.lastTrendCrawl",
    everyHours: Number(process.env.GROWTH_TRENDS_EVERY_HOURS || 6),
    jobType: "crawl_trends",
    label: "Growth: find trending topics",
  },
  {
    key: "growth.lastRedditCrawl",
    everyHours: Number(process.env.GROWTH_REDDIT_EVERY_HOURS || 8),
    jobType: "crawl_reddit_threads",
    label: "Growth: find Reddit threads",
  },
  {
    key: "growth.lastReplyDraft",
    everyHours: Number(process.env.GROWTH_DRAFT_EVERY_HOURS || 8),
    jobType: "draft_reddit_replies",
    label: "Growth: write replies for new threads",
  },
  {
    key: "growth.lastCommunityCrawl",
    // Communities change slowly and this is the most rate-limited call, so weekly.
    everyHours: Number(process.env.GROWTH_COMMUNITIES_EVERY_HOURS || 168),
    jobType: "crawl_communities",
    label: "Growth: discover communities",
  },
  {
    key: "growth.lastPrune",
    everyHours: 24,
    jobType: "prune_trends",
    label: "Growth: drop stale trends",
  },

  /* ------------------------ link-building outreach ----------------------- */

  {
    // The export files only change when somebody downloads a new one, so this is
    // housekeeping rather than discovery.
    key: "links.lastMine",
    everyHours: Number(process.env.LINKS_MINE_EVERY_HOURS || 168),
    jobType: "mine_backlinks",
    label: "Links: read the competitor backlink exports",
  },
  {
    // The slowest task in the system: real HTTP requests to other people's sites
    // with a deliberate pause between each. Runs often but in small batches.
    key: "links.lastContactCrawl",
    everyHours: Number(process.env.LINKS_CONTACTS_EVERY_HOURS || 12),
    jobType: "crawl_link_contacts",
    label: "Links: find who to write to",
  },
  {
    key: "links.lastDraft",
    everyHours: Number(process.env.LINKS_DRAFT_EVERY_HOURS || 12),
    jobType: "draft_link_pitches",
    label: "Links: write the pitches",
  },
  {
    key: "links.lastFollowUp",
    everyHours: Number(process.env.LINKS_FOLLOWUP_EVERY_HOURS || 12),
    jobType: "schedule_followups",
    label: "Links: schedule the one follow-up",
  },
  {
    // Frequent on purpose. Every hour a reply sits unread is an hour in which a
    // follow-up could fire at somebody who already answered.
    key: "links.lastReplyPoll",
    everyHours: Number(process.env.LINKS_REPLY_POLL_EVERY_HOURS || 1),
    jobType: "poll_replies",
    label: "Links: read replies and bounces",
  },
  {
    // Runs often so the daily allowance is spread across the day rather than
    // arriving as one burst, which is itself a spam signal.
    key: "links.lastSend",
    everyHours: Number(process.env.LINKS_SEND_EVERY_HOURS || 2),
    jobType: "send_outreach",
    label: "Links: send what is due",
  },
  {
    // The only task that measures an outcome. Daily, because a link usually appears
    // days or weeks after the email, and because a link that quietly disappears
    // should not go unnoticed for a month.
    key: "links.lastVerify",
    everyHours: Number(process.env.LINKS_VERIFY_EVERY_HOURS || 24),
    jobType: "verify_links",
    label: "Links: check whether the link appeared",
  },
  {
    /**
     * Every six hours rather than daily, because this is the task that PAUSES a
     * sending address whose bounce rate has gone bad. A day of sending from an
     * address in trouble is a day of damage to the whole sending domain, and the
     * task itself is cheap: two queries and no outbound requests.
     */
    key: "inboxes.lastTend",
    everyHours: Number(process.env.INBOX_TEND_EVERY_HOURS || 6),
    jobType: "tend_inboxes",
    label: "Sending addresses: pick up new ones, pause any in trouble",
  },
];

/** Master switch. Off by default so nothing starts crawling unasked. */
export function growthAutopilotEnabled(): boolean {
  return process.env.GROWTH_AUTOPILOT !== "0";
}

/**
 * Queue whatever is due. Called from the Autopilot cycle, and by the "Run
 * everything now" button with force = true.
 *
 * Uses the durable job queue rather than doing the work inline, so a slow Reddit
 * call cannot stall the Autopilot cycle, and a failure retries on its own.
 */
export async function runGrowthCycle(
  opts: { force?: boolean } = {},
): Promise<{ queued: string[]; skipped: { task: string; hoursAgo: number }[]; enabled: boolean }> {
  const queued: string[] = [];
  const skipped: { task: string; hoursAgo: number }[] = [];

  if (!growthAutopilotEnabled() && !opts.force) {
    return { queued, skipped, enabled: false };
  }

  const settings = await import("@/server/db/repos/app-settings");
  const jobs = await import("@/server/db/repos/jobs");

  const now = Date.now();
  const toEnqueue: { type: string; payload?: unknown; label: string }[] = [];

  // A crawl already in flight must never be queued again, even on a forced run.
  // These sweeps take minutes, and a duplicate just re-scrapes the same sources
  // while fighting the same rate limit.
  const inFlight = await jobs.jobTypesInFlight(TASKS.map((t) => t.jobType));

  for (const task of TASKS) {
    if (inFlight.has(task.jobType)) {
      skipped.push({ task: task.jobType, hoursAgo: 0 });
      continue;
    }
    if (!opts.force) {
      const last = await settings.getSetting(task.key);
      if (last) {
        const hoursAgo = (now - new Date(last).getTime()) / 3_600_000;
        if (Number.isFinite(hoursAgo) && hoursAgo < task.everyHours) {
          skipped.push({ task: task.jobType, hoursAgo: Math.round(hoursAgo * 10) / 10 });
          continue;
        }
      }
    }
    toEnqueue.push({ type: task.jobType, payload: task.payload ?? {}, label: task.label });
    // Stamp the attempt now, not on success. Otherwise a task that keeps failing
    // re-queues on every single cycle and hammers the API it is already failing on.
    await settings.setSetting(task.key, new Date().toISOString());
    queued.push(task.jobType);
  }

  if (toEnqueue.length) {
    await jobs.enqueueJobs(toEnqueue);
    const { ensureJobRunner } = await import("./job-runner");
    ensureJobRunner();
  }

  return { queued, skipped, enabled: true };
}

/**
 * Write replies for threads that do not have one yet.
 *
 * Capped per run because each draft is an AI call. Highest-relevance first, so if
 * the cap bites it bites on the least promising threads. Skips anything a human
 * has already acted on.
 */
export async function draftPendingRedditReplies(
  max = Number(process.env.GROWTH_DRAFTS_PER_RUN || 5),
): Promise<{ drafted: number; skipped: number; errors: string[] }> {
  const repo = await import("@/server/db/repos/reddit");
  const { draftRedditReply } = await import("./reddit-reply-drafter");

  const candidates = (await repo.listOpportunities({ status: "new", limit: 60 }))
    .filter((o) => !o.draft_reply)
    .slice(0, max);

  let drafted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const opp of candidates) {
    try {
      const r = await draftRedditReply({
        title: opp.title,
        body: opp.post_body ?? "",
        subreddit: opp.subreddit,
        selfPromoAllowed: opp.self_promo_allowed,
        matchedArticleSlugs: opp.matched_article_slugs,
        matchedTerms: opp.matched_terms,
        intent: opp.intent,
      });
      if (r.ok && r.draft) {
        await repo.saveDraftReply(opp.id, r.draft, r.grounded);
        drafted++;
      } else {
        skipped++;
        if (r.error) errors.push(`${opp.subreddit}: ${r.error}`);
      }
    } catch (e) {
      skipped++;
      errors.push(`${opp.subreddit}: ${String((e as Error)?.message ?? e)}`);
    }
    // Pace the AI calls so a batch does not trip a provider rate limit.
    await new Promise((r) => setTimeout(r, 800));
  }

  return { drafted, skipped, errors };
}

/** Plain-language summary of what the automation did, for the dashboard. */
export async function growthStatus(): Promise<{
  enabled: boolean;
  lastRuns: { task: string; label: string; lastRun: string | null; hoursAgo: number | null; everyHours: number }[];
  counts: { trends: number; threads: number; threadsWithReply: number; communities: number };
}> {
  const settings = await import("@/server/db/repos/app-settings");
  const trends = await import("@/server/db/repos/trends");
  const reddit = await import("@/server/db/repos/reddit");
  const venues = await import("@/server/db/repos/venues");

  const map = await settings.getSettings(TASKS.map((t) => t.key));
  const now = Date.now();

  const lastRuns = TASKS.map((t) => {
    const last = map[t.key] ?? null;
    const hoursAgo = last ? Math.round(((now - new Date(last).getTime()) / 3_600_000) * 10) / 10 : null;
    return { task: t.jobType, label: t.label, lastRun: last, hoursAgo, everyHours: t.everyHours };
  });

  // Counted in SQL over both `new` and `drafted`, because writing a reply moves a
  // row out of `new`. Filtering on `new` alone made the thread count fall as
  // replies were written and pinned "replies ready" at zero.
  const threads = await reddit.countActionableOpportunities();

  return {
    enabled: growthAutopilotEnabled(),
    lastRuns,
    counts: {
      trends: await trends.countTrends("new"),
      threads: threads.total,
      threadsWithReply: threads.withReply,
      communities: await venues.countVenues(),
    },
  };
}
