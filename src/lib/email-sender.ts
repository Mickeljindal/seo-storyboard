import "@tanstack/react-start/server-only";
import crypto from "node:crypto";
import { UNSUBSCRIBE_TOKEN, senderIdentity } from "./email-templates";

/**
 * EMAIL SENDER — the only code in this repo that can put mail on the wire.
 *
 * Everything about it is built to make an accident expensive to trigger and cheap
 * to survive:
 *
 *   1. DRY RUN IS THE DEFAULT. A send is simulated unless the caller passes
 *      dryRun:false AND `EMAIL_SEND_ENABLED=1` is set in the environment. Two
 *      independent switches, because one is too easy to flip by mistake.
 *   2. SUPPRESSION IS CHECKED PER RECIPIENT, immediately before transmission,
 *      not when the batch was drafted. Unsubscribes that arrive mid-run are
 *      honoured by the same run.
 *   3. A DAILY CAP is enforced against what was actually sent, so a loop or a
 *      double-click cannot turn into a thousand emails.
 *   4. UNSUBSCRIBE IS MANDATORY. A body that still contains the unreplaced
 *      token is refused, so a template mistake cannot ship without an opt-out.
 *   5. RATE LIMITED with a real pause between messages. Bursts are what get a
 *      sending domain flagged, and a warm domain is worth more than speed.
 *
 * Providers: Resend over HTTPS (no dependency to install), or SMTP if nodemailer
 * happens to be available. Neither is required for drafting.
 */

export type SendResult = {
  ok: boolean;
  provider: string;
  messageId?: string;
  skipped?: "suppressed" | "capped" | "invalid" | "no-provider";
  error?: string;
  dryRun: boolean;
  /** Which address sent it, when the pool chose one. */
  inboxId?: string;
};

export type Recipient = {
  email: string;
  /** Used to build the per-person unsubscribe link. */
  id?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test((email ?? "").trim());
}

/** True only when both switches agree that real sending is intended. */
export function sendingEnabled(): boolean {
  return process.env.EMAIL_SEND_ENABLED === "1";
}

export function dailyCap(): number {
  const n = Number(process.env.EMAIL_DAILY_CAP ?? 60);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60;
}

function perMessageDelayMs(): number {
  const n = Number(process.env.EMAIL_SEND_DELAY_MS ?? 4000);
  return Number.isFinite(n) && n >= 0 ? n : 4000;
}

/**
 * A signed, per-recipient unsubscribe URL. Signed so the endpoint can trust it
 * without a lookup table, and so nobody can unsubscribe someone else by editing
 * a query string.
 */
export function unsubscribeUrl(email: string): string {
  const base = (process.env.UNSUBSCRIBE_BASE_URL?.trim() || "https://www.kloudbean.com/unsubscribe").replace(/\/$/, "");
  const secret = process.env.UNSUBSCRIBE_SECRET?.trim() || "";
  const addr = email.trim().toLowerCase();
  const sig = secret
    ? crypto.createHmac("sha256", secret).update(addr).digest("hex").slice(0, 32)
    : "";
  const q = new URLSearchParams({ e: addr });
  if (sig) q.set("s", sig);
  return `${base}?${q.toString()}`;
}

/** Verify a signature produced by unsubscribeUrl. */
export function verifyUnsubscribe(email: string, sig: string): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET?.trim();
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
  const a = Buffer.from(expected);
  const b = Buffer.from((sig ?? "").slice(0, 32));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Swap the token for this recipient's real link, in both bodies. */
function personalise(body: string, email: string): string {
  return body.split(UNSUBSCRIBE_TOKEN).join(unsubscribeUrl(email));
}

/* -------------------------------------------------------------------------- *
 * Providers
 * -------------------------------------------------------------------------- */

/**
 * Who an email is from, and which credentials send it.
 *
 * Optional throughout. With no inbox passed, everything behaves exactly as it did
 * before: one global identity from the environment. That default matters, because
 * the whole multi-inbox layer has to be additive rather than a new requirement.
 *
 * DELIBERATELY ENVELOPE-ONLY. This overrides From, Reply-To and the credentials.
 * It does NOT reach into the email body, whose footer carries the company name and
 * postal address. Those are the same whichever address sends, and threading an
 * identity through the template renderer would mean the body of a drafted message
 * could no longer be rendered without first deciding who would send it, which is a
 * decision that legitimately happens later.
 */
export type SendingInbox = {
  id: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  provider: string;
  resendApiKey?: string;
  /** Brevo (formerly Sendinblue) HTTP API key. Sends over HTTPS, no dependency. */
  brevoApiKey?: string;
  smtp?: { host: string; port: number; secure: boolean; user?: string; password?: string };
};

/** The From/Reply-To pair to use, falling back to the global identity. */
function envelopeFor(inbox?: SendingInbox): { fromName: string; fromEmail: string; replyTo: string } {
  const id = senderIdentity();
  return {
    fromName: inbox?.fromName || id.fromName,
    fromEmail: inbox?.fromEmail || id.fromEmail,
    replyTo: inbox?.replyTo || id.replyTo,
  };
}

async function sendViaResend(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
  inbox?: SendingInbox;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  // An inbox's own key wins, so several addresses can live on separate accounts.
  const key = msg.inbox?.resendApiKey?.trim() || process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, error: "RESEND_API_KEY not set" };
  const id = envelopeFor(msg.inbox);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${id.fromName} <${id.fromEmail}>`,
        reply_to: id.replyTo,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        headers: {
          // One-click unsubscribe. Mailbox providers weight this heavily, and it
          // is the difference between "bulk sender" and "spam".
          "List-Unsubscribe": `<${unsubscribeUrl(msg.to)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` };
    let messageId: string | undefined;
    try {
      messageId = (JSON.parse(text) as { id?: string }).id;
    } catch {
      /* a missing id is not a failure */
    }
    return { ok: true, messageId };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

async function sendViaBrevo(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
  inbox?: SendingInbox;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  // Brevo's transactional email API. An inbox's own key wins, so a Brevo mailbox
  // and a Resend mailbox can live side by side in the same pool.
  const key = msg.inbox?.brevoApiKey?.trim() || process.env.BREVO_API_KEY?.trim();
  if (!key) return { ok: false, error: "BREVO_API_KEY not set" };
  const id = envelopeFor(msg.inbox);
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: id.fromName, email: id.fromEmail },
        replyTo: { email: id.replyTo },
        to: [{ email: msg.to }],
        subject: msg.subject,
        htmlContent: msg.html,
        textContent: msg.text,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl(msg.to)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const body = await res.text();
    if (!res.ok) return { ok: false, error: `Brevo ${res.status}: ${body.slice(0, 200)}` };
    let messageId: string | undefined;
    try {
      messageId = (JSON.parse(body) as { messageId?: string }).messageId;
    } catch {
      /* a missing id is not a failure */
    }
    return { ok: true, messageId };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

async function sendViaSmtp(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
  inbox?: SendingInbox;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const host = msg.inbox?.smtp?.host?.trim() || process.env.SMTP_HOST?.trim();
  if (!host) return { ok: false, error: "SMTP_HOST not set" };
  // Imported through a variable specifier on purpose: nodemailer is optional, so
  // this must not become a hard type or build dependency for anyone using Resend.
  type MailTransport = {
    sendMail: (m: Record<string, unknown>) => Promise<{ messageId?: string }>;
  };
  type Nodemailer = { createTransport: (opts: Record<string, unknown>) => MailTransport };
  let nodemailer: Nodemailer;
  try {
    const specifier = "nodemailer";
    nodemailer = (await import(/* @vite-ignore */ specifier)) as unknown as Nodemailer;
  } catch {
    return { ok: false, error: "nodemailer is not installed; use Resend or install it" };
  }
  const id = envelopeFor(msg.inbox);
  const smtp = msg.inbox?.smtp;
  try {
    const transport = nodemailer.createTransport({
      host,
      port: smtp?.port ?? Number(process.env.SMTP_PORT ?? 587),
      secure: smtp ? smtp.secure : process.env.SMTP_SECURE === "1",
      auth: smtp?.user
        ? { user: smtp.user, pass: smtp.password ?? "" }
        : process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" }
          : undefined,
    });
    const info = await transport.sendMail({
      from: `${id.fromName} <${id.fromEmail}>`,
      replyTo: id.replyTo,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl(msg.to)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

export function activeProvider(): "resend" | "brevo" | "smtp" | "none" {
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  if (process.env.BREVO_API_KEY?.trim()) return "brevo";
  if (process.env.SMTP_HOST?.trim()) return "smtp";
  return "none";
}

/**
 * Which provider will carry this particular message.
 *
 * An inbox on provider 'default' shares the global settings, which is the ordinary
 * case of many addresses on one verified domain. An inbox that brings its own
 * credentials uses them, so one pool can mix a Resend account and an SMTP mailbox
 * without either knowing about the other.
 */
export function providerForInbox(inbox?: SendingInbox): "resend" | "brevo" | "smtp" | "none" {
  if (inbox && inbox.provider !== "default") {
    if (inbox.provider === "resend" && inbox.resendApiKey?.trim()) return "resend";
    if (inbox.provider === "brevo" && inbox.brevoApiKey?.trim()) return "brevo";
    if (inbox.provider === "smtp" && inbox.smtp?.host?.trim()) return "smtp";
    return "none";
  }
  return activeProvider();
}

/* -------------------------------------------------------------------------- *
 * The guarded send
 * -------------------------------------------------------------------------- */

/**
 * Send one email, with every guard applied. Returns a result rather than
 * throwing, because a batch must be able to carry on past one bad address.
 */
export async function sendOneEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  dryRun?: boolean;
  /** Counts toward the daily cap; pass the number already sent this run. */
  sentSoFarToday?: number;
  /**
   * Which address sends it. Omitted means the single global identity, so every
   * existing caller keeps working unchanged.
   */
  inbox?: SendingInbox;
}): Promise<SendResult> {
  const dryRun = input.dryRun !== false || !sendingEnabled();
  const provider = providerForInbox(input.inbox);

  if (!isValidEmail(input.to)) {
    return { ok: false, provider, skipped: "invalid", dryRun, error: `Invalid address: ${input.to}` };
  }

  // Unsubscribe must exist and must have been substituted for THIS recipient.
  const html = personalise(input.html, input.to);
  const text = personalise(input.text, input.to);
  // Checking for the exact token after substitution would be dead code, because
  // substitution always replaces exact matches. The real risk is a MALFORMED or
  // renamed placeholder, which silently survives and mails a broken link, so look
  // for any leftover mustache instead.
  const leftover = /\{\{[^}]*\}?\}?/.exec(html) ?? /\{\{[^}]*\}?\}?/.exec(text);
  if (leftover) {
    return {
      ok: false,
      provider,
      dryRun,
      error: `Unsubstituted placeholder in body (${leftover[0].slice(0, 40)}); refusing to send.`,
    };
  }
  if (!/unsubscribe/i.test(text)) {
    return { ok: false, provider, dryRun, error: "Body has no unsubscribe line; refusing to send." };
  }

  // Suppression, checked now rather than at draft time.
  try {
    const repo = await import("@/server/db/repos/outreach");
    if (await repo.isSuppressed(input.to)) {
      return { ok: true, provider, skipped: "suppressed", dryRun };
    }
  } catch {
    // If the suppression list cannot be read we must not send: failing closed is
    // the only safe direction for an irreversible action.
    return { ok: false, provider, dryRun, error: "Suppression list unavailable; refusing to send." };
  }

  const cap = dailyCap();
  if ((input.sentSoFarToday ?? 0) >= cap) {
    return { ok: true, provider, skipped: "capped", dryRun };
  }

  if (dryRun) {
    return { ok: true, provider: provider === "none" ? "manual" : provider, dryRun: true };
  }
  if (provider === "none") {
    return { ok: false, provider: "none", skipped: "no-provider", dryRun: false, error: "No email provider configured (set RESEND_API_KEY or SMTP_HOST)." };
  }

  const msg = { to: input.to, subject: input.subject, html, text, inbox: input.inbox };
  const sent =
    provider === "resend"
      ? await sendViaResend(msg)
      : provider === "brevo"
        ? await sendViaBrevo(msg)
        : await sendViaSmtp(msg);

  return {
    ok: sent.ok,
    provider,
    messageId: sent.messageId,
    error: sent.error,
    dryRun: false,
    // Recorded so a bounce can be attributed to the address that sent it, which is
    // the only level at which pausing one address is a useful response.
    inboxId: input.inbox?.id,
  };
}

/** Pace a batch. Bursts are what get a sending domain flagged. */
export async function pauseBetweenSends(): Promise<void> {
  const ms = perMessageDelayMs();
  if (ms > 0) await new Promise((r) => setTimeout(r, ms));
}
