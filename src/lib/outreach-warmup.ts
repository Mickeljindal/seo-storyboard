import "@tanstack/react-start/server-only";

/**
 * SENDING WARMUP AND PER-DOMAIN LIMITS.
 *
 * WHY THIS EXISTS. The daily cap in email-sender.ts stops a loop turning into a
 * thousand emails, which is a different problem from the one here. This is about
 * the fact that a domain which has never sent cold email and suddenly sends sixty
 * in a day looks exactly like a compromised account, because that is what
 * compromised accounts do. Mailbox providers respond by filtering everything from
 * that domain, and a burned sending reputation takes months to rebuild if it comes
 * back at all.
 *
 * The part people underestimate: it is the SAME domain that sends password resets,
 * invoices and receipts. Burning it to send outreach faster costs transactional
 * email too. That is the real argument for a ramp, and it is an argument about
 * self-interest rather than etiquette.
 *
 * TWO SEPARATE LIMITS, because they prevent different failures:
 *
 *   1. THE RAMP — how many per day in total, growing with sending history. Guards
 *      the sending domain's reputation.
 *
 *   2. THE PER-DOMAIN LIMIT — how many to one recipient organisation per day,
 *      default one. Guards against looking like a bot to a single publication.
 *      Three emails to three people at the same magazine on the same morning is
 *      how a real prospect becomes a spam report, and the backlink miner makes
 *      this likely rather than theoretical: a publisher with several linking pages
 *      can easily produce several contacts.
 *
 * Both sit UNDER the existing EMAIL_DAILY_CAP. Nothing here can raise a limit,
 * only lower it.
 */

/**
 * The ramp, in days of actual sending history.
 *
 * Conservative on purpose. The cost of ramping slowly is a few weeks; the cost of
 * ramping too fast is the domain. Numbers follow the ordinary shape of provider
 * guidance rather than any single vendor's published table, so they are a
 * defensible default rather than a claim about a specific provider's rules.
 */
const RAMP: { throughDay: number; cap: number }[] = [
  { throughDay: 2, cap: 5 },
  { throughDay: 4, cap: 10 },
  { throughDay: 7, cap: 20 },
  { throughDay: 14, cap: 35 },
  { throughDay: 21, cap: 50 },
];

/** Cap implied by the ramp for a given number of sending days. */
export function warmupCapForDay(daysSending: number): number {
  const d = Math.max(0, Math.floor(daysSending));
  for (const step of RAMP) {
    if (d <= step.throughDay) return step.cap;
  }
  return Number.POSITIVE_INFINITY; // warmed up: the configured cap applies
}

export function warmupEnabled(): boolean {
  return process.env.OUTREACH_WARMUP !== "0";
}

/** Emails allowed to one recipient organisation per day. */
export function maxPerRecipientDomainPerDay(): number {
  const n = Number(process.env.OUTREACH_MAX_PER_DOMAIN_PER_DAY || 1);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export type SendBudget = {
  /** What the send loop may actually do right now. */
  allowed: number;
  configuredCap: number;
  warmupCap: number;
  sentToday: number;
  daysSending: number;
  warmingUp: boolean;
  withinWindow: boolean;
  reason: string;
};

/**
 * How many emails may go out right now, and why.
 *
 * Returns the reasoning as well as the number so the UI and the logs can explain a
 * zero. "Nothing sent today" with no explanation is the kind of thing that gets
 * debugged by turning safety features off.
 */
export async function sendBudget(): Promise<SendBudget> {
  const repo = await import("@/server/db/repos/outreach");
  const { dailyCap } = await import("./email-sender");
  const { isWithinSendWindow } = await import("./outreach-sequence");

  const configuredCap = dailyCap();
  const sentToday = await repo.countSentToday();
  const withinWindow = isWithinSendWindow();

  let daysSending = 0;
  let warmupCap = Number.POSITIVE_INFINITY;

  if (warmupEnabled()) {
    // Count DISTINCT DAYS on which something was actually sent, not calendar days
    // since the first one. A campaign paused for a month has not warmed up during
    // the pause, and treating it as though it had is how a ramp becomes decorative.
    daysSending = await repo.countDistinctSendingDays();
    warmupCap = warmupCapForDay(daysSending);
  }

  const cap = Math.min(configuredCap, warmupCap);
  const remaining = Math.max(0, cap - sentToday);
  const warmingUp = Number.isFinite(warmupCap) && warmupCap < configuredCap;

  let reason: string;
  if (!withinWindow) {
    reason = "outside the sending window, so nothing goes out right now";
  } else if (remaining <= 0 && warmingUp) {
    reason = `today's warmup limit of ${cap} is used up (day ${daysSending} of sending)`;
  } else if (remaining <= 0) {
    reason = `today's limit of ${cap} is used up`;
  } else if (warmingUp) {
    reason = `warming up: ${remaining} of ${cap} left today (day ${daysSending} of sending)`;
  } else {
    reason = `${remaining} of ${cap} left today`;
  }

  return {
    allowed: withinWindow ? remaining : 0,
    configuredCap,
    warmupCap: Number.isFinite(warmupCap) ? warmupCap : configuredCap,
    sentToday,
    daysSending,
    warmingUp,
    withinWindow,
    reason,
  };
}

export type SendRunResult = {
  attempted: number;
  sent: number;
  failed: number;
  suppressed: number;
  capped: number;
  domainThrottled: number;
  /**
   * Waiting for the address that owns their conversation. Reported rather than
   * folded into `capped`, because the two need different responses: capped means
   * come back tomorrow, held means one specific address is the bottleneck.
   */
  inboxHeld: number;
  dryRun: boolean;
  budget: SendBudget;
  errors: string[];
};

/**
 * Send what is due, inside every limit.
 *
 * A thin orchestrator on purpose: the actual transmission still goes through
 * sendApprovedOutreach and therefore through all ten gates in sendOneEmail. This
 * adds the two limits that belong to a CAMPAIGN rather than to a single message,
 * and it refuses to run at all outside the sending window.
 */
export async function runOutreachSend(
  opts: { dryRun?: boolean; campaign?: string; max?: number } = {},
): Promise<SendRunResult> {
  const budget = await sendBudget();
  const { sendApprovedOutreach } = await import("./outreach-engine");

  const base: SendRunResult = {
    attempted: 0,
    sent: 0,
    failed: 0,
    suppressed: 0,
    capped: 0,
    domainThrottled: 0,
    inboxHeld: 0,
    dryRun: opts.dryRun !== false,
    budget,
    errors: [],
  };

  // A dry run is allowed to ignore the window and the budget: it transmits nothing
  // and its whole purpose is to let somebody inspect what WOULD go out.
  const isDry = opts.dryRun !== false;
  if (!isDry && budget.allowed <= 0) {
    base.errors.push(budget.reason);
    return base;
  }

  const max = Math.min(opts.max ?? 25, isDry ? 25 : budget.allowed);
  const r = await sendApprovedOutreach({
    dryRun: opts.dryRun,
    max,
    campaign: opts.campaign,
    maxPerRecipientDomain: maxPerRecipientDomainPerDay(),
    dailyCapOverride: isDry ? undefined : Math.min(budget.configuredCap, budget.warmupCap),
  });

  return {
    attempted: r.attempted,
    sent: r.sent,
    failed: r.failed,
    suppressed: r.suppressed,
    capped: r.capped,
    domainThrottled: r.domainThrottled ?? 0,
    inboxHeld: r.inboxHeld ?? 0,
    dryRun: r.dryRun,
    budget,
    errors: r.errors,
  };
}
