import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { linkChecks, linkProspects, outreachActivity } = schema;

export type LinkCheck = {
  id: string;
  link_prospect_id: string;
  checked_url: string;
  http_status: number | null;
  found: boolean;
  found_url: string | null;
  anchor_text: string | null;
  rel_attributes: string | null;
  is_followed: boolean | null;
  link_count: number;
  notes: string | null;
  checked_at: string;
};

function toApi(row: typeof linkChecks.$inferSelect): LinkCheck {
  return {
    id: row.id,
    link_prospect_id: row.linkProspectId,
    checked_url: row.checkedUrl,
    http_status: row.httpStatus ?? null,
    found: row.found,
    found_url: row.foundUrl ?? null,
    anchor_text: row.anchorText ?? null,
    rel_attributes: row.relAttributes ?? null,
    is_followed: row.isFollowed ?? null,
    link_count: Number(row.linkCount ?? 0),
    notes: row.notes ?? null,
    checked_at: row.checkedAt?.toISOString?.() ?? "",
  };
}

export async function insertCheck(row: {
  linkProspectId: string;
  checkedUrl: string;
  httpStatus?: number | null;
  found: boolean;
  foundUrl?: string | null;
  anchorText?: string | null;
  relAttributes?: string | null;
  isFollowed?: boolean | null;
  linkCount?: number;
  notes?: string | null;
}): Promise<LinkCheck> {
  const db = await getDb();
  const [inserted] = await db
    .insert(linkChecks)
    .values({
      linkProspectId: row.linkProspectId,
      checkedUrl: row.checkedUrl,
      httpStatus: row.httpStatus ?? null,
      found: row.found,
      foundUrl: row.foundUrl ?? null,
      anchorText: row.anchorText ?? null,
      relAttributes: row.relAttributes ?? null,
      isFollowed: row.isFollowed ?? null,
      linkCount: row.linkCount ?? 0,
      notes: row.notes ?? null,
    })
    .returning();
  return toApi(inserted);
}

export async function listChecksFor(linkProspectId: string, limit = 10): Promise<LinkCheck[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(linkChecks)
    .where(eq(linkChecks.linkProspectId, linkProspectId))
    .orderBy(desc(linkChecks.checkedAt))
    .limit(limit);
  return rows.map(toApi);
}

/** Record the outcome on the prospect so the list can filter and sort on it. */
export async function applyFoundState(
  id: string,
  v: {
    found: boolean;
    isFollowed?: boolean | null;
    anchor?: string | null;
    foundUrl?: string | null;
    markWon?: boolean;
  },
): Promise<void> {
  const db = await getDb();
  await db
    .update(linkProspects)
    .set({
      linkFound: v.found,
      linkIsFollowed: v.found ? (v.isFollowed ?? null) : null,
      linkAnchor: v.found ? (v.anchor ?? null) : null,
      linkFoundAt: v.found ? new Date() : null,
      lastCheckedAt: new Date(),
      checkCount: sql`coalesce(${linkProspects.checkCount}, 0) + 1`,
      // Only a followed link is a win. A nofollow is recorded honestly and left in
      // its previous stage rather than being promoted into the win column.
      ...(v.markWon ? { status: "won", wonUrl: v.foundUrl ?? null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(linkProspects.id, id));

  if (v.found) {
    await db.insert(outreachActivity).values({
      linkProspectId: id,
      action: v.markWon ? "link_found" : "verified",
      actor: "automation",
      detail: v.markWon
        ? `link found and it is followed: ${v.foundUrl ?? ""}`
        : `link found but marked nofollow or sponsored: ${v.foundUrl ?? ""}`,
    });
  }
}

/**
 * The link was there and is not any more.
 *
 * Kept as its own transition rather than folded into applyFoundState, because
 * losing a link is a real event: it deserves a timestamp, an activity row, and a
 * status that says so instead of quietly reverting to "contacted" as though the win
 * never happened.
 */
export async function applyLostState(id: string, reason: string): Promise<void> {
  const db = await getDb();
  await db
    .update(linkProspects)
    .set({
      linkFound: false,
      linkLostAt: new Date(),
      linkIsFollowed: null,
      lastCheckedAt: new Date(),
      checkCount: sql`coalesce(${linkProspects.checkCount}, 0) + 1`,
      status: "lost",
      notes: reason,
      updatedAt: new Date(),
    })
    .where(eq(linkProspects.id, id));

  await db.insert(outreachActivity).values({
    linkProspectId: id,
    action: "link_lost",
    actor: "automation",
    detail: reason,
  });
}

/**
 * Who is due for a link check, and in what order.
 *
 * The schedule encodes where a link is most likely to be found, and how much it
 * matters to find out quickly:
 *
 *   replied positively   every 2 days   — most likely to convert, most worth knowing
 *   confirmed link       every 21 days  — watching for removal, which is common
 *   emailed, no reply    every 7 days   — plenty of publishers add a link and never
 *                                         reply, so never checking these undercounts
 *   never checked        immediately    — establish a baseline
 *
 * Written as one SQL statement rather than several queries because the ordering
 * across those groups is the point: a fixed per-group limit would starve whichever
 * group came last.
 */
export async function listDueForVerification(limit = 20): Promise<any[]> {
  const db = await getDb();
  try {
    const r: any = await db.execute(
      `select lp.*
         from link_prospects lp
        where lp.status in ('contacted','replied','won','lost')
          and (
                lp.last_checked_at is null
             or (lp.status = 'replied' and lp.last_checked_at < now() - interval '2 days')
             or (lp.link_found = true and lp.last_checked_at < now() - interval '21 days')
             or (lp.status = 'contacted' and lp.last_checked_at < now() - interval '7 days')
             or (lp.status = 'lost' and lp.last_checked_at < now() - interval '30 days')
          )
        order by
          case
            when lp.last_checked_at is null then 0
            when lp.status = 'replied' then 1
            when lp.link_found = true then 2
            else 3
          end,
          lp.value_score desc
        limit ${Number(limit)}`,
    );
    const rows = r.rows ?? r;
    // Map to the snake_case shape the verifier expects from listLinkProspects.
    return rows.map((row: any) => ({
      id: row.id,
      domain: row.domain,
      homepage_url: row.homepage_url,
      best_source_url: row.best_source_url,
      link_found: row.link_found,
      status: row.status,
      value_score: Number(row.value_score ?? 0),
    }));
  } catch {
    return [];
  }
}

/** Verification counts for the dashboard. */
export async function verificationSummary(): Promise<{
  checked: number;
  liveFollowed: number;
  liveNofollow: number;
  notFound: number;
  lost: number;
  neverChecked: number;
}> {
  const db = await getDb();
  const out = {
    checked: 0,
    liveFollowed: 0,
    liveNofollow: 0,
    notFound: 0,
    lost: 0,
    neverChecked: 0,
  };
  try {
    const r: any = await db.execute(
      `select
         count(*) filter (where last_checked_at is not null)::int as checked,
         count(*) filter (where link_found = true and link_is_followed = true)::int as live_followed,
         count(*) filter (where link_found = true and link_is_followed = false)::int as live_nofollow,
         count(*) filter (where link_found = false and link_lost_at is null)::int as not_found,
         count(*) filter (where link_lost_at is not null)::int as lost,
         count(*) filter (where last_checked_at is null and status in ('contacted','replied','won'))::int as never_checked
       from link_prospects`,
    );
    const a = (r.rows ?? r)[0] ?? {};
    out.checked = Number(a.checked ?? 0);
    out.liveFollowed = Number(a.live_followed ?? 0);
    out.liveNofollow = Number(a.live_nofollow ?? 0);
    out.notFound = Number(a.not_found ?? 0);
    out.lost = Number(a.lost ?? 0);
    out.neverChecked = Number(a.never_checked ?? 0);
  } catch {
    /* table optional */
  }
  return out;
}

/* ------------------------------- activity --------------------------------- */

export type Activity = {
  id: string;
  action: string;
  actor: string;
  detail: string | null;
  created_at: string;
};

/**
 * Record an action. Called by every write path, human or automatic.
 *
 * Never throws: an audit failure must not roll back the thing it was recording, and
 * losing one log line is far better than losing the approval it described.
 */
export async function logActivity(row: {
  linkProspectId?: string | null;
  prospectId?: string | null;
  messageId?: string | null;
  action: string;
  actor?: "human" | "automation";
  detail?: string | null;
}): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(outreachActivity).values({
      linkProspectId: row.linkProspectId ?? null,
      prospectId: row.prospectId ?? null,
      messageId: row.messageId ?? null,
      action: row.action,
      actor: row.actor ?? "human",
      detail: row.detail ?? null,
    });
  } catch {
    /* an audit failure must never break the action it describes */
  }
}

export async function listActivityFor(
  linkProspectId: string,
  limit = 20,
): Promise<Activity[]> {
  const db = await getDb();
  try {
    const rows = await db
      .select()
      .from(outreachActivity)
      .where(eq(outreachActivity.linkProspectId, linkProspectId))
      .orderBy(desc(outreachActivity.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      actor: r.actor,
      detail: r.detail ?? null,
      created_at: r.createdAt?.toISOString?.() ?? "",
    }));
  } catch {
    return [];
  }
}

export async function listRecentActivity(limit = 40): Promise<
  (Activity & { domain: string | null })[]
> {
  const db = await getDb();
  try {
    const r: any = await db.execute(
      `select a.id, a.action, a.actor, a.detail, a.created_at, lp.domain
         from outreach_activity a
         left join link_prospects lp on lp.id = a.link_prospect_id
        order by a.created_at desc
        limit ${Number(limit)}`,
    );
    return (r.rows ?? r).map((x: any) => ({
      id: x.id,
      action: x.action,
      actor: x.actor,
      detail: x.detail ?? null,
      created_at: x.created_at ? new Date(x.created_at).toISOString() : "",
      domain: x.domain ?? null,
    }));
  } catch {
    return [];
  }
}
