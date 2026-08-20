/**
 * Re-crawl support.kloudbean.com into the local support KB and report what changed.
 *
 *   npm run kb:crawl            full crawl from the sitemap, writes the cache
 *   npm run kb:crawl -- --dry   crawl and report, do not write the cache
 *   npm run kb:status           what is cached right now, no network
 *
 * The report is the point: it tells you which docs are new, which the docs team
 * edited since last crawl, and which have disappeared, so product-truth drift in
 * the steering files can be caught instead of discovered in a published article.
 */
import {
  refreshSupportKnowledge,
  discoverSupportPaths,
  getSupportCacheStatus,
  readSupportDocs,
} from "../src/lib/support-kb";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const statusOnly = args.includes("--status");

function section(title: string) {
  console.log(`\n${title}\n${"-".repeat(title.length)}`);
}

async function main() {
  if (statusOnly) {
    const s = getSupportCacheStatus();
    section("SUPPORT KB CACHE STATUS");
    console.log(`  docs cached : ${s.count}`);
    console.log(`  updated     : ${s.updatedAt ?? "never"}`);
    console.log(`  fresh (24h) : ${s.cached ? "yes" : "no, next use will re-crawl"}`);
    console.log(`  skipped     : ${s.skipped}`);
    const docs = readSupportDocs();
    if (docs.length) {
      const bySection = new Map<string, number>();
      for (const d of docs) bySection.set(d.section ?? "(root)", (bySection.get(d.section ?? "(root)") ?? 0) + 1);
      section("BY SECTION");
      [...bySection.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
      const words = docs.reduce((a, d) => a + d.words, 0);
      console.log(`\n  ${words.toLocaleString()} words of product documentation cached`);
    }
    return;
  }

  section("DISCOVERY");
  const paths = await discoverSupportPaths();
  console.log(`  ${paths.length} crawlable pages found in sitemap.xml`);
  if (paths.length === 0) {
    console.error("  discovery failed, aborting");
    process.exitCode = 1;
    return;
  }

  if (dry) {
    console.log("  --dry: listing only, cache will not be written\n");
    paths.forEach((p) => console.log(`    ${p}`));
    return;
  }

  section("CRAWL");
  let lastPct = -1;
  const res = await refreshSupportKnowledge({
    paths,
    concurrency: 5,
    onProgress: (done, total) => {
      const pct = Math.floor((done / total) * 100);
      if (pct >= lastPct + 10) {
        lastPct = pct;
        process.stdout.write(`  ${pct}% (${done}/${total})\n`);
      }
    },
  });

  console.log(`\n  ${res.message}`);

  const { diff } = res;
  if (diff.added.length) {
    section(`NEW DOCS (${diff.added.length})`);
    diff.added.forEach((p) => console.log(`  + ${p}`));
  }
  if (diff.changed.length) {
    section(`CHANGED SINCE LAST CRAWL (${diff.changed.length})`);
    diff.changed.forEach((p) => console.log(`  ~ ${p}`));
  }
  if (diff.removed.length) {
    section(`GONE FROM THE DOCS SITE (${diff.removed.length})`);
    diff.removed.forEach((p) => console.log(`  - ${p}`));
    console.log(
      "\n  These were cached before and are no longer reachable. If any is referenced\n  in steering or in an article, that reference is now stale.",
    );
  }
  if (diff.skipped.length) {
    section(`SKIPPED (${diff.skipped.length})`);
    diff.skipped.forEach((s) => console.log(`  ! ${s.path}  ${s.reason}`));
  }
  console.log(`\n  unchanged: ${diff.unchanged}`);

  if (!res.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
