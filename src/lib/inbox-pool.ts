import "@tanstack/react-start/server-only";
import { warmupCapForDay } from "./outreach-warmup";

/**
 * THE INBOX POOL — sending from many addresses without wrecking any of them.
 *
 * WHY SEVERAL ADDRESSES AT ALL. One mailbox has a practical ceiling, and the
 * ceiling is reputation rather than volume. The same domain sends receipts and
 * password resets, so pushing outreach through it puts transactional mail at risk.
 * Spreading the load across addresses lowers the per-address volume, which is what
 * mailbox providers actually judge.
 *
 * WHY SEVERAL ADDRESSES IS ALSO HOW PEOPLE GET BLOCKED. Thirty new addresses that
 * each send twenty cold emails on day one is a textbook spam pattern, and it burns
 * the whole sending domain rather than one mailbox. Everything below exists to stop
 * this file being that.
 *
 * THE FOUR RULES:
 *
 *   1. PER-INBOX WARMUP. Each address has its OWN ramp, counted in days it
 *      actually sent, using the same curve as the global one. A brand new address
 *      on an old domain still starts at five a day.
 *   2. PER-INBOX DAILY CAP, and the pool total can never exceed the global
 *      EMAIL_DAILY_CAP. Adding inboxes buys spread, not permission to send more.
 *   3. THREAD AFFINITY. A conversation keeps the address that started it. If that
 *      address is paused or out of budget, the follow-up WAITS.
 *   4. AUTOMATIC PAUSE on a bounce or complaint rate that says an address is in
 *      trouble, because watching a number is not a control.
 *
 * NO SECRET IS STORED IN THE DATABASE. An inbox row carries a `credentialRef`,
 * which is an environment-variable prefix. The key is read from the environment
 * here, at the moment of sending.
 */

export type InboxIdentity = {
  id: string;
  label: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  /** resend | smtp | default */
  provider: string;
  /** Resolved from the environment. Never read from or written to the database. */
  resendApiKey?: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user?: string;
    password?: string;
  };
};

/* -------------------------------------------------------------------------- *
 * Defining inboxes in the environment
 * -------------------------------------------------------------------------- */

/**
 * The simple case, and the one most people want: many addresses, one provider.
 *
 *   OUTREACH_INBOX_ADDRESSES=vikram@kloudbean.com,hello@kloudbean.com,...
 *
 * Every address in the list shares the globally configured provider, which is what
 * "twenty addresses on one verified domain" actually means in practice. One line
 * rather than sixty, and no per-inbox credentials to manage.
 *
 * An optional display name after a pipe:  vikram@kloudbean.com|Vikram
 */
function parseSharedAddresses(): { email: string; name: string | null }[] {
  const raw = process.env.OUTREACH_INBOX_ADDRESSES?.trim();
  if (!raw) return [];
  return raw
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [email, name] = entry.split("|").map((x) => x.trim());
      return { email: (email ?? "").toLowerCase(), name: name || null };
    })
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.email));
}

/**
 * The harder case: addresses on DIFFERENT providers or accounts, each with its own
 * credentials. Numbered blocks, discovered by scanning rather than by a count, so
 * a gap in the numbering does not silently truncate the pool.
 *
 *   INBOX_1_FROM_EMAIL=vikram@kloudbean.com
 *   INBOX_1_FROM_NAME=Vikram
 *   INBOX_1_PROVIDER=smtp
 *   INBOX_1_SMTP_HOST=smtp.example.com
 *   INBOX_1_SMTP_PORT=587
 *   INBOX_1_SMTP_USER=vikram@kloudbean.com
 *   INBOX_1_SMTP_PASSWORD=...
 *   INBOX_1_DAILY_CAP=15
 */
function parseNumberedInboxes(): {
  ref: string;
  email: string;
  name: string | null;
  replyTo: string | null;
  provider: string;
  dailyCap: number | null;
}[] {
  const refs = new Set<string>();
  for (const key of Object.keys(process.env)) {
    const m = /^(INBOX_\d+)_FROM_EMAIL$/.exec(key);
    if (m) refs.add(m[1]);
  }
  const out: ReturnType<typeof parseNumberedInboxes> = [];
  for (const ref of [...refs].sort()) {
    const email = (process.env[`${ref}_FROM_EMAIL`] ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) continue;
    const cap = Number(process.env[`${ref}_DAILY_CAP`] ?? "");
    out.push({
      ref,
      email,
      name: process.env[`${ref}_FROM_NAME`]?.trim() || null,
      replyTo: process.env[`${ref}_REPLY_TO`]?.trim() || null,
      provider: (process.env[`${ref}_PROVIDER`]?.trim() || "smtp").toLowerCase(),
      dailyCap: Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : null,
    });
  }
  return out;
}

/** Per-address default cap. Deliberately low: spread is the point, not speed. */
function defaultPerInboxCap(): number {
  const n = Number(process.env.OUTREACH_INBOX_DAILY_CAP ?? 15);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 15;
}

/**
 * Read the environment and make the database match it.
 *
 * Additive on purpose. An address that disappears from the environment is NOT
 * deleted, because deleting it would orphan every conversation bound to it and
 * those follow-ups would have nowhere to go. It is left in place for a person to
 * pause or reassign deliberately.
 */
export async function syncInboxesFromEnv(): Promise<{
  added: number;
  updated: number;
  total: number;
  missingCredentials: string[];
  notes: string[];
}> {
  const repo = await import("@/server/db/repos/inboxes");
  const before = await repo.listInboxes();
  const beforeEmails = new Set(before.map((i) => i.from_email));
  const notes: string[] = [];
  const missingCredentials: string[] = [];

  for (const a of parseSharedAddresses()) {
    await repo.upsertInbox({
      label: a.name ? `${a.name} <${a.email}>` : a.email,
      fromEmail: a.email,
      fromName: a.name,
      provider: "default",
      credentialRef: null,
      dailyCap: defaultPerInboxCap(),
      notes: "from OUTREACH_INBOX_ADDRESSES",
    });
  }

  for (const n of parseNumberedInboxes()) {
    // Check the credential exists NOW rather than discovering it at send time,
    // when the failure looks like a provider outage.
    if (n.provider === "smtp" && !process.env[`${n.ref}_SMTP_HOST`]?.trim()) {
      missingCredentials.push(`${n.ref}: no ${n.ref}_SMTP_HOST`);
    }
    if (n.provider === "resend" && !process.env[`${n.ref}_RESEND_API_KEY`]?.trim()) {
      missingCredentials.push(`${n.ref}: no ${n.ref}_RESEND_API_KEY`);
    }
    await repo.upsertInbox({
      label: n.name ? `${n.name} <${n.email}>` : n.email,
      fromEmail: n.email,
      fromName: n.name,
      replyTo: n.replyTo,
      provider: n.provider,
      credentialRef: n.ref,
      dailyCap: n.dailyCap ?? defaultPerInboxCap(),
      notes: `from ${n.ref}_* environment variables`,
    });
  }

  const after = await repo.listInboxes();
  const added = after.filter((i) => !beforeEmails.has(i.from_email)).length;

  const gone = before.filter(
    (b) => !parseSharedAddresses().some((a) => a.email === b.from_email) &&
      !parseNumberedInboxes().some((n) => n.email === b.from_email),
  );
  if (gone.length) {
    notes.push(
      `${gone.length} address(es) are in the database but no longer in the environment. They were left alone rather than deleted, because conversations are bound to them. Pause or reassign them by hand.`,
    );
  }

  return {
    added,
    updated: after.length - added,
    total: after.length,
    missingCredentials,
    notes,
  };
}

/* -------------------------------------------------------------------------- *
 * Credentials
 * -------------------------------------------------------------------------- */

/**
 * Turn a stored inbox row into a usable identity, resolving credentials from the
 * environment. Returns null when the credential the row points at is absent, so a
 * misconfigured address is skipped rather than falling back to the global sender
 * and quietly mailing from the wrong address.
 */
export function resolveInbox(row: {
  id: string;
  label: string;
  from_email: string;
  from_name: string | null;
  reply_to: string | null;
  provider: string;
  credential_ref: string | null;
}): { ok: true; inbox: InboxIdentity } | { ok: false; why: string } {
  const fromName = row.from_name?.trim() || process.env.OUTREACH_FROM_NAME?.trim() || "Kloudbean";
  const replyTo = row.reply_to?.trim() || row.from_email;
  const base = {
    id: row.id,
    label: row.label,
    fromEmail: row.from_email,
    fromName,
    replyTo,
    provider: row.provider,
  };

  if (row.provider === "default") {
    // Shares the globally configured provider. The only thing this address changes
    // is the envelope: who it is from and where a reply goes.
    return { ok: true, inbox: base };
  }

  const ref = row.credential_ref?.trim();
  if (!ref) {
    return { ok: false, why: `${row.from_email} says provider "${row.provider}" but has no credential reference` };
  }

  if (row.provider === "resend") {
    const key = process.env[`${ref}_RESEND_API_KEY`]?.trim();
    if (!key) return { ok: false, why: `${row.from_email} needs ${ref}_RESEND_API_KEY, which is not set` };
    return { ok: true, inbox: { ...base, resendApiKey: key } };
  }

  if (row.provider === "smtp") {
    const host = process.env[`${ref}_SMTP_HOST`]?.trim();
    if (!host) return { ok: false, why: `${row.from_email} needs ${ref}_SMTP_HOST, which is not set` };
    const port = Number(process.env[`${ref}_SMTP_PORT`] ?? 587);
    return {
      ok: true,
      inbox: {
        ...base,
        smtp: {
          host,
          port: Number.isFinite(port) && port > 0 ? port : 587,
          secure: process.env[`${ref}_SMTP_SECURE`] === "1",
          user: process.env[`${ref}_SMTP_USER`]?.trim() || row.from_email,
          password: process.env[`${ref}_SMTP_PASSWORD`] ?? "",
        },
      },
    };
  }

  return { ok: false, why: `${row.from_email} has an unknown provider "${row.provider}"` };
}

/* -------------------------------------------------------------------------- *
 * Budget per address
 * -------------------------------------------------------------------------- */

export type InboxBudget = {
  id: string;
  label: string;
  fromEmail: string;
  status: string;
  pausedReason: string | null;
  configuredCap: number;
  warmupCap: number;
  effectiveCap: number;
  sentToday: number;
  sentTotal: number;
  remaining: number;
  daysSending: number;
  warmingUp: boolean;
  conversations: number;
  bounces: number;
  complaints: number;
  bounceRate: number | null;
  lastSentAt: string | null;
  /** Why this address can or cannot send right now, in plain words. */
  reason: string;
};

function bounceRateLimit(): number {
  const n = Number(process.env.OUTREACH_MAX_BOUNCE_RATE ?? 5);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

/** Real sends below this, a rate means nothing, so it is not acted on. */
const MIN_SENDS_FOR_RATE = 20;

/**
 * The state of every address: what it may send, what it has sent, and why.
 *
 * The reason string is not decoration. "Nothing went out today" with no explanation
 * is the kind of thing that gets debugged by switching safety features off.
 */
export async function inboxBudgets(): Promise<InboxBudget[]> {
  const repo = await import("@/server/db/repos/inboxes");
  const [rows, today, days, totals, convos] = await Promise.all([
    repo.listInboxes(),
    repo.sentTodayByInbox(),
    repo.sendingDaysByInbox(),
    repo.sentTotalByInbox(),
    repo.conversationsByInbox(),
  ]);

  const warmupOn = process.env.OUTREACH_WARMUP !== "0";
  const maxBounce = bounceRateLimit();

  return rows.map((i) => {
    const sentToday = today[i.id] ?? 0;
    const sentTotal = totals[i.id] ?? 0;
    const daysSending = days[i.id] ?? 0;
    const warmupCap = warmupOn ? warmupCapForDay(daysSending) : Number.POSITIVE_INFINITY;
    const configuredCap = i.daily_cap;
    const effectiveCap = Math.min(configuredCap, warmupCap);
    const remaining = Math.max(0, effectiveCap - sentToday);
    const warmingUp = Number.isFinite(warmupCap) && warmupCap < configuredCap;
    const problems = i.bounces + i.complaints;
    // A rate on four sends is noise wearing a percentage sign.
    const bounceRate = sentTotal >= MIN_SENDS_FOR_RATE ? Math.round((problems / sentTotal) * 1000) / 10 : null;

    let reason: string;
    if (i.status === "paused") {
      reason = `paused: ${i.paused_reason ?? "no reason recorded"}`;
    } else if (bounceRate != null && bounceRate > maxBounce) {
      reason = `${bounceRate}% of its emails bounced or drew a complaint, over the ${maxBounce}% limit`;
    } else if (remaining <= 0 && warmingUp) {
      reason = `today's warmup limit of ${effectiveCap} is used up (day ${daysSending} of sending)`;
    } else if (remaining <= 0) {
      reason = `today's limit of ${effectiveCap} is used up`;
    } else if (warmingUp) {
      reason = `warming up: ${remaining} of ${effectiveCap} left today (day ${daysSending} of sending)`;
    } else {
      reason = `${remaining} of ${effectiveCap} left today`;
    }

    return {
      id: i.id,
      label: i.label,
      fromEmail: i.from_email,
      status: i.status,
      pausedReason: i.paused_reason,
      configuredCap,
      warmupCap: Number.isFinite(warmupCap) ? warmupCap : configuredCap,
      effectiveCap,
      sentToday,
      sentTotal,
      remaining,
      daysSending,
      warmingUp,
      conversations: convos[i.id] ?? 0,
      bounces: i.bounces,
      complaints: i.complaints,
      bounceRate,
      lastSentAt: i.last_sent_at,
      reason,
    };
  });
}

/** Can this address send right now? */
function isAvailable(b: InboxBudget): boolean {
  if (b.status !== "active") return false;
  if (b.remaining <= 0) return false;
  if (b.bounceRate != null && b.bounceRate > bounceRateLimit()) return false;
  return true;
}

/* -------------------------------------------------------------------------- *
 * Picking one
 * -------------------------------------------------------------------------- */

export type InboxChoice =
  | { ok: true; inbox: InboxIdentity; budget: InboxBudget; reused: boolean }
  | { ok: false; hold: boolean; why: string };

/**
 * Choose the address for one message.
 *
 * THE ORDER OF THESE BRANCHES IS THE WHOLE DESIGN.
 *
 * An existing conversation is checked FIRST, and if its address cannot send, the
 * answer is HOLD rather than "use another one". Switching address mid-thread breaks
 * threading in the recipient's client and reads as two strangers writing about the
 * same thing, which is worse than the follow-up arriving a day late. `hold: true`
 * says exactly that: not a failure, try again tomorrow.
 *
 * Only a conversation that has never actually been sent to may be reassigned, and
 * that is safe because there is no thread yet to break.
 */
export async function pickInboxFor(opts: {
  prospectId: string;
  /** Real sends only. A prospect at zero touches has no thread to protect. */
  touchesSent?: number;
  /** Pass the shared budget list to avoid re-querying it per message in a batch. */
  budgets?: InboxBudget[];
}): Promise<InboxChoice> {
  const repo = await import("@/server/db/repos/inboxes");
  const budgets = opts.budgets ?? (await inboxBudgets());

  if (!budgets.length) {
    return {
      ok: false,
      hold: false,
      why: "No sending addresses are set up, so the single global address is used instead.",
    };
  }

  const assignedId = await repo.inboxForProspect(opts.prospectId);
  if (assignedId) {
    const mine = budgets.find((b) => b.id === assignedId);
    const alreadySent = (opts.touchesSent ?? 0) > 0;

    if (mine && isAvailable(mine)) {
      const row = await repo.getInboxById(mine.id);
      const r = row ? resolveInbox(row) : { ok: false as const, why: "address disappeared" };
      if (!r.ok) return { ok: false, hold: true, why: r.why };
      return { ok: true, inbox: r.inbox, budget: mine, reused: true };
    }

    if (alreadySent) {
      // The important branch. Wait rather than write from a different address.
      return {
        ok: false,
        hold: true,
        why: mine
          ? `waiting for ${mine.fromEmail}, which started this conversation: ${mine.reason}`
          : "the address that started this conversation no longer exists; reassign it by hand",
      };
    }
    // Never actually sent, so there is no thread to keep. Fall through and pick
    // fresh rather than blocking on an address that was only ever pencilled in.
  }

  /**
   * Least recently used first, among addresses that can send.
   *
   * LRU rather than "whichever has the most budget left" because the aim is an even
   * spread over time. Picking the emptiest address concentrates the day's sending
   * into whichever one was added last, which is the pattern that gets a new address
   * filtered.
   */
  const available = budgets
    .filter(isAvailable)
    .sort((a, b) => {
      const at = a.lastSentAt ? new Date(a.lastSentAt).getTime() : 0;
      const bt = b.lastSentAt ? new Date(b.lastSentAt).getTime() : 0;
      return at - bt;
    });

  if (!available.length) {
    const paused = budgets.filter((b) => b.status === "paused").length;
    const spent = budgets.filter((b) => b.status === "active" && b.remaining <= 0).length;
    return {
      ok: false,
      hold: true,
      why: `no address can send right now: ${spent} have used today's limit, ${paused} are paused`,
    };
  }

  for (const cand of available) {
    const row = await repo.getInboxById(cand.id);
    if (!row) continue;
    const r = resolveInbox(row);
    // A misconfigured address is skipped rather than allowed to fail the whole run.
    if (!r.ok) continue;
    return { ok: true, inbox: r.inbox, budget: cand, reused: false };
  }

  return {
    ok: false,
    hold: true,
    why: "every available address is missing its credentials; check the INBOX_* environment variables",
  };
}

/* -------------------------------------------------------------------------- *
 * Pool-level view
 * -------------------------------------------------------------------------- */

export type PoolStatus = {
  configured: number;
  active: number;
  paused: number;
  /** What the pool may send today, already limited by the global cap. */
  allowedToday: number;
  poolCapacity: number;
  globalCap: number;
  sentToday: number;
  warmingUp: number;
  stranded: number;
  inboxes: InboxBudget[];
  reason: string;
};

/**
 * The pool as one number plus the reasoning.
 *
 * `allowedToday` is the pool's own remaining capacity CLAMPED by the global daily
 * cap and by what the global budget has already used. Adding inboxes must never be
 * a way to raise the ceiling; it is a way to spread the same ceiling across more
 * addresses. Anything else turns this file into a tool for sending more, which is
 * precisely the failure it exists to prevent.
 */
export async function poolStatus(): Promise<PoolStatus> {
  const { dailyCap } = await import("./email-sender");
  const repo = await import("@/server/db/repos/inboxes");
  const [inboxes, stranded] = await Promise.all([inboxBudgets(), repo.strandedConversations()]);

  const active = inboxes.filter((i) => i.status === "active").length;
  const paused = inboxes.length - active;
  const poolCapacity = inboxes.filter(isAvailable).reduce((n, i) => n + i.remaining, 0);
  const sentToday = inboxes.reduce((n, i) => n + i.sentToday, 0);
  const globalCap = dailyCap();
  const allowedToday = Math.max(0, Math.min(poolCapacity, globalCap - sentToday));
  const warmingUp = inboxes.filter((i) => i.warmingUp).length;

  let reason: string;
  if (!inboxes.length) {
    reason =
      "No addresses are set up, so everything sends from the single global address. Set OUTREACH_INBOX_ADDRESSES to spread the load.";
  } else if (allowedToday <= 0 && poolCapacity > 0) {
    reason = `the addresses have room but the overall daily limit of ${globalCap} is used up`;
  } else if (allowedToday <= 0) {
    reason = `all ${inboxes.length} addresses have used their limit for today`;
  } else {
    reason = `${allowedToday} emails can go out now, across ${active} address${active === 1 ? "" : "es"}${
      warmingUp ? `, ${warmingUp} still warming up` : ""
    }`;
  }

  return {
    configured: inboxes.length,
    active,
    paused,
    allowedToday,
    poolCapacity,
    globalCap,
    sentToday,
    warmingUp,
    stranded,
    inboxes,
    reason,
  };
}

/**
 * Pause any address whose bounce or complaint rate has gone past the limit.
 *
 * Automatic because a rate on a dashboard is not a control. By the time somebody
 * notices a climbing bounce rate, the damage to that address is done, and the whole
 * point of having thirty addresses is that losing one should not matter. Only acts
 * above MIN_SENDS_FOR_RATE real sends, so a single bounce on a new address does not
 * pause it.
 */
export async function pauseUnhealthyInboxes(): Promise<{ paused: string[]; checked: number }> {
  const repo = await import("@/server/db/repos/inboxes");
  const budgets = await inboxBudgets();
  const limit = bounceRateLimit();
  const paused: string[] = [];

  for (const b of budgets) {
    if (b.status !== "active") continue;
    if (b.bounceRate == null || b.bounceRate <= limit) continue;
    await repo.setInboxStatus(
      b.id,
      "paused",
      `${b.bounceRate}% of ${b.sentTotal} emails bounced or drew a complaint, over the ${limit}% limit`,
    );
    paused.push(b.fromEmail);
  }
  return { paused, checked: budgets.length };
}
