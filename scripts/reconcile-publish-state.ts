#!/usr/bin/env tsx
/**
 * Reconcile publish state against live WordPress, on demand.
 *
 *   npx tsx scripts/reconcile-publish-state.ts            # fix DB + refresh manifest
 *   npx tsx scripts/reconcile-publish-state.ts --check     # report only, exit 1 on drift
 *   npx tsx scripts/reconcile-publish-state.ts --no-demote # only promote, never demote
 *
 * WordPress is the source of truth. This corrects the engine's database in both
 * directions and rewrites content-studio/_published.json so the committed record
 * stays accurate. It never modifies the live site.
 *
 * Use --check in CI or before planning a publish wave: a non-zero exit means the
 * engine's idea of what is published no longer matches reality.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
for (const f of [".env", ".env.local"]) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const noDemote = args.includes("--no-demote");

const { reconcilePublishState, hasWordPressConfigured } = await import(
  "../src/lib/publish-state-sync"
);

if (!hasWordPressConfigured()) {
  console.error("Missing WP_SITE_URL / WP_USERNAME / WP_APP_PASSWORD in .env");
  process.exit(1);
}

const report = await reconcilePublishState({
  writeManifestFile: !checkOnly,
  allowDemote: !checkOnly && !noDemote,
  log: (m) => console.log(m),
});

if (!report.ok) {
  console.error(`Reconcile failed: ${report.error}`);
  process.exit(1);
}

console.log("");
console.log("PUBLISH STATE");
console.log("=============");
console.log(`live posts on WordPress   : ${report.livePosts}`);
console.log(`articles on disk          : ${report.articlesOnDisk}`);
console.log(`matched to our articles   : ${report.matched}`);
console.log(`legacy posts (not ours)   : ${report.unmatchedLive}`);
console.log(`already correct in DB     : ${report.unchanged}`);
console.log(`corrected upward (live)   : ${report.promoted.length}`);
console.log(`corrected downward        : ${report.demoted.length}`);
console.log(`manifest rewritten        : ${report.manifestWritten ? "yes" : "no"}`);

const drift = report.promoted.length + report.demoted.length;
if (checkOnly) {
  if (drift > 0) {
    console.log("");
    console.log(`DRIFT DETECTED: ${drift} article(s) out of sync with WordPress.`);
    if (report.promoted.length) console.log(`  live but not marked: ${report.promoted.join(", ")}`);
    if (report.demoted.length) console.log(`  marked but not live: ${report.demoted.join(", ")}`);
    console.log("Run without --check to correct it.");
    process.exit(1);
  }
  console.log("\nIn sync. Nothing to correct.");
}

if (report.manifestWritten) {
  console.log("\nRemember to commit content-studio/_published.json so the fix ships.");
}
