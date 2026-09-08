import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * PROMPT-TO-EMAIL server functions: attach sending accounts, compose a campaign
 * from one prompt, and send it to a CRM segment through the guarded sender.
 *
 * The arming rule is surfaced to the UI: a send is a DRY RUN (simulated) unless
 * EMAIL_SEND_ENABLED=1 and the chosen sender can actually transmit. The banner
 * on the page reads this so the operator always knows what a click will do.
 */

async function boot() {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
}

const PROVIDERS = ["resend", "brevo", "smtp"] as const;
const SEGMENTS = ["all", "paying", "abandoned", "registered", "lead"] as const;

function armState() {
  return {
    enabled: process.env.EMAIL_SEND_ENABLED === "1",
  };
}

/** List attached senders. Secrets are never returned, only whether one is set. */
export const listSendersFn = createServerFn({ method: "GET" }).handler(async () => {
  await boot();
  const repo = await import("@/server/db/repos/email");
  const rows = await repo.listSenders();
  return {
    ok: true,
    arm: armState(),
    senders: rows.map((s) => ({
      id: s.id,
      label: s.label,
      provider: s.provider,
      fromName: s.fromName ?? "",
      fromEmail: s.fromEmail,
      replyTo: s.replyTo ?? "",
      hasApiKey: !!s.apiKey,
      smtpHost: s.smtpHost ?? "",
      smtpPort: s.smtpPort ?? 587,
      smtpUser: s.smtpUser ?? "",
      hasSmtpPass: !!s.smtpPass,
      smtpSecure: s.smtpSecure ?? false,
      dailyCap: s.dailyCap ?? 200,
      enabled: s.enabled,
      lastOkAt: s.lastOkAt ? s.lastOkAt.toISOString() : null,
      lastError: s.lastError ?? null,
    })),
  };
});

export const saveSenderFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid().optional(),
      label: z.string().min(1).max(60),
      provider: z.enum(PROVIDERS),
      fromName: z.string().max(80).optional().or(z.literal("")),
      fromEmail: z.string().email().max(200),
      replyTo: z.string().email().max(200).optional().or(z.literal("")),
      apiKey: z.string().max(400).optional().or(z.literal("")),
      smtpHost: z.string().max(200).optional().or(z.literal("")),
      smtpPort: z.number().min(1).max(65535).optional(),
      smtpUser: z.string().max(200).optional().or(z.literal("")),
      smtpPass: z.string().max(400).optional().or(z.literal("")),
      smtpSecure: z.boolean().optional(),
      dailyCap: z.number().min(1).max(100000).optional(),
      enabled: z.boolean().default(true),
    }).parse,
  )
  .handler(async ({ data }) => {
    await boot();
    const repo = await import("@/server/db/repos/email");
    // Empty strings mean "leave as is" on update, so a saved secret is not wiped
    // by re-saving the form (the UI never receives the secret back to resubmit).
    const patch = {
      label: data.label,
      provider: data.provider,
      fromName: data.fromName || null,
      fromEmail: data.fromEmail,
      replyTo: data.replyTo || null,
      smtpHost: data.smtpHost || null,
      smtpPort: data.smtpPort ?? 587,
      smtpUser: data.smtpUser || null,
      smtpSecure: data.smtpSecure ?? false,
      dailyCap: data.dailyCap ?? 200,
      enabled: data.enabled,
      ...(data.apiKey ? { apiKey: data.apiKey } : {}),
      ...(data.smtpPass ? { smtpPass: data.smtpPass } : {}),
    };
    if (data.id) {
      await repo.updateSender(data.id, patch);
      return { ok: true, id: data.id };
    }
    const row = await repo.createSender({
      ...patch,
      apiKey: data.apiKey || null,
      smtpPass: data.smtpPass || null,
    });
    return { ok: true, id: row.id };
  });

export const deleteSenderFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    await boot();
    const repo = await import("@/server/db/repos/email");
    await repo.deleteSender(data.id);
    return { ok: true };
  });

/** Send a one-off test to the sender's own address to confirm it transmits. */
export const testSenderFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    await boot();
    const repo = await import("@/server/db/repos/email");
    const sender = await repo.getSender(data.id);
    if (!sender) return { ok: false as const, error: "sender not found" };
    const { inboxFromSender } = await import("./email-outbound");
    const { sendOneEmail } = await import("./email-sender");
    const inbox = inboxFromSender(sender);
    const r = await sendOneEmail({
      to: sender.fromEmail,
      subject: "Kloudbean test — your sender is connected",
      html: `<p>This is a test from the Kloudbean email engine. If you can read this, <b>${sender.label}</b> can send.</p><p style="font-size:12px;color:#888">Unsubscribe: <a href="{{UNSUBSCRIBE_URL}}">{{UNSUBSCRIBE_URL}}</a></p>`,
      text: "This is a test from the Kloudbean email engine. Your sender is connected.\n\nUnsubscribe: {{UNSUBSCRIBE_URL}}",
      inbox,
    });
    await repo.markSenderResult(data.id, r.ok && !r.error, r.error);
    return {
      ok: r.ok,
      dryRun: r.dryRun,
      provider: r.provider,
      error: r.error,
      note: r.dryRun
        ? "Simulated only. Set EMAIL_SEND_ENABLED=1 to send a real test."
        : undefined,
    };
  });

/**
 * Compose a campaign from one prompt and save it as a draft. Returns the draft so
 * the operator can read it before anything is sent.
 */
export const composeCampaignFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      prompt: z.string().min(3).max(2000),
      segment: z.enum(SEGMENTS).default("all"),
      senderId: z.string().uuid().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    await boot();
    const { composeCampaignEmail } = await import("./email-outbound");
    const repo = await import("@/server/db/repos/email");
    const crm = await import("@/server/db/repos/crm");

    const draft = await composeCampaignEmail(data.prompt, data.segment);
    const recipients = await crm.segmentRecipients(data.segment);
    const campaign = await repo.createCampaign({
      subject: draft.subject,
      htmlBody: draft.html,
      textBody: draft.text,
      segment: data.segment,
      senderId: data.senderId ?? null,
      prompt: data.prompt,
      source: "prompt",
    });
    return {
      ok: true,
      campaignId: campaign.id,
      subject: draft.subject,
      preview: draft.preview,
      html: draft.html,
      text: draft.text,
      segment: data.segment,
      recipientCount: recipients.length,
    };
  });

/** Send (or dry-run) a saved campaign to its segment. */
export const sendCampaignFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ campaignId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    await boot();
    const repo = await import("@/server/db/repos/email");
    const campaign = await repo.getCampaign(data.campaignId);
    if (!campaign) return { ok: false as const, error: "campaign not found" };

    const sender = campaign.senderId ? await repo.getSender(campaign.senderId) : null;
    const { sendCampaign } = await import("./email-outbound");

    await repo.updateCampaign(campaign.id, { status: "sending" });
    const result = await sendCampaign({
      subject: campaign.subject,
      html: campaign.htmlBody,
      text: campaign.textBody,
      segment: campaign.segment,
      sender,
    });
    await repo.updateCampaign(campaign.id, {
      status: result.error && result.sent === 0 && !result.dryRun ? "failed" : result.dryRun ? "draft" : "sent",
      recipientsTotal: result.recipients,
      recipientsSent: result.sent,
      recipientsFailed: result.failed,
      dryRun: result.dryRun,
      stats: { skipped: result.skipped, provider: result.provider },
      error: result.error ?? null,
      sentAt: result.dryRun ? null : new Date(),
    });
    return { ok: true as const, ...result };
  });

export const listCampaignsFn = createServerFn({ method: "GET" }).handler(async () => {
  await boot();
  const repo = await import("@/server/db/repos/email");
  const rows = await repo.listCampaigns(50);
  return {
    ok: true,
    campaigns: rows.map((c) => ({
      id: c.id,
      subject: c.subject,
      segment: c.segment,
      status: c.status,
      prompt: c.prompt ?? "",
      recipientsTotal: c.recipientsTotal ?? 0,
      recipientsSent: c.recipientsSent ?? 0,
      recipientsFailed: c.recipientsFailed ?? 0,
      dryRun: c.dryRun ?? true,
      error: c.error ?? null,
      sentAt: c.sentAt ? c.sentAt.toISOString() : null,
      createdAt: c.createdAt ? c.createdAt.toISOString() : null,
    })),
  };
});

export const deleteCampaignFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    await boot();
    const repo = await import("@/server/db/repos/email");
    await repo.deleteCampaign(data.id);
    return { ok: true };
  });
