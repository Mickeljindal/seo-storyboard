import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { pendingInternalLinks } = schema;

/**
 * The deferred-link ledger.
 *
 * When an article publishes, any internal link whose target is not live yet is
 * stripped to plain text and recorded here. When the target goes live, the
 * healer looks up everything waiting on it and inserts the real links into the
 * already-published source posts.
 */

export type PendingLinkInput = {
  from_slug: string;
  target_slug: string;
  anchor_text: string;
};

export type PendingLink = {
  id: string;
  from_slug: string;
  target_slug: string;
  anchor_text: string;
  status: string;
  attempts: number;
  error: string | null;
};

function toApi(row: typeof pendingInternalLinks.$inferSelect): PendingLink {
  return {
    id: row.id,
    from_slug: row.fromSlug,
    target_slug: row.targetSlug,
    anchor_text: row.anchorText,
    status: row.status,
    attempts: row.attempts ?? 0,
    error: row.error ?? null,
  };
}

/**
 * Record links that could not be published live yet.
 *
 * Deliberately tolerant: a duplicate (from, target, anchor) while still pending
 * hits the partial unique index and is counted as skipped rather than throwing,
 * so re-publishing an article never piles up duplicate work.
 */
export async function recordPendingLinks(
  rows: PendingLinkInput[],
): Promise<{ inserted: number; skipped: number }> {
  if (!rows.length) return { inserted: 0, skipped: 0 };
  const db = await getDb();
  let inserted = 0;
  let skipped = 0;
  for (const r of rows) {
    const anchor = r.anchor_text?.trim();
    if (!r.from_slug || !r.target_slug || !anchor) {
      skipped++;
      continue;
    }
    if (r.from_slug === r.target_slug) {
      skipped++; // never link an article to itself
      continue;
    }
    try {
      await db.insert(pendingInternalLinks).values({
        fromSlug: r.from_slug,
        targetSlug: r.target_slug,
        anchorText: anchor,
      });
      inserted++;
    } catch {
      skipped++; // already pending for this exact triple
    }
  }
  return { inserted, skipped };
}

/**
 * Everything waiting for `targetSlug` to go live.
 * This is the healer's hot path, backed by idx_pending_links_target_status.
 */
export async function listPendingForTarget(
  targetSlug: string,
  opts: { limit?: number; maxAttempts?: number } = {},
): Promise<PendingLink[]> {
  const db = await getDb();
  const maxAttempts = opts.maxAttempts ?? 3;
  const rows = await db
    .select()
    .from(pendingInternalLinks)
    .where(
      and(
        eq(pendingInternalLinks.targetSlug, targetSlug),
        eq(pendingInternalLinks.status, "pending"),
        sql`coalesce(${pendingInternalLinks.attempts}, 0) < ${maxAttempts}`,
      ),
    )
    .limit(opts.limit ?? 500);
  return rows.map(toApi);
}

/**
 * Pending links whose target is now live, across all targets.
 * Used by the autopilot drain so nothing is missed if a publish event was lost.
 */
export async function listApplicablePending(
  liveSlugs: string[],
  opts: { limit?: number; maxAttempts?: number } = {},
): Promise<PendingLink[]> {
  if (!liveSlugs.length) return [];
  const db = await getDb();
  const maxAttempts = opts.maxAttempts ?? 3;
  const rows = await db
    .select()
    .from(pendingInternalLinks)
    .where(
      and(
        eq(pendingInternalLinks.status, "pending"),
        inArray(pendingInternalLinks.targetSlug, liveSlugs),
        sql`coalesce(${pendingInternalLinks.attempts}, 0) < ${maxAttempts}`,
      ),
    )
    .limit(opts.limit ?? 100);
  return rows.map(toApi);
}

export async function markApplied(id: string): Promise<void> {
  const db = await getDb();
  await db
    .update(pendingInternalLinks)
    .set({ status: "applied", appliedAt: new Date(), error: null, updatedAt: new Date() })
    .where(eq(pendingInternalLinks.id, id));
}

/**
 * Not an error, just not actionable: the anchor text is no longer in the post,
 * or the post already links to the target. Closed so it stops being retried.
 */
export async function markSkipped(id: string, reason: string): Promise<void> {
  const db = await getDb();
  await db
    .update(pendingInternalLinks)
    .set({ status: "skipped", error: reason, updatedAt: new Date() })
    .where(eq(pendingInternalLinks.id, id));
}

/** A real failure. Stays pending, attempts increments so it cannot loop forever. */
export async function markAttemptFailed(id: string, error: string): Promise<void> {
  const db = await getDb();
  await db
    .update(pendingInternalLinks)
    .set({
      attempts: sql`coalesce(${pendingInternalLinks.attempts}, 0) + 1`,
      lastAttemptAt: new Date(),
      error,
      updatedAt: new Date(),
    })
    .where(eq(pendingInternalLinks.id, id));
}

/** Drop pending rows for an article, e.g. before re-recording on a republish. */
export async function clearPendingFrom(fromSlug: string): Promise<number> {
  const db = await getDb();
  const rows = await db
    .delete(pendingInternalLinks)
    .where(
      and(eq(pendingInternalLinks.fromSlug, fromSlug), eq(pendingInternalLinks.status, "pending")),
    )
    .returning({ id: pendingInternalLinks.id });
  return rows.length;
}

export type PendingLinkStats = {
  pending: number;
  applied: number;
  skipped: number;
  blocked: number;
  topTargets: { target_slug: string; waiting: number }[];
};

/** Dashboard/report summary: how much of the mesh is still owed. */
export async function pendingLinkStats(): Promise<PendingLinkStats> {
  const db = await getDb();
  const counts = await db
    .select({ status: pendingInternalLinks.status, n: sql<number>`count(*)::int` })
    .from(pendingInternalLinks)
    .groupBy(pendingInternalLinks.status);

  const blockedRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(pendingInternalLinks)
    .where(
      and(
        eq(pendingInternalLinks.status, "pending"),
        sql`coalesce(${pendingInternalLinks.attempts}, 0) >= 3`,
      ),
    );

  const top = await db
    .select({
      target_slug: pendingInternalLinks.targetSlug,
      waiting: sql<number>`count(*)::int`,
    })
    .from(pendingInternalLinks)
    .where(eq(pendingInternalLinks.status, "pending"))
    .groupBy(pendingInternalLinks.targetSlug)
    .orderBy(sql`count(*) desc`)
    .limit(15);

  const by = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  return {
    pending: by("pending"),
    applied: by("applied"),
    skipped: by("skipped"),
    blocked: blockedRows[0]?.n ?? 0,
    topTargets: top,
  };
}
