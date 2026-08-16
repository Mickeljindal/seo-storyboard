#!/usr/bin/env tsx
/**
 * Daily internal-link upkeep. Run this on a schedule.
 *
 *   npx tsx scripts/link-maintenance.ts            # reconcile + repair
 *   npx tsx scripts/link-maintenance.ts --status    # report only, change nothing
 *   npx tsx scripts/link-maintenance.ts --limit 100 # cap repairs this run
 *
 * WHY THIS EXISTS SEPARATELY FROM AUTOPILOT
 * Publishing an article already repairs every link waiting on it, in the publish
 * path itself, so the normal case needs nothing scheduled. Autopilot also carries
 * a catch-up pass, but switching autopilot on turns on topic discovery, article
 * generation and auto-publishing too. This script is the link upkeep on its own,
 * for when you want the safety net without the rest.
 *
 * It does two things:
 *   1. Reconciles publish state against live WordPress, so the engine's idea of
 *      what is published matches reality (this is what drifted to 21 vs 38).
 *   2. Drains the pending-links ledger: any note whose target is now live gets
 *      turned back into a real link in the already-published post.
 *
 * Both are safe to run repeatedly. Writes to your own database and inserts links
 * into live posts; never changes article text, titles, or slugs.
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
const statusOnly = args.includes("--status");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 && args[limitIdx + 1] ? Number(args[limitIdx + 1]) : 200;

const ledger = await import("../src/server/db/repos/pending-internal-links");

const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
console.log(`[${stamp}] internal-link maintenance${statusOnly ? " (status only)" : ""}`);

// ---------------------------------------------------------------- 1. reconcile
if (!statusOnly) {
  const { reconcilePublishState, hasWordPressConfigured } = await import(
    "../src/lib/publish-state-sync"
  );
  if (!hasWordPressConfigured()) {
    console.log("  publish state: skipped, WordPress not configured");
  } else {
    const rec = await reconcilePublishState({ log: (m) => console.log(`  ${m}`) });
    if (!rec.ok) console.log(`  publish state: failed, ${rec.error}`);
  }
}

// ---------------------------------------------------------------- 2. status
const before = await ledger.pendingLinkStats();
console.log("");
console.log("  LEDGER");
console.log(`    waiting for their target to go live : ${before.pending}`);
console.log(`    already restored                   : ${before.applied}`);
console.log(`    closed as not needed               : ${before.skipped}`);
console.log(`    parked after repeated failures     : ${before.blocked}`);

if (before.topTargets.length) {
  console.log("");
  console.log("  most-awaited articles (publishing these repairs the most links):");
  for (const t of before.topTargets.slice(0, 10)) {
    console.log(`    ${String(t.waiting).padStart(4)} links waiting on  ${t.target_slug}`);
  }
}

if (statusOnly) {
  console.log("");
  console.log("  Status only. Nothing was changed.");
  process.exit(0);
}

// ---------------------------------------------------------------- 3. repair
console.log("");
const { drainPendingLinks } = await import("../src/lib/internal-link-healer");
const healed = await drainPendingLinks({ limit, log: (m) => console.log(`  ${m}`) });

if (!healed.ok) {
  console.log(`  repair skipped: ${healed.errors.join("; ")}`);
  process.exit(1);
}

console.log("  REPAIRS THIS RUN");
console.log(`    links restored : ${healed.applied}`);
console.log(`    closed/skipped : ${healed.skipped}`);
console.log(`    failed         : ${healed.failed}`);
for (const e of healed.errors.slice(0, 5)) console.log(`      ${e}`);

const after = await ledger.pendingLinkStats();
console.log("");
console.log(`  still waiting: ${after.pending}${after.pending ? " (their targets are not live yet)" : ""}`);
if (after.blocked) {
  console.log(`  needs a look : ${after.blocked} parked after 3 failed attempts`);
}
console.log("");
console.log("  Done.");
