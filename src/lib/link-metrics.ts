import "@tanstack/react-start/server-only";

/**
 * LINK METRICS — what is actually working, so the pipeline can be steered by
 * evidence rather than by assumption.
 *
 * THE RULE THAT MATTERS MOST HERE: never show a rate computed from a handful of
 * events. "33% reply rate" from three emails is not a measurement, it is noise
 * wearing a percentage sign, and it is exactly the kind of number that gets a whole
 * strategy pointed in the wrong direction. So every rate carries the sample it came
 * from, and anything below a minimum sample reports "too early to tell" instead of
 * a figure. A dashboard that admits it does not know yet is worth more than one
 * that always has an answer.
 *
 * WHAT IS COUNTED, and why these and not vanity numbers:
 *   - Emailed, replied, and links won, as a funnel. Each step's drop-off is where
 *     the work is.
 *   - REPLY RATE and LINK RATE per opportunity type. This is the one that changes
 *     behaviour: if listicle pitches earn links and editorial mentions never do,
 *     the miner's cutoffs should move.
 *   - LINK RATE per article we pitched. Tells us which of our own pages are
 *     genuinely link-worthy, which is useful well beyond outreach.
 *   - Time from first email to link, so "did this work" has a timescale.
 *
 * There is no open rate and no click rate. Apple Mail Privacy Protection pre-fetches
 * images, so an open is now mostly a proxy for which mail client somebody uses. A
 * tracking pixel would buy a misleading number in exchange for a privacy cost and a
 * deliverability risk, which is a bad trade at any volume.
 */

/** Below this, a rate is noise. */
const MIN_SAMPLE = Number(process.env.LINK_METRICS_MIN_SAMPLE || 12);

export type Rate = {
  /** null when the sample is too small to mean anything. */
  pct: number | null;
  numerator: number;
  denominator: number;
  /** Plain-language reading, safe to show directly. */
  label: string;
};

function rate(numerator: number, denominator: number, what: string): Rate {
  if (denominator <= 0) {
    return { pct: null, numerator, denominator, label: `no ${what} yet` };
  }
  if (denominator < MIN_SAMPLE) {
    return {
      pct: null,
      numerator,
      denominator,
      label: `${numerator} of ${denominator} so far, too early for a rate`,
    };
  }
  const pct = Math.round((numerator / denominator) * 1000) / 10;
  return { pct, numerator, denominator, label: `${pct}% (${numerator} of ${denominator})` };
}

export type Funnel = {
  found: number;
  withContact: number;
  pitchWritten: number;
  emailed: number;
  replied: number;
  positive: number;
  linksLive: number;
  linksNofollow: number;
  linksLost: number;
  replyRate: Rate;
  positiveRate: Rate;
  linkRate: Rate;
  /** Median days from first email to a confirmed link. */
  daysToLinkMedian: number | null;
};

export type TypePerformance = {
  opportunityType: string;
  emailed: number;
  replied: number;
  linksLive: number;
  replyRate: Rate;
  linkRate: Rate;
};

export type ArticlePerformance = {
  slug: string;
  pitched: number;
  linksLive: number;
  linkRate: Rate;
};

export type MetricsReport = {
  funnel: Funnel;
  byType: TypePerformance[];
  byArticle: ArticlePerformance[];
  /** What the numbers currently justify saying, in one sentence. */
  readout: string;
  minSample: number;
};

/**
 * Build the whole report.
 *
 * Every count comes from one SQL pass over link_prospects joined to the messages
 * that were actually sent. "Emailed" deliberately means a real, non-dry-run send:
 * counting drafts or dry runs would inflate the denominator and quietly depress
 * every rate on the page.
 */
export async function linkMetrics(opts: { campaign?: string } = {}): Promise<MetricsReport> {
  const { getDb } = await import("@/server/db/client");
  const db = await getDb();

  const campaignFilter = opts.campaign
    ? `and lp.campaign_name = '${opts.campaign.replace(/'/g, "''")}'`
    : "";

  const empty: MetricsReport = {
    funnel: {
      found: 0,
      withContact: 0,
      pitchWritten: 0,
      emailed: 0,
      replied: 0,
      positive: 0,
      linksLive: 0,
      linksNofollow: 0,
      linksLost: 0,
      replyRate: rate(0, 0, "emails sent"),
      positiveRate: rate(0, 0, "emails sent"),
      linkRate: rate(0, 0, "emails sent"),
      daysToLinkMedian: null,
    },
    byType: [],
    byArticle: [],
    readout: "Nothing has been emailed yet, so there is nothing to measure.",
    minSample: MIN_SAMPLE,
  };

  try {
    /**
     * The funnel. `emailed` counts DISTINCT prospects with a real send rather than
     * messages, because a prospect who got a first email and a follow-up is still
     * one prospect, and counting messages would make the reply rate look half as
     * good as it is.
     */
    const f: any = await db.execute(
      `select
         count(*)::int as found,
         count(lp.contact_email)::int as with_contact,
         count(*) filter (where lp.status in ('queued','contacted','replied','won','lost'))::int as pitch_written,
         count(*) filter (where exists (
            select 1 from outreach_messages m
             where m.link_prospect_id = lp.id and m.status = 'sent' and m.dry_run = false
         ))::int as emailed,
         count(*) filter (where lp.status in ('replied','won','lost') and exists (
            select 1 from outreach_replies r where r.prospect_id = lp.prospect_id
         ))::int as replied,
         count(*) filter (where exists (
            select 1 from outreach_replies r
             where r.prospect_id = lp.prospect_id and r.classification = 'interested'
         ))::int as positive,
         count(*) filter (where lp.link_found = true and lp.link_is_followed = true)::int as links_live,
         count(*) filter (where lp.link_found = true and lp.link_is_followed = false)::int as links_nofollow,
         count(*) filter (where lp.link_lost_at is not null)::int as links_lost
       from link_prospects lp
      where lp.status <> 'rejected' ${campaignFilter}`,
    );
    const a = (f.rows ?? f)[0] ?? {};

    const emailed = Number(a.emailed ?? 0);
    const replied = Number(a.replied ?? 0);
    const positive = Number(a.positive ?? 0);
    const linksLive = Number(a.links_live ?? 0);

    // Median rather than mean: one publisher who added a link nine months later
    // would drag a mean into uselessness.
    let daysToLinkMedian: number | null = null;
    try {
      const d: any = await db.execute(
        `select percentile_cont(0.5) within group (
                  order by extract(epoch from (lp.link_found_at - m.sent_at)) / 86400
                ) as median_days
           from link_prospects lp
           join outreach_messages m on m.link_prospect_id = lp.id
          where lp.link_found = true and lp.link_found_at is not null
            and m.status = 'sent' and m.dry_run = false and m.step = 1
            ${campaignFilter}`,
      );
      const md = (d.rows ?? d)[0]?.median_days;
      if (md != null) daysToLinkMedian = Math.round(Number(md) * 10) / 10;
    } catch {
      /* percentile_cont is available in PGlite, but never fail the whole report */
    }

    const funnel: Funnel = {
      found: Number(a.found ?? 0),
      withContact: Number(a.with_contact ?? 0),
      pitchWritten: Number(a.pitch_written ?? 0),
      emailed,
      replied,
      positive,
      linksLive,
      linksNofollow: Number(a.links_nofollow ?? 0),
      linksLost: Number(a.links_lost ?? 0),
      replyRate: rate(replied, emailed, "emails sent"),
      positiveRate: rate(positive, emailed, "emails sent"),
      linkRate: rate(linksLive, emailed, "emails sent"),
      daysToLinkMedian,
    };

    /**
     * Per opportunity type. This is the table that should change behaviour: if
     * listicle pitches earn links and editorial mentions never do, the miner's
     * cutoffs and the drafter's effort should move accordingly.
     */
    const t: any = await db.execute(
      `select lp.opportunity_type as k,
              count(*) filter (where exists (
                 select 1 from outreach_messages m
                  where m.link_prospect_id = lp.id and m.status='sent' and m.dry_run=false
              ))::int as emailed,
              count(*) filter (where exists (
                 select 1 from outreach_replies r where r.prospect_id = lp.prospect_id
              ))::int as replied,
              count(*) filter (where lp.link_found = true and lp.link_is_followed = true)::int as links_live
         from link_prospects lp
        where lp.status <> 'rejected' ${campaignFilter}
        group by lp.opportunity_type`,
    );
    const byType: TypePerformance[] = (t.rows ?? t)
      .map((r: any) => {
        const em = Number(r.emailed ?? 0);
        return {
          opportunityType: r.k ?? "unknown",
          emailed: em,
          replied: Number(r.replied ?? 0),
          linksLive: Number(r.links_live ?? 0),
          replyRate: rate(Number(r.replied ?? 0), em, "emails sent"),
          linkRate: rate(Number(r.links_live ?? 0), em, "emails sent"),
        };
      })
      .filter((r: TypePerformance) => r.emailed > 0)
      .sort((x: TypePerformance, y: TypePerformance) => y.linksLive - x.linksLive || y.emailed - x.emailed);

    /** Which of OUR articles earn links. Useful well beyond outreach. */
    const ar: any = await db.execute(
      `select lp.our_target_slug as slug,
              count(*)::int as pitched,
              count(*) filter (where lp.link_found = true and lp.link_is_followed = true)::int as links_live
         from link_prospects lp
        where lp.our_target_slug is not null and lp.status <> 'rejected' ${campaignFilter}
        group by lp.our_target_slug
        order by links_live desc, pitched desc
        limit 12`,
    );
    const byArticle: ArticlePerformance[] = (ar.rows ?? ar).map((r: any) => ({
      slug: r.slug,
      pitched: Number(r.pitched ?? 0),
      linksLive: Number(r.links_live ?? 0),
      linkRate: rate(Number(r.links_live ?? 0), Number(r.pitched ?? 0), "pitches"),
    }));

    return { funnel, byType, byArticle, readout: readoutFor(funnel, byType), minSample: MIN_SAMPLE };
  } catch {
    return empty;
  }
}

/**
 * One honest sentence about where things stand.
 *
 * Deliberately refuses to claim a trend from a small sample, and says what is
 * missing instead. The most useful thing this can say early on is "not enough has
 * been sent to know anything yet", because that is true and it stops somebody
 * concluding the approach does not work after eight emails.
 */
function readoutFor(f: Funnel, byType: TypePerformance[]): string {
  if (f.emailed === 0) {
    if (f.pitchWritten > 0) {
      return `${f.pitchWritten} pitches are written but nothing has been sent, so there is nothing to measure yet.`;
    }
    return "Nothing has been emailed yet, so there is nothing to measure.";
  }
  if (f.emailed < MIN_SAMPLE) {
    return `Only ${f.emailed} emails have gone out. That is too few to read anything into: ${f.replied} replied and ${f.linksLive} links are live so far. Come back after about ${MIN_SAMPLE}.`;
  }

  const parts: string[] = [];
  parts.push(`${f.emailed} emailed, ${f.replied} replied (${f.replyRate.pct}%), ${f.linksLive} links live (${f.linkRate.pct}%).`);

  const best = byType.filter((t) => t.linkRate.pct != null).sort((a, b) => (b.linkRate.pct ?? 0) - (a.linkRate.pct ?? 0))[0];
  if (best) {
    parts.push(`${best.opportunityType.replace(/_/g, " ")} is earning the most links at ${best.linkRate.pct}%.`);
  }
  if (f.linksLost > 0) {
    parts.push(`${f.linksLost} link${f.linksLost === 1 ? " has" : "s have"} disappeared since being added, which is worth chasing.`);
  }
  if (f.linksNofollow > 0) {
    parts.push(`${f.linksNofollow} placement${f.linksNofollow === 1 ? " is" : "s are"} nofollow, so they pass no credit.`);
  }
  if (f.daysToLinkMedian != null) {
    parts.push(`A link typically appears about ${f.daysToLinkMedian} days after the first email.`);
  }
  return parts.join(" ");
}

/** Campaign labels currently in use, for the filter. */
export async function campaignNames(): Promise<{ name: string; count: number }[]> {
  const { getDb } = await import("@/server/db/client");
  const db = await getDb();
  try {
    const r: any = await db.execute(
      `select campaign_name as name, count(*)::int as c
         from link_prospects
        where campaign_name is not null and status <> 'rejected'
        group by 1 order by 2 desc limit 30`,
    );
    return (r.rows ?? r).map((x: any) => ({ name: x.name, count: Number(x.c) }));
  } catch {
    return [];
  }
}
