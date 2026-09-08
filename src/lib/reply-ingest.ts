import "@tanstack/react-start/server-only";
import { classifyReply, stopReasonFor, stripQuotedReply } from "./reply-classifier";

/**
 * REPLY INGEST — takes one inbound email and makes the system react to it.
 *
 * Deliberately source-agnostic: it accepts a normalised message and does not care
 * whether it arrived by IMAP poll, a provider webhook, or a human pasting it in.
 * That keeps the decision logic in one place and means adding a second inbound
 * source later needs no changes here.
 *
 * WHAT IT DOES, in order, per message:
 *   1. Deduplicate on the provider message id, so re-polling the same mailbox does
 *      not re-suppress an address or double-count a reply.
 *   2. Match the sender to a prospect. Address first, then domain, because people
 *      reply from a personal address after being contacted on a role one.
 *   3. Classify it.
 *   4. Stop the sequence, unless it was only an out-of-office.
 *   5. Suppress the address when they asked to stop, complained, or the address is
 *      permanently undeliverable.
 *   6. Record it, so a human can check the machine's reading.
 *
 * IT NEVER SENDS A REPLY. Auto-answering a real person who took the time to
 * respond is the one thing that would make this system worse than doing nothing.
 * An interested reply is flagged for a human, and that is the whole point.
 */

export type InboundEmail = {
  fromEmail: string;
  fromName?: string | null;
  subject?: string | null;
  body?: string | null;
  providerMessageId?: string | null;
  /** In-Reply-To / References, used to tie the reply to the exact message. */
  inReplyTo?: string | null;
  receivedAt?: Date | null;
  /** e.g. "email.bounced" from a provider webhook. */
  providerEvent?: string | null;
};

export type IngestResult = {
  stored: boolean;
  duplicate: boolean;
  matchedProspect: boolean;
  classification: string;
  stoppedSequence: boolean;
  suppressed: boolean;
  needsHuman: boolean;
  reason: string;
};

/**
 * Handle one inbound message.
 *
 * Unmatched senders are still recorded. A reply from an address we never wrote to
 * is usually a forward inside the same company, and silently dropping it would
 * hide the most interesting thing that can happen in a link campaign.
 */
export async function ingestReply(msg: InboundEmail): Promise<IngestResult> {
  const repo = await import("@/server/db/repos/outreach");
  const replies = await import("@/server/db/repos/replies");

  const from = (msg.fromEmail ?? "").trim().toLowerCase();
  const out: IngestResult = {
    stored: false,
    duplicate: false,
    matchedProspect: false,
    classification: "unknown",
    stoppedSequence: false,
    suppressed: false,
    needsHuman: false,
    reason: "",
  };

  if (!from || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(from)) {
    out.reason = "no usable sender address";
    return out;
  }

  if (msg.providerMessageId) {
    if (await replies.replyExists(msg.providerMessageId)) {
      out.duplicate = true;
      out.reason = "already seen";
      return out;
    }
  }

  const c = classifyReply({
    fromEmail: from,
    subject: msg.subject,
    body: msg.body,
    providerEvent: msg.providerEvent,
  });
  out.classification = c.classification;
  out.reason = c.reason;

  // Match to a prospect. A bounce arrives from mailer-daemon rather than the
  // recipient, so for machine mail the real address has to come out of the body.
  let prospect = await replies.findProspectByEmail(from);
  if (!prospect && c.isAutomated) {
    const quoted = extractOriginalRecipient(msg.body ?? "", msg.subject ?? "");
    if (quoted) prospect = await replies.findProspectByEmail(quoted);
  }
  if (!prospect) {
    // Somebody at the same company answering from a different mailbox.
    const domain = from.split("@")[1];
    if (domain) prospect = await replies.findProspectByDomain(domain);
  }
  out.matchedProspect = !!prospect;

  // Which of our messages is this answering? Best effort, used only for display.
  let messageId: string | null = null;
  if (prospect) {
    const mine = await repo.listMessages({ prospectId: prospect.id, limit: 5 });
    const sent = mine.filter((m) => m.status === "sent");
    messageId = sent[0]?.id ?? null;
  }

  await replies.insertReply({
    prospectId: prospect?.id ?? null,
    messageId,
    fromEmail: from,
    subject: msg.subject ?? null,
    snippet: stripQuotedReply(msg.body ?? "").slice(0, 600) || null,
    providerMessageId: msg.providerMessageId ?? null,
    classification: c.classification,
    confidence: c.confidence,
    isAutomated: c.isAutomated,
    // An out-of-office needs nothing from anybody, so it is filed as handled.
    handled: !c.stopsSequence,
  });
  out.stored = true;

  if (prospect && c.stopsSequence) {
    const reason = stopReasonFor(c);
    if (reason) {
      await repo.stopSequence(prospect.id, reason, {
        replyAt: msg.receivedAt ?? new Date(),
        status:
          c.classification === "interested"
            ? "replied"
            : c.classification === "not_interested"
              ? "lost"
              : c.classification === "bounce"
                ? "suppressed"
                : "replied",
      });
      out.stoppedSequence = true;

      // Keep the link pipeline honest about what happened.
      const linkRepo = await import("@/server/db/repos/link-prospects");
      const own = await linkProspectFor(prospect.id);
      if (own) {
        await linkRepo.updateLinkProspectStatus(
          own,
          c.classification === "interested" ? "replied" : c.classification === "not_interested" ? "lost" : "replied",
        );
      }
    }
  }

  /**
   * Charge a bounce or a complaint to the address that actually sent the email.
   *
   * A global bounce count cannot be acted on. With thirty addresses in rotation,
   * the useful question is "which one is in trouble", because pausing that one
   * costs almost nothing while pausing everything stops the programme. The
   * conversation is already bound to a sending address, so the attribution is
   * simply a lookup rather than a guess.
   *
   * Wrapped and swallowed on purpose: this is bookkeeping, and it must never be the
   * reason a bounce fails to suppress an address.
   */
  if (prospect && (c.classification === "bounce" || c.classification === "complaint")) {
    try {
      const inboxRepo = await import("@/server/db/repos/inboxes");
      const inboxId = await inboxRepo.inboxForProspect(prospect.id);
      if (inboxId) {
        await inboxRepo.recordInboxProblem(inboxId, c.classification === "bounce" ? "bounce" : "complaint");
      }
    } catch {
      /* never let an audit write break a suppression */
    }
  }

  if (c.suppress) {
    await repo.addSuppression({
      email: from,
      reason: c.suppress,
      note: `auto: ${c.reason}`,
    });
    // Suppress the address we actually wrote to as well, when it differs. A
    // complaint about an email we sent to editor@ is not answered by blocking the
    // personal address the complaint came from.
    if (prospect && prospect.email.toLowerCase() !== from) {
      await repo.addSuppression({
        email: prospect.email,
        reason: c.suppress,
        note: `auto: ${c.reason} (reported from ${from})`,
      });
    }
    out.suppressed = true;
  }

  // An interested reply or a question is the valuable outcome and the one thing a
  // person must handle.
  out.needsHuman = ["interested", "question", "unknown", "complaint"].includes(c.classification);
  return out;
}

/** Which link prospect, if any, this contact belongs to. */
async function linkProspectFor(prospectId: string): Promise<string | null> {
  const { getDb } = await import("@/server/db/client");
  const db = await getDb();
  try {
    const r: any = await db.execute(
      `select id from link_prospects where prospect_id = '${prospectId.replace(/'/g, "")}' limit 1`,
    );
    return (r.rows ?? r)[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Dig the original recipient out of a bounce report.
 *
 * A bounce comes from mailer-daemon, so the address that actually failed is only
 * mentioned inside the body. Without this, every bounce would fail to match a
 * prospect and the sequence would keep emailing a dead mailbox.
 */
export function extractOriginalRecipient(body: string, subject: string): string | null {
  const hay = `${subject}\n${body}`;
  const patterns = [
    /(?:final|original)[- ]recipient:\s*(?:rfc822;)?\s*([^\s<>]+@[^\s<>]+)/i,
    /to:\s*<?([^\s<>]+@[^\s<>]+)>?/i,
    /(?:failed|undelivered|not delivered) to\s*:?\s*<?([^\s<>]+@[^\s<>]+)>?/i,
    /<([^\s<>]+@[^\s<>]+)>:\s/,
  ];
  for (const re of patterns) {
    const m = re.exec(hay);
    if (m?.[1]) {
      const addr = m[1].trim().toLowerCase().replace(/[.,;]$/, "");
      // Ignore our own addresses: they appear in every quoted bounce.
      if (!/kloudbean/i.test(addr)) return addr;
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- *
 * IMAP polling
 * -------------------------------------------------------------------------- */

/**
 * Why IMAP rather than a provider webhook.
 *
 * A webhook from a sending provider reports deliveries, bounces and complaints,
 * and those matter. But it cannot report a REPLY, because a reply never touches
 * the sending provider at all: it goes to the reply-to mailbox. Replies are the
 * signal the whole sequence depends on, so polling the mailbox is not the lazy
 * option, it is the only one that sees everything. Bounce reports land in the same
 * mailbox, so one source covers both.
 *
 * imapflow is an OPTIONAL dependency, imported through a variable specifier so the
 * bundler does not require it, exactly as email-sender.ts does with nodemailer.
 * Absent library or missing config means this reports why and does nothing.
 */
export function imapConfigured(): boolean {
  return !!(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASSWORD);
}

export type PollResult = {
  available: boolean;
  fetched: number;
  ingested: number;
  duplicates: number;
  stopped: number;
  suppressed: number;
  needsHuman: number;
  errors: string[];
  note?: string;
};

export async function pollInbox(opts: { max?: number } = {}): Promise<PollResult> {
  const out: PollResult = {
    available: false,
    fetched: 0,
    ingested: 0,
    duplicates: 0,
    stopped: 0,
    suppressed: 0,
    needsHuman: 0,
    errors: [],
  };

  if (!imapConfigured()) {
    out.note =
      "IMAP is not configured. Set IMAP_HOST, IMAP_USER and IMAP_PASSWORD to let the system read replies.";
    return out;
  }

  let ImapFlow: any;
  try {
    const specifier = "imapflow";
    const mod: any = await import(/* @vite-ignore */ specifier);
    ImapFlow = mod.ImapFlow ?? mod.default?.ImapFlow;
  } catch {
    out.note =
      "The imapflow package is not installed, so replies cannot be read yet. Install it with: npm i imapflow";
    return out;
  }
  if (!ImapFlow) {
    out.note = "imapflow loaded but did not export ImapFlow.";
    return out;
  }

  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT || 993),
    secure: process.env.IMAP_SECURE !== "0",
    auth: { user: process.env.IMAP_USER, pass: process.env.IMAP_PASSWORD },
    logger: false,
  });

  const max = opts.max ?? Number(process.env.IMAP_MAX_PER_POLL || 40);
  const mailbox = process.env.IMAP_MAILBOX || "INBOX";

  try {
    await client.connect();
    out.available = true;
    const lock = await client.getMailboxLock(mailbox);
    try {
      // Unseen only. Marking as seen after processing is what stops the same reply
      // being handled twice, and the provider-id dedupe is the second line.
      const uids: number[] = await client.search({ seen: false }, { uid: true });
      const slice = (uids ?? []).slice(-max);

      for (const uid of slice) {
        try {
          const m: any = await client.fetchOne(String(uid), { envelope: true, source: true }, { uid: true });
          if (!m) continue;
          out.fetched++;

          const fromAddr = m.envelope?.from?.[0];
          const body = await extractTextBody(m.source?.toString?.("utf8") ?? "");

          const r = await ingestReply({
            fromEmail: fromAddr?.address ?? "",
            fromName: fromAddr?.name ?? null,
            subject: m.envelope?.subject ?? null,
            body,
            providerMessageId: m.envelope?.messageId ?? `imap-uid-${uid}`,
            inReplyTo: m.envelope?.inReplyTo ?? null,
            receivedAt: m.envelope?.date ? new Date(m.envelope.date) : new Date(),
          });

          if (r.duplicate) out.duplicates++;
          else if (r.stored) out.ingested++;
          if (r.stoppedSequence) out.stopped++;
          if (r.suppressed) out.suppressed++;
          if (r.needsHuman) out.needsHuman++;

          await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
        } catch (e) {
          out.errors.push(`uid ${uid}: ${String((e as Error)?.message ?? e).slice(0, 120)}`);
        }
      }
    } finally {
      lock.release();
    }
  } catch (e) {
    out.errors.push(String((e as Error)?.message ?? e).slice(0, 200));
  } finally {
    try {
      await client.logout();
    } catch {
      /* closing a broken connection is not an error worth reporting */
    }
  }

  return out;
}

/**
 * Pull readable text out of a raw RFC822 message.
 *
 * Deliberately minimal rather than a full MIME parser: the classifier only needs
 * enough prose to read intent, and a dependency-free approximation that handles
 * the common cases beats requiring another package. Prefers text/plain, falls back
 * to stripping tags from the HTML part.
 */
async function extractTextBody(raw: string): Promise<string> {
  if (!raw) return "";
  const decodeQp = (s: string) =>
    s
      .replace(/=\r?\n/g, "")
      .replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));

  const parts = raw.split(/\r?\n\r?\n/);
  const headers = parts[0] ?? "";
  const rest = parts.slice(1).join("\n\n");

  const isQp = /content-transfer-encoding:\s*quoted-printable/i.test(headers);
  const isB64 = /content-transfer-encoding:\s*base64/i.test(headers);

  // Multipart: find the text/plain section.
  const boundary = /boundary="?([^";\r\n]+)"?/i.exec(headers)?.[1];
  if (boundary) {
    const chunks = rest.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    const plain = chunks.find((c) => /content-type:\s*text\/plain/i.test(c));
    const html = chunks.find((c) => /content-type:\s*text\/html/i.test(c));
    const chosen = plain ?? html;
    if (chosen) {
      const [h, ...b] = chosen.split(/\r?\n\r?\n/);
      let body = b.join("\n\n");
      if (/quoted-printable/i.test(h)) body = decodeQp(body);
      if (/base64/i.test(h)) {
        try {
          body = Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8");
        } catch {
          /* leave it as-is */
        }
      }
      if (!plain) body = body.replace(/<[^>]+>/g, " ");
      return body.slice(0, 20_000);
    }
  }

  let body = rest;
  if (isQp) body = decodeQp(body);
  if (isB64) {
    try {
      body = Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8");
    } catch {
      /* leave it as-is */
    }
  }
  if (/content-type:\s*text\/html/i.test(headers)) body = body.replace(/<[^>]+>/g, " ");
  return body.slice(0, 20_000);
}
