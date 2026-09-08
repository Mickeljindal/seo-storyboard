#!/usr/bin/env node
/**
 * Clean-up pass for the CTA upgrade. The old conversion block sometimes had its
 * own heading sitting just above it, in the HTML, in the markdown, or in both.
 * The new component carries its own heading, so a leftover one is now an orphan
 * and breaks Markdown/HTML heading parity.
 *
 * A heading is only removed when it is an orphan: present on one side, absent on
 * the other, and directly above the CTA. Anything shared by both sides is a real
 * section and is left alone.
 *
 *   node scripts/fix-orphan-cta-headings.mjs           # dry run
 *   node scripts/fix-orphan-cta-headings.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CS = path.join(ROOT, "content-studio");
const apply = process.argv.includes("--apply");

const clean = (s) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/[`*_]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

let fixedHtml = 0;
let fixedMd = 0;
const touched = [];

for (const slug of fs.readdirSync(CS).sort()) {
  const htmlPath = path.join(CS, slug, `${slug}.html`);
  const mdPath = path.join(CS, slug, `${slug}.md`);
  if (!fs.existsSync(htmlPath) || !fs.existsSync(mdPath)) continue;

  let html = fs.readFileSync(htmlPath, "utf8");
  let md = fs.readFileSync(mdPath, "utf8");
  if (!/kbcta-[a-z]+-wrap/.test(html)) continue;

  let changed = false;

  // --- HTML side: an <h2> immediately above the CTA that markdown does not have ---
  const mdHeads = new Set([...md.matchAll(/^##\s+(.+)$/gm)].map((m) => clean(m[1])));
  // The inner match must not be allowed to run across other headings, or a lazy
  // [\s\S]*? will swallow every section between the first h2 and the CTA.
  const htmlOrphan = html.match(
    /[ \t]*<h2[^>]*>((?:(?!<\/?h2\b)[\s\S])*?)<\/h2>\s*\n(?=<div class="kbcta-)/,
  );
  if (htmlOrphan && !mdHeads.has(clean(htmlOrphan[1]))) {
    html = html.replace(htmlOrphan[0], "");
    fixedHtml++;
    changed = true;
  }

  // --- Markdown side: a '## heading' immediately above the CTA that HTML lacks ---
  const htmlHeads = new Set(
    [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => clean(m[1])),
  );
  const mdOrphan = md.match(/^##[ \t]+(.+)\n+(?=<!-- cta:start -->)/m);
  if (mdOrphan && !htmlHeads.has(clean(mdOrphan[1]))) {
    md = md.replace(mdOrphan[0], "");
    fixedMd++;
    changed = true;
  }

  if (changed) {
    touched.push(slug);
    if (apply) {
      fs.writeFileSync(htmlPath, html);
      fs.writeFileSync(mdPath, md);
    }
  }
}

console.log(`${apply ? "FIXED" : "DRY RUN"}: ${touched.length} article(s)`);
console.log(`  orphan HTML headings removed : ${fixedHtml}`);
console.log(`  orphan markdown headings removed: ${fixedMd}`);
for (const s of touched) console.log(`   - ${s}`);
if (!apply) console.log("\nNothing written. Re-run with --apply.");
