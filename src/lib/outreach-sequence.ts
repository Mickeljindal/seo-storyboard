import "@tanstack/react-start/server-only";

/**
 * OUTREACH SEQUENCE — scheduling, the single follow-up, and the guards that make
 * automatic follow-ups safe rather than embarrassing.
 *
 * THE PROBLEM THIS SOLVES. Before this, `step` existed as a column and nothing
 * could ever fill it. `draftOutreachBatch` only read prospects with status 'new',
 * so the moment a prospect became 'queued' it was structurally impossible to draft
 * their step 2. There was no delay column, no scheduler, and no way to know
 * whether somebody had already answered. A follow-up system without that last part
 * is not a feature, it is a way to email "just checking in" to somebody who said
 * yes yesterday.
 *
 * WHY ONLY TWO TOUCHES. A first email genuinely gets buried, so one nudge is fair
 * and measurably effective. A third is pressure, and the reply rate on it does not
 * justify what it costs in goodwill and spam complaints. The (prospect_id, step)
 * unique index already made double-sending structurally impossible; MAX_TOUCHES
 * makes the sequence length explicit rather than accidental.
 *
 * THE FOUR GUARDS, in the order they apply:
 *   1. sequence_stopped_reason must be null. Set by reply, bounce, unsubscribe and
 *      complaint handling, so one check covers every reason to stop, including
 *      reasons added later.
 *   2. touches_sent must be under MAX_TOUCHES.
 *   3. The waiting period must have elapsed since the last message was actually
 *      SENT, not since it was drafted. Drafting time is meaningless to the
 *      recipient.
 *   4. Step 1 must have been genuinely sent. A follow-up to an email that never
 *      left, or that bounced, reads as nonsense because there is nothing to follow
 *      up on.
 *
 * Nothing here sends. It drafts and schedules; the send path is unchanged and
 * still behind both switches.
 */

/** Days to wait before the single follow-up. */
export function followUpDays(): number {
  const n = Number(process.env.OUTREACH_FOLLOWUP_DAYS || 5);
  return Number.isFinite(n) && n >= 1 ? n : 5;
}

/** First touch plus one nudge. */
export function maxTouches(): number {
  const n = Number(process.env.OUTREACH_MAX_TOUCHES || 2);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 3) : 2;
}

/**
 * Only send on weekday mornings, in the sender's timezone.
 *
 * Not superstition about open rates. A cold email arriving at 3am Sunday looks
 * automated because it is, and looking automated is what gets a sender reported.
 * Off-window messages are not dropped, they wait, which is the whole reason
 * send_after exists.
 */
export function nextSendWindow(from = new Date()): Date {
  const startHour = Number(process.env.OUTREACH_SEND_HOUR_START || 9);
  const endHour = Number(process.env.OUTREACH_SEND_HOUR_END || 17);
  const d = new Date(from);

  for (let guard = 0; guard < 14; guard++) {
    const day = d.getDay(); // 0 Sun, 6 Sat
    const hour = d.getHours();
    if (day === 0 || day === 6) {
      d.setDate(d.getDate() + 1);
      d.setHours(startHour, 0, 0, 0);
      continue;
    }
    if (hour < startHour) {
      d.setHours(startHour, 0, 0, 0);
      return d;
    }
    if (hour >= endHour) {
      d.setDate(d.getDate() + 1);
      d.setHours(startHour, 0, 0, 0);
      continue;
    }
    return d;
  }
  return d;
}

export function isWithinSendWindow(now = new Date()): boolean {
  if (process.env.OUTREACH_IGNORE_SEND_WINDOW === "1") return true;
  const startHour = Number(process.env.OUTREACH_SEND_HOUR_START || 9);
  const endHour = Number(process.env.OUTREACH_SEND_HOUR_END || 17);
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const h = now.getHours();
  return h >= startHour && h < endHour;
}

export type FollowUpResult = {
  considered: number;
  scheduled: number;
  stoppedInstead: number;
  skipped: number;
  errors: string[];
};

/**
 * Draft and schedule the follow-up for everyone who is due one.
 *
 * Drafted as `draft`, not `approved`, so the approval step still exists. The
 * automation decides WHO and WHEN; whether a message goes out at all stays a
 * separate decision.
 */
export async function scheduleFollowUps(
  opts: { campaign?: string; limit?: number } = {},
): Promise<FollowUpResult> {
  const repo = await import("@/server/db/repos/outreach");
  const out: FollowUpResult = {
    considered: 0,
    scheduled: 0,
    stoppedInstead: 0,
    skipped: 0,
    errors: [],
  };

  const due = await repo.listProspectsDueForFollowUp({
    afterDays: followUpDays(),
    maxTouches: maxTouches(),
    campaign: opts.campaign,
    limit: opts.limit ?? 25,
  });

  for (const { prospect, lastStep } of due) {
    out.considered++;
    const nextStep = lastStep + 1;

    if (nextStep > maxTouches()) {
      // The sequence is finished. Marking it closed stops this prospect being
      // reconsidered on every future cycle.
      await repo.stopSequence(prospect.id, "completed");
      out.stoppedInstead++;
      continue;
    }

    // Re-check suppression here as well. Somebody may have unsubscribed between the
    // first email and today, which is precisely the window a follow-up lands in.
    if (await repo.isSuppressed(prospect.email)) {
      await repo.stopSequence(prospect.id, "unsubscribed", { status: "suppressed" });
      out.stoppedInstead++;
      continue;
    }

    try {
      const drafted = await draftFollowUpFor(prospect, nextStep);
      if (!drafted) {
        out.skipped++;
        continue;
      }
      await repo.upsertMessage({
        prospectId: prospect.id,
        step: nextStep,
        subject: drafted.subject,
        bodyText: drafted.bodyText,
        bodyHtml: drafted.bodyHtml,
        assetUrl: drafted.assetUrl,
        campaign: drafted.campaign,
        linkProspectId: drafted.linkProspectId,
        sendAfter: nextSendWindow(new Date()),
      });
      out.scheduled++;
    } catch (e) {
      out.errors.push(`${prospect.email}: ${String((e as Error)?.message ?? e).slice(0, 140)}`);
    }
  }

  return out;
}

/**
 * Draft the right kind of follow-up for this prospect.
 *
 * A link-building prospect gets the link-building nudge referring to their own
 * page; an agency prospect gets the agency one. Reusing the wrong drafter would
 * produce a follow-up that does not match the email it is following up on, which
 * is worse than not following up.
 */
async function draftFollowUpFor(
  prospect: { id: string; email: string; name: string | null; company: string | null; segment: string; personal_note: string | null; stack_signals: string[]; pain_hypothesis: string | null; country: string | null },
  step: number,
): Promise<{
  subject: string;
  bodyText: string;
  bodyHtml: string;
  assetUrl: string;
  campaign: string;
  linkProspectId: string | null;
} | null> {
  const repo = await import("@/server/db/repos/outreach");

  // What was the first touch? Its campaign decides which drafter to use.
  const prior = await repo.listMessages({ prospectId: prospect.id, limit: 5 });
  const first = prior.find((m) => m.step === 1) ?? prior[0];
  const campaign = first?.campaign ?? "agency";

  if (campaign === "link_building" && first?.link_prospect_id) {
    const linkRepo = await import("@/server/db/repos/link-prospects");
    const lp = await linkRepo.getLinkProspectById(first.link_prospect_id);
    if (!lp) return null;
    const { draftLinkPitch } = await import("./link-pitch-drafter");
    const pitch = draftLinkPitch(
      {
        domain: lp.domain,
        contactName: lp.contact_name,
        contactEmail: lp.contact_email ?? prospect.email,
        opportunityType: lp.opportunity_type,
        bestSourceUrl: lp.best_source_url,
        bestSourceTitle: lp.best_source_title,
        bestAnchor: lp.best_anchor,
        bestTargetUrl: lp.best_target_url,
        linksTo: lp.links_to,
        acceptsGuestPosts: lp.accepts_guest_posts,
        guidelinesUrl: lp.guidelines_url,
        authority: lp.authority,
        // Read from the stored row, so a follow-up argues the same point as the
        // first email rather than drifting to the generic angle.
        sourceRecipe: lp.source_recipe,
        recipeEvidence: lp.recipe_evidence,
      },
      step,
    );
    if (!pitch.ok) return null;
    return {
      subject: pitch.subject,
      bodyText: pitch.bodyText,
      bodyHtml: pitch.bodyHtml,
      assetUrl: pitch.assetUrl,
      campaign: "link_building",
      linkProspectId: lp.id,
    };
  }

  const { draftOutreach } = await import("./outreach-engine");
  const d = draftOutreach(
    {
      id: prospect.id,
      email: prospect.email,
      name: prospect.name,
      company: prospect.company,
      segment: prospect.segment,
      stackSignals: prospect.stack_signals,
      painHypothesis: prospect.pain_hypothesis,
      personalNote: prospect.personal_note,
      country: prospect.country,
    },
    step,
  );
  if (!d.ok) return null;
  return {
    subject: d.subject,
    bodyText: d.bodyText,
    bodyHtml: d.bodyHtml,
    assetUrl: d.assetUrl,
    campaign: "agency",
    linkProspectId: null,
  };
}

/**
 * Approve drafted link-building pitches, with a real bar.
 *
 * Auto-approval is the point at which the system stops being a research tool and
 * starts speaking for the brand, so it refuses anything that would embarrass us:
 * a pitch with no specific page to quote, a suppressed or unpitchable address, or a
 * prospect whose sequence has already stopped. Off by default.
 */
export async function autoApproveLinkPitches(
  opts: { limit?: number; minValue?: number } = {},
): Promise<{ approved: number; held: number; reasons: Record<string, number> }> {
  const repo = await import("@/server/db/repos/outreach");
  const linkRepo = await import("@/server/db/repos/link-prospects");
  const { isUnpitchableAddress } = await import("./contact-finder");

  const out = { approved: 0, held: 0, reasons: {} as Record<string, number> };
  const hold = (why: string) => {
    out.held++;
    out.reasons[why] = (out.reasons[why] ?? 0) + 1;
  };

  if (process.env.OUTREACH_AUTO_APPROVE !== "1") {
    return { approved: 0, held: 0, reasons: { "auto-approve is off (OUTREACH_AUTO_APPROVE=1)": 1 } };
  }

  const minValue = opts.minValue ?? Number(process.env.OUTREACH_AUTO_APPROVE_MIN_VALUE || 60);
  const drafts = await repo.listMessages({ status: "draft", limit: opts.limit ?? 50 });

  for (const m of drafts) {
    if (m.campaign !== "link_building") continue;

    const prospect = await repo.getProspectById(m.prospect_id);
    if (!prospect) {
      hold("prospect missing");
      continue;
    }
    if (prospect.sequence_stopped_reason) {
      hold("sequence already stopped");
      continue;
    }
    if (isUnpitchableAddress(prospect.email)) {
      hold("address is a do-not-pitch mailbox");
      continue;
    }
    if (await repo.isSuppressed(prospect.email)) {
      hold("suppressed");
      continue;
    }
    // The one true specific line about them. Without it the email is generic, and a
    // generic cold pitch is the thing this whole system exists to avoid sending.
    if (!prospect.personal_note?.trim()) {
      hold("no specific page to reference");
      continue;
    }
    if (m.link_prospect_id) {
      const lp = await linkRepo.getLinkProspectById(m.link_prospect_id);
      if (!lp) {
        hold("link prospect missing");
        continue;
      }
      if (lp.value_score < minValue) {
        hold(`value below ${minValue}`);
        continue;
      }
    }

    await repo.approveMessage(m.id);
    out.approved++;
  }

  return out;
}
