/**
 * REPLY CLASSIFIER — works out what an inbound email means.
 *
 * Pure functions, no I/O, so the judgement is testable and lives in one place.
 *
 * WHY THIS IS THE MOST IMPORTANT FILE IN THE OUTREACH LAYER. Every automatic
 * follow-up is gated on "has this person already answered". Before this existed
 * there was no inbound path at all, which meant a follow-up system could only be
 * built by hoping nobody replied. The classifier is what turns an inbox into that
 * signal.
 *
 * THE BIAS IS DELIBERATE AND ONE-DIRECTIONAL. When the meaning is unclear, treat
 * it as a real reply and stop the sequence. The two possible mistakes are not
 * equal: stopping a sequence for a false positive costs one unsent follow-up,
 * while missing a real reply means emailing "just checking in" to somebody who
 * already said yes. So `unknown` stops the sequence too, and only a confidently
 * detected automated bounce or out-of-office is allowed to leave it running.
 */

export type ReplyClass =
  | "interested"
  | "not_interested"
  | "unsubscribe"
  | "bounce"
  | "auto_reply"
  | "complaint"
  | "question"
  | "unknown";

export type Classification = {
  classification: ReplyClass;
  confidence: number;
  isAutomated: boolean;
  /** Should the sequence stop because of this message? */
  stopsSequence: boolean;
  /** Should the address go on the suppression list, and why? */
  suppress: null | "unsubscribe" | "bounce" | "complaint";
  /** Plain-language reason, shown in the UI so a human can sanity-check it. */
  reason: string;
};

/* -------------------------------------------------------------------------- *
 * Signals
 * -------------------------------------------------------------------------- */

/** A hard bounce: the address does not exist. Permanent. */
const HARD_BOUNCE =
  /(550|551|553|554)[\s-]|user unknown|no such user|does not exist|unknown recipient|recipient (address )?rejected|address (not found|rejected)|mailbox (unavailable|not found|does not exist)|invalid recipient|account (has been )?(disabled|closed|terminated)|delivery has failed to these recipients|undeliverable/i;

/** A soft bounce: temporary. Not a reason to suppress anybody forever. */
const SOFT_BOUNCE =
  /(421|450|451|452)[\s-]|mailbox full|over quota|quota exceeded|temporarily (unavailable|deferred|rejected)|try again later|greylist|rate limited|message deferred/i;

/** Envelope senders that only ever carry machine mail. */
const DAEMON_SENDER =
  /^(mailer-daemon|postmaster|no-?reply|do-?not-?reply|bounce[s]?|bounce-|return|autoreply|auto-reply|notifications?|noreply)[@+.-]/i;

const OUT_OF_OFFICE =
  /(out of (the )?office|away from (my|the) (desk|office)|on (annual |parental |maternity |paternity )?leave|on vacation|on holiday|currently travell?ing|auto[- ]?reply|automatic reply|autoresponder|i am currently away|will be back on|返信|不在)/i;

/** An explicit request to stop. Always honoured, never second-guessed. */
const UNSUBSCRIBE =
  /\b(unsubscribe|remove me|take me off|opt[- ]?out|stop (emailing|contacting|sending)|do not (contact|email) (me|us)|don'?t (contact|email) (me|us) again|no longer wish to receive|delete my (data|details|email)|erase my data)\b/i;

/** Hostile. Suppress the whole domain's contact and never touch it again. */
const COMPLAINT =
  /\b(spam|spamming|unsolicited|report(ing|ed)? (you|this) (to|as)|gdpr (violation|complaint)|legal action|cease and desist|harass|blacklist|abuse report)\b/i;

/**
 * Positive signals.
 *
 * Note the lookbehinds on "interested" and "keen". A bare \binterested\b also
 * matches "not interested", which made the commonest rejection in cold outreach
 * come out as a mixed signal instead of a clear no. Negation is the classic way a
 * keyword classifier gets a reply exactly backwards.
 */
const INTERESTED =
  /\b(sounds (good|great|interesting)|happy to|would love|i'?d love|yes please|yes,? (please|absolutely|definitely)|let'?s (do|talk|chat|discuss)|send (it|them|the|over|me)|(?<!not )(?<!n'?t )interested|(?<!not )keen|go ahead|works for me|i'?ve added|we'?ve added|we can (add|include)|will (add|include|take a look)|good (idea|point|catch)|thanks for (flagging|pointing|letting)|noted,? (thanks|will)|great catch|i'?ll (add|include|look|take a look)|happy to include|makes sense)\b/i;

const NOT_INTERESTED =
  /\b(not interested|no thanks|no,? thank|not (a )?(good )?fit|not relevant|we'?re (all )?(good|set|sorted)|not (right )?(for us|at (the|this) moment)|we don'?t (accept|do|take|publish)|不要|pass on this|we'?ll pass|decline|not looking|no need|already (have|covered|sorted)|not something we)\b/i;

/** Genuinely a question: the highest-value reply and must never be automated at. */
const QUESTION =
  /(\?|\bcould you\b|\bcan you\b|\bwhat (is|are|about)\b|\bhow (do|does|would|much)\b|\bwhich\b|\bwhen\b|\bwho\b|\bdo you (have|offer|charge)\b|\bwhat'?s your\b|\bmore (info|information|detail)\b|\bpricing\b|\brates?\b|\bhow much\b)/i;

/** Paid-placement requests. Common, and the answer is always no. */
const PAID_REQUEST =
  /\b(sponsored (post|content|article)|paid (post|placement|collaboration|link|guest post)|our (rate|price|fee)s? (card|are|is)|\$\d+ per (post|link|article)|charge (a fee|for (publishing|posting))|payment (is )?required|link insertion fee|we do charge)\b/i;

/* -------------------------------------------------------------------------- *
 * Cleaning
 * -------------------------------------------------------------------------- */

/**
 * Strip the quoted original out of a reply.
 *
 * Without this, every reply looks "interested", because our own email is quoted
 * underneath and it contains our own enthusiastic wording. A three-word "no
 * thanks" on top of 300 quoted words would classify from the wrong 300 words. This
 * is the single highest-impact detail in the whole file.
 */
export function stripQuotedReply(body: string): string {
  let text = (body ?? "").replace(/\r\n/g, "\n");

  const markers: RegExp[] = [
    /^On .{0,120}\bwrote:\s*$/im, // Gmail / Apple Mail
    /^-{2,}\s*Original Message\s*-{2,}/im, // Outlook
    /^_{5,}\s*$/m, // Outlook divider
    /^From:\s.+$/im, // Outlook header block
    /^Sent from my /im,
    /^>\s?/m, // quote prefix
    /^Am .{0,120}schrieb .{0,120}:\s*$/im, // German
    /^Le .{0,120}a écrit\s*:\s*$/im, // French
    /^El .{0,120}escribió:\s*$/im, // Spanish
  ];

  let cut = text.length;
  for (const re of markers) {
    const m = re.exec(text);
    if (m && m.index < cut) cut = m.index;
  }
  text = text.slice(0, cut);

  // Drop a trailing signature block.
  const sig = /^--\s*$/m.exec(text);
  if (sig) text = text.slice(0, sig.index);

  return text.trim();
}

/* -------------------------------------------------------------------------- *
 * Classify
 * -------------------------------------------------------------------------- */

/**
 * Decide what an inbound message means.
 *
 * Order matters and encodes priority: machine mail is identified first so its
 * wording cannot be read as human intent, then the two signals we must always
 * honour (a complaint and an unsubscribe), then human sentiment.
 */
export function classifyReply(input: {
  fromEmail: string;
  subject?: string | null;
  body?: string | null;
  /** Set when the provider already told us this was a bounce. */
  providerEvent?: string | null;
}): Classification {
  const from = (input.fromEmail ?? "").trim().toLowerCase();
  const subject = (input.subject ?? "").trim();
  const clean = stripQuotedReply(input.body ?? "");
  // Subject carries most of the signal for machine mail, and the visible reply
  // carries it for humans.
  const hay = `${subject}\n${clean}`;

  // 0. The provider already knows. Trust it over any text heuristic.
  const ev = (input.providerEvent ?? "").toLowerCase();
  if (ev.includes("complain")) {
    return {
      classification: "complaint",
      confidence: 1,
      isAutomated: true,
      stopsSequence: true,
      suppress: "complaint",
      reason: "the provider reported a spam complaint",
    };
  }
  if (ev.includes("bounce") || ev.includes("failed")) {
    const soft = SOFT_BOUNCE.test(hay) && !HARD_BOUNCE.test(hay);
    return {
      classification: "bounce",
      confidence: 1,
      isAutomated: true,
      stopsSequence: true,
      // A mailbox that is merely full should not be blocked forever.
      suppress: soft ? null : "bounce",
      reason: soft
        ? "the provider reported a temporary delivery failure"
        : "the provider reported the address does not accept mail",
    };
  }

  const daemon = DAEMON_SENDER.test(from);

  // 1. Bounces. Checked before anything human because a bounce report quotes our
  // own email and would otherwise read as whatever our email said.
  //
  // SOFT BEFORE HARD, and this ordering is load-bearing. The generic
  // daemon-plus-delivery-words branch below is deliberately broad, and a real
  // "Delivery delayed / mailbox full" report from mailer-daemon matches it on the
  // word "Delivery". Checking hard first therefore suppressed a perfectly valid
  // address permanently because somebody's inbox was full for a day. A soft bounce
  // must never lead to suppression.
  const softSignal = SOFT_BOUNCE.test(hay);
  const hardSignal = HARD_BOUNCE.test(hay);

  if (softSignal && !hardSignal) {
    return {
      classification: "bounce",
      confidence: daemon ? 0.8 : 0.6,
      isAutomated: true,
      stopsSequence: true,
      suppress: null, // temporary: worth another try one day
      reason: "delivery failed temporarily, for example a full mailbox",
    };
  }
  if (hardSignal || (daemon && /deliver|fail|bounce|reject|undeliverable|returned to sender/i.test(hay))) {
    return {
      classification: "bounce",
      confidence: hardSignal ? 0.9 : 0.7,
      isAutomated: true,
      stopsSequence: true,
      suppress: "bounce",
      reason: "the address does not exist or refuses mail",
    };
  }

  // 2. A complaint outranks everything else a human might say.
  if (COMPLAINT.test(hay)) {
    return {
      classification: "complaint",
      confidence: 0.85,
      isAutomated: false,
      stopsSequence: true,
      suppress: "complaint",
      reason: "they called it spam or threatened a complaint",
    };
  }

  // 3. An explicit request to stop. Honoured without interpretation.
  if (UNSUBSCRIBE.test(hay)) {
    return {
      classification: "unsubscribe",
      confidence: 0.95,
      isAutomated: false,
      stopsSequence: true,
      suppress: "unsubscribe",
      reason: "they asked not to be contacted again",
    };
  }

  // 4. Out of office. The ONLY case that leaves the sequence running, because the
  // person has not actually read anything yet.
  if (OUT_OF_OFFICE.test(hay)) {
    return {
      classification: "auto_reply",
      confidence: 0.85,
      isAutomated: true,
      stopsSequence: false,
      suppress: null,
      reason: "an out-of-office autoresponder, so nobody has read it yet",
    };
  }

  // 5. A request for payment. Not hostile, but the answer is no, so stop.
  if (PAID_REQUEST.test(hay)) {
    return {
      classification: "not_interested",
      confidence: 0.8,
      isAutomated: false,
      stopsSequence: true,
      suppress: null,
      reason: "they want payment for placement, which we do not do",
    };
  }

  // 6. Human sentiment. Negative is checked first: "not interested, thanks" also
  // matches the positive pattern on "thanks".
  const neg = NOT_INTERESTED.test(hay);
  const pos = INTERESTED.test(hay);

  if (neg && !pos) {
    return {
      classification: "not_interested",
      confidence: 0.85,
      isAutomated: false,
      stopsSequence: true,
      suppress: null,
      reason: "a clear no",
    };
  }
  if (pos && !neg) {
    return {
      classification: "interested",
      confidence: 0.8,
      isAutomated: false,
      stopsSequence: true,
      suppress: null,
      reason: "they sound positive, so this needs a person to reply",
    };
  }
  if (pos && neg) {
    // Mixed signals mean a human has to read it. Stop either way.
    return {
      classification: "question",
      confidence: 0.5,
      isAutomated: false,
      stopsSequence: true,
      suppress: null,
      reason: "the reply is mixed, so a person should read it",
    };
  }
  if (QUESTION.test(hay)) {
    return {
      classification: "question",
      confidence: 0.7,
      isAutomated: false,
      stopsSequence: true,
      suppress: null,
      reason: "they asked something, which needs a real answer",
    };
  }

  // 7. Unclear. Still stops the sequence: see the note at the top of this file.
  return {
    classification: "unknown",
    confidence: 0.3,
    isAutomated: daemon,
    stopsSequence: true,
    suppress: null,
    reason: "a real reply we could not read confidently, so the sequence stopped",
  };
}

/** Map a classification onto the sequence stop reason the repo expects. */
export function stopReasonFor(
  c: Classification,
): "replied" | "bounced" | "unsubscribed" | "complained" | null {
  if (!c.stopsSequence) return null;
  if (c.classification === "bounce") return "bounced";
  if (c.classification === "unsubscribe") return "unsubscribed";
  if (c.classification === "complaint") return "complained";
  return "replied";
}
