import "@tanstack/react-start/server-only";
import { renderOutreachEmail } from "./email-templates";

/**
 * OUTREACH ENGINE — honest, asset-first emails to agencies and studios.
 *
 * The goal is link-worthy relationships and real customers, not volume. Which
 * means this is built to make the spammy version impossible rather than merely
 * discouraged:
 *
 *   - EVERY email leads with something useful (a specific guide) and carries
 *     exactly ONE ask, phrased so that "no" is easy. Leading with the ask is what
 *     gets mail deleted and domains burned.
 *   - PERSONALISATION IS NEVER INVENTED. The one specific line about their work
 *     comes from `personalNote` on the prospect, supplied by a human or by real
 *     research. If it is missing, the draft falls back to a segment-level line
 *     that is true of the segment, and the row is flagged as weaker. A model is
 *     never asked to guess what an agency does.
 *   - TWO TOUCHES MAXIMUM, enforced by a unique index on (prospect, step).
 *   - NO FABRICATED PRODUCT CLAIMS. Value copy is assembled from the confirmed
 *     capability set below, which is drawn from the product-truth files.
 *   - NEVER paid links, link exchanges, or directory schemes. The ask is always
 *     "try it" or "worth a look", never "link to us".
 *
 * The pitch that actually works for this audience is specific: an agency hosting
 * client projects carries the ops risk and the 2am pager for work that does not
 * bill. That is the real pain, and it is what the copy speaks to.
 */

export type ProspectInput = {
  id: string;
  email: string;
  name?: string | null;
  company?: string | null;
  segment?: string | null;
  stackSignals?: string[];
  painHypothesis?: string | null;
  personalNote?: string | null;
  country?: string | null;
};

export type DraftedOutreach = {
  ok: boolean;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  assetUrl: string;
  assetTitle: string;
  /** False when we had to fall back to a segment line instead of a real note. */
  personalised: boolean;
  error?: string;
};

const BLOG = "https://www.kloudbean.com/blog";

/**
 * The assets we lead with, chosen by what the prospect actually builds. Every
 * one of these is a real article in the library.
 */
const ASSETS: {
  match: RegExp;
  slug: string;
  title: string;
  /** Why this specific piece is useful to them, in one sentence. */
  because: string;
}[] = [
  {
    match: /lovable|bolt|cursor|v0|replit|windsurf|vibe|ai[- ]built|chatgpt/i,
    slug: "deploy-ai-built-app-to-production",
    title: "How to deploy an AI-built app to production",
    because:
      "it covers the five things AI builders leave behind (hard-coded ports, SQLite, build-time env vars, uploads on local disk) that break the first client deploy",
  },
  {
    match: /wordpress|woocommerce|elementor|wp/i,
    slug: "how-agencies-host-20-client-apps",
    title: "How agencies host 20+ client apps on one managed server",
    because:
      "it walks the per-client isolation, per-app backups and deploy setup that keeps a shared server from becoming a support problem",
  },
  {
    match: /next|react|node|vercel|netlify/i,
    slug: "vercel-alternative-for-full-stack-apps",
    title: "The Vercel alternative breakdown for full-stack apps",
    because:
      "it prices out what happens when a client project grows a database, a worker and a cron on per-service billing",
  },
  {
    match: /saudi|ksa|dammam|riyadh|jeddah|pdpl|gulf|uae/i,
    slug: "data-residency-saudi-arabia",
    title: "Data residency in Saudi Arabia, and where data quietly leaks",
    because:
      "it maps which parts of a stack actually have to stay in-Kingdom when a client asks where their data lives",
  },
  {
    match: /.*/,
    slug: "how-agencies-host-20-client-apps",
    title: "How agencies host 20+ client apps on one managed server",
    because:
      "it lays out the isolation, backup and deploy model that lets one server carry a whole client book without the ops overhead",
  },
];

function pickAsset(p: ProspectInput): { slug: string; title: string; because: string } {
  const hay = `${p.company ?? ""} ${p.segment ?? ""} ${(p.stackSignals ?? []).join(" ")} ${p.painHypothesis ?? ""} ${p.country ?? ""}`;
  return ASSETS.find((a) => a.match.test(hay)) ?? ASSETS[ASSETS.length - 1];
}

/**
 * Segment-level opening that is true of the segment without pretending to know
 * anything specific about this company. Used only when no real note was supplied.
 */
function segmentLine(segment: string | null | undefined): string {
  switch ((segment ?? "agency").toLowerCase()) {
    case "freelancer":
      return "I work with a lot of freelance developers who end up as the unpaid sysadmin for every site they have ever shipped.";
    case "saas":
      return "Most small SaaS teams I talk to are paying per service for a web process, a worker, a cron and a database that could all sit on one box.";
    case "wordpress":
      return "Most WordPress studios I speak to are running client sites across three or four hosting accounts nobody wants to audit.";
    case "enterprise":
      return "Most teams at your size are less worried about hosting features than about who is accountable when something breaks at 2am.";
    default:
      return "Most agencies I speak to are hosting client projects across several platforms, and carrying the ops risk for all of them.";
  }
}

/** The value paragraph. Only confirmed capabilities, no numbers we cannot stand behind. */
function valueParagraph(p: ProspectInput, asset: { title: string; because: string }): string {
  const isAgency = /agency|wordpress|freelancer/i.test(p.segment ?? "agency");
  const core = isAgency
    ? "The model that seems to work is boring: client apps as isolated applications on managed servers you control, each with its own database and SSL, per-app backups you can restore individually, and Git deploys, all from one dashboard. The server, the stack, SSL, patching and backups are handled, so the hosting stops being work you do for free."
    : "The shape that seems to work is one managed server running the whole app tier, with managed databases beside it, automatic backups, free SSL and Git deploys, on the cloud and region you pick. The server, stack, patching and backups are handled; the application stays yours.";
  return `I wrote something that might be useful either way: ${asset.title}, because ${asset.because}. ${core}`;
}

/** One ask, and an easy no. */
function askLine(step: number): string {
  if (step >= 2) {
    return "If it is not relevant, no reply needed and I will leave it there. If it is, I am happy to look at one of your client setups with you and say honestly whether this would help.";
  }
  return "If that is useful, I can set up a free trial and migrate one site across for you so you can judge it on your own work rather than a demo. If not, no reply needed.";
}

function subjectLine(p: ProspectInput, step: number): string {
  const company = p.company?.trim();
  if (step >= 2) return company ? `One more thought on ${company}'s hosting` : "One more thought on client hosting";
  const seg = (p.segment ?? "agency").toLowerCase();
  if (seg === "wordpress") return company ? `${company} and client WordPress hosting` : "Client WordPress hosting";
  if (seg === "saas") return "Per-service billing on a small SaaS";
  return company ? `Hosting client projects at ${company}` : "Hosting client projects";
}

/**
 * Draft one outreach email. Deterministic and template-based on purpose: this
 * copy goes out under a real person's name to a real inbox, and a model that
 * improvises about someone's business is exactly the failure mode to avoid.
 */
export function draftOutreach(p: ProspectInput, step = 1): DraftedOutreach {
  if (!p.email?.trim()) {
    return {
      ok: false,
      subject: "",
      bodyText: "",
      bodyHtml: "",
      assetUrl: "",
      assetTitle: "",
      personalised: false,
      error: "Prospect has no email",
    };
  }

  const asset = pickAsset(p);
  const assetUrl = `${BLOG}/${asset.slug}/`;
  const personalised = !!p.personalNote?.trim();
  const opening = personalised ? p.personalNote!.trim() : segmentLine(p.segment);

  const rendered = renderOutreachEmail({
    subject: subjectLine(p, step),
    greetingName: p.name?.split(/\s+/)[0] ?? null,
    personalNote: opening,
    valueParagraph: valueParagraph(p, asset),
    assetTitle: asset.title,
    assetUrl,
    ask: askLine(step),
  });

  return {
    ok: true,
    subject: rendered.subject,
    bodyText: rendered.text,
    bodyHtml: rendered.html,
    assetUrl,
    assetTitle: asset.title,
    personalised,
  };
}

/**
 * Score a prospect on how likely we are to genuinely help them. Used to order the
 * queue so the best-fit people get the careful, hand-checked treatment.
 */
export function scoreProspect(p: ProspectInput): number {
  let score = 0;
  if (p.personalNote?.trim()) score += 30; // real research done
  if (p.company?.trim()) score += 10;
  if (p.name?.trim()) score += 5;
  const signals = (p.stackSignals ?? []).join(" ").toLowerCase();
  if (/lovable|cursor|bolt|v0|replit|vibe/.test(signals)) score += 20; // our strongest fit
  if (/wordpress|woocommerce/.test(signals)) score += 15;
  if (/next|react|node|laravel|django/.test(signals)) score += 12;
  if (/vercel|netlify|heroku|render|railway/.test(signals)) score += 12; // already feeling the pain
  if (p.painHypothesis?.trim()) score += 10;
  if (/agency|wordpress|freelancer/i.test(p.segment ?? "")) score += 8;
  return Math.min(100, score);
}

/**
 * Draft (or refresh) messages for a batch of prospects and store them.
 * Everything lands as `draft`; approving and sending are separate steps.
 */
export async function draftOutreachBatch(opts: {
  segment?: string;
  limit?: number;
  step?: number;
} = {}): Promise<{
  drafted: number;
  skipped: number;
  weakPersonalisation: number;
  errors: string[];
}> {
  const repo = await import("@/server/db/repos/outreach");
  const step = opts.step ?? 1;
  /**
   * Which prospects to draft for depends on the step, and getting this wrong made
   * follow-ups impossible.
   *
   * A first touch belongs to prospects who have not been contacted, so 'new' is
   * right for step 1. But this function hard-coded 'new' for every step, so once a
   * prospect became 'queued' or 'contacted' there was no way to draft their step 2
   * at all: the step column and the step-aware copy existed with no path to reach
   * them. For a follow-up the relevant population is the people who HAVE been
   * contacted.
   */
  const prospects = await repo.listProspects({
    status: step >= 2 ? "contacted" : "new",
    segment: opts.segment,
    limit: opts.limit ?? 50,
  });

  let drafted = 0;
  let skipped = 0;
  let weakPersonalisation = 0;
  const errors: string[] = [];

  for (const p of prospects) {
    if (await repo.isSuppressed(p.email)) {
      await repo.updateProspectStatus(p.id, "suppressed");
      skipped++;
      continue;
    }
    const input: ProspectInput = {
      id: p.id,
      email: p.email,
      name: p.name,
      company: p.company,
      segment: p.segment,
      stackSignals: p.stack_signals,
      painHypothesis: p.pain_hypothesis,
      personalNote: p.personal_note,
      country: p.country,
    };
    const d = draftOutreach(input, step);
    if (!d.ok) {
      errors.push(`${p.email}: ${d.error}`);
      skipped++;
      continue;
    }
    if (!d.personalised) weakPersonalisation++;
    try {
      await repo.upsertMessage({
        prospectId: p.id,
        step,
        subject: d.subject,
        bodyText: d.bodyText,
        bodyHtml: d.bodyHtml,
        assetUrl: d.assetUrl,
      });
      await repo.upsertProspect({ email: p.email, score: scoreProspect(input) });
      // Only a first touch moves a prospect to 'queued'. Doing it for step 2 would
      // walk an already-contacted prospect backwards and lose the fact that they
      // have been emailed, which the follow-up scheduler depends on.
      if (step === 1) await repo.updateProspectStatus(p.id, "queued");
      drafted++;
    } catch (e) {
      errors.push(`${p.email}: ${String((e as Error)?.message ?? e)}`);
    }
  }

  return { drafted, skipped, weakPersonalisation, errors };
}

/**
 * Send approved messages, honouring the suppression list, the daily cap, and the
 * pacing delay. Dry run unless explicitly told otherwise AND the environment
 * agrees, so running this by accident costs nothing.
 */
export async function sendApprovedOutreach(opts: {
  dryRun?: boolean;
  max?: number;
  campaign?: string;
  /**
   * Emails allowed to one recipient organisation today. Set by the campaign layer
   * (see outreach-warmup.ts); omitted means no per-domain limit.
   */
  maxPerRecipientDomain?: number;
  /** A lower cap than EMAIL_DAILY_CAP, e.g. while a sending domain warms up. */
  dailyCapOverride?: number;
} = {}): Promise<{
  attempted: number;
  sent: number;
  failed: number;
  suppressed: number;
  capped: number;
  domainThrottled: number;
  /**
   * Messages that could not go out because the address that owns their conversation
   * is paused or has used its budget. Not failures: they wait.
   */
  inboxHeld: number;
  dryRun: boolean;
  errors: string[];
}> {
  const repo = await import("@/server/db/repos/outreach");
  const inboxRepo = await import("@/server/db/repos/inboxes");
  const { sendOneEmail, pauseBetweenSends, dailyCap, sendingEnabled } = await import("./email-sender");
  const { pickInboxFor, inboxBudgets } = await import("./inbox-pool");

  const dryRun = opts.dryRun !== false || !sendingEnabled();
  // listDueMessages, not listMessages: a follow-up scheduled for next Tuesday must
  // not go out the moment it is approved, and a prospect whose sequence has been
  // stopped must not be contacted at all. Both are enforced in the query.
  const messages = await repo.listDueMessages({ campaign: opts.campaign, limit: opts.max ?? 25 });
  let sentToday = await repo.countSentToday();

  let attempted = 0;
  let sent = 0;
  let failed = 0;
  let suppressed = 0;
  let capped = 0;
  let domainThrottled = 0;
  let inboxHeld = 0;
  const errors: string[] = [];

  /**
   * The pool's state, read ONCE for the whole batch.
   *
   * Re-querying per message would be both slow and wrong: the counts would shift
   * under the loop, so two messages in the same run could each be told they were
   * the last one allowed. The in-memory copy below is decremented as the run
   * proceeds, which is the same reason `usedToday` is tracked locally.
   *
   * An empty pool is not an error. It means no addresses are configured, and every
   * send falls back to the single global identity exactly as it did before.
   */
  const budgets = await inboxBudgets();
  const usingPool = budgets.length > 0;

  // The effective cap can be lower than the configured one while a sending domain
  // warms up. It can never be higher: Math.min, not a replacement.
  const effectiveCap =
    opts.dailyCapOverride != null ? Math.min(dailyCap(), opts.dailyCapOverride) : dailyCap();

  // Today's real sends per recipient organisation, so several contacts at one
  // publication do not all get mailed the same morning.
  const perDomainLimit = opts.maxPerRecipientDomain;
  const sentPerDomain = perDomainLimit ? await repo.countSentTodayByDomain() : {};

  /**
   * Budget used so far today, counting simulated sends during a dry run.
   *
   * BOTH LIMITS APPLY IN A DRY RUN, and that is the fix for a genuinely misleading
   * bug. The limits were originally skipped when `dryRun` was true, on the theory
   * that a preview should show everything. The result was a preview that reported
   * eight sends where reality would send one, because the per-domain limit and the
   * daily cap were both ignored. A dry run whose numbers do not match what would
   * actually happen is worse than no dry run, since its entire job is to be
   * trusted before somebody enables real sending.
   */
  let usedToday = sentToday;

  for (const msg of messages) {
    const prospect = await repo.getProspectById(msg.prospect_id);
    if (!prospect) {
      errors.push(`${msg.id}: prospect missing`);
      failed++;
      continue;
    }
    if (usedToday >= effectiveCap) {
      capped++;
      continue;
    }
    const recipientDomain = prospect.email.toLowerCase().split("@")[1] ?? "";
    if (perDomainLimit && (sentPerDomain[recipientDomain] ?? 0) >= perDomainLimit) {
      // Not a failure: it waits for tomorrow rather than being dropped.
      domainThrottled++;
      continue;
    }

    /**
     * Choose the sending address BEFORE counting an attempt.
     *
     * A message held back because its conversation's address is busy has not been
     * attempted, so counting it would make the run look like it tried and failed.
     * `hold` is the normal outcome here rather than an error: the follow-up waits
     * for the address that started the thread instead of arriving from a stranger.
     */
    let chosen: Awaited<ReturnType<typeof pickInboxFor>> | null = null;
    if (usingPool) {
      chosen = await pickInboxFor({
        prospectId: prospect.id,
        touchesSent: prospect.touches_sent ?? 0,
        budgets,
      });
      if (!chosen.ok) {
        if (chosen.hold) {
          inboxHeld++;
          continue;
        }
        // Not a hold: the pool has nothing to offer, so fall through on the global
        // identity rather than stopping. Losing multi-inbox is a downgrade; losing
        // the ability to send at all is a breakage.
        chosen = null;
      }
    }

    attempted++;
    const result = await sendOneEmail({
      to: prospect.email,
      subject: msg.subject,
      html: msg.body_html ?? msg.body_text,
      text: msg.body_text,
      dryRun,
      sentSoFarToday: usedToday,
      inbox: chosen?.ok ? chosen.inbox : undefined,
    });

    if (result.skipped === "suppressed") {
      suppressed++;
      // Suppression is real information even during a preview, so the prospect is
      // flagged either way. But the MESSAGE is only written off on a real run: a
      // preview must leave the queue exactly as it found it.
      if (!dryRun) {
        await repo.recordMessageSend(msg.id, { ok: false, dryRun, error: "suppressed" });
      }
      await repo.updateProspectStatus(prospect.id, "suppressed");
      continue;
    }
    if (result.skipped === "capped") {
      capped++;
      continue;
    }

    /**
     * A DRY RUN LEAVES THE QUEUE ALONE.
     *
     * recordMessageSend flips a message to 'sent', and upsertMessage refuses to
     * rewrite a message that is already 'sent' ("a message already sent is
     * history"). So recording dry runs meant previewing the queue permanently
     * consumed it: six real pitches ended up marked sent with dry_run = true, with
     * no provider configured and nothing actually transmitted, and they could
     * never be sent or re-drafted afterwards. The one operation whose entire
     * purpose is to be safe was the most destructive one available.
     */
    if (!result.dryRun) {
      await repo.recordMessageSend(msg.id, {
        ok: result.ok,
        provider: result.provider,
        messageId: result.messageId,
        dryRun: result.dryRun,
        error: result.error,
      });
    }

    if (result.ok) {
      sent++;
      // Count the budget for real AND simulated sends, so a dry run's numbers match
      // what would actually go out. Counting within the batch also matters: without
      // it the per-domain limit would only be enforced against what was already
      // sent before the run started, and a single batch could still mail five
      // people at the same publication.
      usedToday++;
      if (perDomainLimit) {
        sentPerDomain[recipientDomain] = (sentPerDomain[recipientDomain] ?? 0) + 1;
      }
      if (!result.dryRun) sentToday++;

      /**
       * Bind the conversation to the address that just sent, and spend that
       * address's budget in the local copy.
       *
       * Both only on a real send. A dry run that bound the affinity would decide who
       * owns a conversation that has not started, and a dry run that spent the
       * budget would let the preview button exhaust the day's sending.
       */
      if (!result.dryRun && chosen?.ok) {
        await inboxRepo.recordInboxSend(msg.id, chosen.inbox.id);
        await inboxRepo.assignInboxToProspect(prospect.id, chosen.inbox.id);
        const usedId = chosen.inbox.id;
        const b = budgets.find((x) => x.id === usedId);
        if (b) {
          b.sentToday++;
          b.remaining = Math.max(0, b.remaining - 1);
          b.lastSentAt = new Date().toISOString();
        }
      }

      // Also only for real sends: a preview must not make a prospect look emailed.
      if (!result.dryRun) {
        await repo.updateProspectStatus(prospect.id, "contacted", { lastContactedAt: new Date() });
      }
      // Count the touch and close the sequence once the last one has gone, so a
      // finished prospect is not reconsidered on every future cycle. Only for real
      // sends: a dry run must not advance anybody's position in the sequence.
      if (!result.dryRun) {
        const { maxTouches } = await import("./outreach-sequence");
        await repo.recordTouch(prospect.id);
        if (msg.step >= maxTouches()) await repo.stopSequence(prospect.id, "completed");
        // Mirror progress onto the link prospect so the pipeline board is honest.
        if (msg.link_prospect_id) {
          const linkRepo = await import("@/server/db/repos/link-prospects");
          await linkRepo.updateLinkProspectStatus(msg.link_prospect_id, "contacted");
        }
      }
    } else {
      failed++;
      if (result.error) errors.push(`${prospect.email}: ${result.error}`);
    }

    if (!dryRun) await pauseBetweenSends();
  }

  return { attempted, sent, failed, suppressed, capped, domainThrottled, inboxHeld, dryRun, errors };
}
