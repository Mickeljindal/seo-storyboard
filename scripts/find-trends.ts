#!/usr/bin/env -S npx tsx
/**
 * Viral content finder: what is getting attention right now that WE can add
 * something true to.
 *
 *   npx tsx scripts/find-trends.ts                       # crawl every source + shortlist
 *   npx tsx scripts/find-trends.ts --min 30              # stricter gate
 *   npx tsx scripts/find-trends.ts --sources hackernews,github
 *   npx tsx scripts/find-trends.ts --report              # shortlist only, no crawl
 *   npx tsx scripts/find-trends.ts --prune               # drop stale unactioned items
 *
 * Sources: Hacker News, DEV.to, Lobsters, GitHub, and Reddit. All read-only. Only
 * Reddit needs credentials; the rest are public.
 *
 * The shortlist can legitimately come back empty. That means nothing in our lane
 * is hot right now, which is a real answer and better than padding it with
 * marginal topics.
 */
import { loadProjectEnv } from "../src/lib/load-env";
import { CLUSTERS } from "../src/lib/pillars";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const clusterName = (id: number | null): string =>
  id == null ? "unmapped" : (CLUSTERS.find((c) => c.id === id)?.short ?? `cluster ${id}`);

async function main() {
  loadProjectEnv();
  const repo = await import("../src/server/db/repos/trends");

  if (process.argv.includes("--prune")) {
    const removed = await repo.pruneStaleTrends(Number(arg("--days", "14")));
    console.log(`pruned ${removed} stale item(s)`);
    return;
  }

  if (!process.argv.includes("--report")) {
    const { crawlTrends } = await import("../src/lib/trend-radar");
    const sourcesArg = arg("--sources");
    const r = await crawlTrends({
      sources: sourcesArg
        ? (sourcesArg.split(",").map((s) => s.trim()) as Parameters<typeof crawlTrends>[0]["sources"])
        : undefined,
      minHeat: Number(arg("--min", "22")),
      hoursBack: Number(arg("--hours", "48")),
    });
    console.log(`fetched            : ${r.fetched}`);
    console.log(`stored (our lane)  : ${r.stored}`);
    console.log(`rejected off-topic : ${r.rejectedOffTopic}`);
    console.log(`below heat gate    : ${r.belowThreshold}`);
    if (Object.keys(r.bySource).length) {
      console.log("\nby source");
      for (const [s, n] of Object.entries(r.bySource)) console.log(`  ${s.padEnd(12)} ${n}`);
    }
    if (r.errors.length) {
      console.log(`\n${r.errors.length} note(s):`);
      for (const e of r.errors.slice(0, 10)) console.log(`  - ${e}`);
    }
  }

  const shortlist = await repo.listTrends({
    status: "new",
    freshHours: Number(arg("--fresh", "72")),
    limit: Number(arg("--top", "20")),
  });

  console.log(`\nSHORTLIST (${shortlist.length} item(s), hottest first)`);
  if (!shortlist.length) {
    console.log(
      "  Nothing in our lane is hot right now. That is a valid answer: publishing a\n" +
        "  marginal take on an unrelated trend costs more authority than it gains.",
    );
  }
  for (const t of shortlist) {
    console.log(
      `\n  [heat ${String(Math.round(t.heat)).padStart(3)}] ${t.source} · ${clusterName(t.cluster_id)} · ${t.points} pts, ${t.comments} comments, ${t.velocity.toFixed(1)}/h`,
    );
    console.log(`      ${t.title.slice(0, 100)}`);
    if (t.discussion_url) console.log(`      ${t.discussion_url}`);
    if (t.matched_terms.length) console.log(`      matched: ${t.matched_terms.slice(0, 6).join(", ")}`);
    if (t.covered_by_slugs.length) {
      console.log(`      ALREADY COVERED: ${t.covered_by_slugs.join(", ")}`);
    }
    if (t.angle) console.log(`      angle (${t.angle_kind}): ${t.angle}`);
  }
  console.log(
    "\nNothing was written. Pick an item, confirm we have something true to add, then brief it.",
  );
}

// PGlite keeps the event loop alive, so exit explicitly once the work is done.
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
