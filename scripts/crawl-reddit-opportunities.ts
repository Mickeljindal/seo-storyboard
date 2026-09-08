#!/usr/bin/env -S npx tsx
/**
 * Find public Reddit threads our library genuinely answers.
 *
 *   npx tsx scripts/crawl-reddit-opportunities.ts
 *   npx tsx scripts/crawl-reddit-opportunities.ts --min 45 --limit 40
 *   npx tsx scripts/crawl-reddit-opportunities.ts --subs webdev,node,nextjs
 *   npx tsx scripts/crawl-reddit-opportunities.ts --report          # show the shortlist
 *
 * READ ONLY. This never posts, votes, or authenticates. It builds the shortlist a
 * human then works through, which is the part that actually takes hours.
 */
import { loadProjectEnv } from "../src/lib/load-env";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function main() {
  loadProjectEnv();
  const reportOnly = process.argv.includes("--report");
  const repo = await import("../src/server/db/repos/reddit");

  if (!reportOnly) {
    const { crawlRedditOpportunities, hasRedditCredentials } = await import("../src/lib/reddit-listener");
    if (!hasRedditCredentials()) {
      console.log(
        "Running on the public RSS feed (no API credentials needed).\n" +
          "  Works, with two gaps: no upvote or comment counts, and subreddit rules cannot be\n" +
          "  read, so self-promo policy shows as unknown. Check the sidebar before you link.\n" +
          '  For the full data, add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET (free "script" app).\n',
      );
    }
    const subs = arg("--subs");
    const r = await crawlRedditOpportunities({
      subreddits: subs ? subs.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      minRelevance: Number(arg("--min", "35")),
      limitPerSub: Number(arg("--limit", "50")),
    });
    console.log(`scanned              : ${r.scanned}`);
    console.log(`stored (worth a look): ${r.stored}`);
    console.log(`below threshold      : ${r.skippedLowRelevance}`);
    if (Object.keys(r.bySubreddit).length) {
      console.log("\nby subreddit");
      for (const [sub, n] of Object.entries(r.bySubreddit).sort((a, b) => b[1] - a[1])) {
        console.log(`  r/${sub.padEnd(18)} ${n}`);
      }
    }
    if (r.errors.length) {
      console.log(`\n${r.errors.length} note(s):`);
      for (const e of r.errors.slice(0, 12)) console.log(`  - ${e}`);
    }
  }

  const shortlist = await repo.listOpportunities({ status: "new", limit: 25 });
  console.log(`\nTOP OPPORTUNITIES (${shortlist.length} shown, highest relevance first)`);
  for (const o of shortlist) {
    const promo =
      o.self_promo_allowed === "no"
        ? "ANSWER ONLY, no link"
        : o.self_promo_allowed === "limited"
          ? "link allowed if it adds something"
          : o.self_promo_allowed;
    console.log(
      `\n  [${String(Math.round(o.relevance)).padStart(3)}] r/${o.subreddit} · ${o.intent} · ${promo}`,
    );
    console.log(`        ${o.title.slice(0, 96)}`);
    console.log(`        ${o.permalink}`);
    if (o.matched_terms.length) console.log(`        matched: ${o.matched_terms.slice(0, 6).join(", ")}`);
    if (o.matched_article_slugs.length)
      console.log(`        we cover: ${o.matched_article_slugs.join(", ")}`);
  }
  console.log(
    "\nNothing was posted. Draft a reply from the dashboard or with draftRedditReplyFn, read it, then post it yourself.",
  );
}

// PGlite keeps the event loop alive, so exit explicitly once the work is done.
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
