// Sync FAQPage JSON-LD question text to the VISIBLE FAQ headings.
//
// Google requires FAQ structured data to match the content a reader actually
// sees; a mismatch is a structured-data violation, not a cosmetic nit. So the
// visible <h3> is treated as the source of truth and the JSON-LD is corrected to
// match it. Visible copy is never touched.
//
// Usage: node scripts/fix-faq-parity.mjs [--dry] [slug ...]
import fs from "node:fs";
import path from "node:path";

const ROOT = "content-studio";
const DRY = process.argv.includes("--dry");
let slugs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!slugs.length)
  slugs = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && d.name !== "assets")
    .map((d) => d.name);

let fixedFiles = 0,
  fixedQs = 0;

for (const slug of slugs) {
  const p = path.join(ROOT, slug, `${slug}.html`);
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, "utf8");

  const faqBlock = (html.match(/<div class="faq">([\s\S]*?)<\/div>\s*<p class="byline"/) ?? [, ""])[1];
  if (!faqBlock) continue;
  const visible = [...faqBlock.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((m) => m[1].trim());
  if (!visible.length) continue;

  // Locate the JSON-LD block that carries the FAQPage.
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let changedHere = 0;

  for (const b of blocks) {
    const raw = b[1];
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const graph = parsed["@graph"] ?? [parsed];
    const faq = graph.find((n) => n && n["@type"] === "FAQPage");
    if (!faq?.mainEntity?.length) continue;
    if (faq.mainEntity.length !== visible.length) continue; // count differs: needs a human

    let block = raw;
    faq.mainEntity.forEach((q, i) => {
      const from = String(q.name ?? "").trim();
      const to = visible[i];
      if (!from || from === to) return;
      // A question name may not contain a double quote, or it breaks the schema.
      if (/"/.test(to)) return;
      // Replace the exact JSON string value, so nothing else in the block moves.
      const needle = `"name": ${JSON.stringify(from)}`;
      const alt = `"name":${JSON.stringify(from)}`;
      if (block.includes(needle)) block = block.replace(needle, `"name": ${JSON.stringify(to)}`);
      else if (block.includes(alt)) block = block.replace(alt, `"name":${JSON.stringify(to)}`);
      else return;
      changedHere++;
    });

    if (block !== raw) html = html.replace(raw, block);
  }

  if (changedHere) {
    fixedFiles++;
    fixedQs += changedHere;
    console.log(`  ${slug}: ${changedHere} question(s) synced`);
    if (!DRY) fs.writeFileSync(p, html);
  }
}

console.log(`\n${DRY ? "[DRY] " : ""}files: ${fixedFiles} | questions synced: ${fixedQs}`);
