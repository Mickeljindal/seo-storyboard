import "@tanstack/react-start/server-only";

/**
 * SHARED REDDIT CLIENT — one auth path, one rate-limit posture, two consumers.
 *
 * Both the thread listener (`reddit-listener.ts`) and the community finder
 * (`community-finder.ts`) need the same three things: a compliant User-Agent, an
 * OAuth token, and a fetch that tells the difference between "nothing found" and
 * "we were blocked". Duplicating that in two files would guarantee they drift.
 *
 * Everything here is READ ONLY. There is no post, comment, vote, or subscribe
 * call anywhere in this module, and the application-only OAuth flow it uses
 * cannot perform user actions even if something tried.
 */

/**
 * Reddit requires a descriptive User-Agent naming the app and a contact. A
 * browser-spoofing UA is against their terms and the fastest way to get blocked.
 */
export const REDDIT_UA =
  process.env.REDDIT_USER_AGENT?.trim() ||
  "web:kloudbean-seo-storyboard:1.0 (by /u/kloudbean; contact hello@kloudbean.com)";

/**
 * Reddit closed off unauthenticated `.json` endpoints; they answer 403 for most
 * non-browser clients now. The supported route is OAuth, so this uses the
 * application-only (client_credentials) flow, which needs a free app registered
 * at reddit.com/prefs/apps as type "script".
 */
type TokenCache = { token: string; expiresAt: number };
const g = globalThis as typeof globalThis & { __redditToken?: TokenCache };

export function hasRedditCredentials(): boolean {
  return !!(process.env.REDDIT_CLIENT_ID?.trim() && process.env.REDDIT_CLIENT_SECRET?.trim());
}

export async function getRedditAccessToken(): Promise<string | null> {
  if (!hasRedditCredentials()) return null;
  const cached = g.__redditToken;
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const id = process.env.REDDIT_CLIENT_ID!.trim();
  const secret = process.env.REDDIT_CLIENT_SECRET!.trim();
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": REDDIT_UA,
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    g.__redditToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

/** Thrown for 401/403/429 so a caller can report the real cause. */
export class RedditAccessError extends Error {}

/**
 * GET a Reddit endpoint. Prefers the OAuth host when credentials exist and falls
 * back to the public host otherwise, so the tools still work for anyone whose IP
 * is not blocked.
 *
 * Pass a path with its query string, e.g. `/r/node/new.json?limit=25`.
 */
export async function redditJson<T>(pathAndQuery: string): Promise<T | null> {
  const token = await getRedditAccessToken();
  const url = token
    ? `https://oauth.reddit.com${pathAndQuery}`
    : `https://www.reddit.com${pathAndQuery}`;
  const headers: Record<string, string> = { "User-Agent": REDDIT_UA, Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
    if (res.status === 401 || res.status === 403) {
      throw new RedditAccessError(
        token
          ? `Reddit refused the request (${res.status}) even with OAuth. Check the app credentials and that the app type is "script".`
          : `Reddit refused the request (${res.status}). Unauthenticated access is blocked: set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET (free app at reddit.com/prefs/apps, type "script").`,
      );
    }
    if (res.status === 429) {
      throw new RedditAccessError("Reddit rate limited the request (429). Slow down or try later.");
    }
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof RedditAccessError) throw e;
    return null;
  }
}

/** Politeness delay between Reddit calls. Their public API is a courtesy. */
export async function redditPause(ms = 1200): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/* -------------------------------------------------------------------------- *
 * RSS fallback — works with NO credentials at all.
 *
 * Reddit blocks unauthenticated JSON but still serves public RSS. That is enough
 * to do the two jobs that matter (find threads, find communities) without anyone
 * having to register an app, which is worth a lot when the alternative is a
 * captcha that will not submit.
 *
 * WHAT RSS DOES NOT GIVE US, and this is stated plainly because it changes the
 * quality of the output:
 *   - no score, no comment count on posts
 *   - no subscriber or active-user counts on subreddits
 * So the crawlers still prefer OAuth when credentials exist, and mark rows as
 * partial when they came from RSS. Nothing pretends a missing number is a zero.
 *
 * RSS is also rate limited harder than the API, so every call goes through a
 * 429-aware backoff instead of a fixed sleep.
 * -------------------------------------------------------------------------- */

export type RssEntry = {
  /** Reddit fullname, e.g. t3_abc123 for a post or t5_xyz for a subreddit. */
  id: string;
  title: string;
  link: string;
  author: string | null;
  published: Date | null;
  /** The HTML blob Reddit puts in <content>, useful for selftext and links. */
  content: string;
  /** Subreddit name from the category tag, when present. */
  subreddit: string | null;
};

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => {
      const n = Number(d);
      return n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : " ";
    })
    .replace(/&amp;/g, "&");
}

/** Parse a Reddit Atom feed into entries. Deliberately regex-based: no dependency. */
export function parseRedditRss(xml: string): RssEntry[] {
  const out: RssEntry[] = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const id = e.match(/<id>([^<]+)<\/id>/)?.[1]?.trim() ?? "";
    const title = decodeXml(e.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "");
    const link = e.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "";
    const author = e.match(/<author><name>([^<]+)<\/name>/)?.[1]?.replace(/^\/u\//, "") ?? null;
    const publishedRaw =
      e.match(/<published>([^<]+)<\/published>/)?.[1] ?? e.match(/<updated>([^<]+)<\/updated>/)?.[1];
    const content = decodeXml(e.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "");
    const subreddit = e.match(/<category[^>]*term="([^"]+)"/)?.[1] ?? null;
    if (!id || !title) continue;
    out.push({
      id,
      title,
      link,
      author,
      published: publishedRaw ? new Date(publishedRaw) : null,
      content,
      subreddit,
    });
  }
  return out;
}

/**
 * Fetch a Reddit RSS feed with backoff. Reddit rate limits RSS aggressively and
 * inconsistently, so a fixed delay either wastes time or gets throttled; growing
 * waits on 429 adapt to whatever the limit is today.
 */
export async function redditRss(pathAndQuery: string, attempt = 0): Promise<RssEntry[]> {
  const url = `https://www.reddit.com${pathAndQuery}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": REDDIT_UA, Accept: "application/atom+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(25_000),
    });
    if (res.status === 429) {
      if (attempt >= 3) {
        throw new RedditAccessError(
          "Reddit rate limited the RSS feed repeatedly. Wait a few minutes, or add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET for the higher API limit.",
        );
      }
      // 8s, 20s, 45s. Reddit's RSS window is short but not generous.
      await new Promise((r) => setTimeout(r, [8000, 20_000, 45_000][attempt]));
      return redditRss(pathAndQuery, attempt + 1);
    }
    if (res.status === 401 || res.status === 403) {
      throw new RedditAccessError(`Reddit refused the RSS feed (${res.status}).`);
    }
    if (!res.ok) return [];
    return parseRedditRss(await res.text());
  } catch (e) {
    if (e instanceof RedditAccessError) throw e;
    return [];
  }
}

/** True when we are running without credentials and therefore on the RSS path. */
export function usingRssFallback(): boolean {
  return !hasRedditCredentials();
}
