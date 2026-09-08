import "@tanstack/react-start/server-only";
import fs from "node:fs";
import path from "node:path";
import { CLUSTERS } from "./pillars";

/**
 * TREND RADAR — what is getting attention right now, and whether we can add
 * anything true to it.
 *
 * Timeliness is the only structural advantage a small publisher has. Nobody
 * out-authorities an established site on an evergreen term, but anyone can be the
 * clearest explanation of the thing that broke this morning. So this crawls the
 * places our audience actually reads, measures how fast attention is
 * accumulating, and scores each item on fit with what we genuinely know.
 *
 * THE RULE THAT KEEPS THIS USEFUL: relevance outweighs popularity. A story with
 * 2,000 points that has nothing to do with hosting scores near zero here, on
 * purpose. Chasing unrelated virality produces content nobody trusts, dilutes the
 * topical authority the library exists to build, and is the single most common
 * way a "trending content" tool makes a brand worse. The scoring is built so an
 * off-topic hit cannot reach the shortlist however hot it is.
 *
 * It also checks what we ALREADY publish. A trend we have covered becomes an
 * "update the existing piece" signal rather than a new article, which is the
 * cannibalisation rule applied at discovery time.
 *
 * Sources are all public and unauthenticated except Reddit:
 *   Hacker News (Algolia), DEV.to, Lobsters, GitHub search, Reddit (OAuth).
 */

const UA = "Kloudbean-SEO-Storyboard/1.0 (+https://www.kloudbean.com)";

export type TrendSource = "hackernews" | "reddit" | "devto" | "lobsters" | "github";

export type RawTrend = {
  source: TrendSource;
  sourceId: string;
  title: string;
  url: string | null;
  discussionUrl: string | null;
  summary: string | null;
  author: string | null;
  tags: string[];
  points: number;
  comments: number;
  publishedAt: Date | null;
};

/* -------------------------------------------------------------------------- *
 * Relevance model: the vocabulary we actually have standing to write about.
 * Mapped to the 10 clusters so a hit lands in a real part of the roadmap.
 * -------------------------------------------------------------------------- */

const CLUSTER_TERMS: { clusterId: number; weight: number; terms: string[] }[] = [
  {
    clusterId: 1,
    weight: 1.15, // our strongest, fastest-moving cluster
    terms: ["lovable", "bolt.new", "cursor", "v0", "replit", "windsurf", "claude code", "vibe coding", "ai-generated code", "ai builder", "copilot", "codex", "ai agent", "agentic"],
  },
  {
    clusterId: 2,
    weight: 1.0,
    terms: ["self-host", "self-hosted", "selfhosted", "n8n", "supabase", "gitlab", "open source alternative", "docker compose", "homelab", "appwrite", "nocodb", "plausible"],
  },
  {
    clusterId: 3,
    weight: 1.0,
    terms: ["deploy", "deployment", "next.js", "nextjs", "node.js", "nodejs", "laravel", "django", "fastapi", "rails", "astro", "nestjs", "pm2", "nginx", "bun", "deno"],
  },
  {
    clusterId: 4,
    weight: 1.1,
    terms: ["vercel", "netlify", "render.com", "railway", "heroku", "fly.io", "cloudways", "digitalocean", "app platform", "cloud run", "amplify", "pricing change", "price increase", "egress fees"],
  },
  {
    clusterId: 5,
    weight: 0.95,
    // Never the bare word "agency": it matched a Hacker News piece called "Anger,
    // Anxiety and Agency", which is exactly the kind of false positive that makes
    // a trend tool untrustworthy. Ambiguous single words need their qualifier.
    terms: ["digital agency", "web agency", "dev agency", "agency owner", "freelance", "client work", "client projects", "white label", "reseller", "multi-tenant"],
  },
  { clusterId: 6, weight: 0.9, terms: ["wordpress", "woocommerce", "elementor", "headless cms", "gutenberg"] },
  {
    clusterId: 7,
    weight: 1.0,
    terms: ["postgres", "postgresql", "mysql", "mariadb", "mongodb", "redis", "sqlite", "pgvector", "s3", "object storage", "connection pool", "read replica", "database migration"],
  },
  {
    clusterId: 8,
    weight: 1.05,
    terms: ["cloud bill", "cloud cost", "aws bill", "saas spend", "cost optimization", "cost optimisation", "surprise bill", "billing", "finops", "serverless cost"],
  },
  {
    clusterId: 9,
    weight: 1.0,
    terms: ["ddos", "waf", "firewall", "cve", "vulnerability", "supply chain attack", "npm package", "load balancer", "autoscaling", "kubernetes", "outage", "downtime", "postmortem", "incident", "ssl", "tls", "certificate"],
  },
  {
    clusterId: 10,
    weight: 1.0,
    terms: ["data residency", "data sovereignty", "gdpr", "pdpl", "compliance", "soc 2", "iso 27001", "hipaa", "saudi", "ksa", "dammam", "sovereign cloud", "eu cloud"],
  },
];

/** Infrastructure words that make an item plausibly ours even without a cluster hit. */
const DOMAIN_TERMS = [
  "hosting", "host", "server", "vps", "cloud", "devops", "infrastructure", "production",
  "latency", "uptime", "backup", "ci/cd", "container", "runtime", "database", "deploy",
];

/** Topics that are popular and emphatically not ours. Hard-excluded. */
const OFF_TOPIC = [
  "crypto", "bitcoin", "ethereum", "nft", "web3", "token price", "trading",
  "layoff", "politics", "election", "war", "ukraine", "israel", "gaza", "covid",
  "keyboard", "mechanical keyboard", "chair", "monitor setup", "salary negotiation",
  "leetcode", "interview question", "resume", "quantum", "physics", "space telescope",
  "game review", "steam deck", "movie", "netflix show",
];

/* -------------------------------------------------------------------------- *
 * Fetchers
 * -------------------------------------------------------------------------- */

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const stripTags = (s: string): string =>
  (s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x2F;/g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

/** Hacker News via the free Algolia API. Front page plus recent high scorers. */
export async function fetchHackerNews(hoursBack = 48): Promise<RawTrend[]> {
  const since = Math.floor(Date.now() / 1000) - hoursBack * 3600;
  type Hit = {
    objectID?: string;
    title?: string;
    url?: string | null;
    points?: number;
    num_comments?: number;
    created_at_i?: number;
    author?: string;
    story_text?: string | null;
  };
  const out: RawTrend[] = [];
  const endpoints = [
    "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=50",
    `https://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=created_at_i>${since},points>25&hitsPerPage=100`,
  ];
  for (const ep of endpoints) {
    const data = await getJson<{ hits?: Hit[] }>(ep);
    for (const h of data?.hits ?? []) {
      if (!h.objectID || !h.title) continue;
      out.push({
        source: "hackernews",
        sourceId: h.objectID,
        title: stripTags(h.title),
        url: h.url ?? null,
        discussionUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
        summary: h.story_text ? stripTags(h.story_text).slice(0, 500) : null,
        author: h.author ?? null,
        tags: [],
        points: h.points ?? 0,
        comments: h.num_comments ?? 0,
        publishedAt: h.created_at_i ? new Date(h.created_at_i * 1000) : null,
      });
    }
  }
  return out;
}

/** DEV.to top articles. Public API, no key. */
export async function fetchDevTo(): Promise<RawTrend[]> {
  type Article = {
    id?: number;
    title?: string;
    url?: string;
    description?: string;
    user?: { username?: string };
    tag_list?: string[];
    positive_reactions_count?: number;
    comments_count?: number;
    published_timestamp?: string;
  };
  const out: RawTrend[] = [];
  for (const q of ["top=1&per_page=50", "top=7&per_page=50"]) {
    const data = await getJson<Article[]>(`https://dev.to/api/articles?${q}`);
    for (const a of data ?? []) {
      if (!a.id || !a.title) continue;
      out.push({
        source: "devto",
        sourceId: String(a.id),
        title: stripTags(a.title),
        url: a.url ?? null,
        discussionUrl: a.url ?? null,
        summary: a.description ? stripTags(a.description).slice(0, 500) : null,
        author: a.user?.username ?? null,
        tags: a.tag_list ?? [],
        points: a.positive_reactions_count ?? 0,
        comments: a.comments_count ?? 0,
        publishedAt: a.published_timestamp ? new Date(a.published_timestamp) : null,
      });
    }
  }
  return out;
}

/** Lobsters hottest. Public JSON, technical audience, low noise. */
export async function fetchLobsters(): Promise<RawTrend[]> {
  type Story = {
    short_id?: string;
    title?: string;
    url?: string;
    comments_url?: string;
    score?: number;
    comment_count?: number;
    created_at?: string;
    submitter_user?: string | { username?: string };
    tags?: string[];
    description_plain?: string;
  };
  const data = await getJson<Story[]>("https://lobste.rs/hottest.json");
  const out: RawTrend[] = [];
  for (const s of data ?? []) {
    if (!s.short_id || !s.title) continue;
    const author =
      typeof s.submitter_user === "string" ? s.submitter_user : (s.submitter_user?.username ?? null);
    out.push({
      source: "lobsters",
      sourceId: s.short_id,
      title: stripTags(s.title),
      url: s.url || null,
      discussionUrl: s.comments_url ?? null,
      summary: s.description_plain ? stripTags(s.description_plain).slice(0, 500) : null,
      author,
      tags: s.tags ?? [],
      points: s.score ?? 0,
      comments: s.comment_count ?? 0,
      publishedAt: s.created_at ? new Date(s.created_at) : null,
    });
  }
  return out;
}

/**
 * GitHub repos that gained traction recently. A new tool everyone is starring is
 * a reliable early signal for "people will need to deploy this next month".
 * Works unauthenticated at a low rate limit; GITHUB_TOKEN raises it.
 */
export async function fetchGitHubTrending(daysBack = 30): Promise<RawTrend[]> {
  const since = new Date(Date.now() - daysBack * 86_400_000).toISOString().slice(0, 10);
  type Repo = {
    id?: number;
    full_name?: string;
    html_url?: string;
    description?: string | null;
    stargazers_count?: number;
    open_issues_count?: number;
    created_at?: string;
    topics?: string[];
    owner?: { login?: string };
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  const data = await getJson<{ items?: Repo[] }>(
    `https://api.github.com/search/repositories?q=created:>${since}+stars:>80&sort=stars&order=desc&per_page=50`,
    token ? { Authorization: `Bearer ${token}` } : {},
  );
  const out: RawTrend[] = [];
  for (const r of data?.items ?? []) {
    if (!r.id || !r.full_name) continue;
    out.push({
      source: "github",
      sourceId: String(r.id),
      title: `${r.full_name}: ${stripTags(r.description ?? "").slice(0, 120)}`.trim(),
      url: r.html_url ?? null,
      discussionUrl: r.html_url ?? null,
      summary: r.description ? stripTags(r.description).slice(0, 500) : null,
      author: r.owner?.login ?? null,
      tags: r.topics ?? [],
      points: r.stargazers_count ?? 0,
      comments: r.open_issues_count ?? 0,
      publishedAt: r.created_at ? new Date(r.created_at) : null,
    });
  }
  return out;
}

/** Reddit hot posts from our target communities. Uses the shared OAuth client. */
export async function fetchRedditTrending(subreddits: string[]): Promise<RawTrend[]> {
  const { redditJson, redditPause, RedditAccessError } = await import("./reddit-api");
  const out: RawTrend[] = [];
  for (const sub of subreddits) {
    type Listing = {
      data?: {
        children?: {
          data?: {
            name?: string;
            title?: string;
            url?: string;
            permalink?: string;
            selftext?: string;
            author?: string;
            score?: number;
            num_comments?: number;
            created_utc?: number;
            stickied?: boolean;
            over_18?: boolean;
            link_flair_text?: string | null;
          };
        }[];
      };
    };
    try {
      const data = await redditJson<Listing>(`/r/${encodeURIComponent(sub)}/hot.json?limit=25&raw_json=1`);
      for (const c of data?.data?.children ?? []) {
        const d = c.data;
        if (!d?.name || !d.title || d.stickied || d.over_18) continue;
        out.push({
          source: "reddit",
          sourceId: d.name,
          title: stripTags(d.title),
          url: d.url ?? null,
          discussionUrl: d.permalink ? `https://www.reddit.com${d.permalink}` : null,
          summary: d.selftext ? stripTags(d.selftext).slice(0, 500) : null,
          author: d.author ?? null,
          tags: [sub, ...(d.link_flair_text ? [d.link_flair_text] : [])],
          points: d.score ?? 0,
          comments: d.num_comments ?? 0,
          publishedAt: d.created_utc ? new Date(d.created_utc * 1000) : null,
        });
      }
    } catch (e) {
      // An access problem applies to every subreddit, so stop rather than repeat it.
      if (e instanceof RedditAccessError) break;
    }
    await redditPause(1200);
  }
  return out;
}

/* -------------------------------------------------------------------------- *
 * Scoring
 * -------------------------------------------------------------------------- */

type LibraryEntry = { slug: string; title: string; keyword: string };

function loadLibrary(): LibraryEntry[] {
  const cs = path.join(process.cwd(), "content-studio");
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
      /* slug is a fine fallback */
    }
    out.push({ slug, title, keyword });
  }
  return out;
}

export type ScoredTrend = RawTrend & {
  velocity: number;
  relevance: number;
  heat: number;
  clusterId: number | null;
  matchedTerms: string[];
  coveredBySlugs: string[];
  angle: string | null;
  angleKind: string;
};

/**
 * Engagement is not comparable across sources. A GitHub repo collects thousands
 * of stars where an HN front-page story collects hundreds of points, and a DEV.to
 * post in single digits. Without normalising, GitHub would win every time and
 * DEV.to would never appear. These divisors put one unit of engagement on roughly
 * the same footing across sources.
 */
const ENGAGEMENT_DIVISOR: Record<TrendSource, number> = {
  hackernews: 1,
  reddit: 1.5,
  lobsters: 0.5,
  devto: 0.6,
  github: 9,
};

/** Absolute floor. Below this, something is not trending by any definition. */
const MIN_ENGAGEMENT: Record<TrendSource, number> = {
  hackernews: 15,
  reddit: 15,
  lobsters: 8,
  devto: 12,
  github: 150,
};

/** Engagement per hour since publication, normalised per source. */
function computeVelocity(t: RawTrend): number {
  // A comment is a stronger signal of attention than an upvote: it costs effort.
  const engagement = ((t.points ?? 0) + (t.comments ?? 0) * 2) / ENGAGEMENT_DIVISOR[t.source];
  if (!t.publishedAt) return engagement / 24;
  const hours = Math.max(1.5, (Date.now() - t.publishedAt.getTime()) / 3_600_000);
  return engagement / hours;
}

/** True when the item simply has not attracted attention yet. */
export function belowEngagementFloor(t: RawTrend): boolean {
  return (t.points ?? 0) + (t.comments ?? 0) * 2 < MIN_ENGAGEMENT[t.source];
}

/**
 * Score an item's fit with what we can credibly write about.
 * Returns 0 for anything off-topic, which is what keeps the shortlist honest.
 */
function computeRelevance(t: RawTrend): {
  relevance: number;
  clusterId: number | null;
  matchedTerms: string[];
} {
  const hay = `${t.title} ${t.summary ?? ""} ${t.tags.join(" ")}`.toLowerCase();

  for (const bad of OFF_TOPIC) {
    if (hay.includes(bad)) return { relevance: 0, clusterId: null, matchedTerms: [] };
  }

  // We publish in English (Arabic is a separate, deliberate editorial track, not
  // something to trigger off a trending CJK repo). A predominantly CJK title is
  // not actionable for this library, so drop it rather than mistranslate a take.
  const cjk = (t.title.match(/[\u3000-\u9fff\uac00-\ud7af]/g) ?? []).length;
  if (cjk > 0 && cjk / Math.max(1, t.title.length) > 0.15) {
    return { relevance: 0, clusterId: null, matchedTerms: [] };
  }

  const matched: string[] = [];
  const clusterScores = new Map<number, number>();
  for (const { clusterId, weight, terms } of CLUSTER_TERMS) {
    for (const term of terms) {
      if (hay.includes(term)) {
        matched.push(term);
        clusterScores.set(clusterId, (clusterScores.get(clusterId) ?? 0) + weight);
      }
    }
  }

  const domainHits = DOMAIN_TERMS.filter((d) => new RegExp(`\\b${d.replace("/", "\\/")}\\b`).test(hay));

  // No cluster term and no domain word: not ours, whatever the score.
  if (clusterScores.size === 0 && domainHits.length === 0) {
    return { relevance: 0, clusterId: null, matchedTerms: [] };
  }

  // One lone keyword with no supporting infrastructure vocabulary is almost always
  // a coincidence rather than a topic we can write about. Requiring corroboration
  // is what stops the shortlist filling up with near-misses.
  if (matched.length === 1 && domainHits.length === 0) {
    return { relevance: 0, clusterId: null, matchedTerms: [] };
  }

  let best: number | null = null;
  let bestScore = 0;
  for (const [cid, score] of clusterScores) {
    if (score > bestScore) {
      bestScore = score;
      best = cid;
    }
  }

  // Cluster hits carry most of the weight; domain words alone cap out low, because
  // "server" appearing once does not mean we have anything to say.
  let relevance = Math.min(70, bestScore * 22) + Math.min(20, domainHits.length * 7);
  if (clusterScores.size === 0) relevance = Math.min(relevance, 30);
  if (clusterScores.size > 1) relevance += 6; // sits across two things we know

  return {
    relevance: Math.max(0, Math.min(100, relevance)),
    clusterId: best,
    matchedTerms: [...new Set([...matched, ...domainHits])].slice(0, 12),
  };
}

/** Which of our articles already cover this, so we extend rather than duplicate. */
function findCoverage(t: RawTrend, library: LibraryEntry[]): string[] {
  const words = new Set(
    `${t.title} ${t.tags.join(" ")}`
      .toLowerCase()
      .match(/\b[a-z][a-z0-9.+-]{2,}\b/g)
      ?.filter((w) => !STOP.has(w)) ?? [],
  );
  if (words.size < 2) return [];
  const scored: { slug: string; hits: number }[] = [];
  for (const e of library) {
    const target = `${e.title} ${e.keyword} ${e.slug.replace(/-/g, " ")}`.toLowerCase();
    let hits = 0;
    for (const w of words) if (target.includes(w)) hits++;
    if (hits >= 3) scored.push({ slug: e.slug, hits });
  }
  scored.sort((a, b) => b.hits - a.hits);
  return scored.slice(0, 3).map((s) => s.slug);
}

const STOP = new Set(
  "the a an and or for with your you how what why when where which can does is are it that this from into best new using use why not just why now has have will their there about over under more most than then them they our".split(
    " ",
  ),
);

/**
 * Suggest the shape of the piece. Deliberately conservative: when we have nothing
 * distinct to add, it says so ("none") rather than inventing a reason to publish.
 */
function suggestAngle(
  t: RawTrend,
  clusterId: number | null,
  covered: string[],
  matchedTerms: string[],
): { angle: string | null; angleKind: string } {
  if (clusterId == null) return { angle: null, angleKind: "none" };
  const cluster = CLUSTERS.find((c) => c.id === clusterId);
  const hay = `${t.title} ${t.summary ?? ""}`.toLowerCase();
  const topic = matchedTerms[0] ?? cluster?.short ?? "this";

  if (covered.length) {
    return {
      angle: `We already cover this in ${covered[0]}. Update that piece with what changed rather than publishing a second one, and add the new detail people are searching for.`,
      angleKind: "explainer",
    };
  }
  if (/outage|down|postmortem|incident|breach|cve|vulnerab/.test(hay)) {
    return {
      angle: `Write the operator's version: what actually broke, how to tell if you are exposed, and the specific change that prevents it. No speculation about the vendor.`,
      angleKind: "teardown",
    };
  }
  if (/price|pricing|bill|cost|charge|fee|egress/.test(hay)) {
    return {
      angle: `Price it out honestly for a real workload, including where a flat managed server loses. A cost piece that only flatters us gets dismantled in the comments.`,
      angleKind: "explainer",
    };
  }
  if (/launch|announc|releas|introduc|\bv\d|version/.test(hay)) {
    return {
      angle: `Explain what it changes for someone deploying it: the runtime it needs, what breaks in production, and whether it is worth adopting yet.`,
      angleKind: "how-to",
    };
  }
  if (/why|should|stop|never|myth|wrong|mistake|vs\b/.test(hay)) {
    return {
      angle: `Take a position with an argument. Where does this claim hold, where does it fall over, and what would you do on a real project?`,
      angleKind: "counterpoint",
    };
  }
  // Vary the default by source and cluster. A repeated suggestion line is easy to
  // stop reading, and the whole value of this field is that a human reads it.
  if (t.source === "github") {
    return {
      angle: `A tool people are adopting fast. Write the deployment reality: what it needs to run, where it breaks outside a demo, and whether it is worth putting in front of a client yet.`,
      angleKind: "how-to",
    };
  }
  if (t.source === "reddit") {
    return {
      angle: `A lot of people are describing this problem in one thread. Turn the best answer into the page that should have existed, covering ${topic} and the diagnosis path.`,
      angleKind: "how-to",
    };
  }
  const byCluster: Record<number, { angle: string; kind: string }> = {
    1: { angle: `Tie this to the deploy gap: what AI-generated code assumes about ${topic} and what production actually requires.`, kind: "how-to" },
    2: { angle: `Cover running this yourself honestly: what it costs to operate, what it needs, and when the hosted version is the smarter call.`, kind: "explainer" },
    7: { angle: `Write the data-layer version: how ${topic} behaves under real load, and the sizing or access mistake people make first.`, kind: "how-to" },
    9: { angle: `Write the operator's checklist: how to tell whether you are affected by this, and the one change that closes it.`, kind: "teardown" },
    10: { angle: `Cover the residency and compliance angle: what this means for data that cannot leave a region, without claiming certification.`, kind: "explainer" },
  };
  const pick = clusterId != null ? byCluster[clusterId] : undefined;
  if (pick) return { angle: pick.angle, angleKind: pick.kind };

  return {
    angle: `Write the practical version for ${topic}: the failure people hit first, how to diagnose it, and the fix.`,
    angleKind: "how-to",
  };
}

/**
 * Combine attention and relevance into one priority, as a GEOMETRIC mean.
 *
 * This is the important design choice in the whole module. A weighted sum lets a
 * highly relevant item with no engagement score well, which is exactly wrong for
 * a tool whose job is spotting what is hot: the first version of this ranked two
 * one-point blog posts above a repo with 8,887 stars. A geometric mean requires
 * BOTH to be present, so "relevant but nobody cares" and "huge but not ours" both
 * fall away, and only genuinely relevant momentum rises.
 */
function computeHeat(velocity: number, relevance: number): number {
  if (relevance <= 0 || velocity <= 0) return 0;
  // Log scale so one enormous story cannot dominate the whole shortlist.
  const attention = Math.min(100, Math.log10(1 + velocity) * 42);
  return Math.round(Math.sqrt(attention * relevance) * 100) / 100;
}

export function scoreTrend(t: RawTrend, library: LibraryEntry[]): ScoredTrend {
  const velocity = computeVelocity(t);
  const { relevance, clusterId, matchedTerms } = computeRelevance(t);
  const coveredBySlugs = relevance > 0 ? findCoverage(t, library) : [];
  const { angle, angleKind } = suggestAngle(t, clusterId, coveredBySlugs, matchedTerms);
  return {
    ...t,
    velocity: Math.round(velocity * 1000) / 1000,
    relevance,
    heat: computeHeat(velocity, relevance),
    clusterId,
    matchedTerms,
    coveredBySlugs,
    angle,
    angleKind,
  };
}

/* -------------------------------------------------------------------------- *
 * The crawl
 * -------------------------------------------------------------------------- */

/** Normalise a headline enough to recognise the same story with a different title. */
function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/^(show|ask)\s+hn:\s*/i, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .sort()
    .join(" ")
    .slice(0, 90);
}

/** Collapse the same story across sources, keeping the best-engaged copy. */
function dedupeAcrossSources(items: RawTrend[]): { item: RawTrend; sourceCount: number }[] {
  const groups = new Map<string, RawTrend[]>();
  for (const item of items) {
    const key = titleKey(item.title);
    if (!key) continue;
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  const out: { item: RawTrend; sourceCount: number }[] = [];
  for (const bucket of groups.values()) {
    const best = bucket.reduce((a, b) =>
      (b.points ?? 0) + (b.comments ?? 0) > (a.points ?? 0) + (a.comments ?? 0) ? b : a,
    );
    out.push({ item: best, sourceCount: new Set(bucket.map((b) => b.source)).size });
  }
  return out;
}

export type TrendCrawlResult = {
  fetched: number;
  scored: number;
  stored: number;
  rejectedOffTopic: number;
  belowThreshold: number;
  bySource: Record<string, number>;
  errors: string[];
};

/**
 * Crawl every source, score everything, store what is genuinely ours.
 *
 * `minHeat` is the shortlist gate. The default is deliberately high enough that a
 * quiet day produces an empty list, because an empty shortlist is a valid and
 * useful answer, and padding it with marginal topics is how this kind of tool
 * starts generating filler.
 */
export async function crawlTrends(
  opts: {
    sources?: TrendSource[];
    minHeat?: number;
    hoursBack?: number;
    subreddits?: string[];
  } = {},
): Promise<TrendCrawlResult> {
  const sources: TrendSource[] = opts.sources?.length
    ? opts.sources
    : ["hackernews", "devto", "lobsters", "github", "reddit"];
  const minHeat = opts.minHeat ?? 22;
  const errors: string[] = [];
  const bySource: Record<string, number> = {};
  const raw: RawTrend[] = [];

  const runners: Record<TrendSource, () => Promise<RawTrend[]>> = {
    hackernews: () => fetchHackerNews(opts.hoursBack ?? 48),
    devto: () => fetchDevTo(),
    lobsters: () => fetchLobsters(),
    github: () => fetchGitHubTrending(),
    reddit: () =>
      fetchRedditTrending(
        opts.subreddits ?? ["webdev", "node", "nextjs", "selfhosted", "devops", "SaaS", "vibecoding"],
      ),
  };

  for (const s of sources) {
    try {
      const items = await runners[s]();
      raw.push(...items);
      bySource[s] = items.length;
      if (items.length === 0) errors.push(`${s}: returned nothing (blocked, rate limited, or genuinely quiet)`);
    } catch (e) {
      errors.push(`${s}: ${String((e as Error)?.message ?? e)}`);
    }
  }

  const library = loadLibrary();
  const repo = await import("@/server/db/repos/trends");

  let stored = 0;
  let rejectedOffTopic = 0;
  let belowThreshold = 0;

  // The same story lands on Hacker News, Lobsters and Reddit within hours. Showing
  // it three times pads the shortlist and hides other topics. Keep the copy with
  // the most engagement, and treat multi-source pickup as what it actually is: a
  // stronger signal, worth a small boost.
  const deduped = dedupeAcrossSources(raw);

  for (const { item, sourceCount } of deduped) {
    // No attention yet means it is not a trend, whatever it is about.
    if (belowEngagementFloor(item)) {
      belowThreshold++;
      continue;
    }
    const scoredItem = scoreTrend(item, library);
    if (scoredItem.relevance <= 0) {
      rejectedOffTopic++;
      continue;
    }
    if (sourceCount > 1) {
      // Picked up independently by more than one community.
      scoredItem.heat = Math.round(scoredItem.heat * (1 + 0.12 * (sourceCount - 1)) * 100) / 100;
      scoredItem.matchedTerms = [...scoredItem.matchedTerms, `seen on ${sourceCount} sources`];
    }
    if (scoredItem.heat < minHeat) {
      belowThreshold++;
      continue;
    }
    try {
      await repo.upsertTrend(scoredItem);
      stored++;
    } catch (e) {
      errors.push(`store ${scoredItem.source}:${scoredItem.sourceId}: ${String((e as Error)?.message ?? e)}`);
    }
  }

  return {
    fetched: raw.length,
    scored: raw.length,
    stored,
    rejectedOffTopic,
    belowThreshold,
    bySource,
    errors,
  };
}
