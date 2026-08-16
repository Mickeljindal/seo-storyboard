#!/usr/bin/env node
/**
 * Publish-order planner + internal-link readiness audit.
 *
 * The problem it solves: we write articles that link to each other, but only a
 * few are live on WordPress. Every link whose target is not live yet is a 404
 * for real readers and a wasted crawl for search engines.
 *
 * This script reads what is actually live (content-studio/_published.json) and
 * the internal links in every article, then answers two questions:
 *
 *   1. How bad is it right now?  (audit)
 *   2. What order should we publish in so links go live before the pages that
 *      point at them?  (plan, hub-first by inbound link count)
 *
 * Usage:
 *   node scripts/plan-publish-order.mjs                # audit + first wave
 *   node scripts/plan-publish-order.mjs --waves 6      # full phased plan
 *   node scripts/plan-publish-order.mjs --size 25      # articles per wave
 *   node scripts/plan-publish-order.mjs --json         # machine-readable
 *
 * Nothing is published or modified. Read-only.
 */
import fs from "fs";
import path from "path";

const ROOT = "content-studio";
const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const WAVES = Number(flag("waves", 5));
const SIZE = Number(flag("size", 30));
const AS_JSON = args.includes("--json");

// ---------------------------------------------------------------- load state
const manifestPath = path.join(ROOT, "_published.json");
if (!fs.existsSync(manifestPath)) {
  console.error(`missing ${manifestPath}. Regenerate with scripts/sync-published-from-wordpress.mjs`);
  process.exit(1);
}
const live = new Set(JSON.parse(fs.readFileSync(manifestPath, "utf8")).published.map((p) => p.slug));

/** slug -> Set(outbound internal slugs) for every article that has a body file. */
const outbound = new Map();
for (const slug of fs.readdirSync(ROOT)) {
  const f = path.join(ROOT, slug, `${slug}.html`);
  if (!fs.existsSync(f)) continue;
  const set = new Set();
  for (const m of fs.readFileSync(f, "utf8").matchAll(/kloudbean\.com\/blog\/([a-z0-9-]+)\//g)) {
    if (m[1] !== slug) set.add(m[1]);
  }
  outbound.set(slug, set);
}

// inbound counts, restricted to targets we actually have an article for
const inbound = new Map();
for (const [, targets] of outbound) {
  for (const t of targets) inbound.set(t, (inbound.get(t) || 0) + 1);
}

// ---------------------------------------------------------------- audit
let totalLinks = 0;
let deadLinks = 0;
let fullyBroken = 0;
for (const [, targets] of outbound) {
  const dead = [...targets].filter((t) => !live.has(t)).length;
  totalLinks += targets.size;
  deadLinks += dead;
  if (targets.size > 0 && dead === targets.size) fullyBroken++;
}

// orphan hubs: heavily linked-to but not live, and missing entirely from disk
const orphanHubs = [...inbound.entries()]
  .filter(([slug]) => !live.has(slug))
  .sort((a, b) => b[1] - a[1]);
const missingFromDisk = orphanHubs.filter(([slug]) => !outbound.has(slug));

// ---------------------------------------------------------------- plan waves
// Greedy hub-first: each wave takes the unpublished articles with the highest
// inbound-link count, so the pages most depended on go live earliest. That
// retires the largest number of future dead links per article published.
const published = new Set(live);
const unpublished = [...outbound.keys()].filter((s) => !published.has(s));
const waves = [];
let remaining = new Set(unpublished);

for (let w = 0; w < WAVES && remaining.size; w++) {
  const ranked = [...remaining].sort((a, b) => {
    const ia = inbound.get(a) || 0;
    const ib = inbound.get(b) || 0;
    if (ib !== ia) return ib - ia;
    // tie-break: prefer articles whose own outbound links are already satisfied
    const sa = [...(outbound.get(a) || [])].filter((t) => !published.has(t)).length;
    const sb = [...(outbound.get(b) || [])].filter((t) => !published.has(t)).length;
    return sa - sb;
  });
  const batch = ranked.slice(0, SIZE);
  for (const s of batch) {
    published.add(s);
    remaining.delete(s);
  }
  // how healthy are links across everything live once this wave lands?
  let t = 0;
  let d = 0;
  for (const s of published) {
    for (const target of outbound.get(s) || []) {
      t++;
      if (!published.has(target)) d++;
    }
  }
  waves.push({
    wave: w + 1,
    count: batch.length,
    slugs: batch,
    liveAfter: published.size,
    linkHealthAfter: t ? Number((100 * (1 - d / t)).toFixed(1)) : 100,
  });
}

// ---------------------------------------------------------------- output
if (AS_JSON) {
  console.log(
    JSON.stringify(
      {
        audit: { articles: outbound.size, live: live.size, totalLinks, deadLinks, fullyBroken },
        orphanHubs: orphanHubs.slice(0, 25).map(([slug, n]) => ({ slug, inbound: n, onDisk: outbound.has(slug) })),
        missingFromDisk: missingFromDisk.map(([slug, n]) => ({ slug, inbound: n })),
        waves,
        remaining: [...remaining],
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const pct = totalLinks ? ((100 * deadLinks) / totalLinks).toFixed(1) : "0";
console.log("INTERNAL LINK READINESS");
console.log("=======================");
console.log(`articles on disk          : ${outbound.size}`);
console.log(`live on WordPress         : ${live.size}`);
console.log(`internal links            : ${totalLinks}`);
console.log(`  -> target is live       : ${totalLinks - deadLinks}`);
console.log(`  -> target NOT live (404): ${deadLinks}  (${pct}%)`);
console.log(`articles where every link is dead: ${fullyBroken}`);
console.log();

if (missingFromDisk.length) {
  console.log("LINKS TO SLUGS WE HAVE NOT WRITTEN AT ALL (permanent 404s, fix these first):");
  for (const [slug, n] of missingFromDisk.slice(0, 20)) {
    console.log(`  ${String(n).padStart(3)} inbound  ${slug}`);
  }
  console.log();
}

console.log("TOP HUBS NOT LIVE YET (publishing these retires the most dead links):");
for (const [slug, n] of orphanHubs.filter(([s]) => outbound.has(s)).slice(0, 15)) {
  console.log(`  ${String(n).padStart(3)} inbound  ${slug}`);
}
console.log();

console.log(`PHASED PUBLISH PLAN  (${SIZE} per wave, hub-first)`);
for (const w of waves) {
  console.log(
    `\nWave ${w.wave}: ${w.count} articles  ->  ${w.liveAfter} live, internal-link health ${w.linkHealthAfter}%`,
  );
  console.log("  " + w.slugs.join(", "));
}
if (remaining.size) {
  console.log(`\n(${remaining.size} articles still queued after wave ${waves.length}; raise --waves to plan them.)`);
}
console.log(
  "\nNote: link health is the share of internal links on live pages whose target is also live.\nPublish a whole wave together so the links inside it resolve to each other.",
);
