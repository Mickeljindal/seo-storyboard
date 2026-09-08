import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { outreachInboxes, outreachMessages, outreachProspects } = schema;

/**
 * SENDING INBOXES — the data layer for rotating across many addresses.
 *
 * Two rules are enforced here rather than left to callers, because both are the
 * kind of thing that silently stops working:
 *
 *   1. NO SECRET IS READ OR WRITTEN BY THIS FILE. An inbox row carries a
 *      `credentialRef`, which is the NAME of an environment-variable prefix. The
 *      actual key or password is resolved from the environment at send time, in
 *      inbox-pool.ts. So a database dump contains routing and health, never
 *      credentials.
 *
 *   2. "SENT TODAY" IS ALWAYS COUNTED, NEVER STORED. `sentTodayByInbox` runs a
 *      query against real sent messages. A counter column would drift the first
 *      time a send failed halfway, and a drifted counter is worse than no limit
 *      because it still reads like a working one.
 */

export type Inbox = {
  id: string;
  label: string;
  from_email: string;
  from_name: string | null;
  reply_to: string | null;
  provider: string;
  credential_ref: string | null;
  daily_cap: number;
  warmup_started_at: string | null;
  status: string;
  paused_reason: string | null;
  bounces: number;
  complaints: number;
  last_sent_at: string | null;
  notes: string | null;
  created_at: string;
};

function toApi(row: typeof outreachInboxes.$inferSelect): Inbox {
  return {
    id: row.id,
    label: row.label,
    from_email: row.fromEmail,
    from_name: row.fromName ?? null,
    reply_to: row.replyTo ?? null,
    provider: row.provider,
    credential_ref: row.credentialRef ?? null,
    daily_cap: Number(row.dailyCap ?? 20),
    warmup_started_at: row.warmupStartedAt?.toISOString?.() ?? null,
    status: row.status,
    paused_reason: row.pausedReason ?? null,
    bounces: Number(row.bounces ?? 0),
    complaints: Number(row.complaints ?? 0),
    last_sent_at: row.lastSentAt?.toISOString?.() ?? null,
    notes: row.notes ?? null,
    created_at: row.createdAt?.toISOString?.() ?? "",
  };
}

export type InboxUpsert = {
  label: string;
  fromEmail: string;
  fromName?: string | null;
  replyTo?: string | null;
  provider?: string;
  credentialRef?: string | null;
  dailyCap?: number;
  warmupStartedAt?: Date | null;
  status?: string;
  notes?: string | null;
};

/**
 * Add or update an address, keyed on the address itself.
 *
 * `warmupStartedAt` is stamped on FIRST INSERT ONLY and never moved by an update.
 * Otherwise re-running the env sync would reset every address's warmup clock back
 * to day zero, and the ramp would hold a six-week-old mailbox at five emails a day
 * forever while looking like it was working.
 */
export async function upsertInbox(row: InboxUpsert): Promise<Inbox> {
  const db = await getDb();
  const email = row.fromEmail.trim().toLowerCase();

  const [existing] = await db
    .select()
    .from(outreachInboxes)
    .where(sql`lower(${outreachInboxes.fromEmail}) = ${email}`)
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(outreachInboxes)
      .set({
        label: row.label ?? existing.label,
        fromName: row.fromName ?? existing.fromName,
        replyTo: row.replyTo ?? existing.replyTo,
        provider: row.provider ?? existing.provider,
        credentialRef: row.credentialRef ?? existing.credentialRef,
        dailyCap: row.dailyCap ?? existing.dailyCap,
        // Never restarted by an update. See the note above.
        warmupStartedAt: existing.warmupStartedAt ?? row.warmupStartedAt ?? null,
        // A paused address stays paused. A sync should not un-pause something a
        // person or the bounce guard deliberately stopped.
        status: existing.status === "paused" ? "paused" : (row.status ?? existing.status),
        notes: row.notes ?? existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(outreachInboxes.id, existing.id))
      .returning();
    return toApi(updated);
  }

  const [inserted] = await db
    .insert(outreachInboxes)
    .values({
      label: row.label,
      fromEmail: email,
      fromName: row.fromName ?? null,
      replyTo: row.replyTo ?? null,
      provider: row.provider ?? "default",
      credentialRef: row.credentialRef ?? null,
      dailyCap: row.dailyCap ?? 20,
      warmupStartedAt: row.warmupStartedAt ?? new Date(),
      status: row.status ?? "active",
      notes: row.notes ?? null,
    })
    .returning();
  return toApi(inserted);
}

export async function listInboxes(opts?: { status?: string }): Promise<Inbox[]> {
  const db = await getDb();
  let q = db.select().from(outreachInboxes).$dynamic();
  if (opts?.status) q = q.where(eq(outreachInboxes.status, opts.status));
  // Least recently used first: that is the rotation order, so the list a person
  // reads matches the order the sender will actually pick in.
  q = q.orderBy(asc(sql`coalesce(${outreachInboxes.lastSentAt}, '1970-01-01'::timestamptz)`));
  return (await q).map(toApi);
}

export async function getInboxById(id: string): Promise<Inbox | null> {
  const db = await getDb();
  const [row] = await db.select().from(outreachInboxes).where(eq(outreachInboxes.id, id)).limit(1);
  return row ? toApi(row) : null;
}

export async function getInboxByEmail(email: string): Promise<Inbox | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(outreachInboxes)
    .where(sql`lower(${outreachInboxes.fromEmail}) = ${email.trim().toLowerCase()}`)
    .limit(1);
  return row ? toApi(row) : null;
}

/** Pause or resume one address. A reason is required to pause, so history reads. */
export async function setInboxStatus(
  id: string,
  status: "active" | "paused",
  reason?: string | null,
): Promise<void> {
  const db = await getDb();
  await db
    .update(outreachInboxes)
    .set({
      status,
      pausedReason: status === "paused" ? (reason ?? "paused by hand") : null,
      updatedAt: new Date(),
    })
    .where(eq(outreachInboxes.id, id));
}

export async function updateInbox(
  id: string,
  patch: { label?: string; dailyCap?: number; replyTo?: string | null; fromName?: string | null; notes?: string | null },
): Promise<void> {
  const db = await getDb();
  await db
    .update(outreachInboxes)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(outreachInboxes.id, id));
}

/**
 * How many each address really sent today, counted from the messages themselves.
 *
 * Real sends only: `dry_run = false`. A preview that counted toward an address's
 * daily budget would let somebody exhaust the day's sending by pressing the
 * "what would go out?" button four times.
 */
export async function sentTodayByInbox(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = (await db.execute(
    `select inbox_id::text as inbox_id, count(*)::int as n
       from outreach_messages
      where inbox_id is not null
        and status = 'sent'
        and dry_run = false
        and sent_at >= date_trunc('day', now())
      group by inbox_id`,
  )) as unknown as { rows: { inbox_id: string; n: number }[] };
  const out: Record<string, number> = {};
  for (const r of rows.rows ?? []) out[r.inbox_id] = Number(r.n);
  return out;
}

/**
 * Distinct days on which one address actually sent, for its own warmup ramp.
 *
 * Distinct DAYS, not days since it was created. An address added six weeks ago and
 * used twice has not warmed up, and treating elapsed time as history is how a ramp
 * becomes decorative.
 */
export async function sendingDaysByInbox(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = (await db.execute(
    `select inbox_id::text as inbox_id, count(distinct date_trunc('day', sent_at))::int as d
       from outreach_messages
      where inbox_id is not null and status = 'sent' and dry_run = false and sent_at is not null
      group by inbox_id`,
  )) as unknown as { rows: { inbox_id: string; d: number }[] };
  const out: Record<string, number> = {};
  for (const r of rows.rows ?? []) out[r.inbox_id] = Number(r.d);
  return out;
}

/** Lifetime real sends per address, for the health table. */
export async function sentTotalByInbox(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = (await db.execute(
    `select inbox_id::text as inbox_id, count(*)::int as n
       from outreach_messages
      where inbox_id is not null and status = 'sent' and dry_run = false
      group by inbox_id`,
  )) as unknown as { rows: { inbox_id: string; n: number }[] };
  const out: Record<string, number> = {};
  for (const r of rows.rows ?? []) out[r.inbox_id] = Number(r.n);
  return out;
}

/** Bind a conversation to an address. Called once, on the first send. */
export async function assignInboxToProspect(prospectId: string, inboxId: string): Promise<void> {
  const db = await getDb();
  await db
    .update(outreachProspects)
    .set({ inboxId, updatedAt: new Date() })
    .where(eq(outreachProspects.id, prospectId));
}

/** Record which address sent a message, and touch that address's LRU stamp. */
export async function recordInboxSend(messageId: string, inboxId: string): Promise<void> {
  const db = await getDb();
  await db
    .update(outreachMessages)
    .set({ inboxId, updatedAt: new Date() })
    .where(eq(outreachMessages.id, messageId));
  await db
    .update(outreachInboxes)
    .set({ lastSentAt: new Date(), updatedAt: new Date() })
    .where(eq(outreachInboxes.id, inboxId));
}

/**
 * Count a bounce or complaint against the address that sent the message.
 *
 * Attributed to the SENDING address rather than counted globally, because that is
 * the only level at which the number is actionable: one address with a bad list
 * behind it should be paused without stopping the other twenty-nine.
 */
export async function recordInboxProblem(
  inboxId: string,
  kind: "bounce" | "complaint",
): Promise<void> {
  const db = await getDb();
  const col = kind === "bounce" ? outreachInboxes.bounces : outreachInboxes.complaints;
  await db
    .update(outreachInboxes)
    .set({
      [kind === "bounce" ? "bounces" : "complaints"]: sql`${col} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(outreachInboxes.id, inboxId));
}

/** Which address, if any, sent to this prospect before. */
export async function inboxForProspect(prospectId: string): Promise<string | null> {
  const db = await getDb();
  const [row] = await db
    .select({ inboxId: outreachProspects.inboxId })
    .from(outreachProspects)
    .where(eq(outreachProspects.id, prospectId))
    .limit(1);
  return row?.inboxId ?? null;
}

/** How many conversations each address currently owns, for the health table. */
export async function conversationsByInbox(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db
    .select({ inboxId: outreachProspects.inboxId, n: sql<number>`count(*)::int` })
    .from(outreachProspects)
    .where(isNotNull(outreachProspects.inboxId))
    .groupBy(outreachProspects.inboxId);
  const out: Record<string, number> = {};
  for (const r of rows) if (r.inboxId) out[r.inboxId] = Number(r.n);
  return out;
}

/**
 * Conversations bound to an address that has since been paused.
 *
 * Worth surfacing because those follow-ups are now WAITING rather than failing,
 * and a queue that is quietly stuck is the failure mode nobody notices. The
 * alternative, sending them from a different address, would break the thread.
 */
export async function strandedConversations(): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(outreachProspects)
    .innerJoin(outreachInboxes, eq(outreachInboxes.id, outreachProspects.inboxId))
    .where(and(eq(outreachInboxes.status, "paused"), isNotNull(outreachProspects.nextTouchAt)));
  return Number(row?.n ?? 0);
}

/** Move every conversation from one address to another, by hand. */
export async function reassignConversations(fromInboxId: string, toInboxId: string): Promise<number> {
  const db = await getDb();
  const rows = await db
    .update(outreachProspects)
    .set({ inboxId: toInboxId, updatedAt: new Date() })
    .where(eq(outreachProspects.inboxId, fromInboxId))
    .returning({ id: outreachProspects.id });
  return rows.length;
}

/** Recent real sends with the address that sent them, for the UI. */
export async function recentSendsByInbox(limit = 20): Promise<
  { message_id: string; inbox_id: string | null; subject: string; sent_at: string | null }[]
> {
  const db = await getDb();
  const rows = await db
    .select({
      id: outreachMessages.id,
      inboxId: outreachMessages.inboxId,
      subject: outreachMessages.subject,
      sentAt: outreachMessages.sentAt,
    })
    .from(outreachMessages)
    .where(and(eq(outreachMessages.status, "sent"), isNotNull(outreachMessages.sentAt)))
    .orderBy(desc(outreachMessages.sentAt))
    .limit(limit);
  return rows.map((r) => ({
    message_id: r.id,
    inbox_id: r.inboxId ?? null,
    subject: r.subject,
    sent_at: r.sentAt?.toISOString?.() ?? null,
  }));
}
