// Replace DOUBLE quotes with single quotes in FAQ question text, in both the
// visible <h3>, the .md mirror, and the FAQPage JSON-LD.
//
// Why: a double quote inside a JSON-LD `name` breaks the schema, so those get
// stripped, which then breaks FAQ parity against the visible heading. The two
// validator rules are unsatisfiable together while a question quotes an error
// string with double quotes. Single quotes satisfy both and keep the
// "this is a literal error string" signal for the reader.
//
// Usage: node scripts/fix-faq-quotes.mjs [--dry] [slug ...]
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

let files = 0,
  count = 0;

for (const slug of slugs) {
  const hp = path.join(ROOT, slug, `${slug}.html`);
  const mp = path.join(ROOT, slug, `${slug}.md`);
  if (!fs.existsSync(hp)) continue;
  let html = fs.readFileSync(hp, "utf8");
  const before = html;

  const faqBlock = (html.match(/<div class="faq">([\s\S]*?)<\/div>\s*<p class="byline"/) ?? [, ""])[1];
  if (!faqBlock) continue;

  // Only touch questions that actually carry a double quote.
  const quoted = [...faqBlock.matchAll(/<h3>([\s\S]*?)<\/h3>/g)]
    .map((m) => m[1].trim())
    .filter((q) => q.includes('"'));
  if (!quoted.length) continue;

  let md = fs.existsSync(mp) ? fs.readFileSync(mp, "utf8") : null;

  for (const q of quoted) {
    const single = q.replace(/"/g, "'");
    // visible heading
    html = html.split(`<h3>${q}</h3>`).join(`<h3>${single}</h3>`);
    // the JSON-LD variant, which has had its quotes stripped rather than converted
    const stripped = q.replace(/"/g, "");
    for (const variant of [q, stripped]) {
      html = html
        .split(`"name": ${JSON.stringify(variant)}`)
        .join(`"name": ${JSON.stringify(single)}`)
        .split(`"name":${JSON.stringify(variant)}`)
        .join(`"name":${JSON.stringify(single)}`);
    }
    if (md != null) md = md.split(q).join(single);
    count++;
  }

  if (html !== before) {
    files++;
    console.log(`  ${slug}: ${quoted.length} question(s) requoted`);
    if (!DRY) {
      fs.writeFileSync(hp, html);
      if (md != null) fs.writeFileSync(mp, md);
    }
  }
}

console.log(`\n${DRY ? "[DRY] " : ""}files: ${files} | questions requoted: ${count}`);
