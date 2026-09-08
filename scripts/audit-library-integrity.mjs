#!/usr/bin/env node
/**
 * Read-only structural integrity audit for every content-studio article.
 *
 * Checks source pairs that the per-article validator cannot assess across the
 * whole library: Markdown/HTML H1 and H2 parity, Article + FAQPage schema,
 * visible FAQ versus schema question count, image alt attributes, canonical
 * URLs, internal-link targets, and optional hero-image presence.
 *
 * Usage: node scripts/audit-library-integrity.mjs [--list]
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "content-studio");
const list = process.argv.includes("--list");
const verbose = process.argv.includes("--verbose");
const clean = (value) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
const cleanMarkdown = (value) => {
  const code = [];
  const protectedCode = clean(value).replace(/`([^`]+)`/g, (_, inner) => `\u0000${code.push(inner) - 1}\u0000`);
  return protectedCode
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\u0000(\d+)\u0000/g, (_, index) => code[Number(index)])
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
};
const matches = (text, re) => [...text.matchAll(re)];

const rows = [];
for (const slug of fs.readdirSync(root).sort()) {
  const dir = path.join(root, slug);
  const mdPath = path.join(dir, `${slug}.md`);
  const htmlPath = path.join(dir, `${slug}.html`);
  if (!fs.existsSync(mdPath) || !fs.existsSync(htmlPath)) continue;

  const md = fs.readFileSync(mdPath, "utf8");
  const html = fs.readFileSync(htmlPath, "utf8");
  const h1Md = cleanMarkdown((md.match(/^#\s+(.+)$/m) ?? [])[1] ?? "");
  const h1Html = clean((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ?? [])[1] ?? "");
  const h2Md = matches(md, /^##\s+(.+)$/gm).map((m) => cleanMarkdown(m[1]));
  const h2Html = matches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi).map((m) => clean(m[1]));
  // Markdown has historically represented a CTA title as an H2, while the
  // rendered article puts the same title in a .cta block. Treat that as a
  // representation difference, not reader-visible content drift.
  const ctaText = clean((html.match(/<div\s+class=["'][^"']*\bcta\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ?? [])[1] ?? "");
  const normalizedH2Md = h2Md.filter((heading) => !(ctaText.includes(clean(heading)) && !h2Html.includes(heading)));
  const scripts = matches(html, /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
  let articleSchema = false;
  let faqSchema = false;
  let schemaQuestions = null;
  let invalidSchema = false;
  for (const block of scripts) {
    try {
      const json = JSON.parse(block[1]);
      const graph = json["@graph"] ?? [json];
      for (const node of graph) {
        if (node["@type"] === "Article") articleSchema = true;
        if (node["@type"] === "FAQPage") {
          faqSchema = true;
          schemaQuestions = (node.mainEntity ?? []).length;
        }
      }
    } catch {
      invalidSchema = true;
    }
  }
  const faqBlock = (html.match(/<div\s+class=["']faq["'][^>]*>([\s\S]*?)<\/div>/i) ?? [])[1] ?? "";
  const visibleFaq = matches(faqBlock, /<h3[^>]*>([\s\S]*?)<\/h3>/gi).length;
  const htmlWithoutComments = html.replace(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//g, "");
  const imagesWithoutAlt = matches(htmlWithoutComments, /<img\b[^>]*>/gi).filter((m) => !/\balt\s*=/.test(m[0]));
  const internalTargets = matches(html, /https:\/\/www\.kloudbean\.com\/blog\/([a-z0-9-]+)\//gi)
    .map((m) => m[1]).filter((target) => !fs.existsSync(path.join(root, target)));
  const expectedCanonical = `https://www.kloudbean.com/blog/${slug}/`;
  const canonical = (html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) ?? [])[1] ?? "";
  const issues = [];
  if (!h1Md || !h1Html || h1Md !== h1Html) issues.push("h1");
  if (normalizedH2Md.length !== h2Html.length || normalizedH2Md.some((h, i) => h !== h2Html[i])) issues.push("h2");
  if (invalidSchema || !articleSchema || !faqSchema) issues.push("schema");
  if (schemaQuestions !== null && visibleFaq !== schemaQuestions) issues.push("faq");
  if (imagesWithoutAlt.length) issues.push("alt");
  if (internalTargets.length) issues.push("internal-links");
  if (canonical && slug !== "hosting-architecture" && canonical !== expectedCanonical) issues.push("canonical");
  rows.push({ slug, issues, hero: fs.existsSync(path.join(dir, "images", "hero.png")), h2Md, h2Html, imagesWithoutAlt: imagesWithoutAlt.map((m) => m[0]) });
}

const count = (issue) => rows.filter((row) => row.issues.includes(issue)).length;
console.log(`Articles scanned: ${rows.length}`);
console.log(`H1 parity failures: ${count("h1")}`);
console.log(`H2 parity failures: ${count("h2")}`);
console.log(`Schema failures: ${count("schema")}`);
console.log(`FAQ count failures: ${count("faq")}`);
console.log(`Images missing alt: ${count("alt")}`);
console.log(`Missing internal-link targets: ${count("internal-links")}`);
console.log(`Unexpected canonical URL: ${count("canonical")}`);
console.log(`Hero PNG not rendered: ${rows.filter((row) => !row.hero).length}`);

if (list) {
  for (const row of rows.filter((row) => row.issues.length)) {
    console.log(`  ${row.slug}: ${row.issues.join(", ")}`);
    if (verbose && row.issues.includes("h2")) {
      console.log(`    md:   ${row.h2Md.join(" | ")}`);
      console.log(`    html: ${row.h2Html.join(" | ")}`);
    }
    if (verbose && row.imagesWithoutAlt.length) console.log(`    images without alt: ${row.imagesWithoutAlt.join(" | ")}`);
  }
}

const blocking = rows.filter((row) => row.issues.length).length;
console.log(blocking ? `\n${blocking} article(s) need source review.` : "\nPASS. No structural source issues found.");
process.exit(blocking ? 1 : 0);
