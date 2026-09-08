import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../client";

const { emailBroadcasts } = schema;

export type EmailBroadcast = {
  id: string;
  article_id: string | null;
  subject: string;
  preview: string | null;
  html_body: string;
  text_body: string;
  audience: string;
  status: string;
  provider: string | null;
  recipients_total: number;
  recipients_sent: number;
  recipients_failed: number;
  dry_run: boolean;
  error: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
};

function toApi(row: typeof emailBroadcasts.$inferSelect): EmailBroadcast {
  return {
    id: row.id,
    article_id: row.articleId ?? null,
    subject: row.subject,
    preview: row.preview ?? null,
    html_body: row.htmlBody,
    text_body: row.textBody,
    audience: row.audience,
    status: row.status,
    provider: row.provider ?? null,
    recipients_total: row.recipientsTotal ?? 0,
    recipients_sent: row.recipientsSent ?? 0,
    recipients_failed: row.recipientsFailed ?? 0,
    dry_run: row.dryRun ?? true,
    error: row.error ?? null,
    approved_at: row.approvedAt?.toISOString?.() ?? null,
    sent_at: row.sentAt?.toISOString?.() ?? null,
    created_at: row.createdAt?.toISOString?.() ?? "",
  };
}

export async function insertBroadcast(row: {
  articleId?: string | null;
  subject: string;
  preview?: string | null;
  htmlBody: string;
  textBody: string;
  audience?: string;
}): Promise<EmailBroadcast> {
  const db = await getDb();
  const [inserted] = await db
    .insert(emailBroadcasts)
    .values({
      articleId: row.articleId ?? null,
      subject: row.subject,
      preview: row.preview ?? null,
      htmlBody: row.htmlBody,
      textBody: row.textBody,
      audience: row.audience ?? "newsletter",
    })
    .returning();
  return toApi(inserted);
}

export async function listBroadcasts(opts?: {
  status?: string;
  limit?: number;
}): Promise<EmailBroadcast[]> {
  const db = await getDb();
  let q = db.select().from(emailBroadcasts).$dynamic();
  if (opts?.status) q = q.where(eq(emailBroadcasts.status, opts.status));
  q = q.orderBy(desc(emailBroadcasts.createdAt));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  return rows.map(toApi);
}

export async function getBroadcastById(id: string): Promise<EmailBroadcast | null> {
  const db = await getDb();
  const [row] = await db.select().from(emailBroadcasts).where(eq(emailBroadcasts.id, id)).limit(1);
  return row ? toApi(row) : null;
}

/** Approving is a separate, deliberate step from drafting. */
export async function approveBroadcast(id: string): Promise<void> {
  const db = await getDb();
  await db
    .update(emailBroadcasts)
    .set({ status: "approved", approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(emailBroadcasts.id, id));
}

export async function recordBroadcastResult(
  id: string,
  result: {
    status: string;
    provider?: string | null;
    recipientsTotal?: number;
    recipientsSent?: number;
    recipientsFailed?: number;
    dryRun?: boolean;
    error?: string | null;
  },
): Promise<void> {
  const db = await getDb();
  await db
    .update(emailBroadcasts)
    .set({
      status: result.status,
      provider: result.provider ?? null,
      recipientsTotal: result.recipientsTotal ?? 0,
      recipientsSent: result.recipientsSent ?? 0,
      recipientsFailed: result.recipientsFailed ?? 0,
      dryRun: result.dryRun ?? true,
      error: result.error ?? null,
      sentAt: result.status === "sent" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(emailBroadcasts.id, id));
}
