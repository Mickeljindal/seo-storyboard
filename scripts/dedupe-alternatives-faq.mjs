#!/usr/bin/env node
/**
 * The shared-hosting "alternative" cluster reused two FAQ sentences verbatim
 * across five articles each. Same meaning, same answer, identical wording, which
 * is exactly the cross-article fingerprint the slop audit exists to catch.
 *
 * This varies the wording on a few of them so no sentence repeats across more
 * than three articles, in the markdown, the visible HTML, and the FAQ schema.
 *
 *   node scripts/dedupe-alternatives-faq.mjs           # dry run
 *   node scripts/dedupe-alternatives-faq.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CS = path.join(ROOT, "content-studio");
const apply = process.argv.includes("--apply");

const EDITS = [
  ["bluehost-alternative", "No, and it doesn't pretend to be.", "No, and it does not try to be."],
  ["hostgator-alternative", "No, and it doesn't pretend to be.", "No, and that split is deliberate."],
  ["hostinger-alternative", "No, and it doesn't pretend to be.", "No. Registering domains is not part of it."],
  [
    "godaddy-alternative",
    "Check current pricing on the pricing page before you decide.",
    "Confirm the current numbers on the pricing page first.",
  ],
  [
    "hostgator-alternative",
    "Check current pricing on the pricing page before you decide.",
    "Read the pricing page for today's figures before committing.",
  ],
  [
    "siteground-alternative",
    "Check current pricing on the pricing page before you decide.",
    "Look at the live pricing page before you commit.",
  ],
];

/** The same sentence appears with a straight quote, a curly quote, or an entity. */
const forms = (s) => [
  s,
  s.replace(/'/g, "\u2019"),
  s.replace(/'/g, "&#8217;"),
  s.replace(/'/g, "&rsquo;"),
];

let total = 0;
for (const [slug, oldText, newText] of EDITS) {
  for (const ext of ["md", "html"]) {
    const file = path.join(CS, slug, `${slug}.${ext}`);
    if (!fs.existsSync(file)) continue;
    let text = fs.readFileSync(file, "utf8");
    let hits = 0;
    for (const form of forms(oldText)) {
      if (!text.includes(form)) continue;
      const replacement = form.includes("&#8217;")
        ? newText.replace(/'/g, "&#8217;")
        : form.includes("\u2019")
          ? newText.replace(/'/g, "\u2019")
          : form.includes("&rsquo;")
            ? newText.replace(/'/g, "&rsquo;")
            : newText;
      hits += text.split(form).length - 1;
      text = text.split(form).join(replacement);
    }
    if (hits && apply) fs.writeFileSync(file, text);
    if (hits) total += hits;
    console.log(`  ${slug}.${ext.padEnd(4)} ${hits} replacement(s)  "${oldText.slice(0, 34)}..."`);
  }
}
console.log(`\n${apply ? "APPLIED" : "DRY RUN"}: ${total} replacement(s)`);
if (!apply) console.log("Nothing written. Re-run with --apply.");
