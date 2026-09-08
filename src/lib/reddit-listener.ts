import "@tanstack/react-start/server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * REDDIT LISTENER — find public threads our existing knowledge genuinely answers.
 *
 * This is a discovery tool, and that boundary is the whole design. It reads
 * public JSON, scores how well the article library answers each thread, records
 * the community's own self-promotion rules, and stops. It never posts, never
 * votes, never touches an account. A human writes or approves every reply.
 *
 * That is not timidity. Reddit is the single highest-intent place to be useful
 * about hosting problems, and it is also the fastest place to destroy a brand:
 * automated replies get the account banned, the domain blacklisted across
 * subreddits, and the company talked about for the wrong reason. The value is in
 * the SHORTLIST, which is the part that actually takes a human hours.
 *
 * Scoring is deliberately conservative. A thread only surfaces when our library
 * has a specific answer to it, because "we have a vaguely related article" is how
 * useful comments turn into spam.
 */

import {
  hasRedditCredentials,
  redditJson,
  RedditAccessError,
  redditPause,
  redditRss,
  usingRssFallback,
} from "./reddit-api";

// Re-exported so existing callers (scripts, server functions) keep working after
// the client moved into its own module.
export { hasRedditCredentials, RedditAccessError };

/**
 * Where our audience actually asks these questions. Each entry carries the
 * community's self-promotion posture, because that decides what a reply may look
 * like. Kept as data so it can be corrected as rules change: subreddit rules do
 * change, and a stale assumption here is what gets someone banned.
 */
export const SUBREDDIT_TARGETS: {
  name: string;
  selfPromo: "yes" | "limited" | "no" | "unknown";
  why: string;
}[] = [
  { name: "webdev", selfPromo: "limited", why: "Deploy and hosting questions from people building client sites." },
  { name: "node", selfPromo: "limited", why: "Process, PM2, port and deploy problems we have written up." },
  { name: "nextjs", selfPromo: "limited", why: "Self-hosting Next.js outside Vercel comes up constantly." },
  { name: "reactjs", selfPromo: "limited", why: "Build and deploy questions for SPAs and full-stack React." },
  { name: "devops", selfPromo: "no", why: "Strong anti-promo culture. Answer only, never link first." },
  { name: "selfhosted", selfPromo: "limited", why: "Managed vs self-hosted tradeoffs, Docker, backups." },
  { name: "sysadmin", selfPromo: "no", why: "Answer-only. Credibility here is worth more than a click." },
  { name: "PostgreSQL", selfPromo: "limited", why: "Managed Postgres, pooling, replicas, migrations." },
  { name: "django", selfPromo: "limited", why: "Deploy, static files, database configuration." },
  { name: "laravel", selfPromo: "limited", why: "Queues, cron, deploy, managed MySQL." },
  { name: "wordpress", selfPromo: "limited", why: "Hosting, caching, migration, the DB connection error." },
  { name: "ProWordPress", selfPromo: "limited", why: "Agency-grade WordPress operations." },
  { name: "SaaS", selfPromo: "limited", why: "Founders picking infrastructure and worrying about cost." },
  { name: "indiehackers", selfPromo: "limited", why: "Side projects moving from prototype to production." },
  { name: "vibecoding", selfPromo: "limited", why: "AI-built apps that work locally and break in production." },
  { name: "ChatGPTCoding", selfPromo: "limited", why: "The exact deploy gap our AI cluster covers." },
  { name: "LocalLLaMA", selfPromo: "no", why: "Self-hosted model questions. GPU sizing, never a pitch." },
  { name: "aws", selfPromo: "no", why: "Managed-vs-raw questions. Be genuinely neutral or stay out." },
  { name: "digital_ocean", selfPromo: "limited", why: "Managed layer on top of a provider they already use." },
  { name: "saudiarabia", selfPromo: "no", why: "Residency and local hosting questions. Cultural care required." },
];

/**
 * What we can actually help with, mapped to the language people use when asking.
 * A thread has to hit one of these to be worth a human's attention.
 */
const TOPIC_TERMS: { topic: string; terms: string[] }[] = [
  { topic: "deploy-failure", terms: ["503", "502", "won't start", "wont start", "crashes on deploy", "app crashed", "deploy failed", "cannot find module"] },
  { topic: "sqlite-data-loss", terms: ["sqlite", "data disappeared", "database resets", "lost data on deploy", "ephemeral filesystem"] },
  { topic: "env-vars", terms: ["env var", "environment variable", "vite_", "next_public", "secret in bundle", "api key exposed"] },
  { topic: "managed-database", terms: ["managed postgres", "managed mysql", "connection pool", "too many connections", "read replica", "database hosting"] },
  { topic: "hosting-choice", terms: ["where should i host", "best host", "hosting recommendation", "vps or", "alternative to vercel", "alternative to heroku", "alternative to render", "railway alternative"] },
  { topic: "cost", terms: ["bill", "expensive", "cost too much", "pricing", "egress", "surprise charge"] },
  { topic: "background-jobs", terms: ["cron", "background job", "worker", "queue", "scheduled task", "bullmq"] },
  { topic: "serverless-limits", terms: ["timeout", "cold start", "spin down", "execution limit", "function timeout"] },
  { topic: "ai-app-hosting", terms: ["deploy my ai app", "host an llm", "self-host model", "ollama", "rag app", "ai agent hosting", "gpu server"] },
  { topic: "wordpress-ops", terms: ["error establishing a database connection", "wordpress slow", "wp migration", "wordpress cache", "critical error"] },
  { topic: "agency-ops", terms: ["client sites", "manage multiple sites", "agency hosting", "reseller", "white label hosting"] },
  { topic: "residency", terms: ["data residency", "in-kingdom", "saudi hosting", "pdpl", "gdpr hosting", "data sovereignty"] },
  { topic: "ssl-dns", terms: ["ssl error", "certificate", "dns", "cloudflare 520", "https not working"] },
];

export type RedditPost = {
  postId: string;
  subreddit: string;
  title: string;
  permalink: string;
  author: string | null;
  flair: string | null;
  body: string;
  score: number;
  numComments: number;
  createdUtc: Date | null;
};

type RedditListing = {
  data?: {
    children?: {
      data?: {
        id?: string;
        name?: string;
        subreddit?: string;
        title?: string;
        permalink?: string;
        author?: string;
        link_flair_text?: string | null;
        selftext?: string;
        score?: number;
        num_comments?: number;
        created_utc?: number;
        over_18?: boolean;
        stickied?: boolean;
      };
    }[];
  };
};

/** Public listing for one subreddit. `new` finds threads before they go stale. */
export async function fetchSubredditPosts(
  subreddit: string,
  opts: { sort?: "new" | "hot" | "top"; limit?: number } = {},
): Promise<RedditPost[]> {
  const sort = opts.sort ?? "new";
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);

  // No credentials: use the public RSS feed. It carries the title, body link and
  // timestamp, which is everything the relevance scoring actually needs. It does
  // NOT carry score or comment count, so those stay 0 and the caller can tell.
  if (usingRssFallback()) {
    const entries = await redditRss(`/r/${encodeURIComponent(subreddit)}/${sort}.rss?limit=${limit}`);
    return entries
      .filter((e) => e.id.startsWith("t3_"))
      .map((e) => ({
        postId: e.id,
        subreddit: e.subreddit ?? subreddit,
        title: e.title,
        permalink: e.link,
        author: e.author,
        flair: null,
        // RSS puts the submission blurb in <content> as HTML; strip it to text.
        body: e.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000),
        score: 0,
        numComments: 0,
        createdUtc: e.published,
      }));
  }

  const data = await redditJson<RedditListing>(
    `/r/${encodeURIComponent(subreddit)}/${sort}.json?limit=${limit}&raw_json=1`,
  );
  const children = data?.data?.children ?? [];
  const out: RedditPost[] = [];
  for (const c of children) {
    const d = c.data;
    if (!d?.id || !d.title) continue;
    if (d.over_18 || d.stickied) continue; // never engage with either
    out.push({
      postId: d.name ?? `t3_${d.id}`,
      subreddit: d.subreddit ?? subreddit,
      title: d.title,
      permalink: d.permalink ? `https://www.reddit.com${d.permalink}` : "",
      author: d.author ?? null,
      flair: d.link_flair_text ?? null,
      body: (d.selftext ?? "").slice(0, 4000),
      score: d.score ?? 0,
      numComments: d.num_comments ?? 0,
      createdUtc: d.created_utc ? new Date(d.created_utc * 1000) : null,
    });
  }
  return out;
}

/** Public subreddit rules, so a draft can respect them instead of guessing. */
export async function fetchSubredditRules(subreddit: string): Promise<{
  rules: { short_name?: string; description?: string }[];
  selfPromoAllowed: "yes" | "limited" | "no" | "unknown";
}> {
  const data = await redditJson<{ rules?: { short_name?: string; description?: string }[] }>(
    `/r/${encodeURIComponent(subreddit)}/about/rules.json`,
  );
  const rules = data?.rules ?? [];
  const text = rules.map((r) => `${r.short_name ?? ""} ${r.description ?? ""}`).join(" ").toLowerCase();
  let selfPromoAllowed: "yes" | "limited" | "no" | "unknown" = "unknown";
  if (/no (self[- ]?promo|advertis|solicit)|do not (promote|advertise)|no blog ?spam/.test(text)) {
    selfPromoAllowed = "no";
  } else if (/self[- ]?promo/.test(text)) {
    selfPromoAllowed = "limited";
  }
  return { rules, selfPromoAllowed };
}

/* -------------------------------------------------------------------------- *
 * Matching against what we have actually published
 * -------------------------------------------------------------------------- */

type LibraryEntry = { slug: string; title: string; keyword: string; live: boolean };

/** Read the published library from disk: slug, title, target keyword. */
export function loadLibrary(): LibraryEntry[] {
  const cs = path.join(process.cwd(), "content-studio");
  let live = new Set<string>();
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(cs, "_published.json"), "utf8")) as {
      published?: { slug?: string }[];
    };
    live = new Set((manifest.published ?? []).map((p) => p.slug ?? ""));
  } catch {
    /* the manifest is optional */
  }

  const out: LibraryEntry[] = [];
  let dirs: string[] = [];
  try {
    dirs = fs.readdirSync(cs);
  } catch {
    return out;
  }
  for (const slug of dirs) {
    const md = path.join(cs, slug, `${slug}.md`);
    if (!fs.existsSync(md)) continue;
    let title = slug.replace(/-/g, " ");
    let keyword = "";
    try {
      const head = fs.readFileSync(md, "utf8").slice(0, 1200);
      title = head.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? title;
      keyword = head.match(/^target_keyword:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? "";
    } catch {
      /* fall back to the slug */
    }
    out.push({ slug, title, keyword, live: live.has(slug) });
  }
  return out;
}

export type ScoredOpportunity = RedditPost & {
  relevance: number;
  intent: string;
  matchedTerms: string[];
  matchedArticleSlugs: string[];
};

function classifyIntent(title: string, body: string): string {
  const t = `${title} ${body}`.toLowerCase();

  // Someone asking which tool to pick is a different conversation from someone
  // whose deploy is broken, and they deserve different replies.
  if (/recommend|suggest|looking for|which (host|provider|platform|one)|best (host|platform|provider)|alternative to/.test(t)) {
    return "recommendation";
  }
  if (/\?|^(how|why|what|where|which|can|does|is|should|anyone|any ?one)\b/i.test(title)) {
    return "question";
  }
  // A plain problem report is a question even when it has no question mark. This
  // is the most common shape of the threads we can actually help with: a status
  // code, a stack trace, or "works locally, breaks in production".
  if (
    /\b[45]\d\d\b|error|exception|stack ?trace|fail(s|ed|ing)?|crash(es|ed|ing)?|timeout|timed out|stuck|broken|not working|doesn'?t work|won'?t (start|build|deploy|connect)|cannot|can'?t|help/.test(
      t,
    ) ||
    /works? (locally|on localhost).*(but|then)|but (not|fails) (in|on) production/.test(t)
  ) {
    return "question";
  }
  if (/rant|frustrat|angry|terrible|awful|hate|bill shock|charged me|ripped off/.test(t)) {
    return "complaint";
  }
  if (/i built|i made|i launched|showcase|feedback on my|my new (app|project|tool)/.test(t)) {
    return "showcase";
  }
  return "other";
}

/**
 * Score a thread 0..100 for whether we can genuinely help.
 *
 * The weighting is intentionally biased toward specificity: a matched error
 * string or product term beats a topically similar title, because that is the
 * difference between a comment that helps and a comment that annoys.
 */
export function scoreOpportunity(post: RedditPost, library: LibraryEntry[]): ScoredOpportunity {
  const hay = `${post.title}\n${post.body}`.toLowerCase();
  const matchedTerms: string[] = [];
  const topics = new Set<string>();

  for (const { topic, terms } of TOPIC_TERMS) {
    for (const term of terms) {
      if (hay.includes(term)) {
        matchedTerms.push(term);
        topics.add(topic);
      }
    }
  }

  // Which of our articles actually speak to this thread.
  const titleWords = new Set(
    post.title
      .toLowerCase()
      .match(/\b[a-z][a-z0-9.+-]{2,}\b/g)
      ?.filter((w) => !STOP.has(w)) ?? [],
  );
  const matched: { slug: string; hits: number }[] = [];
  for (const entry of library) {
    const target = `${entry.title} ${entry.keyword} ${entry.slug.replace(/-/g, " ")}`.toLowerCase();
    let hits = 0;
    for (const w of titleWords) if (target.includes(w)) hits++;
    if (hits >= 2) matched.push({ slug: entry.slug, hits });
  }
  matched.sort((a, b) => b.hits - a.hits);
  const matchedArticleSlugs = matched.slice(0, 3).map((m) => m.slug);

  const intent = classifyIntent(post.title, post.body);

  let score = 0;
  score += Math.min(matchedTerms.length, 4) * 12; // up to 48: they used our language
  score += Math.min(topics.size, 3) * 6; // up to 18: coherent topic
  score += Math.min(matchedArticleSlugs.length, 3) * 8; // up to 24: we have the answer
  if (intent === "question") score += 8;
  if (intent === "recommendation") score += 6;
  if (intent === "complaint") score += 2;
  if (intent === "showcase") score -= 10; // nobody wants a vendor in their launch thread
  // Freshness: an answer on a two-week-old thread helps nobody.
  if (post.createdUtc) {
    const ageH = (Date.now() - post.createdUtc.getTime()) / 3_600_000;
    if (ageH <= 24) score += 8;
    else if (ageH <= 72) score += 4;
    else if (ageH > 336) score -= 10;
  }
  // A thread with 40 comments already has its answer. Only applied when we know
  // the count: on the RSS path it is 0 because RSS omits it, not because the
  // thread is empty, and penalising an unknown would be wrong.
  if (post.numComments > 40) score -= 6;

  return {
    ...post,
    relevance: Math.max(0, Math.min(100, score)),
    intent,
    matchedTerms: [...new Set(matchedTerms)].slice(0, 12),
    matchedArticleSlugs,
  };
}

const STOP = new Set(
  "the a an and or for with your you how what why when where which can does is are it that this from into best help need any anyone someone please thanks my our their his her its about over under just still very really".split(
    " ",
  ),
);

/**
 * Crawl the target subreddits and store anything worth a human look.
 *
 * Paced politely and read-only. Returns counts rather than throwing, so one
 * unreachable subreddit cannot fail the run.
 */
export async function crawlRedditOpportunities(opts: {
  subreddits?: string[];
  minRelevance?: number;
  limitPerSub?: number;
  sort?: "new" | "hot" | "top";
} = {}): Promise<{
  scanned: number;
  stored: number;
  skippedLowRelevance: number;
  bySubreddit: Record<string, number>;
  errors: string[];
}> {
  // Target selection, in order of trust:
  //   1. what the caller asked for
  //   2. what the community finder discovered and a human left as post/participate
  //   3. the curated fallback list below
  // Discovery beats the hardcoded list because it carries real audience numbers
  // and the current rules, where the fallback is a guess someone made once.
  let targets: { name: string; selfPromo: "yes" | "limited" | "no" | "unknown"; why: string }[];
  if (opts.subreddits?.length) {
    targets = opts.subreddits.map((n) => ({ name: n, selfPromo: "unknown" as const, why: "manual target" }));
  } else {
    let discovered: string[] = [];
    try {
      const venues = await import("@/server/db/repos/venues");
      discovered = await venues.activeVenueNames("reddit");
    } catch {
      /* fall back to the curated list */
    }
    targets = discovered.length
      ? discovered.map((n) => ({ name: n, selfPromo: "unknown" as const, why: "discovered by the community finder" }))
      : SUBREDDIT_TARGETS;
  }
  const minRelevance = opts.minRelevance ?? 35;
  const library = loadLibrary();
  const repo = await import("@/server/db/repos/reddit");

  let scanned = 0;
  let stored = 0;
  let skippedLowRelevance = 0;
  const bySubreddit: Record<string, number> = {};
  const errors: string[] = [];

  // Fail fast and loudly on an access problem: it applies to every subreddit, so
  // grinding through 20 of them to collect 20 copies of the same 403 wastes time
  // and hides the actual cause.
  for (const target of targets) {
    let posts: RedditPost[] = [];
    try {
      posts = await fetchSubredditPosts(target.name, { sort: opts.sort, limit: opts.limitPerSub });
    } catch (e) {
      if (e instanceof RedditAccessError) {
        errors.push(e.message);
        break;
      }
      errors.push(`r/${target.name}: ${String((e as Error)?.message ?? e)}`);
      continue;
    }
    if (!posts.length) {
      errors.push(`r/${target.name}: no posts returned (private, renamed, or rate limited)`);
      continue;
    }

    // Fetch the rules once per subreddit, not once per post. On the RSS path the
    // rules endpoint is not available, so the curated posture is all we have,
    // which is a good reason to keep that list accurate.
    let rules: Awaited<ReturnType<typeof fetchSubredditRules>> = { rules: [], selfPromoAllowed: "unknown" };
    if (!usingRssFallback()) {
      try {
        rules = await fetchSubredditRules(target.name);
      } catch {
        /* rules are advisory here; the curated posture below still applies */
      }
    }
    // Our own curated posture wins when it is stricter than what parsing found.
    const selfPromo =
      target.selfPromo === "no" || rules.selfPromoAllowed === "no"
        ? "no"
        : rules.selfPromoAllowed !== "unknown"
          ? rules.selfPromoAllowed
          : target.selfPromo;

    for (const post of posts) {
      scanned++;
      const scoredPost = scoreOpportunity(post, library);
      if (scoredPost.relevance < minRelevance) {
        skippedLowRelevance++;
        continue;
      }
      try {
        await repo.upsertOpportunity({
          postId: scoredPost.postId,
          subreddit: scoredPost.subreddit,
          title: scoredPost.title,
          permalink: scoredPost.permalink,
          author: scoredPost.author,
          flair: scoredPost.flair,
          postBody: scoredPost.body,
          score: scoredPost.score,
          numComments: scoredPost.numComments,
          createdUtc: scoredPost.createdUtc,
          relevance: scoredPost.relevance,
          intent: scoredPost.intent,
          matchedTerms: scoredPost.matchedTerms,
          matchedArticleSlugs: scoredPost.matchedArticleSlugs,
          selfPromoAllowed: selfPromo,
          subredditRules: { source: "reddit /about/rules.json", why_targeted: target.why, rules: rules.rules.slice(0, 12) },
        });
        stored++;
        bySubreddit[target.name] = (bySubreddit[target.name] ?? 0) + 1;
      } catch (e) {
        errors.push(`store ${scoredPost.postId}: ${String((e as Error)?.message ?? e)}`);
      }
    }

    // Be a good citizen: Reddit's endpoints are a courtesy, not an entitlement.
    await redditPause(1500);
  }

  return { scanned, stored, skippedLowRelevance, bySubreddit, errors };
}
