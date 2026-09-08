import "@tanstack/react-start/server-only";
import { generateText } from "ai";
import { createAiProvider } from "./ai-provider";
import { KLOUDBEAN_PROMPT_CORE } from "./kloudbean-scope";
import { UNSUBSCRIBE_TOKEN } from "./email-templates";
import type { SendingInbox } from "./email-sender";
import type { EmailSenderRow } from "@/server/db/schema";

/**
 * PROMPT-TO-EMAIL ("vibe emailing") — turn one prompt into a real, on-brand email
 * to a CRM segment, sent through the guarded sender.
 *
 * Two safety lines are load-bearing here and are NOT this file's to relax:
 *   - the actual transmission goes through sendOneEmail(), which stays dry-run
 *     unless EMAIL_SEND_ENABLED=1, checks suppression per recipient, enforces the
 *     daily cap, and refuses a body with no unsubscribe. This file only drafts,
 *     picks the sending identity, and iterates the segment.
 *   - composition is grounded in KLOUDBEAN_PROMPT_CORE, so a prompt cannot talk
 *     the model into a claim Kloudbean cannot back.
 */

/* --------------------------- sender -> inbox ----------------------------- */

/**
 * Turn a stored sender into the envelope + credentials the sender layer expects.
 * The provider decides which credential field is populated, so a Brevo account
 * and an SMTP mailbox can coexist without either leaking into the other.
 */
export function inboxFromSender(s: EmailSenderRow): SendingInbox {
  const provider = (s.provider || "smtp").toLowerCase();
  return {
    id: s.id,
    fromEmail: s.fromEmail,
    fromName: s.fromName || "Kloudbean",
    replyTo: s.replyTo || s.fromEmail,
    provider,
    resendApiKey: provider === "resend" ? s.apiKey || undefined : undefined,
    brevoApiKey: provider === "brevo" ? s.apiKey || undefined : undefined,
    smtp:
      provider === "smtp" && s.smtpHost
        ? {
            host: s.smtpHost,
            port: s.smtpPort ?? 587,
            secure: s.smtpSecure ?? false,
            user: s.smtpUser || undefined,
            password: s.smtpPass || undefined,
          }
        : undefined,
  };
}

/* ----------------------------- composition ------------------------------- */

/** What each segment is, in plain words, so the AI writes to the right reader. */
const SEGMENT_BRIEF: Record<string, string> = {
  all: "the whole subscribed list (a mix of customers, trial users and leads). Keep it broadly useful and welcoming.",
  paying:
    "existing PAYING customers. They already trust us. Do not sell the basics; share something genuinely useful, an update, a tip that helps them get more from what they already pay for. Warm, not salesy.",
  abandoned:
    "people who started a purchase but never completed it. Be helpful and low-pressure: address the likely hesitation, offer to answer questions, make finishing easy. No guilt, no fake scarcity.",
  registered:
    "people who registered but never bought or tried to buy. They need a reason and a nudge. Lead with one concrete benefit and an easy first step. Educational, not pushy.",
  lead: "early leads who showed interest. Introduce the value simply and invite a small next step. No hard sell.",
};

const EMAIL_SYSTEM = `You write ONE marketing email for Kloudbean (managed cloud hosting) from a single prompt. Return STRICT JSON only:
{"subject":"...","preview":"one short line","intro":"one sentence","body":"2-3 short paragraphs separated by a blank line","cta_label":"short button text","cta_url":"https://www.kloudbean.com/..."}

Rules:
- Sound like a sharp human wrote it to one person. Contractions. Uneven rhythm. No corporate boilerplate.
- VALUE FIRST. Give something useful even if they never click.
- HONESTY: no "certified", no invented numbers/benchmarks, no client names, no guarantees (uptime, ranking, revenue, security). Only claims consistent with the Kloudbean context below. This is the fact-check: stay inside it.
- No AI-tell phrases (delve, seamless, unlock, elevate, game-changer, "in today's landscape", "when it comes to").
- Almost no em-dashes. Use commas or periods.
- cta_url must be a real kloudbean.com URL (default https://www.kloudbean.com or https://www.kloudbean.com/pricing/).
- No markdown. JSON only.`;

const esc = (s: string): string =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export type ComposedEmail = {
  subject: string;
  preview: string;
  html: string;
  text: string;
};

/**
 * Draft one email for a segment from a prompt. Falls back to a safe, plain
 * message (still carrying the unsubscribe token) if the AI is unavailable, so the
 * pipeline never blocks on the model.
 */
export async function composeCampaignEmail(
  prompt: string,
  segment: string,
): Promise<ComposedEmail> {
  const audience = SEGMENT_BRIEF[segment] ?? SEGMENT_BRIEF.all;
  let subject = `Kloudbean update`.slice(0, 140);
  let preview = "";
  let intro = "";
  let body = prompt.trim() || "A quick update from Kloudbean.";
  let ctaLabel = "Visit Kloudbean";
  let ctaUrl = "https://www.kloudbean.com";

  try {
    const model = createAiProvider();
    const { text } = await generateText({
      model,
      system: `${EMAIL_SYSTEM}\n\nKLOUDBEAN CONTEXT (stay accurate to this):\n${KLOUDBEAN_PROMPT_CORE}`,
      prompt: `Audience for this email: ${audience}\n\nThe owner's prompt (what this email is about): ${prompt}\n\nWrite the JSON now, tuned to that audience.`,
      temperature: 0.6,
    });
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const j = JSON.parse(text.slice(first, last + 1)) as Partial<{
        subject: string;
        preview: string;
        intro: string;
        body: string;
        cta_label: string;
        cta_url: string;
      }>;
      if (j.subject) subject = j.subject.slice(0, 140);
      if (j.preview) preview = j.preview.slice(0, 160);
      if (j.intro) intro = j.intro;
      if (j.body) body = j.body;
      if (j.cta_label) ctaLabel = j.cta_label.slice(0, 40);
      if (j.cta_url && /^https?:\/\/(www\.)?kloudbean\.com/i.test(j.cta_url)) ctaUrl = j.cta_url;
    }
  } catch {
    /* fall back to the plain defaults above */
  }

  if (!preview) preview = intro || body.slice(0, 120);

  const paras = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px">${esc(p)}</p>`)
    .join("");

  // The unsubscribe token is mandatory: sendOneEmail refuses a body without it.
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f6f7fb">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e6e9f2;border-radius:12px">
<tr><td style="padding:28px 26px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:#1c2536">
${intro ? `<p style="margin:0 0 16px">${esc(intro)}</p>` : ""}
${paras}
<p style="margin:6px 0 4px"><a href="${esc(ctaUrl)}" style="display:inline-block;background:#4F1AF3;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${esc(ctaLabel)}</a></p>
<p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#6b7280">You are receiving this because you are a Kloudbean contact. <a href="${UNSUBSCRIBE_TOKEN}" style="color:#6b7280;text-decoration:underline">Unsubscribe</a>.<br>Kloudbean by Secured Orbis</p>
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    intro,
    "",
    body,
    "",
    `${ctaLabel}: ${ctaUrl}`,
    "",
    "---",
    `Unsubscribe: ${UNSUBSCRIBE_TOKEN}`,
    "Kloudbean by Secured Orbis",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  return { subject, preview, html, text };
}

/* ------------------------------- sending --------------------------------- */

export type CampaignSendResult = {
  dryRun: boolean;
  recipients: number;
  sent: number;
  failed: number;
  skipped: number;
  provider: string;
  emailedIds: string[];
  error?: string;
};

/**
 * Send a campaign to its segment through the guarded sender.
 *
 * Dry-run (simulated) unless EMAIL_SEND_ENABLED=1 AND the chosen sender/provider
 * can actually transmit. Every recipient is checked against suppression at send
 * time by sendOneEmail; here we only pace the batch and tally the outcome.
 */
export async function sendCampaign(input: {
  subject: string;
  html: string;
  text: string;
  segment: string;
  sender?: EmailSenderRow | null;
}): Promise<CampaignSendResult> {
  const { sendOneEmail, sendingEnabled, providerForInbox, pauseBetweenSends } = await import(
    "./email-sender"
  );
  const crm = await import("@/server/db/repos/crm");

  const inbox = input.sender ? inboxFromSender(input.sender) : undefined;
  const provider = providerForInbox(inbox);
  const dryRun = !sendingEnabled() || provider === "none";

  const recipients = await crm.segmentRecipients(input.segment);
  if (!recipients.length) {
    return {
      dryRun,
      recipients: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      provider,
      emailedIds: [],
      error: "No subscribed contacts in this segment.",
    };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const emailedIds: string[] = [];

  for (const r of recipients) {
    const res = await sendOneEmail({
      to: r.email,
      subject: input.subject,
      html: input.html,
      text: input.text,
      sentSoFarToday: sent,
      inbox,
    });
    if (res.dryRun) {
      // simulated — neither sent nor failed
    } else if (res.skipped) {
      skipped++;
    } else if (res.ok) {
      sent++;
      emailedIds.push(r.id);
    } else {
      failed++;
    }
    if (!res.dryRun) await pauseBetweenSends();
  }

  if (emailedIds.length) {
    try {
      await crm.markEmailed(emailedIds);
    } catch {
      /* stamping last-emailed is best-effort */
    }
  }

  return { dryRun, recipients: recipients.length, sent, failed, skipped, provider, emailedIds };
}
