#!/usr/bin/env node
/**
 * READ-ONLY helper. Prints the hand-edited live CTA blocks captured by
 * extract-live-cta-patterns.mjs so their real structure can be studied.
 *
 *   node scripts/inspect-live-cta-report.mjs                 # overview
 *   node scripts/inspect-live-cta-report.mjs <slug> [...]    # full blocks
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const reportPath = path.join(ROOT, ".local", "live-cta-report.json");
if (!fs.existsSync(reportPath)) {
  console.error("Run: node scripts/extract-live-cta-patterns.mjs --dump");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const wanted = process.argv.slice(2);
const ok = report.filter((r) => !r.error);

if (wanted.length === 0) {
  const rows = ok
    .map((r) => ({
      slug: r.slug,
      inline: r.facts.inline_style_attrs,
      buttons: r.facts.buttons,
      tables: r.facts.tables,
      links: r.facts.links.length,
      ksa: r.facts.mentions_ksa ? "yes" : "",
    }))
    .sort((a, b) => b.inline + b.buttons - (a.inline + a.buttons));
  console.log("slug".padEnd(46), "inline", "btn", "tbl", "links", "ksa");
  for (const r of rows) {
    console.log(
      r.slug.padEnd(46),
      String(r.inline).padStart(6),
      String(r.buttons).padStart(3),
      String(r.tables).padStart(3),
      String(r.links).padStart(5),
      r.ksa.padStart(4),
    );
  }
  const linkTally = new Map();
  for (const r of ok) for (const l of r.facts.links) linkTally.set(l, (linkTally.get(l) ?? 0) + 1);
  console.log("\nMOST-USED CTA DESTINATIONS");
  for (const [link, n] of [...linkTally].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`  ${String(n).padStart(3)}  ${link}`);
  }
  process.exit(0);
}

for (const slug of wanted) {
  const r = report.find((x) => x.slug === slug);
  if (!r) {
    console.log(`\n===== ${slug}: not in report =====`);
    continue;
  }
  console.log(`\n================ ${slug} ================`);
  console.log(`blocks: ${r.cta_block_count} | facts: ${JSON.stringify(r.facts)}`);
  r.blocks.forEach((b, i) => {
    console.log(`\n--- block ${i + 1} ---`);
    console.log(b.length > 3000 ? `${b.slice(0, 3000)}\n[...truncated]` : b);
  });
  console.log("\n--- rendered tail ---");
  console.log(r.tail);
}
