/**
 * Prove the metrics refuse to invent a rate from a small sample.
 *
 *   npx tsx scripts/verify-link-metrics.ts
 *
 * This is the assertion that matters: "33% reply rate" from three emails is noise
 * wearing a percentage sign, and it is exactly the number that points a strategy in
 * the wrong direction. Seeds synthetic prospects under a unique campaign label,
 * checks the behaviour below and above the minimum sample, then deletes them.
 *
 * Run with the dev server stopped: PGlite allows a single writer.
 */
import { loadProjectEnv } from "../src/lib/load-env";

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  loadProjectEnv();
  const { linkMetrics } = await import("../src/lib/link-metrics");
  const { getDb } = await import("../src/server/db/client");
  const db = await getDb();

  const TAG = `metrics-${Date.now()}`;

  /**
   * Seed n prospects that look genuinely emailed, of which `replies` replied and
   * `links` have a live followed link. Uses the real tables so the metric SQL is
   * exercised rather than mocked.
   */
  // Every seeded row needs a globally unique address and domain, because two seed
  // calls in the same run would otherwise collide on the unique email index.
  let seq = 0;
  const seed = async (n: number, replies: number, links: number, type = "listicle") => {
    for (let i = 0; i < n; i++) {
      const uid = `${TAG}-${seq++}`;
      const email = `ed@${uid}.example.com`;
      const p: any = await db.execute(
        `insert into outreach_prospects (email, company, segment, source, personal_note)
         values ('${email}', 'M', 'publisher', '${TAG}', 'Published a page') returning id`,
      );
      const prospectId = (p.rows ?? p)[0].id;

      const lp: any = await db.execute(
        `insert into link_prospects
           (domain, opportunity_type, status, prospect_id, campaign_name, our_target_slug,
            value_score, link_found, link_is_followed, link_found_at)
         values ('${uid}.example.com', '${type}',
                 '${i < links ? "won" : i < replies ? "replied" : "contacted"}',
                 '${prospectId}', '${TAG}', 'heroku-alternative', '70',
                 ${i < links ? "true" : "null"},
                 ${i < links ? "true" : "null"},
                 ${i < links ? "now() - interval '9 days'" : "null"})
         returning id`,
      );
      const linkId = (lp.rows ?? lp)[0].id;

      await db.execute(
        `insert into outreach_messages
           (prospect_id, step, subject, body_text, status, dry_run, sent_at, campaign, link_prospect_id)
         values ('${prospectId}', 1, 's', 'b unsubscribe', 'sent', false,
                 now() - interval '20 days', 'link_building', '${linkId}')`,
      );
      if (i < replies) {
        await db.execute(
          `insert into outreach_replies (prospect_id, from_email, classification, confidence)
           values ('${prospectId}', '${email}', '${i < links ? "interested" : "not_interested"}', '0.9')`,
        );
      }
    }
  };

  const cleanup = async () => {
    await db.execute(
      `delete from outreach_replies where prospect_id in (select id from outreach_prospects where source='${TAG}')`,
    );
    await db.execute(
      `delete from outreach_messages where prospect_id in (select id from outreach_prospects where source='${TAG}')`,
    );
    await db.execute(`delete from link_prospects where campaign_name='${TAG}'`);
    await db.execute(`delete from outreach_prospects where source='${TAG}'`);
  };

  await cleanup();

  console.log("1) a small sample must NOT produce a percentage\n");
  await seed(3, 1, 1);
  let r = await linkMetrics({ campaign: TAG });
  check("3 emails is counted correctly", r.funnel.emailed === 3, String(r.funnel.emailed));
  check("reply rate has NO percentage", r.funnel.replyRate.pct === null, String(r.funnel.replyRate.pct));
  check("link rate has NO percentage", r.funnel.linkRate.pct === null, String(r.funnel.linkRate.pct));
  check(
    "the label says it is too early",
    /too early/i.test(r.funnel.replyRate.label),
    r.funnel.replyRate.label,
  );
  check(
    "the readout says how many more are needed",
    /too few|too early/i.test(r.readout) && /12/.test(r.readout),
    r.readout,
  );
  check(
    "but the raw counts are still shown",
    r.funnel.replyRate.numerator === 1 && r.funnel.replyRate.denominator === 3,
    `${r.funnel.replyRate.numerator}/${r.funnel.replyRate.denominator}`,
  );

  console.log("\n2) once the sample is big enough, a rate appears\n");
  await cleanup();
  await seed(20, 8, 5);
  r = await linkMetrics({ campaign: TAG });
  check("20 emails counted", r.funnel.emailed === 20, String(r.funnel.emailed));
  check("reply rate is now a number", r.funnel.replyRate.pct === 40, String(r.funnel.replyRate.pct));
  check("link rate is now a number", r.funnel.linkRate.pct === 25, String(r.funnel.linkRate.pct));
  check(
    "the readout quotes both rates",
    /40%/.test(r.readout) && /25%/.test(r.readout),
    r.readout,
  );
  check("links live counted", r.funnel.linksLive === 5, String(r.funnel.linksLive));
  check(
    "positive replies counted separately from all replies",
    r.funnel.positive === 5 && r.funnel.replied === 8,
    `positive ${r.funnel.positive}, replied ${r.funnel.replied}`,
  );

  console.log("\n3) days-to-link is a median, from the FIRST email\n");
  check(
    "median days to link is measured",
    r.funnel.daysToLinkMedian != null && r.funnel.daysToLinkMedian > 0,
    String(r.funnel.daysToLinkMedian),
  );
  check(
    "and it is about 11 days (sent 20 days ago, found 9 days ago)",
    Math.abs((r.funnel.daysToLinkMedian ?? 0) - 11) < 1.5,
    String(r.funnel.daysToLinkMedian),
  );

  console.log("\n4) per-type performance is broken out\n");
  const listicle = r.byType.find((t) => t.opportunityType === "listicle");
  check("the listicle row exists", !!listicle);
  check("it counts the emails", listicle?.emailed === 20, String(listicle?.emailed));
  check("it counts the links", listicle?.linksLive === 5, String(listicle?.linksLive));
  check("and it has a rate", listicle?.linkRate.pct === 25, String(listicle?.linkRate.pct));

  console.log("\n5) two types are compared, and the better one is named\n");
  await seed(14, 1, 0, "editorial_mention");
  r = await linkMetrics({ campaign: TAG });
  check("both types appear", r.byType.length === 2, JSON.stringify(r.byType.map((t) => t.opportunityType)));
  const ed = r.byType.find((t) => t.opportunityType === "editorial_mention");
  check("the weaker type shows 0 links", ed?.linksLive === 0, String(ed?.linksLive));
  check(
    "the readout names listicle as the best performer",
    /listicle/i.test(r.readout),
    r.readout,
  );

  console.log("\n6) our own articles are ranked by links earned\n");
  const art = r.byArticle.find((a) => a.slug === "heroku-alternative");
  check("the pitched article is listed", !!art, JSON.stringify(r.byArticle.slice(0, 2)));
  check("with its link count", (art?.linksLive ?? 0) === 5, String(art?.linksLive));

  console.log("\n7) a lost link is reported, not hidden\n");
  await db.execute(
    `update link_prospects set link_found=false, link_lost_at=now(), status='lost'
      where campaign_name='${TAG}' and link_found=true and id in (
        select id from link_prospects where campaign_name='${TAG}' and link_found=true limit 2)`,
  );
  r = await linkMetrics({ campaign: TAG });
  check("lost links are counted", r.funnel.linksLost === 2, String(r.funnel.linksLost));
  check(
    "and the readout mentions them",
    /disappeared/i.test(r.readout),
    r.readout,
  );

  console.log("\n8) a nofollow placement is not counted as a win\n");
  await cleanup();
  await seed(15, 5, 4);
  await db.execute(
    `update link_prospects set link_is_followed=false
      where campaign_name='${TAG}' and link_found=true`,
  );
  r = await linkMetrics({ campaign: TAG });
  check("no followed links are claimed", r.funnel.linksLive === 0, String(r.funnel.linksLive));
  check("they are counted as nofollow instead", r.funnel.linksNofollow === 4, String(r.funnel.linksNofollow));
  check(
    "and the readout says they pass no credit",
    /nofollow/i.test(r.readout) && /no credit/i.test(r.readout),
    r.readout,
  );

  await cleanup();
  console.log(`\ncleaned up test rows (${TAG})`);
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

main().then(() => process.exit(process.exitCode ?? 0));
