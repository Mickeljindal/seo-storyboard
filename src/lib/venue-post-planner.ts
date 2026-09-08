import "@tanstack/react-start/server-only";
import { buildChannelAsset } from "./distribution-channels";
import { loadLibrary } from "./reddit-listener";
import { CLUSTERS } from "./pillars";

/**
 * VENUE POST PLANNER — answers the three questions a list of communities does not.
 *
 *   WHY is this one right for Kloudbean?   (the selection reasoning, shown openly)
 *   HOW are we allowed to post there?      (that community's rules, as a checklist)
 *   WHAT exactly can we post?              (real articles from our library, with a draft)
 *
 * The reasoning is exposed rather than hidden because a score on its own is not
 * trustworthy. If the tool says "fit 90" and cannot say which words it matched,
 * nobody should act on it. Everything below is derived from data we actually hold:
 * the community's own description and rules, and the articles that genuinely exist
 * in content-studio. No suggestion is invented.
 */

export type PostCandidate = {
  slug: string;
  title: string;
  url: string;
  /** Why this specific article suits this specific community. */
  reason: string;
  /** Ready-to-paste text, already shaped by the community's promo policy. */
  draft: string;
  /** True when the draft carries no link because the community forbids them. */
  linkFree: boolean;
};

export type VenuePlan = {
  venue: string;
  platform: string;
  /** Bullet reasons this venue was selected, in plain language. */
  whyChosen: string[];
  /** What we are permitted to do here, as an ordered checklist. */
  howToPost: string[];
  /** Real articles we could lead with, best match first. */
  whatToPost: PostCandidate[];
  /** Stated plainly when the rules could not be read. */
  caveat: string | null;
};

const BLOG = "https://www.kloudbean.com/blog";

/** Words that make an article a good fit for a community about a given subject. */
function scoreArticleForVenue(
  article: { slug: string; title: string; keyword: string; live: boolean },
  terms: string[],
  venueName: string,
): { score: number; hits: string[] } {
  const hay = `${article.title} ${article.keyword} ${article.slug.replace(/-/g, " ")}`.toLowerCase();
  const hits: string[] = [];
  let score = 0;

  // The community's own name is the strongest signal of what belongs there.
  const nameTerm = venueName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (nameTerm.length > 2 && hay.replace(/[^a-z0-9]/g, "").includes(nameTerm)) {
    score += 40;
    hits.push(venueName);
  }
  for (const t of terms) {
    const term = t.toLowerCase();
    if (term.length < 3) continue;
    if (hay.includes(term)) {
      score += 12;
      hits.push(t);
    }
  }
  // A published article can be linked; an unpublished one cannot.
  if (article.live) score += 8;
  return { score, hits: [...new Set(hits)].slice(0, 5) };
}

/**
 * Build the plan for one venue.
 *
 * `selfPromoAllowed` drives the whole shape of the output: where links are banned
 * the drafts come back link-free and the checklist says so, because the failure
 * mode here is not a bad post, it is a banned account.
 */
export function planVenuePosts(input: {
  name: string;
  platform: string;
  selfPromoAllowed: string;
  matchedTerms: string[];
  topicalFit: number;
  subscribers: number;
  activeUsers: number;
  recommendation: string;
  submissionNotes: string | null;
  description: string | null;
  rulesCount: number;
}): VenuePlan {
  const linksAllowed = input.selfPromoAllowed === "yes" || input.selfPromoAllowed === "limited";
  const rulesUnknown = input.selfPromoAllowed === "unknown";

  /* ------------------------------- WHY ---------------------------------- */
  // Plain and short. The point is that a human can check our reasoning in seconds.
  const whyChosen: string[] = [];
  if (input.matchedTerms.length) {
    whyChosen.push(`They talk about ${input.matchedTerms.slice(0, 5).join(", ")}. We write about all of that.`);
  }
  whyChosen.push(`Match score ${Math.round(input.topicalFit)} out of 100.`);
  if (input.subscribers > 0) {
    whyChosen.push(
      `${input.subscribers.toLocaleString()} members, ${input.activeUsers} online now. We rank busy small groups above big quiet ones.`,
    );
  } else {
    whyChosen.push("Member count not available, so this score is based on the topic match only.");
  }
  if (input.recommendation === "participate") {
    whyChosen.push("Answer questions here, do not share links. These groups trust what they read, so it is worth it.");
  }
  if (input.recommendation === "post") {
    whyChosen.push("Good match and links are allowed here, with limits.");
  }

  /* ------------------------------- HOW ---------------------------------- */
  // Kept short and plain on purpose. Long instructions do not get read at the
  // moment someone is about to post.
  const howToPost: string[] = [];
  if (rulesUnknown) {
    howToPost.push("Read the sidebar rules first. We could not fetch them, so do not add a link yet.");
  }
  howToPost.push("Answer the question fully in the comment. They may never click a link.");
  if (linksAllowed) {
    howToPost.push("One link at the end. Say you work at Kloudbean.");
  } else {
    howToPost.push("No link. No product mention. This community bans self-promotion.");
  }
  if (input.submissionNotes) {
    howToPost.push(`This community also asks: ${input.submissionNotes}.`);
  }
  howToPost.push("Use an account with some history here, and reply to follow-ups.");

  /* ------------------------------ WHAT ---------------------------------- */
  const library = loadLibrary();
  const scored = library
    .map((a) => ({ a, ...scoreArticleForVenue(a, input.matchedTerms, input.name) }))
    .filter((x) => x.score >= 20)
    .sort((x, y) => y.score - x.score)
    .slice(0, 4);

  const whatToPost: PostCandidate[] = scored.map(({ a, hits }) => {
    const url = `${BLOG}/${a.slug}/`;
    const asset = buildChannelAsset(linksAllowed ? "reddit" : "community_chat", {
      slug: a.slug,
      title: a.title,
      url,
      summary: a.keyword ? `Covers ${a.keyword}.` : a.title,
      points: [],
      tags: [],
      social: null,
    });
    let draft = asset?.body ?? "";
    if (!linksAllowed) {
      // Strip everything promotional: in a no-promo community the only acceptable
      // contribution is the answer itself.
      draft = draft
        .split("\n")
        .filter((l) => !/kloudbean|https?:\/\//i.test(l))
        .join("\n")
        .trim();
      draft =
        draft ||
        `Answer this from the article "${a.title}" in your own words. Give the diagnosis and the fix, and do not mention or link Kloudbean.`;
    }
    return {
      slug: a.slug,
      title: a.title,
      url,
      reason: hits.length
        ? `Matches on ${hits.join(", ")}${a.live ? " and is already published, so it can be linked" : ", but is not published yet, so do not link it"}.`
        : a.live
          ? "General fit, already published."
          : "General fit, not published yet.",
      draft,
      linkFree: !linksAllowed,
    };
  });

  return {
    venue: input.name,
    platform: input.platform,
    whyChosen,
    howToPost,
    whatToPost,
    caveat: rulesUnknown
      ? "Rules could not be read for this community, so nothing here assumes a link is allowed."
      : input.rulesCount === 0
        ? "This community publishes no machine-readable rules. Check the sidebar."
        : null,
  };
}

/**
 * The same three questions for a TREND rather than a venue: why it surfaced, what
 * we would actually publish, and where that piece then goes.
 */
export type TrendPlan = {
  title: string;
  whyChosen: string[];
  whatToWrite: string[];
  /** Existing articles to update instead of writing something new. */
  updateInstead: string[];
  whereToPost: string[];
};

export function planTrendAction(input: {
  title: string;
  source: string;
  points: number;
  comments: number;
  velocity: number;
  relevance: number;
  heat: number;
  clusterId: number | null;
  matchedTerms: string[];
  coveredBySlugs: string[];
  angle: string | null;
}): TrendPlan {
  const cluster = input.clusterId != null ? CLUSTERS.find((c) => c.id === input.clusterId) : null;

  // Plain language. Every number is explained in one short sentence.
  const whyChosen = [
    `Lots of people are reading it: ${input.points} upvotes and ${input.comments} comments on ${input.source}, about ${Math.round(input.velocity)} per hour. Fast and new beats big and old.`,
    `It is our topic${cluster ? ` (${cluster.short})` : ""}. It talks about ${input.matchedTerms.slice(0, 5).join(", ") || "hosting and servers"}.`,
    `Score ${Math.round(input.heat)}. A topic needs both: people reading it AND us knowing about it. One without the other does not show up here.`,
  ];

  const whatToWrite = [
    input.angle ?? "Write the practical version: what breaks first, how to spot it, and the fix.",
    "Only say things about Kloudbean that our docs confirm. If you are unsure, leave it out.",
    "Add one thing only we can say: a real error we see, a real command, or an honest limit of ours.",
  ];

  const whereToPost = input.coveredBySlugs.length
    ? [
        "Update the article we already have, then share it again.",
        "Reply in the original discussion. Answer the question there, link only if that group allows it.",
      ]
    : [
        "Write and publish the article. Posts for all 12 channels are then created for you.",
        "Reply in the discussion that found this. Answer first, link second.",
        "Email list and LinkedIn work best for this audience.",
      ];

  return {
    title: input.title,
    whyChosen,
    whatToWrite,
    updateInstead: input.coveredBySlugs,
    whereToPost,
  };
}
