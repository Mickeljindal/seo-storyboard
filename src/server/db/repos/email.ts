import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../client";

const { emailSenders, emailCampaigns } = schema;

/**
 * EMAIL SENDERS + CAMPAIGNS — the data layer for prompt-to-email.
 *
 * A sender is an attached email account: a Resend or Brevo API key, or raw SMTP
 * (a Gmail app-password, or any host). This is an internal admin tool, so the
 * credentials are stored here rather than resolved from env; the trade-off is
 * that the DB is sensitive and should be treated as such.
 *
 * A campaign is one prompt-driven broadcast to one segment. It keeps the prompt
 * that produced it and real delivery counts, so any send can be read back later.
 */

/* ------------------------------ senders --------------------------------- */

export type SenderInput = {
  label: string;
  provider: string; // resend | brevo | smtp
  fromName?: string | null;
  fromEmail: string;
  replyTo?: string | null;
  apiKey?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpSecure?: boolean | null;
  dailyCap?: number | null;
  enabled?: boolean;
};

export async function listSenders() {
  const db = await getDb();
  return db.select().from(emailSenders).orderBy(desc(emailSenders.createdAt));
}

export async function getSender(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(emailSenders).where(eq(emailSenders.id, id)).limit(1);
  return row ?? null;
}

export async function createSender(input: SenderInput) {
  const db = await getDb();
  const [row] = await db
    .insert(emailSenders)
    .values({
      label: input.label,
      provider: input.provider,
      fromName: input.fromName ?? null,
      fromEmail: input.fromEmail.trim(),
      replyTo: input.replyTo ?? null,
      apiKey: input.apiKey ?? null,
      smtpHost: input.smtpHost ?? null,
      smtpPort: input.smtpPort ?? 587,
      smtpUser: input.smtpUser ?? null,
      smtpPass: input.smtpPass ?? null,
      smtpSecure: input.smtpSecure ?? false,
      dailyCap: input.dailyCap ?? 200,
      enabled: input.enabled ?? true,
    })
    .returning();
  return row;
}

export async function updateSender(id: string, patch: Partial<SenderInput>) {
  const db = await getDb();
  const set: Record<string, unknown> = { updatedAt: new Date() };
  const map: Record<string, keyof SenderInput> = {
    label: "label",
    provider: "provider",
    fromName: "fromName",
    fromEmail: "fromEmail",
    replyTo: "replyTo",
    apiKey: "apiKey",
    smtpHost: "smtpHost",
    smtpPort: "smtpPort",
    smtpUser: "smtpUser",
    smtpPass: "smtpPass",
    smtpSecure: "smtpSecure",
    dailyCap: "dailyCap",
    enabled: "enabled",
  };
  for (const col of Object.keys(map)) {
    const key = map[col];
    if (patch[key] !== undefined) set[col] = patch[key];
  }
  await db.update(emailSenders).set(set).where(eq(emailSenders.id, id));
}

export async function markSenderResult(id: string, ok: boolean, error?: string) {
  const db = await getDb();
  await db
    .update(emailSenders)
    .set(ok ? { lastOkAt: new Date(), lastError: null } : { lastError: error ?? "failed" })
    .where(eq(emailSenders.id, id));
}

export async function deleteSender(id: string) {
  const db = await getDb();
  await db.delete(emailSenders).where(eq(emailSenders.id, id));
}

/* ----------------------------- campaigns -------------------------------- */

export type CampaignInput = {
  subject: string;
  htmlBody: string;
  textBody: string;
  segment: string;
  senderId?: string | null;
  prompt?: string | null;
  source?: string;
  scheduledAt?: Date | null;
};

export async function createCampaign(input: CampaignInput) {
  const db = await getDb();
  const [row] = await db
    .insert(emailCampaigns)
    .values({
      subject: input.subject,
      htmlBody: input.htmlBody,
      textBody: input.textBody,
      segment: input.segment,
      senderId: input.senderId ?? null,
      prompt: input.prompt ?? null,
      source: input.source ?? "prompt",
      scheduledAt: input.scheduledAt ?? null,
    })
    .returning();
  return row;
}

export async function getCampaign(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id)).limit(1);
  return row ?? null;
}

export async function listCampaigns(limit = 50) {
  const db = await getDb();
  return db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt)).limit(limit);
}

export async function updateCampaign(
  id: string,
  patch: {
    status?: string;
    recipientsTotal?: number;
    recipientsSent?: number;
    recipientsFailed?: number;
    dryRun?: boolean;
    stats?: unknown;
    error?: string | null;
    sentAt?: Date | null;
    subject?: string;
    htmlBody?: string;
    textBody?: string;
  },
) {
  const db = await getDb();
  await db
    .update(emailCampaigns)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(emailCampaigns.id, id));
}

export async function deleteCampaign(id: string) {
  const db = await getDb();
  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
}
