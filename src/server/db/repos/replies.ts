import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { outreachReplies, outreachProspects } = schema;

export type OutreachReply = {
  id: string;
  prospect_id: string | null;
  message_id: string | null;
  from_email: string;
  subject: string | null;
  snippet: string | null;
  classification: string;
  confidence: number;
  is_automated: boolean;
  handled: boolean;
  received_at: string;
};

function toApi(row: typeof outreachReplies.$inferSelect): OutreachReply {
  return {
    id: row.id,
    prospect_id: row.prospectId ?? null,
    message_id: row.messageId ?? null,
    from_email: row.fromEmail,
    subject: row.subject ?? null,
    snippet: row.snippet ?? null,
    classification: row.classification,
    confidence: Number(row.confidence ?? 0),
    is_automated: row.isAutomated ?? false,
    handled: row.handled ?? false,
    received_at: row.receivedAt?.toISOString?.() ?? "",
  };
}

export async function insertReply(row: {
  prospectId?: string | null;
  messageId?: string | null;
  fromEmail: string;
  subject?: string | null;
  snippet?: string | null;
  providerMessageId?: string | null;
  classification: string;
  confidence?: number;
  isAutomated?: boolean;
  handled?: boolean;
}): Promise<OutreachReply | null> {
  const db = await getDb();
  const [inserted] = await db
    .insert(outreachReplies)
    .values({
      prospectId: row.prospectId ?? null,
      messageId: row.messageId ?? null,
      fromEmail: row.fromEmail.trim().toLowerCase(),
      subject: row.subject ?? null,
      snippet: row.snippet ?? null,
      providerMessageId: row.providerMessageId ?? null,
      classification: row.classification,
      confidence: String(row.confidence ?? 0),
      isAutomated: row.isAutomated ?? false,
      handled: row.handled ?? false,
    })
    // The unique partial index on provider_message_id makes re-polling the same
    // mailbox harmless: the second attempt is simply ignored rather than
    // re-suppressing an address or double-counting a reply.
    .onConflictDoNothing()
    .returning();
  return inserted ? toApi(inserted) : null;
}

/** Have we already processed this provider message? */
export async function replyExists(providerMessageId: string): Promise<boolean> {
  if (!providerMessageId) return false;
  const db = await getDb();
  try {
    const [row] = await db
      .select({ id: outreachReplies.id })
      .from(outreachReplies)
      .where(eq(outreachReplies.providerMessageId, providerMessageId))
      .limit(1);
    return !!row;
  } catch {
    return false;
  }
}

export async function findProspectByEmail(email: string) {
  const db = await getDb();
  const addr = (email ?? "").trim().toLowerCase();
  if (!addr) return null;
  const [row] = await db
    .select()
    .from(outreachProspects)
    .where(sql`lower(${outreachProspects.email}) = ${addr}`)
    .limit(1);
  return row ?? null;
}

/**
 * Find a prospect at the same company.
 *
 * People reply from a personal address after being contacted on a role one, and
 * treating that as an unmatched stranger would leave the sequence running and
 * email them again. Most recently contacted first, since that is the conversation
 * they are most likely answering.
 */
export async function findProspectByDomain(domain: string) {
  const db = await getDb();
  const d = (domain ?? "").trim().toLowerCase();
  if (!d) return null;
  const [row] = await db
    .select()
    .from(outreachProspects)
    .where(sql`split_part(lower(${outreachProspects.email}), '@', 2) = ${d}`)
    .orderBy(desc(outreachProspects.lastContactedAt))
    .limit(1);
  return row ?? null;
}

export async function listReplies(opts?: {
  classification?: string;
  handled?: boolean;
  needsHuman?: boolean;
  limit?: number;
}): Promise<OutreachReply[]> {
  const db = await getDb();
  let q = db.select().from(outreachReplies).$dynamic();
  const where = [];
  if (opts?.classification) where.push(eq(outreachReplies.classification, opts.classification));
  if (opts?.handled != null) where.push(eq(outreachReplies.handled, opts.handled));
  if (opts?.needsHuman) {
    where.push(
      sql`${outreachReplies.handled} = false AND ${outreachReplies.classification} in ('interested','question','unknown','complaint')`,
    );
  }
  if (where.length) q = q.where(where.length === 1 ? where[0] : and(...where));
  q = q.orderBy(desc(outreachReplies.receivedAt));
  if (opts?.limit) q = q.limit(opts.limit);
  return (await q).map(toApi);
}

export async function markReplyHandled(id: string): Promise<void> {
  const db = await getDb();
  await db.update(outreachReplies).set({ handled: true }).where(eq(outreachReplies.id, id));
}

export async function replySummary(): Promise<{
  byClass: Record<string, number>;
  needsHuman: number;
  total: number;
}> {
  const db = await getDb();
  const out = { byClass: {} as Record<string, number>, needsHuman: 0, total: 0 };
  try {
    const r: any = await db.execute(
      `select classification, count(*)::int c from outreach_replies group by classification`,
    );
    for (const row of r.rows ?? r) out.byClass[row.classification] = Number(row.c);
    const n: any = await db.execute(
      `select count(*)::int c from outreach_replies
        where handled = false and classification in ('interested','question','unknown','complaint')`,
    );
    out.needsHuman = Number((n.rows ?? n)[0]?.c ?? 0);
    const t: any = await db.execute(`select count(*)::int c from outreach_replies`);
    out.total = Number((t.rows ?? t)[0]?.c ?? 0);
  } catch {
    /* table optional */
  }
  return out;
}
