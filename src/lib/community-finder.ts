import "@tanstack/react-start/server-only";
import { redditJson, redditPause, RedditAccessError, redditRss, usingRssFallback } from "./reddit-api";

/**
 * COMMUNITY FINDER — where should we actually be posting?
 *
 * The thread listener answers "which conversation can we help with today". This
 * answers the prior question: which communities are worth showing up in at all.
 * The existing curated list of ~20 subreddits was a guess made by a human once.
 * This discovers them from Reddit's own search, reads each one's size, activity,
 * and rules, and produces a plain recommendation.
 *
 * FOUR OUTCOMES, and "participate" is not a consolation prize:
 *
 *   post        Good fit, and the rules permit sharing our own work.
 *   participate Good fit, but self-promotion is banned. Answer questions, never
 *               link. These are frequently the HIGHEST value communities, because
 *               a ban on links means the people there trust what they read.
 *   watch       Plausible but unproven: too small, too quiet, or fit unclear.
 *   avoid       Wrong audience, dead, or hostile to vendors in a way that means
 *               even a helpful answer will be read as marketing.
 *
 * Read-only. It never subscribes, posts, or votes.
 */

/**
 * Search terms drawn from what we genuinely know. Each maps to a real cluster, so
 * a discovered community can be tied back to content we already have.
 */
export const DISCOVERY_QUERIES: { query: string; clusterHint: number }[] = [
  { query: "web hosting", clusterHint: 1 },
  { query: "self hosted", clusterHint: 2 },
  { query: "devops", clusterHint: 9 },
  { query: "node js", clusterHint: 3 },
  { query: "nextjs", clusterHint: 3 },
  { query: "laravel", clusterHint: 3 },
  { query: "django", clusterHint: 3 },
  { query: "wordpress", clusterHint: 6 },
  { query: "web development", clusterHint: 3 },
  { query: "saas", clusterHint: 8 },
  { query: "indie hackers", clusterHint: 8 },
  { query: "freelance developer", clusterHint: 5 },
  { query: "digital agency", clusterHint: 5 },
  { query: "postgresql", clusterHint: 7 },
  { query: "database", clusterHint: 7 },
  { query: "sysadmin", clusterHint: 9 },
  { query: "homelab", clusterHint: 2 },
  { query: "docker", clusterHint: 2 },
  { query: "kubernetes", clusterHint: 9 },
  { query: "cloud computing", clusterHint: 1 },
  { query: "ai coding", clusterHint: 1 },
  { query: "vibe coding", clusterHint: 1 },
  { query: "local llm", clusterHint: 1 },
  { query: "saudi arabia tech", clusterHint: 10 },
];

/** Vocabulary that says a community talks about what we know. */
const FIT_TERMS = [
  "hosting", "host", "server", "vps", "cloud", "deploy", "deployment", "devops",
  "infrastructure", "sysadmin", "database", "postgres", "mysql", "redis", "docker",
  "kubernetes", "backup", "nginx", "ssl", "domain", "wordpress", "laravel", "django",
  "node", "nextjs", "react", "python", "php", "saas", "agency", "freelance",
  "selfhosted", "self-hosted", "homelab", "ai", "llm", "web development", "webdev",
];

/** Communities we should not be in regardless of size. */
const EXCLUDE_PATTERN =
  /\b(nsfw|gonewild|porn|crypto|bitcoin|nft|forex|betting|casino|jobs?|hiring|hire\w*|forhire|resume|memes?|jokes?|politics|conspiracy)\b/i;

export type SubredditAbout = {
  name: string;
  title: string | null;
  description: string | null;
  subscribers: number;
  activeUsers: number;
  over18: boolean;
  createdUtc: Date | null;
  url: string;
  submissionType: string | null;
};

type AboutResponse = {
  data?: {
    display_name?: string;
    title?: string;
    public_description?: string;
    description?: string;
    subscribers?: number;
    accounts_active?: number;
    active_user_count?: number;
    over18?: boolean;
    created_utc?: number;
    url?: string;
    submission_type?: string;
    subreddit_type?: string;
  };
};

/** Discover candidate subreddits for one query using Reddit's own search. */
/**
 * RSS search, returning everything the feed gives us in ONE request.
 *
 * This exists because the first version called the search feed again for every
 * single candidate just to read a description the search had already returned.
 * That turned one request into a dozen and got the whole crawl rate limited into a
 * timeout. The feed already carries the name, title and blurb, so use them.
 */
export async function searchSubredditsDetailed(
  query: string,
  limit = 15,
): Promise<SubredditAbout[]> {
  const entries = await redditRss(`/subreddits/search.rss?q=${encodeURIComponent(query)}`);
  const out: SubredditAbout[] = [];
  for (const e of entries) {
    if (!e.id.startsWith("t5_")) continue;
    const name = e.link.match(/\/r\/([^/]+)/)?.[1];
    if (!name) continue;
    out.push({
      name,
      title: e.title || null,
      description:
        e.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1200) || null,
      // -1 means UNKNOWN, not empty. RSS does not expose audience numbers.
      subscribers: -1,
      activeUsers: -1,
      over18: false,
      createdUtc: e.published,
      url: `https://www.reddit.com/r/${name}/`,
      submissionType: null,
    });
    if (out.length >= limit) break;
  }
  return out;
}

export async function searchSubreddits(query: string, limit = 15): Promise<string[]> {
  if (usingRssFallback()) {
    return (await searchSubredditsDetailed(query, limit)).map((s) => s.name);
  }

  type SearchResponse = {
    data?: { children?: { data?: { display_name?: string; subreddit_type?: string } }[] };
  };
  const data = await redditJson<SearchResponse>(
    `/subreddits/search.json?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 25)}&raw_json=1`,
  );
  const names: string[] = [];
  for (const c of data?.data?.children ?? []) {
    const d = c.data;
    if (!d?.display_name) continue;
    // Private and restricted communities cannot be posted in, so skip them.
    if (d.subreddit_type && !["public", "restricted"].includes(d.subreddit_type)) continue;
    names.push(d.display_name);
  }
  return names;
}

export async function fetchSubredditAbout(name: string): Promise<SubredditAbout | null> {
  // RSS path: we can get the name, title and description, but Reddit does not
  // expose subscriber or active-user counts over RSS. Those come back as -1 to
  // mean UNKNOWN rather than 0, because scoring an unknown as "empty community"
  // would rank every real community as dead.
  if (usingRssFallback()) {
    const entries = await redditRss(`/subreddits/search.rss?q=${encodeURIComponent(name)}`);
    const hit =
      entries.find((e) => e.link.toLowerCase().includes(`/r/${name.toLowerCase()}/`)) ?? null;
    if (!hit) return null;
    return {
      name,
      title: hit.title || null,
      description: hit.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1200) || null,
      subscribers: -1,
      activeUsers: -1,
      over18: false,
      createdUtc: hit.published,
      url: `https://www.reddit.com/r/${name}/`,
      submissionType: null,
    };
  }

  const data = await redditJson<AboutResponse>(`/r/${encodeURIComponent(name)}/about.json?raw_json=1`);
  const d = data?.data;
  if (!d?.display_name) return null;
  return {
    name: d.display_name,
    title: d.title ?? null,
    description: (d.public_description || d.description || "").slice(0, 1200) || null,
    subscribers: d.subscribers ?? 0,
    activeUsers: d.active_user_count ?? d.accounts_active ?? 0,
    over18: !!d.over18,
    createdUtc: d.created_utc ? new Date(d.created_utc * 1000) : null,
    url: d.url ? `https://www.reddit.com${d.url}` : `https://www.reddit.com/r/${d.display_name}/`,
    submissionType: d.submission_type ?? null,
  };
}

export async function fetchRules(name: string): Promise<{
  rules: { short_name?: string; description?: string }[];
  selfPromoAllowed: "yes" | "limited" | "no" | "unknown";
  submissionNotes: string | null;
}> {
  // The rules endpoint has no RSS equivalent. Returning "unknown" is the honest
  // answer: a guess here is what gets an account banned, so the recommendation
  // logic treats unknown rules as a reason to check manually before posting.
  if (usingRssFallback()) {
    return { rules: [], selfPromoAllowed: "unknown", submissionNotes: null };
  }

  const data = await redditJson<{ rules?: { short_name?: string; description?: string }[] }>(
    `/r/${encodeURIComponent(name)}/about/rules.json`,
  );
  const rules = data?.rules ?? [];
  const text = rules
    .map((r) => `${r.short_name ?? ""} ${r.description ?? ""}`)
    .join(" ")
    .toLowerCase();

  let selfPromoAllowed: "yes" | "limited" | "no" | "unknown" = "unknown";
  if (
    /no (self[- ]?promo|advertis|solicit|blog ?spam|marketing)|do not (promote|advertise|self)|zero tolerance for (spam|promo)|no promotional/.test(
      text,
    )
  ) {
    selfPromoAllowed = "no";
  } else if (/self[- ]?promo|promotion|9:1|90\/10|saturday|showcase thread|sticky/.test(text)) {
    // A rule that discusses self-promotion usually means "allowed, with limits".
    selfPromoAllowed = "limited";
  }

  const notes: string[] = [];
  if (/flair (is )?(required|mandatory)|must (use|add) .{0,12}flair/.test(text)) notes.push("flair required");
  if (/no link posts?|text posts? only|self ?posts? only/.test(text)) notes.push("text posts only");
  if (/no (questions|support|help)/.test(text)) notes.push("support questions not allowed");
  if (/weekly|megathread|sticky thread/.test(text)) notes.push("has a megathread for these topics");

  return { rules, selfPromoAllowed, submissionNotes: notes.length ? notes.join("; ") : null };
}

export type ScoredVenue = SubredditAbout & {
  selfPromoAllowed: string;
  rules: { short_name?: string; description?: string }[];
  submissionNotes: string | null;
  topicalFit: number;
  matchedTerms: string[];
  opportunity: number;
  recommendation: "post" | "participate" | "watch" | "avoid";
  reasoning: string;
};

/**
 * How well this community matches what we know.
 *
 * The NAME carries far more weight than the description, because it is the most
 * reliable signal available and often the only one. r/PHP has a one-line
 * description that matches a single term, but the name alone tells you exactly
 * what it is. Weighting these equally made the first version mark r/PHP and
 * r/react as "avoid", which is obviously wrong and would have hidden two of the
 * best communities for this library.
 */
function computeFit(about: SubredditAbout): { fit: number; matched: string[] } {
  const name = about.name.toLowerCase();
  const title = (about.title ?? "").toLowerCase();
  const description = (about.description ?? "").toLowerCase();

  const matched = new Set<string>();
  let score = 0;

  for (const term of FIT_TERMS) {
    // A technology in the community's own name is close to a definition of fit.
    if (name.includes(term.replace(/\s+/g, ""))) {
      matched.add(term);
      score += 30;
      continue;
    }
    if (title.includes(term)) {
      matched.add(term);
      score += 10;
      continue;
    }
    if (description.includes(term)) {
      matched.add(term);
      score += 6;
    }
  }

  return { fit: Math.min(100, Math.round(score)), matched: [...matched].slice(0, 12) };
}

/**
 * Combine reach, liveliness, and fit into one priority, then turn it into a
 * recommendation a human can act on without re-reading the rules.
 */
export function scoreVenue(
  about: SubredditAbout,
  rules: { selfPromoAllowed: string; rules: { short_name?: string; description?: string }[]; submissionNotes: string | null },
): ScoredVenue {
  const { fit, matched } = computeFit(about);

  // -1 means the number was not available (the RSS path). Treating unknown as 0
  // would rank every real community as a ghost town, so audience is simply left
  // out of the score and the recommendation says the size is unverified.
  const sizeKnown = about.subscribers >= 0;

  // Reach on a log scale: 500k subscribers is not 100x more useful than 5k, and
  // small focused communities often convert better than huge general ones.
  const reach = sizeKnown ? Math.min(30, Math.log10(1 + about.subscribers) * 7) : 0;
  // Liveliness matters more than size. A 200k-member ghost town is worth nothing.
  const activityRatio = sizeKnown && about.subscribers > 0 ? about.activeUsers / about.subscribers : 0;
  const liveliness = sizeKnown ? Math.min(20, activityRatio * 4000) : 0;

  // Without audience data, fit has to carry the score, so it is weighted higher to
  // keep the numbers comparable rather than making every RSS row look weak.
  let opportunity = sizeKnown ? fit * 0.5 + reach + liveliness : fit * 0.85;
  if (rules.selfPromoAllowed === "no") opportunity -= 6; // still valuable, just not for links
  if (about.over18) opportunity = 0;
  if (EXCLUDE_PATTERN.test(`${about.name} ${about.title ?? ""}`)) opportunity = 0;
  opportunity = Math.max(0, Math.min(100, Math.round(opportunity * 100) / 100));

  const audienceText = sizeKnown
    ? `${about.subscribers.toLocaleString()} members, ${about.activeUsers} online`
    : "audience size unknown (no API credentials)";

  let recommendation: ScoredVenue["recommendation"];
  let reasoning: string;

  if (opportunity === 0 || fit < 20) {
    recommendation = "avoid";
    reasoning =
      about.over18 || EXCLUDE_PATTERN.test(about.name)
        ? "Excluded on content grounds."
        : `Weak topical fit (${fit}/100): our knowledge does not match what this community discusses.`;
  } else if (sizeKnown && (about.subscribers < 2000 || about.activeUsers < 5)) {
    recommendation = "watch";
    reasoning = `Relevant but small or quiet (${audienceText}). Worth watching, not worth a routine.`;
  } else if (rules.selfPromoAllowed === "no") {
    recommendation = "participate";
    reasoning = `Good fit (${fit}/100) but self-promotion is prohibited. Answer questions here and never link: communities that ban links are usually the ones whose members trust what they read.`;
  } else if (!sizeKnown) {
    // Rules are also unknown on this path, and guessing them is what gets an
    // account banned, so the verdict stops short of "post".
    recommendation = fit >= 45 ? "participate" : "watch";
    reasoning = `Fit ${fit}/100, but ${audienceText} and the rules could not be read. Check the sidebar before posting; answering questions is safe either way.`;
  } else if (fit >= 45 && about.subscribers >= 10_000) {
    recommendation = "post";
    reasoning = `Strong fit (${fit}/100), ${audienceText}, and the rules allow sharing with limits. Lead with the answer, link second.`;
  } else {
    recommendation = "participate";
    reasoning = `Reasonable fit (${fit}/100). Build a track record by answering first; earn the right to link later.`;
  }

  return {
    ...about,
    selfPromoAllowed: rules.selfPromoAllowed,
    rules: rules.rules,
    submissionNotes: rules.submissionNotes,
    topicalFit: fit,
    matchedTerms: matched,
    opportunity,
    recommendation,
    reasoning,
  };
}

export type VenueCrawlResult = {
  queriesRun: number;
  candidates: number;
  evaluated: number;
  stored: number;
  byRecommendation: Record<string, number>;
  errors: string[];
};

/**
 * Discover and evaluate communities. Paced politely, and it stops on an access
 * error rather than grinding through 24 queries collecting the same 403.
 */
export async function crawlCommunities(
  opts: { queries?: string[]; maxPerQuery?: number } = {},
): Promise<VenueCrawlResult> {
  const queries = opts.queries?.length ? opts.queries : DISCOVERY_QUERIES.map((q) => q.query);
  const maxPerQuery = opts.maxPerQuery ?? 12;
  const errors: string[] = [];
  const byRecommendation: Record<string, number> = {};
  const seen = new Set<string>();

  let queriesRun = 0;
  let candidates = 0;
  let evaluated = 0;
  let stored = 0;

  const repo = await import("@/server/db/repos/venues");

  const rssMode = usingRssFallback();

  outer: for (const query of queries) {
    // On the RSS path one request yields the name AND the description for every
    // candidate, so there is nothing more to fetch per community.
    let found: SubredditAbout[] = [];
    try {
      found = rssMode
        ? await searchSubredditsDetailed(query, maxPerQuery)
        : (await searchSubreddits(query, maxPerQuery)).map(
            (name) => ({ name }) as unknown as SubredditAbout,
          );
      queriesRun++;
    } catch (e) {
      if (e instanceof RedditAccessError) {
        errors.push(e.message);
        break outer;
      }
      errors.push(`search "${query}": ${String((e as Error)?.message ?? e)}`);
      continue;
    }
    await redditPause(rssMode ? 3000 : 1200);

    for (const candidate of found) {
      const key = candidate.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      candidates++;

      try {
        let about: SubredditAbout | null;
        let rules: Awaited<ReturnType<typeof fetchRules>>;
        if (rssMode) {
          about = candidate;
          rules = { rules: [], selfPromoAllowed: "unknown", submissionNotes: null };
        } else {
          about = await fetchSubredditAbout(candidate.name);
          await redditPause(1000);
          if (!about) continue;
          rules = await fetchRules(candidate.name);
          await redditPause(1000);
        }
        if (!about) continue;

        const scored = scoreVenue(about, rules);
        evaluated++;
        await repo.upsertVenue({
          platform: "reddit",
          name: scored.name,
          url: scored.url,
          title: scored.title,
          description: scored.description,
          subscribers: Math.max(0, scored.subscribers),
          activeUsers: Math.max(0, scored.activeUsers),
          over18: scored.over18,
          createdUtc: scored.createdUtc,
          selfPromoAllowed: scored.selfPromoAllowed,
          rules: { source: "reddit /about/rules.json", rules: scored.rules.slice(0, 12) },
          submissionNotes: scored.submissionNotes,
          topicalFit: scored.topicalFit,
          matchedTerms: scored.matchedTerms,
          opportunity: scored.opportunity,
          recommendation: scored.recommendation,
          reasoning: scored.reasoning,
        });
        stored++;
        byRecommendation[scored.recommendation] = (byRecommendation[scored.recommendation] ?? 0) + 1;
      } catch (e) {
        if (e instanceof RedditAccessError) {
          errors.push(e.message);
          break outer;
        }
        errors.push(`r/${candidate.name}: ${String((e as Error)?.message ?? e)}`);
      }
    }
  }

  return { queriesRun, candidates, evaluated, stored, byRecommendation, errors };
}
