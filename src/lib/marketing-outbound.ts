import "@tanstack/react-start/server-only";
import { generateText } from "ai";
import { createAiProvider } from "./ai-provider";
import { KLOUDBEAN_PROMPT_CORE } from "./kloudbean-scope";
import { UNSUBSCRIBE_TOKEN } from "./email-templates";

/**
 * OUTBOUND ACTIONS — the code that can actually transmit (post socially / send
 * email) on a prompt's behalf. Built with the same fail-safe philosophy as
 * email-sender.ts: NOTHING goes out unless an explicit switch is set. Default is
 * dry-run everywhere, so a prompt drafts and simulates until the owner arms it.
 *
 * SOCIAL: posts go to a single configured webhook (SOCIAL_WEBHOOK_URL) — point
 * it at your own n8n workflow (Kloudbean runs n8n), Zapier, Make, or Buffer, and
 * that workflow fans out to LinkedIn / X / Facebook with your connected accounts.
 * This avoids per-platform OAuth while still being a real auto-post.
 *
 * EMAIL: reuses the guarded sender in email-sender.ts (Resend/SMTP, unsubscribe
 * mandatory, suppression + daily cap enforced), sent to a configured recipient
 * list (BROADCAST_RECIPIENTS).
 */

/* ------------------------------- SOCIAL ---------------------------------- */

export function socialWebhookUrl(): string | null {
  const u = process.env.SOCIAL_WEBHOOK_URL?.trim();
  return u || null;
}

/** True only when BOTH the switch is on AND a webhook is configured. */
export function socialAutopostArmed(): boolean {
  return process.env.SOCIAL_AUTOPOST_ENABLED === "1" && !!socialWebhookUrl();
}

const SOCIAL_SYSTEM = `You write ONE high-quality social post for Kloudbean (a managed cloud hosting platform). Rules:
- VALUE FIRST: every post must carry one concrete, useful takeaway a reader can act on (a specific tip, a real tradeoff, a number that matters, a mistake to avoid). No generic "we help you scale" filler. If it isn't genuinely useful on its own, rewrite it.
- Sound like a sharp human, not a marketer. No emoji spam.
- Lead with the useful hook. One clear idea. Plainspoken.
- NEVER overpromise or invent: no "certified", no fake benchmarks, no client names, no absolute guarantees. Only claims consistent with the Kloudbean context below (this is the fact-check — stay inside it).
- No AI-tell phrases (delve, seamless, unlock, elevate, game-changer, in today's landscape, etc.).
- Return ONLY the post text, no quotes, no preamble, no markdown, no "Here's a post:".`;

/** Per-platform voice + length so the same idea is repurposed uniquely, not copy-pasted. */
const PLATFORM_STYLE: Record<string, { limit: number; guide: string }> = {
  linkedin: {
    limit: 1300,
    guide: "LinkedIn: professional but human. A strong first line as the hook, then 2-3 short paragraphs. One concrete takeaway. 0-2 relevant hashtags at the very end. No clickbait.",
  },
  x: {
    limit: 270,
    guide: "X/Twitter: one punchy idea, under 270 characters. A sharp hook or a mild hot take. 0-1 hashtag. No thread.",
  },
  twitter: {
    limit: 270,
    guide: "X/Twitter: one punchy idea, under 270 characters. A sharp hook or a mild hot take. 0-1 hashtag.",
  },
  facebook: {
    limit: 600,
    guide: "Facebook: friendly and casual, 1-2 short paragraphs. Conversational. Minimal hashtags.",
  },
  instagram: {
    limit: 1000,
    guide: "Instagram caption: an engaging first line, then a few short lines with line breaks. End with 5-8 relevant, specific hashtags. Light emoji use is fine.",
  },
  threads: {
    limit: 450,
    guide: "Threads: conversational and concise, under 450 characters. Casual, no hashtag spam.",
  },
  mastodon: {
    limit: 480,
    guide: "Mastodon: plain and useful, under 480 characters. No hashtag spam, no hype.",
  },
  webhook: {
    limit: 600,
    guide: "General social post: a clear hook and one takeaway, around 400-600 characters. A couple of hashtags at most.",
  },
};

function sanitizePost(text: string): string {
  return text
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^```[a-z]*|```$/gi, "")
    .replace(/^(here'?s?( is)? (a |your )?[a-z ]*post:?\s*)/i, "")
    .trim();
}

/**
 * Compose one on-brand post, REPURPOSED for the platform's voice + length.
 * `link` is appended for platforms where a URL reads naturally. Falls back to a
 * plain line if AI is unavailable.
 */
export async function composeSocialPost(
  topic: string,
  channel: string,
  opts?: { link?: string | null; persona?: string | null },
): Promise<string> {
  const style = PLATFORM_STYLE[channel.toLowerCase()] ?? PLATFORM_STYLE.webhook;
  const link = opts?.link ?? undefined;
  const persona = opts?.persona?.trim();
  const personaBlock = persona
    ? `\n\nACCOUNT VOICE — write as this specific author, in their voice: ${persona}. Keep it authentic to them, not corporate boilerplate.`
    : "";
  try {
    const model = createAiProvider();
    const { text } = await generateText({
      model,
      system: `${SOCIAL_SYSTEM}\n\nPLATFORM STYLE — ${style.guide}${personaBlock}\n\nKLOUDBEAN CONTEXT (stay accurate to this):\n${KLOUDBEAN_PROMPT_CORE}`,
      prompt: `Platform: ${channel}. Topic/source: ${topic}.${link ? ` Reference link: ${link}` : ""} Write the single post now (max ~${style.limit} chars). Make it distinct to this platform's voice${persona ? " and this author's persona" : ""}, and genuinely useful.`,
      temperature: 0.7,
    });
    let out = sanitizePost(text);
    if (!out) out = `New from Kloudbean: ${topic}.`;
    return out.slice(0, style.limit);
  } catch {
    const base = `${topic} — from Kloudbean.${link ? " " + link : " https://www.kloudbean.com"}`;
    return base.slice(0, style.limit);
  }
}

export type SocialPostResult = {
  posted: boolean;
  dryRun: boolean;
  channel: string;
  error?: string;
  status?: number;
};

/** Transmit a post to the configured webhook — or simulate if not armed. */
export async function postToSocial(input: {
  channel: string;
  text: string;
  link?: string;
  imageUrl?: string;
}): Promise<SocialPostResult> {
  const url = socialWebhookUrl();
  if (!socialAutopostArmed() || !url) {
    return { posted: false, dryRun: true, channel: input.channel };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "kloudbean-seo-engine",
        channel: input.channel,
        text: input.text,
        link: input.link ?? "https://www.kloudbean.com",
        image: input.imageUrl ?? null,
        ts: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return { posted: false, dryRun: false, channel: input.channel, error: `webhook ${res.status}`, status: res.status };
    }
    return { posted: true, dryRun: false, channel: input.channel, status: res.status };
  } catch (e) {
    return { posted: false, dryRun: false, channel: input.channel, error: String((e as Error)?.message ?? e) };
  }
}

/* -------------------------------- EMAIL ---------------------------------- */

export function emailBroadcastRecipients(): string[] {
  return (process.env.BROADCAST_RECIPIENTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const EMAIL_SYSTEM = `You write ONE short marketing email for Kloudbean (managed cloud hosting). Return STRICT JSON: {"subject":"...","intro":"one sentence","body":"2 short paragraphs of plain text"}.
Rules: sound human, useful, specific. No overpromising (no "certified", no invented numbers, no client names, no guarantees). No AI-tell phrases. No markdown.`;

async function composeMarketingEmail(topic: string): Promise<{ subject: string; html: string; text: string }> {
  let subject = `Kloudbean: ${topic}`.slice(0, 120);
  let intro = "";
  let body = `We wanted to share something on ${topic}. Read more on kloudbean.com.`;
  try {
    const model = createAiProvider();
    const { text } = await generateText({
      model,
      system: `${EMAIL_SYSTEM}\n\nKLOUDBEAN CONTEXT:\n${KLOUDBEAN_PROMPT_CORE}`,
      prompt: `Topic: ${topic}. Return the JSON now.`,
      temperature: 0.5,
    });
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const j = JSON.parse(text.slice(first, last + 1)) as { subject?: string; intro?: string; body?: string };
      if (j.subject) subject = j.subject.slice(0, 140);
      if (j.intro) intro = j.intro;
      if (j.body) body = j.body;
    }
  } catch {
    /* fall back to defaults */
  }

  const site = "https://www.kloudbean.com";
  // The unsubscribe token is mandatory — email-sender refuses a body without it.
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">
  ${intro ? `<p>${escapeHtml(intro)}</p>` : ""}
  <p>${escapeHtml(body).replace(/\n{2,}/g, "</p><p>")}</p>
  <p><a href="${site}">Visit Kloudbean</a></p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
  <p style="font-size:12px;color:#888">Kloudbean by Secured Orbis. You are receiving this because you opted in.<br/>
  Unsubscribe: <a href="${UNSUBSCRIBE_TOKEN}">${UNSUBSCRIBE_TOKEN}</a></p>
</div>`;
  const text = `${intro ? intro + "\n\n" : ""}${body}\n\nVisit Kloudbean: ${site}\n\n---\nUnsubscribe: ${UNSUBSCRIBE_TOKEN}`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type BroadcastResult = {
  dryRun: boolean;
  recipients: number;
  sent: number;
  failed: number;
  skipped: number;
  provider: string;
  error?: string;
};

/**
 * Send a marketing email about `topic` to the configured recipient list, through
 * the guarded sender. Dry-run (simulated) unless EMAIL_SEND_ENABLED=1 and a
 * provider is configured. Every message carries a working unsubscribe and is
 * checked against the suppression list at send time.
 */
export async function sendMarketingBroadcast(topic: string): Promise<BroadcastResult> {
  const { sendOneEmail, sendingEnabled, activeProvider, pauseBetweenSends } = await import("./email-sender");
  const recipients = emailBroadcastRecipients();
  const provider = activeProvider();
  const dryRun = !sendingEnabled() || provider === "none";

  if (!recipients.length) {
    return { dryRun, recipients: 0, sent: 0, failed: 0, skipped: 0, provider, error: "No recipients configured (set BROADCAST_RECIPIENTS)." };
  }

  const { subject, html, text } = await composeMarketingEmail(topic);
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const to of recipients) {
    const r = await sendOneEmail({ to, subject, html, text, sentSoFarToday: sent });
    if (r.dryRun) {
      // simulated — counts as neither sent nor failed
    } else if (r.skipped) {
      skipped++;
    } else if (r.ok) {
      sent++;
    } else {
      failed++;
    }
    await pauseBetweenSends();
  }
  return { dryRun, recipients: recipients.length, sent, failed, skipped, provider };
}

/* ------------------------------- STATUS ---------------------------------- */

/** Arming state, for the UI to show whether steps will really transmit. */
export function outboundChannelStatus() {
  return {
    social: { armed: socialAutopostArmed(), webhookConfigured: !!socialWebhookUrl() },
    email: {
      armed: process.env.EMAIL_SEND_ENABLED === "1" && !!(process.env.RESEND_API_KEY?.trim() || process.env.SMTP_HOST?.trim()),
      provider: process.env.RESEND_API_KEY?.trim() ? "resend" : process.env.SMTP_HOST?.trim() ? "smtp" : "none",
      recipients: emailBroadcastRecipients().length,
    },
  };
}
