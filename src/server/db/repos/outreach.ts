import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { outreachProspects, outreachMessages, outreachSuppressions } = schema;

export type Prospect = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: string | null;
  website: string | null;
  country: string | null;
  segment: string;
  stack_signals: string[];
  pain_hypothesis: string | null;
  personal_note: string | null;
  source: string | null;
  consent_basis: string;
  status: string;
  score: number;
  last_contacted_at: string | null;
  reply_at: string | null;
  notes: string | null;
  created_at: string;
  /** v25 sequencing. Non-null here means nothing automatic may contact them again. */
  sequence_stopped_reason: string | null;
  next_touch_at: string | null;
  touches_sent: number;
};

function prospectToApi(row: typeof outreachProspects.$inferSelect): Prospect {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    company: row.company ?? null,
    role: row.role ?? null,
    website: row.website ?? null,
    country: row.country ?? null,
    segment: row.segment ?? "agency",
    stack_signals: row.stackSignals ?? [],
    pain_hypothesis: row.painHypothesis ?? null,
    personal_note: row.personalNote ?? null,
    source: row.source ?? null,
    consent_basis: row.consentBasis ?? "legitimate-interest",
    status: row.status,
    score: Number(row.score ?? 0),
    last_contacted_at: row.lastContactedAt?.toISOString?.() ?? null,
    reply_at: row.replyAt?.toISOString?.() ?? null,
    notes: row.notes ?? null,
    created_at: row.createdAt?.toISOString?.() ?? "",
    sequence_stopped_reason: row.sequenceStoppedReason ?? null,
    next_touch_at: row.nextTouchAt?.toISOString?.() ?? null,
    touches_sent: Number(row.touchesSent ?? 0),
  };
}

export type OutreachMessage = {
  id: string;
  prospect_id: string;
  step: number;
  subject: string;
  body_text: string;
  body_html: string | null;
  asset_url: string | null;
  status: string;
  dry_run: boolean;
  provider: string | null;
  error: string | null;
  sent_at: string | null;
  created_at: string;
  campaign: string;
  link_prospect_id: string | null;
  send_after: string | null;
  /**
   * Whether a person rewrote this message. Carried through to the API on purpose:
   * the drafter checks it before rewriting, so the UI has to be able to show it.
   * A flag that changes behaviour but cannot be seen is how silent overwrites
   * happen without anyone noticing.
   */
  edited_by_human: boolean;
  edited_at: string | null;
};

function messageToApi(row: typeof outreachMessages.$inferSelect): OutreachMessage {
  return {
    id: row.id,
    prospect_id: row.prospectId,
    step: row.step,
    subject: row.subject,
    body_text: row.bodyText,
    body_html: row.bodyHtml ?? null,
    asset_url: row.assetUrl ?? null,
    status: row.status,
    dry_run: row.dryRun ?? true,
    provider: row.provider ?? null,
    error: row.error ?? null,
    sent_at: row.sentAt?.toISOString?.() ?? null,
    created_at: row.createdAt?.toISOString?.() ?? "",
    campaign: row.campaign ?? "agency",
    link_prospect_id: row.linkProspectId ?? null,
    send_after: row.sendAfter?.toISOString?.() ?? null,
    edited_by_human: row.editedByHuman ?? false,
    edited_at: row.editedAt?.toISOString?.() ?? null,
  };
}

/* ----------------------------- prospects ---------------------------------- */

/** Insert or refresh by email. Never downgrades a prospect who already replied. */
export async function upsertProspect(row: {
  email: string;
  name?: string | null;
  company?: string | null;
  role?: string | null;
  website?: string | null;
  country?: string | null;
  segment?: string;
  stackSignals?: string[];
  painHypothesis?: string | null;
  personalNote?: string | null;
  source?: string | null;
  consentBasis?: string;
  score?: number;
  notes?: string | null;
}): Promise<Prospect> {
  const db = await getDb();
  const email = row.email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(outreachProspects)
    .where(sql`lower(${outreachProspects.email}) = ${email}`)
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(outreachProspects)
      .set({
        name: row.name ?? existing.name,
        company: row.company ?? existing.company,
        role: row.role ?? existing.role,
        website: row.website ?? existing.website,
        country: row.country ?? existing.country,
        segment: row.segment ?? existing.segment,
        stackSignals: row.stackSignals ?? existing.stackSignals,
        painHypothesis: row.painHypothesis ?? existing.painHypothesis,
        personalNote: row.personalNote ?? existing.personalNote,
        source: row.source ?? existing.source,
        consentBasis: row.consentBasis ?? existing.consentBasis,
        score: row.score != null ? String(row.score) : existing.score,
        notes: row.notes ?? existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(outreachProspects.id, existing.id))
      .returning();
    return prospectToApi(updated);
  }

  const [inserted] = await db
    .insert(outreachProspects)
    .values({
      email,
      name: row.name ?? null,
      company: row.company ?? null,
      role: row.role ?? null,
      website: row.website ?? null,
      country: row.country ?? null,
      segment: row.segment ?? "agency",
      stackSignals: row.stackSignals ?? [],
      painHypothesis: row.painHypothesis ?? null,
      personalNote: row.personalNote ?? null,
      source: row.source ?? null,
      consentBasis: row.consentBasis ?? "legitimate-interest",
      score: row.score != null ? String(row.score) : "0",
      notes: row.notes ?? null,
    })
    .returning();
  return prospectToApi(inserted);
}

export async function listProspects(opts?: {
  status?: string;
  segment?: string;
  limit?: number;
}): Promise<Prospect[]> {
  const db = await getDb();
  let q = db.select().from(outreachProspects).$dynamic();
  const where = [];
  if (opts?.status) where.push(eq(outreachProspects.status, opts.status));
  if (opts?.segment) where.push(eq(outreachProspects.segment, opts.segment));
  if (where.length) q = q.where(where.length === 1 ? where[0] : and(...where));
  q = q.orderBy(desc(outreachProspects.score), desc(outreachProspects.createdAt));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  return rows.map(prospectToApi);
}

export async function getProspectById(id: string): Promise<Prospect | null> {
  const db = await getDb();
  const [row] = await db.select().from(outreachProspects).where(eq(outreachProspects.id, id)).limit(1);
  return row ? prospectToApi(row) : null;
}

export async function updateProspectStatus(
  id: string,
  status: string,
  extra?: { lastContactedAt?: Date; replyAt?: Date; notes?: string },
): Promise<void> {
  const db = await getDb();
  await db
    .update(outreachProspects)
    .set({
      status,
      lastContactedAt: extra?.lastContactedAt,
      replyAt: extra?.replyAt,
      notes: extra?.notes,
      updatedAt: new Date(),
    })
    .where(eq(outreachProspects.id, id));
}

export async function countProspects(status?: string): Promise<number> {
  const db = await getDb();
  try {
    let q = db.select({ c: sql<number>`count(*)::int` }).from(outreachProspects).$dynamic();
    if (status) q = q.where(eq(outreachProspects.status, status));
    const [r] = await q;
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

/* ----------------------------- messages ----------------------------------- */

/** One row per (prospect, step). The unique index makes double-sending structural. */
export async function upsertMessage(row: {
  prospectId: string;
  step: number;
  subject: string;
  bodyText: string;
  bodyHtml?: string | null;
  assetUrl?: string | null;
  /** v25: which programme this belongs to, and when it may go out. */
  campaign?: string;
  linkProspectId?: string | null;
  sendAfter?: Date | null;
}): Promise<OutreachMessage> {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(outreachMessages)
    .where(and(eq(outreachMessages.prospectId, row.prospectId), eq(outreachMessages.step, row.step)))
    .limit(1);

  if (existing) {
    // A message already sent is history: never rewrite it.
    if (existing.status === "sent") return messageToApi(existing);
    /**
     * Nor rewrite wording a person changed.
     *
     * The schema comment claimed the drafter respected this flag and nothing
     * enforced it, so an automatic re-draft would silently replace a human's edit
     * with the template version. Somebody who rewrote a pitch and came back to find
     * the generated text restored would reasonably stop trusting the tool, which is
     * a worse outcome than a slightly stale draft. Only the scheduling fields are
     * still allowed to move.
     */
    if (existing.editedByHuman) {
      if (row.sendAfter !== undefined || row.campaign || row.linkProspectId) {
        const [touched] = await db
          .update(outreachMessages)
          .set({
            campaign: row.campaign ?? existing.campaign,
            linkProspectId: row.linkProspectId ?? existing.linkProspectId,
            sendAfter: row.sendAfter ?? existing.sendAfter,
            updatedAt: new Date(),
          })
          .where(eq(outreachMessages.id, existing.id))
          .returning();
        return messageToApi(touched);
      }
      return messageToApi(existing);
    }
    const [updated] = await db
      .update(outreachMessages)
      .set({
        subject: row.subject,
        bodyText: row.bodyText,
        bodyHtml: row.bodyHtml ?? null,
        assetUrl: row.assetUrl ?? null,
        campaign: row.campaign ?? existing.campaign,
        linkProspectId: row.linkProspectId ?? existing.linkProspectId,
        sendAfter: row.sendAfter ?? existing.sendAfter,
        updatedAt: new Date(),
      })
      .where(eq(outreachMessages.id, existing.id))
      .returning();
    return messageToApi(updated);
  }

  const [inserted] = await db
    .insert(outreachMessages)
    .values({
      prospectId: row.prospectId,
      step: row.step,
      subject: row.subject,
      bodyText: row.bodyText,
      bodyHtml: row.bodyHtml ?? null,
      assetUrl: row.assetUrl ?? null,
      campaign: row.campaign ?? "agency",
      linkProspectId: row.linkProspectId ?? null,
      sendAfter: row.sendAfter ?? null,
    })
    .returning();
  return messageToApi(inserted);
}

export async function listMessages(opts?: {
  status?: string;
  prospectId?: string;
  limit?: number;
}): Promise<OutreachMessage[]> {
  const db = await getDb();
  let q = db.select().from(outreachMessages).$dynamic();
  const where = [];
  if (opts?.status) where.push(eq(outreachMessages.status, opts.status));
  if (opts?.prospectId) where.push(eq(outreachMessages.prospectId, opts.prospectId));
  if (where.length) q = q.where(where.length === 1 ? where[0] : and(...where));
  q = q.orderBy(desc(outreachMessages.createdAt));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  return rows.map(messageToApi);
}

/**
 * Approved messages that are actually DUE.
 *
 * `listMessages({status:"approved"})` returns everything approved, including a
 * follow-up deliberately scheduled for next Tuesday. Sending from that list would
 * fire every follow-up the instant it was drafted, which defeats the entire point
 * of a sequence. A null send_after means "no delay requested", so it is due now.
 *
 * The join is the safety-critical part: it excludes any prospect whose sequence
 * has been stopped. Reply, bounce and unsubscribe handling all set
 * sequence_stopped_reason, so one condition here covers all of them, and a future
 * stop reason is covered automatically instead of needing a new clause.
 */
export async function listDueMessages(opts?: {
  campaign?: string;
  limit?: number;
}): Promise<OutreachMessage[]> {
  const db = await getDb();
  const rows = await db
    .select({ m: outreachMessages })
    .from(outreachMessages)
    .innerJoin(outreachProspects, eq(outreachProspects.id, outreachMessages.prospectId))
    .where(
      and(
        eq(outreachMessages.status, "approved"),
        sql`(${outreachMessages.sendAfter} IS NULL OR ${outreachMessages.sendAfter} <= now())`,
        sql`${outreachProspects.sequenceStoppedReason} IS NULL`,
        opts?.campaign ? eq(outreachMessages.campaign, opts.campaign) : sql`true`,
      ),
    )
    .orderBy(asc(outreachMessages.sendAfter), asc(outreachMessages.createdAt))
    .limit(opts?.limit ?? 25);
  return rows.map((r) => messageToApi(r.m));
}

/**
 * Stop the sequence for one prospect, for good.
 *
 * This is the single most important write in the whole outreach layer. Everything
 * automatic downstream, follow-up drafting and sending alike, is gated on
 * sequence_stopped_reason being null. Any pending unsent message is marked skipped
 * in the same call, because leaving an approved follow-up in the queue after
 * somebody replies is exactly how an automated system embarrasses you.
 */
export async function stopSequence(
  prospectId: string,
  reason: "replied" | "bounced" | "unsubscribed" | "complained" | "completed" | "manual",
  extra?: { replyAt?: Date; status?: string },
): Promise<{ cancelledMessages: number }> {
  const db = await getDb();
  await db
    .update(outreachProspects)
    .set({
      sequenceStoppedReason: reason,
      nextTouchAt: null,
      replyAt: extra?.replyAt,
      status: extra?.status,
      updatedAt: new Date(),
    })
    .where(eq(outreachProspects.id, prospectId));

  const cancelled = await db
    .update(outreachMessages)
    .set({ status: "skipped", error: `sequence stopped: ${reason}`, updatedAt: new Date() })
    .where(
      and(
        eq(outreachMessages.prospectId, prospectId),
        inArray(outreachMessages.status, ["draft", "approved"]),
      ),
    )
    .returning({ id: outreachMessages.id });

  return { cancelledMessages: cancelled.length };
}

/** Count a delivered touch and record when the next one may be considered. */
export async function recordTouch(
  prospectId: string,
  opts: { nextTouchAt?: Date | null } = {},
): Promise<void> {
  const db = await getDb();
  await db
    .update(outreachProspects)
    .set({
      touchesSent: sql`coalesce(${outreachProspects.touchesSent}, 0) + 1`,
      lastContactedAt: new Date(),
      nextTouchAt: opts.nextTouchAt ?? null,
      updatedAt: new Date(),
    })
    .where(eq(outreachProspects.id, prospectId));
}

/**
 * Prospects whose follow-up is now due: contacted, not stopped, under the touch
 * limit, and with the waiting period elapsed since the last send.
 */
export async function listProspectsDueForFollowUp(opts: {
  afterDays: number;
  maxTouches: number;
  campaign?: string;
  limit?: number;
}): Promise<{ prospect: Prospect; lastStep: number }[]> {
  const db = await getDb();
  const res: any = await db.execute(
    `select p.*, coalesce(max(m.step), 0) as last_step
       from outreach_prospects p
       join outreach_messages m on m.prospect_id = p.id and m.status = 'sent'
      where p.sequence_stopped_reason is null
        and coalesce(p.touches_sent, 0) < ${Number(opts.maxTouches)}
        ${opts.campaign ? `and m.campaign = '${opts.campaign.replace(/'/g, "")}'` : ""}
      group by p.id
     having max(m.sent_at) <= now() - interval '${Number(opts.afterDays)} days'
        and not exists (
              select 1 from outreach_messages m2
               where m2.prospect_id = p.id
                 and m2.step > coalesce(max(m.step), 0)
            )
      order by max(m.sent_at) asc
      limit ${Number(opts.limit ?? 25)}`,
  );
  const rows = res.rows ?? res;
  return rows.map((r: any) => ({
    prospect: prospectToApi({
      ...r,
      stackSignals: r.stack_signals,
      painHypothesis: r.pain_hypothesis,
      personalNote: r.personal_note,
      consentBasis: r.consent_basis,
      lastContactedAt: r.last_contacted_at ? new Date(r.last_contacted_at) : null,
      replyAt: r.reply_at ? new Date(r.reply_at) : null,
      createdAt: r.created_at ? new Date(r.created_at) : null,
    } as never),
    lastStep: Number(r.last_step ?? 1),
  }));
}

export async function approveMessage(id: string): Promise<void> {
  const db = await getDb();
  await db
    .update(outreachMessages)
    .set({ status: "approved", approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(outreachMessages.id, id));
}

export async function recordMessageSend(
  id: string,
  result: { ok: boolean; provider?: string | null; messageId?: string | null; dryRun: boolean; error?: string | null },
): Promise<void> {
  const db = await getDb();
  await db
    .update(outreachMessages)
    .set({
      status: result.ok ? "sent" : "failed",
      provider: result.provider ?? null,
      providerMessageId: result.messageId ?? null,
      dryRun: result.dryRun,
      error: result.error ?? null,
      sentAt: result.ok ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(outreachMessages.id, id));
}

/** How many real (non dry-run) sends went out since midnight, for the daily cap. */
export async function countSentToday(): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(outreachMessages)
      .where(
        sql`${outreachMessages.status} = 'sent' AND ${outreachMessages.dryRun} = false AND ${outreachMessages.sentAt} >= date_trunc('day', now())`,
      );
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

/**
 * How many DISTINCT DAYS we have actually sent on.
 *
 * The warmup ramp is measured in sending days rather than calendar days since the
 * first send. A campaign paused for a month has not warmed up during the pause, and
 * measuring elapsed time would let a dormant domain resume at full volume, which is
 * the exact pattern a ramp exists to prevent.
 */
export async function countDistinctSendingDays(): Promise<number> {
  const db = await getDb();
  try {
    const r: any = await db.execute(
      `select count(distinct date_trunc('day', sent_at))::int as c
         from outreach_messages
        where status = 'sent' and dry_run = false and sent_at is not null`,
    );
    return Number((r.rows ?? r)[0]?.c ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Real sends today, grouped by the recipient's domain.
 *
 * Used to avoid emailing several people at the same publication on the same
 * morning. The backlink miner makes that likely rather than theoretical: one
 * publisher with several linking pages can easily yield several contacts.
 */
export async function countSentTodayByDomain(): Promise<Record<string, number>> {
  const db = await getDb();
  const out: Record<string, number> = {};
  try {
    const r: any = await db.execute(
      `select split_part(lower(p.email), '@', 2) as domain, count(*)::int as c
         from outreach_messages m
         join outreach_prospects p on p.id = m.prospect_id
        where m.status = 'sent' and m.dry_run = false
          and m.sent_at >= date_trunc('day', now())
        group by 1`,
    );
    for (const row of r.rows ?? r) if (row.domain) out[row.domain] = Number(row.c);
  } catch {
    /* best effort */
  }
  return out;
}

/* --------------------------- suppressions --------------------------------- */

/** Address-level or domain-level. Checked before every send. */
export async function isSuppressed(email: string): Promise<boolean> {
  const db = await getDb();
  const addr = (email ?? "").trim().toLowerCase();
  if (!addr) return true;
  const domain = addr.split("@")[1] ?? "";
  const [row] = await db
    .select({ id: outreachSuppressions.id })
    .from(outreachSuppressions)
    .where(
      sql`lower(${outreachSuppressions.email}) = ${addr} OR (${outreachSuppressions.domain} IS NOT NULL AND lower(${outreachSuppressions.domain}) = ${domain})`,
    )
    .limit(1);
  return !!row;
}

export async function addSuppression(row: {
  email?: string | null;
  domain?: string | null;
  reason?: string;
  note?: string | null;
}): Promise<void> {
  const db = await getDb();
  const email = row.email?.trim().toLowerCase() ?? null;
  if (email) {
    const existing = await isSuppressed(email);
    if (existing) return;
  }
  await db.insert(outreachSuppressions).values({
    email,
    domain: row.domain?.trim().toLowerCase() ?? null,
    reason: row.reason ?? "unsubscribe",
    note: row.note ?? null,
  });
  // Mark the prospect too, so the pipeline view matches reality.
  if (email) {
    await db
      .update(outreachProspects)
      .set({ status: "suppressed", updatedAt: new Date() })
      .where(sql`lower(${outreachProspects.email}) = ${email}`);
  }
}

export async function countSuppressions(): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(outreachSuppressions);
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}
