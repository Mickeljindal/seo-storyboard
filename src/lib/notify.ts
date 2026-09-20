import "@tanstack/react-start/server-only";

/**
 * TEAM NOTIFICATIONS — "this article just went live, here is the link".
 *
 * Deliberately separate from social-publisher.ts. That module posts PUBLICLY and
 * is gated behind SOCIAL_AUTOPOST_ENABLED, which is correct for a LinkedIn post
 * and wrong for an internal ping: you do not want the team's Slack message
 * suppressed by the same switch that guards your public accounts. So this has
 * its own config and its own kill switch.
 *
 * Opt-in by configuration: every channel is a no-op until its URL or token is
 * set, so nothing can transmit by accident. `NOTIFY_DISABLED=1` turns the whole
 * thing off without unsetting anything.
 *
 * ── Slack, Pumble, Discord ──────────────────────────────────────────────────
 * All three accept an "incoming webhook": POST JSON with a top-level `text`.
 * Pumble is Slack-compatible, so the same payload works for both. Discord reads
 * `content` instead, so we send both keys, which is the trick digest.ts already
 * uses. One code path, three products.
 *
 * ── WhatsApp: read this before wiring it up ─────────────────────────────────
 * WhatsApp is NOT like the other three, and the difference will bite you.
 *
 * Meta's WhatsApp Cloud API addresses INDIVIDUAL PHONE NUMBERS. It does not
 * address group chats. There is no supported "post to my WhatsApp group" call.
 * You will find vendor blog posts advertising a "WhatsApp Groups API"; that
 * contradicts Meta's own documentation, and the libraries that really can post
 * to a group (whatsapp-web.js, Baileys and friends) drive a logged-in personal
 * session, which is against WhatsApp's terms and risks the number being banned.
 * Not something to hang a publishing pipeline on.
 *
 * So there are two honest options, and this module supports both:
 *
 *   1. GROUP  -> use the generic webhook (NOTIFY_WEBHOOK_URL) and let n8n, which
 *      Kloudbean already runs, do the last hop. The engine stays clean and the
 *      ToS question lives in a tool you control.
 *
 *   2. DIRECT -> Cloud API to specific numbers (NOTIFY_WHATSAPP_*). Officially
 *      supported, but note the 24-hour rule: free-form text only reaches someone
 *      who messaged you in the last 24 hours. A publish notification almost
 *      never qualifies, so set NOTIFY_WHATSAPP_TEMPLATE to an APPROVED template
 *      name. Without one, expect the send to be rejected even though your token
 *      is perfectly valid. That single fact accounts for most "the API returns
 *      200 but nothing arrives" confusion.
 *
 * Slack or Pumble is the lower-friction choice for a team feed. WhatsApp is
 * worth the setup only if the group is genuinely where the team lives.
 */

export type NotifyTarget = "slack" | "pumble" | "discord" | "webhook" | "whatsapp";

export type NotifyResult = {
  target: NotifyTarget;
  ok: boolean;
  skipped: boolean;
  error?: string;
};

export type NotifyPayload = {
  /** Plain-text message. Kept readable in every client, no Slack blocks. */
  text: string;
  /** The published URL, passed separately so a webhook consumer can use it. */
  link?: string | null;
  /** Article title, for structured consumers. */
  title?: string | null;
  /** Anything extra a webhook consumer might want (slug, score, position). */
  meta?: Record<string, unknown>;
};

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function notifyDisabled(): boolean {
  return process.env.NOTIFY_DISABLED === "1";
}

/** Which channels are actually configured right now. Useful for status output. */
export function configuredNotifyTargets(): NotifyTarget[] {
  const out: NotifyTarget[] = [];
  if (env("NOTIFY_SLACK_WEBHOOK_URL")) out.push("slack");
  if (env("NOTIFY_PUMBLE_WEBHOOK_URL")) out.push("pumble");
  if (env("NOTIFY_DISCORD_WEBHOOK_URL")) out.push("discord");
  if (env("NOTIFY_WEBHOOK_URL")) out.push("webhook");
  if (env("NOTIFY_WHATSAPP_PHONE_ID") && env("NOTIFY_WHATSAPP_TOKEN") && env("NOTIFY_WHATSAPP_TO"))
    out.push("whatsapp");
  return out;
}

const TIMEOUT_MS = 15_000;

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return { ok: true };
    // Read a little of the body: Slack answers "invalid_payload" in plain text
    // and Meta returns a JSON error object. Both are far more useful than the
    // status code alone when you are debugging a silent channel.
    const detail = await res.text().catch(() => "");
    return { ok: false, error: `HTTP ${res.status}${detail ? ` ${detail.slice(0, 180)}` : ""}` };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/** Slack / Pumble / Discord all take a simple chat-style payload. */
async function sendChatWebhook(
  target: NotifyTarget,
  url: string,
  p: NotifyPayload,
): Promise<NotifyResult> {
  const text = p.link && !p.text.includes(p.link) ? `${p.text}\n${p.link}` : p.text;
  // `text` is what Slack and Pumble render; `content` is Discord's field name.
  const r = await postJson(url, { text, content: text });
  return { target, ok: r.ok, skipped: false, error: r.error };
}

/** Generic automation webhook (n8n / Zapier / Make). Structured, not chat-shaped. */
async function sendGenericWebhook(url: string, p: NotifyPayload): Promise<NotifyResult> {
  const r = await postJson(url, {
    source: "kloudbean-seo-engine",
    event: "article_published",
    text: p.text,
    title: p.title ?? null,
    link: p.link ?? null,
    meta: p.meta ?? {},
    ts: new Date().toISOString(),
  });
  return { target: "webhook", ok: r.ok, skipped: false, error: r.error };
}

/**
 * WhatsApp Cloud API, to individual numbers. Sends a template when
 * NOTIFY_WHATSAPP_TEMPLATE is set (which is what you need outside the 24-hour
 * window), otherwise a plain text message.
 */
async function sendWhatsApp(p: NotifyPayload): Promise<NotifyResult[]> {
  const phoneId = env("NOTIFY_WHATSAPP_PHONE_ID");
  const token = env("NOTIFY_WHATSAPP_TOKEN");
  const to = env("NOTIFY_WHATSAPP_TO");
  if (!phoneId || !token || !to) {
    return [{ target: "whatsapp", ok: false, skipped: true }];
  }
  const version = env("NOTIFY_WHATSAPP_API_VERSION") ?? "v21.0";
  const template = env("NOTIFY_WHATSAPP_TEMPLATE");
  const lang = env("NOTIFY_WHATSAPP_TEMPLATE_LANG") ?? "en_US";
  const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
  const body = p.link && !p.text.includes(p.link) ? `${p.text}\n${p.link}` : p.text;

  const recipients = to
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const out: NotifyResult[] = [];
  for (const number of recipients) {
    const message = template
      ? {
          messaging_product: "whatsapp",
          to: number,
          type: "template",
          template: {
            name: template,
            language: { code: lang },
            // One body parameter: the whole message. Your approved template
            // therefore needs exactly one {{1}} placeholder in its body.
            components: [{ type: "body", parameters: [{ type: "text", text: body }] }],
          },
        }
      : {
          messaging_product: "whatsapp",
          to: number,
          type: "text",
          text: { preview_url: true, body },
        };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) {
        out.push({ target: "whatsapp", ok: true, skipped: false });
      } else {
        const detail = await res.text().catch(() => "");
        let hint = "";
        // The most common real failure, worth naming rather than leaving as a
        // raw error code.
        if (!template && /24|window|template|131047|470/i.test(detail)) {
          hint =
            " (outside the 24-hour window: set NOTIFY_WHATSAPP_TEMPLATE to an approved template name)";
        }
        out.push({
          target: "whatsapp",
          ok: false,
          skipped: false,
          error: `HTTP ${res.status}${detail ? ` ${detail.slice(0, 180)}` : ""}${hint}`,
        });
      }
    } catch (e) {
      out.push({
        target: "whatsapp",
        ok: false,
        skipped: false,
        error: String((e as Error)?.message ?? e),
      });
    }
  }
  return out;
}

/**
 * Send one notification to every configured channel. Never throws: a broken
 * Slack webhook must not fail the publish that triggered it, because the article
 * is already live by then and failing the job would retry the publish.
 */
export async function notify(p: NotifyPayload): Promise<NotifyResult[]> {
  if (notifyDisabled()) return [];

  const jobs: Promise<NotifyResult | NotifyResult[]>[] = [];

  const slack = env("NOTIFY_SLACK_WEBHOOK_URL");
  if (slack) jobs.push(sendChatWebhook("slack", slack, p));

  const pumble = env("NOTIFY_PUMBLE_WEBHOOK_URL");
  if (pumble) jobs.push(sendChatWebhook("pumble", pumble, p));

  const discord = env("NOTIFY_DISCORD_WEBHOOK_URL");
  if (discord) jobs.push(sendChatWebhook("discord", discord, p));

  const generic = env("NOTIFY_WEBHOOK_URL");
  if (generic) jobs.push(sendGenericWebhook(generic, p));

  if (env("NOTIFY_WHATSAPP_PHONE_ID")) jobs.push(sendWhatsApp(p));

  if (!jobs.length) return [];

  const settled = await Promise.allSettled(jobs);
  const results: NotifyResult[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") {
      if (Array.isArray(s.value)) results.push(...s.value);
      else results.push(s.value);
    } else {
      results.push({
        target: "webhook",
        ok: false,
        skipped: false,
        error: String(s.reason?.message ?? s.reason),
      });
    }
  }
  return results;
}

/** The message for a freshly published article. */
export function buildPublishedMessage(a: {
  title: string;
  link: string;
  keyword?: string | null;
  position?: { index: number; total: number } | null;
  nextAt?: Date | null;
}): string {
  const lines = [`Published: ${a.title}`];
  if (a.keyword) lines.push(`Target keyword: ${a.keyword}`);
  lines.push(a.link);
  if (a.position) lines.push(`(${a.position.index} of ${a.position.total} in the queue)`);
  if (a.nextAt) {
    lines.push(`Next one due ${a.nextAt.toISOString().replace("T", " ").slice(0, 16)} UTC.`);
  }
  return lines.join("\n");
}

/** Send a test message to every configured channel, so setup can be verified. */
export async function notifyTest(): Promise<NotifyResult[]> {
  return notify({
    text: "Kloudbean SEO engine: notification test. If you can read this, the channel works.",
    link: "https://www.kloudbean.com/blog/",
    title: "Notification test",
    meta: { test: true },
  });
}
