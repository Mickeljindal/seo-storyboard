#!/usr/bin/env node
/**
 * Safety check for the CTA upgrade. Compares every article against its committed
 * version and reports any section that disappeared, so a bad replacement cannot
 * quietly delete body content.
 *
 *   node scripts/verify-cta-upgrade-safety.mjs
 *
 * A heading is expected to disappear only when it was the old CTA's own heading.
 * Anything else is a real loss and gets listed.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CS = path.join(ROOT, "content-studio");

const clean = (s) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const headOf = (rel) => {
  try {
    return execFileSync("git", ["show", `HEAD:${rel}`], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 });
  } catch {
    return null;
  }
};

let checked = 0;
const lostHeadings = [];
const bigShrink = [];

for (const slug of fs.readdirSync(CS).sort()) {
  const rel = `content-studio/${slug}/${slug}.md`;
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const before = headOf(rel);
  if (before == null) continue;
  const after = fs.readFileSync(abs, "utf8");
  if (before === after) continue;
  checked++;

  const heads = (t) => [...t.matchAll(/^##\s+(.+)$/gm)].map((m) => clean(m[1]));
  const beforeHeads = heads(before);
  const afterHeads = new Set(heads(after));
  const missing = beforeHeads.filter((h) => !afterHeads.has(h));

  // The old CTA heading legitimately goes away: it was the last H2 before the
  // FAQ and the new component supplies its own heading.
  const faqPos = beforeHeads.findIndex((h) => /\bfaq\b|frequently asked/i.test(h));
  const ctaHeading = faqPos > 0 ? beforeHeads[faqPos - 1] : beforeHeads[beforeHeads.length - 1];
  const unexpected = missing.filter((h) => h !== ctaHeading);
  if (unexpected.length) lostHeadings.push([slug, unexpected]);

  // Body should get slightly longer, not shorter by a section's worth.
  const delta = after.length - before.length;
  if (delta < -900) bigShrink.push([slug, delta]);
}

console.log(`markdown files changed vs HEAD : ${checked}`);
console.log(`articles missing a real section: ${lostHeadings.length}`);
console.log(`articles that shrank a lot      : ${bigShrink.length}`);
for (const [slug, hs] of lostHeadings) console.log(`  ! ${slug}: lost ${hs.map((h) => `"${h}"`).join(", ")}`);
for (const [slug, d] of bigShrink) console.log(`  ? ${slug}: ${d} chars`);
if (!lostHeadings.length && !bigShrink.length) console.log("\nPASS. Only CTA copy was replaced.");
process.exit(lostHeadings.length || bigShrink.length ? 1 : 0);
