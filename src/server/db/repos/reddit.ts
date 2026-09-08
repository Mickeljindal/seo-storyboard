import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { redditOpportunities } = schema;

/**
 * The community's own rules, captured with the opportunity. Given a concrete
 * shape rather than a loose record so it crosses the server-function boundary
 * as a serializable type.
 */
export type SubredditRules = {
  source?: string;
  why_targeted?: string;
  rules?: { short_name?: string; description?: string }[];
};

export type RedditOpportunity = {
  id: string;
  post_id: string;
  subreddit: string;
  title: string;
  permalink: string;
  author: string | null;
  flair: string | null;
  post_body: string | null;
  score: number;
  num_comments: number;
  created_utc: string | null;
  relevance: number;
  intent: string | null;
  matched_terms: string[];
  matched_article_slugs: string[];
  self_promo_allowed: string;
  subreddit_rules: SubredditRules | null;
  status: string;
  draft_reply: string | null;
  draft_grounded: boolean;
  posted_url: string | null;
  skip_reason: string | null;
  created_at: string;
};

function toApi(row: typeof redditOpportunities.$inferSelect): RedditOpportunity {
  return {
    id: row.id,
    post_id: row.postId,
    subreddit: row.subreddit,
    title: row.title,
    permalink: row.permalink,
    author: row.author ?? null,
    flair: row.flair ?? null,
    post_body: row.postBody ?? null,
    score: row.score ?? 0,
    num_comments: row.numComments ?? 0,
    created_utc: row.createdUtc?.toISOString?.() ?? null,
    relevance: Number(row.relevance ?? 0),
    intent: row.intent ?? null,
    matched_terms: row.matchedTerms ?? [],
    matched_article_slugs: row.matchedArticleSlugs ?? [],
    self_promo_allowed: row.selfPromoAllowed ?? "unknown",
    subreddit_rules: (row.subredditRules ?? null) as SubredditRules | null,
    status: row.status,
    draft_reply: row.draftReply ?? null,
    draft_grounded: row.draftGrounded ?? false,
    posted_url: row.postedUrl ?? null,
    skip_reason: row.skipReason ?? null,
    created_at: row.createdAt?.toISOString?.() ?? "",
  };
}

/**
 * Insert or refresh by Reddit post id. A re-crawl updates the volatile fields
 * (score, comment count, our relevance) but never overwrites human work: an
 * approved or posted row keeps its status and its draft.
 */
export async function upsertOpportunity(row: {
  postId: string;
  subreddit: string;
  title: string;
  permalink: string;
  author?: string | null;
  flair?: string | null;
  postBody?: string | null;
  score?: number;
  numComments?: number;
  createdUtc?: Date | null;
  relevance?: number;
  intent?: string | null;
  matchedTerms?: string[];
  matchedArticleSlugs?: string[];
  selfPromoAllowed?: string;
  subredditRules?: SubredditRules | null;
}): Promise<RedditOpportunity> {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(redditOpportunities)
    .where(eq(redditOpportunities.postId, row.postId))
    .limit(1);

  if (existing) {
    const humanTouched = ["approved", "posted", "skipped"].includes(existing.status);
    const [updated] = await db
      .update(redditOpportunities)
      .set({
        score: row.score ?? existing.score,
        numComments: row.numComments ?? existing.numComments,
        relevance: row.relevance != null ? String(row.relevance) : existing.relevance,
        matchedTerms: row.matchedTerms ?? existing.matchedTerms,
        matchedArticleSlugs: row.matchedArticleSlugs ?? existing.matchedArticleSlugs,
        selfPromoAllowed: row.selfPromoAllowed ?? existing.selfPromoAllowed,
        subredditRules: row.subredditRules ?? existing.subredditRules,
        // Only the untouched rows may have their status recomputed.
        status: humanTouched ? existing.status : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(redditOpportunities.id, existing.id))
      .returning();
    return toApi(updated);
  }

  const [inserted] = await db
    .insert(redditOpportunities)
    .values({
      postId: row.postId,
      subreddit: row.subreddit,
      title: row.title,
      permalink: row.permalink,
      author: row.author ?? null,
      flair: row.flair ?? null,
      postBody: row.postBody ?? null,
      score: row.score ?? 0,
      numComments: row.numComments ?? 0,
      createdUtc: row.createdUtc ?? null,
      relevance: row.relevance != null ? String(row.relevance) : "0",
      intent: row.intent ?? null,
      matchedTerms: row.matchedTerms ?? [],
      matchedArticleSlugs: row.matchedArticleSlugs ?? [],
      selfPromoAllowed: row.selfPromoAllowed ?? "unknown",
      subredditRules: row.subredditRules ?? null,
    })
    .returning();
  return toApi(inserted);
}

export async function listOpportunities(opts?: {
  status?: string;
  subreddit?: string;
  minRelevance?: number;
  limit?: number;
}): Promise<RedditOpportunity[]> {
  const db = await getDb();
  let q = db.select().from(redditOpportunities).$dynamic();
  const where = [];
  if (opts?.status) where.push(eq(redditOpportunities.status, opts.status));
  if (opts?.subreddit) where.push(eq(redditOpportunities.subreddit, opts.subreddit));
  if (opts?.minRelevance != null) {
    where.push(gte(redditOpportunities.relevance, String(opts.minRelevance)));
  }
  if (where.length) q = q.where(where.length === 1 ? where[0] : and(...where));
  q = q.orderBy(desc(redditOpportunities.relevance), desc(redditOpportunities.createdAt));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  return rows.map(toApi);
}

export async function getOpportunityById(id: string): Promise<RedditOpportunity | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(redditOpportunities)
    .where(eq(redditOpportunities.id, id))
    .limit(1);
  return row ? toApi(row) : null;
}

export async function saveDraftReply(
  id: string,
  draft: string,
  grounded: boolean,
): Promise<void> {
  const db = await getDb();
  await db
    .update(redditOpportunities)
    .set({ draftReply: draft, draftGrounded: grounded, status: "drafted", updatedAt: new Date() })
    .where(eq(redditOpportunities.id, id));
}

/** A human approved the draft. Still does not post it: that stays manual. */
export async function approveOpportunity(id: string): Promise<void> {
  const db = await getDb();
  await db
    .update(redditOpportunities)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(redditOpportunities.id, id));
}

export async function markOpportunityPosted(id: string, postedUrl: string): Promise<void> {
  const db = await getDb();
  await db
    .update(redditOpportunities)
    .set({ status: "posted", postedUrl, updatedAt: new Date() })
    .where(eq(redditOpportunities.id, id));
}

export async function skipOpportunity(id: string, reason: string): Promise<void> {
  const db = await getDb();
  await db
    .update(redditOpportunities)
    .set({ status: "skipped", skipReason: reason, updatedAt: new Date() })
    .where(eq(redditOpportunities.id, id));
}

/**
 * Threads still worth a human's attention, and how many already have a reply
 * written and waiting.
 *
 * Counting `status = 'new'` is the obvious thing and it is wrong, because
 * saveDraftReply moves a row from `new` to `drafted`. So a "new" count goes DOWN
 * every time the automation writes a reply, and a "has a reply" count built on
 * the same filter is stuck at zero forever. Actionable means new or drafted:
 * posted, approved and skipped rows are finished with.
 */
export async function countActionableOpportunities(): Promise<{
  total: number;
  withReply: number;
}> {
  const db = await getDb();
  try {
    const [r] = await db
      .select({
        total: count(),
        withReply: sql<number>`count(${redditOpportunities.draftReply})`,
      })
      .from(redditOpportunities)
      .where(inArray(redditOpportunities.status, ["new", "drafted"]));
    return { total: Number(r?.total ?? 0), withReply: Number(r?.withReply ?? 0) };
  } catch {
    return { total: 0, withReply: 0 };
  }
}

export async function countOpportunities(status?: string): Promise<number> {
  const db = await getDb();
  try {
    let q = db.select({ c: sql<number>`count(*)::int` }).from(redditOpportunities).$dynamic();
    if (status) q = q.where(eq(redditOpportunities.status, status));
    const [r] = await q;
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}
