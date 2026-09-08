/**
 * EMAIL TEMPLATES — the HTML and plain-text bodies we actually send.
 *
 * Two shapes only: an article announcement for the list, and a one-to-one
 * outreach note. They are deliberately plain. Heavy marketing HTML lands in
 * Promotions, breaks in Outlook, and reads like a newsletter nobody asked for;
 * a narrow single-column layout with real text renders everywhere and looks like
 * a person sent it.
 *
 * Two things are baked into the markup rather than left to whoever sends:
 *   - a visible unsubscribe link, and a physical identification line. Both are
 *     legal requirements for bulk commercial mail in most of the markets
 *     Kloudbean sells into, and both are trivial to forget.
 *   - `{{UNSUBSCRIBE_URL}}` as a token the sender must replace per recipient, so
 *     an unsubscribe is per-person rather than a shared link.
 *
 * The sender refuses to transmit a body that still contains an unreplaced token,
 * so a missing unsubscribe fails loudly instead of going out.
 */

import type { ArticleSource } from "./distribution-channels";

export const UNSUBSCRIBE_TOKEN = "{{UNSUBSCRIBE_URL}}";

/** Sender identity, overridable by env so staging cannot mail as production. */
export function senderIdentity(): {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  postalAddress: string;
} {
  return {
    fromName: process.env.OUTREACH_FROM_NAME?.trim() || "Kloudbean",
    fromEmail: process.env.OUTREACH_FROM_EMAIL?.trim() || "hello@kloudbean.com",
    replyTo: process.env.OUTREACH_REPLY_TO?.trim() || process.env.OUTREACH_FROM_EMAIL?.trim() || "hello@kloudbean.com",
    postalAddress: process.env.OUTREACH_POSTAL_ADDRESS?.trim() || "Kloudbean",
  };
}

const esc = (s: string): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const clip = (s: string, n: number): string => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1).replace(/\s+\S*$/, "")}\u2026`;
};

/** Shared shell: one column, system fonts, real text, mandatory footer. */
function shell(bodyHtml: string, opts: { preview: string; showUnsubscribe: boolean }): string {
  const id = senderIdentity();
  const footer = opts.showUnsubscribe
    ? `<p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#6b7280">
        You are receiving this because you subscribed to Kloudbean updates.
        <a href="${UNSUBSCRIBE_TOKEN}" style="color:#6b7280;text-decoration:underline">Unsubscribe</a>.<br>
        ${esc(id.postalAddress)}
      </p>`
    : `<p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#6b7280">
        Reply with "no thanks" and I will not follow up again.<br>
        ${esc(id.postalAddress)} &middot;
        <a href="${UNSUBSCRIBE_TOKEN}" style="color:#6b7280;text-decoration:underline">unsubscribe</a>
      </p>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f6f7fb">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb">
    <tr><td align="center" style="padding:28px 14px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="max-width:560px;background:#ffffff;border:1px solid #e6e9f2;border-radius:12px">
        <tr><td style="padding:28px 26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:#1c2536">
          ${bodyHtml}
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export type RenderedEmail = {
  subject: string;
  preview: string;
  html: string;
  text: string;
};

/**
 * The article announcement. One idea, one link, no digest padding: the point is
 * that a subscriber can tell in two seconds whether this one is for them.
 */
export function renderArticleEmail(a: ArticleSource): RenderedEmail {
  const lead = a.points[0] ?? a.summary;
  const rest = a.points.slice(1, 3).join(" ") || "";
  const subject = clip(a.title, 78);
  const preview = clip(lead, 120);

  const bullets = a.points.slice(0, 4);
  const bulletHtml = bullets.length
    ? `<ul style="margin:0 0 18px;padding-left:20px">${bullets
        .map((p) => `<li style="margin:0 0 8px">${esc(clip(p, 160))}</li>`)
        .join("")}</ul>`
    : "";

  const html = shell(
    `<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#000f27">${esc(a.title)}</p>
     <p style="margin:0 0 16px">${esc(clip(lead, 320))}</p>
     ${bulletHtml}
     ${rest ? `<p style="margin:0 0 20px">${esc(clip(rest, 320))}</p>` : ""}
     <p style="margin:0 0 6px">
       <a href="${esc(a.url)}" style="display:inline-block;background:#4F1AF3;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">Read the guide</a>
     </p>`,
    { preview, showUnsubscribe: true },
  );

  const text = [
    a.title,
    "",
    clip(lead, 320),
    "",
    ...bullets.map((p) => `- ${clip(p, 160)}`),
    "",
    rest ? `${clip(rest, 320)}\n` : "",
    `Read it: ${a.url}`,
    "",
    `Unsubscribe: ${UNSUBSCRIBE_TOKEN}`,
    senderIdentity().postalAddress,
  ]
    .filter((l) => l !== "")
    .join("\n");

  return { subject, preview, html, text };
}

/**
 * A one-to-one outreach note. Plain by design: no logo, no banner, no tracking
 * pixel. It has to read like an engineer wrote it to one person, because that is
 * the only kind of cold email anyone answers.
 */
export function renderOutreachEmail(input: {
  subject: string;
  greetingName?: string | null;
  /** The one specific, true line about their work. */
  personalNote: string;
  /** The useful thing we are leading with. */
  valueParagraph: string;
  assetTitle?: string;
  assetUrl?: string;
  /** Exactly one ask, phrased so "no" is easy. */
  ask: string;
  signOff?: string;
}): RenderedEmail {
  const id = senderIdentity();
  const greeting = input.greetingName?.trim() ? `Hi ${input.greetingName.trim()},` : "Hi,";
  const assetLine =
    input.assetUrl && input.assetTitle
      ? `<p style="margin:0 0 16px"><a href="${esc(input.assetUrl)}" style="color:#4F1AF3">${esc(input.assetTitle)}</a></p>`
      : "";

  const html = shell(
    `<p style="margin:0 0 16px">${esc(greeting)}</p>
     <p style="margin:0 0 16px">${esc(input.personalNote)}</p>
     <p style="margin:0 0 16px">${esc(input.valueParagraph)}</p>
     ${assetLine}
     <p style="margin:0 0 16px">${esc(input.ask)}</p>
     <p style="margin:0">${esc(input.signOff ?? id.fromName)}</p>`,
    { preview: clip(input.personalNote, 120), showUnsubscribe: false },
  );

  const text = [
    greeting,
    "",
    input.personalNote,
    "",
    input.valueParagraph,
    "",
    input.assetUrl && input.assetTitle ? `${input.assetTitle}: ${input.assetUrl}\n` : "",
    input.ask,
    "",
    input.signOff ?? id.fromName,
    "",
    `Not interested? Reply "no thanks" and I will stop. Unsubscribe: ${UNSUBSCRIBE_TOKEN}`,
    id.postalAddress,
  ]
    .filter((l) => l !== "")
    .join("\n");

  return {
    subject: input.subject,
    preview: clip(input.personalNote, 120),
    html,
    text,
  };
}
