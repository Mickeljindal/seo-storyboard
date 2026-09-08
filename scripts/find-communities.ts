#!/usr/bin/env -S npx tsx
/**
 * Find WHERE we should be posting: discover communities, read their rules, and
 * score them.
 *
 *   npx tsx scripts/find-communities.ts                      # discover + evaluate
 *   npx tsx scripts/find-communities.ts --queries "nextjs,laravel"
 *   npx tsx scripts/find-communities.ts --report             # list what we found
 *   npx tsx scripts/find-communities.ts --report --reco post # just the ones to post in
 *
 * Needs REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET (free app at reddit.com/prefs/apps,
 * type "script"). Read-only: it never subscribes, posts, or votes.
 *
 * Four verdicts: post, participate, watch, avoid. "participate" is not a
 * consolation prize. Communities that ban links are often the ones whose members
 * trust what they read, and a track record there is worth more than a link.
 */
import { loadProjectEnv } from "../src/lib/load-env";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function main() {
  loadProjectEnv();
  const repo = await import("../src/server/db/repos/venues");

  if (!process.argv.includes("--report")) {
    const { hasRedditCredentials } = await import("../src/lib/reddit-api");
    if (!hasRedditCredentials()) {
      console.log(
        "Running on the public RSS feed (no API credentials needed).\n" +
          "  Discovery works, but member counts and rules are not available over RSS, so no\n" +
          '  community will be marked "post" without a manual rules check. Verdicts stay at\n' +
          "  participate or watch. Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET for the full picture.\n",
      );
    }
    const { crawlCommunities } = await import("../src/lib/community-finder");
    const queriesArg = arg("--queries");
    const r = await crawlCommunities({
      queries: queriesArg ? queriesArg.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      maxPerQuery: Number(arg("--per-query", "12")),
    });
    console.log(`queries run  : ${r.queriesRun}`);
    console.log(`candidates   : ${r.candidates}`);
    console.log(`evaluated    : ${r.evaluated}`);
    console.log(`stored       : ${r.stored}`);
    if (Object.keys(r.byRecommendation).length) {
      console.log("\nverdicts");
      for (const [k, n] of Object.entries(r.byRecommendation).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${k.padEnd(12)} ${n}`);
      }
    }
    if (r.errors.length) {
      console.log(`\n${r.errors.length} note(s):`);
      for (const e of r.errors.slice(0, 10)) console.log(`  - ${e}`);
    }
  }

  const reco = arg("--reco");
  const venues = await repo.listVenues({
    platform: "reddit",
    recommendation: reco,
    limit: Number(arg("--top", "30")),
  });

  console.log(`\nCOMMUNITIES (${venues.length} shown, best opportunity first)`);
  for (const v of venues) {
    console.log(
      `\n  [${String(Math.round(v.opportunity)).padStart(3)}] ${v.recommendation.toUpperCase().padEnd(11)} r/${v.name}`,
    );
    const audience =
      v.subscribers > 0
        ? `${v.subscribers.toLocaleString()} members · ${v.active_users} online`
        : "size unknown";
    console.log(
      `        ${audience} · fit ${Math.round(v.topical_fit)}/100 · self-promo: ${v.self_promo_allowed}`,
    );
    if (v.reasoning) console.log(`        ${v.reasoning}`);
    if (v.submission_notes) console.log(`        posting notes: ${v.submission_notes}`);
  }

  if (venues.length) {
    console.log(
      "\nThe thread listener automatically targets everything marked post or participate,\n" +
        "so approving a community here changes what gets crawled next run.",
    );
  }
}

// PGlite keeps the event loop alive, so exit explicitly once the work is done.
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
