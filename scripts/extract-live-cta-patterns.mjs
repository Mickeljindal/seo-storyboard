#!/usr/bin/env node
/**
 * READ-ONLY. Fetches the LIVE WordPress HTML for every article listed in
 * content-studio/_published.json and extracts the call-to-action blocks that
 * were hand-edited on WordPress, so new CTAs can be modelled on the real thing
 * instead of guesswork.
 *
 *   node scripts/extract-live-cta-patterns.mjs            # summary
 *   node scripts/extract-live-cta-patterns.mjs --dump     # write full report
 *
 * It never writes to WordPress and never modifies article sources. The optional
 * report goes to .local/live-cta-report.json (gitignored working directory).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CS = path.join(ROOT, "content-studio");

for (const f of [".env", ".env.local"]) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const site = (process.env.WP_SITE_URL ?? "").replace(/\/+$/, "");
const user = process.env.WP_USERNAME ?? "";
const pass = process.env.WP_APP_PASSWORD ?? "";
if (!site || !user || !pass) {
  console.error("Missing WP_SITE_URL / WP_USERNAME / WP_APP_PASSWORD in .env");
  process.exit(1);
}
const auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
const dump = process.argv.includes("--dump");

const manifest = JSON.parse(fs.readFileSync(path.join(CS, "_published.json"), "utf8"));

async function wpGet(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30000);
  try {
    const res = await fetch(url, { headers: { Authorization: auth }, signal: ctl.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Pull every block that looks like a conversion unit out of rendered content. */
function extractCtaBlocks(html) {
  const blocks = [];
  const classRe =
    /<(div|section|aside|figure|table)\b[^>]*class=["'][^"']*\b(cta|kb-cta|kb-card|wp-block-buttons|has-background|banner|callout|promo)\b[^"']*["'][\s\S]*?<\/\1>/gi;
  for (const m of html.matchAll(classRe)) blocks.push(m[0]);

  // Anything wrapping a kloudbean.com or /pricing/ link near the end of the post.
  const linkRe = /<(div|section|p|table)\b[^>]*>(?:(?!<\/\1>)[\s\S])*?kloudbean\.com(?:(?!<\/\1>)[\s\S])*?<\/\1>/gi;
  for (const m of html.matchAll(linkRe)) if (m[0].length < 4000) blocks.push(m[0]);

  return [...new Set(blocks)];
}

const styleFacts = (html) => ({
  inline_style_attrs: (html.match(/style=["'][^"']+["']/gi) ?? []).length,
  style_tags: (html.match(/<style[\s\S]*?<\/style>/gi) ?? []).length,
  images: (html.match(/<img\b[^>]*>/gi) ?? []).map((t) => (t.match(/src=["']([^"']+)["']/i) ?? [])[1]).filter(Boolean),
  svgs: (html.match(/<svg\b/gi) ?? []).length,
  buttons: (html.match(/class=["'][^"']*\b(btn|button|wp-block-button__link)\b[^"']*["']/gi) ?? []).length,
  tables: (html.match(/<table\b/gi) ?? []).length,
  links: [...new Set((html.match(/href=["']([^"']*kloudbean\.com[^"']*)["']/gi) ?? []).map((h) => h.replace(/^href=["']|["']$/g, "")))],
  arabic: /[\u0600-\u06FF]/.test(html),
  mentions_ksa: /\b(saudi|ksa|kingdom|dammam|riyadh|jeddah|pdpl|nca)\b/i.test(html.replace(/<[^>]*>/g, " ")),
});

const report = [];
for (const entry of manifest.published) {
  let posts;
  try {
    posts = await wpGet(`${site}/wp-json/wp/v2/posts?slug=${encodeURIComponent(entry.wp_slug)}&_fields=id,slug,link,content`);
  } catch (e) {
    report.push({ slug: entry.slug, error: String(e.message ?? e) });
    continue;
  }
  const post = posts?.[0];
  if (!post) {
    report.push({ slug: entry.slug, error: "not found on WordPress" });
    continue;
  }
  const rendered = post.content?.rendered ?? "";
  const blocks = extractCtaBlocks(rendered);
  report.push({
    slug: entry.slug,
    wp_slug: post.slug,
    content_chars: rendered.length,
    cta_block_count: blocks.length,
    facts: styleFacts(blocks.join("\n")),
    tail: rendered.slice(-2600),
    blocks,
  });
}

const ok = report.filter((r) => !r.error);
console.log(`live articles inspected : ${report.length}`);
console.log(`fetched successfully    : ${ok.length}`);
console.log(`errors                  : ${report.length - ok.length}`);
console.log(`with a CTA-like block   : ${ok.filter((r) => r.cta_block_count > 0).length}`);
console.log(`CTA uses inline styles  : ${ok.filter((r) => r.facts.inline_style_attrs > 0).length}`);
console.log(`CTA embeds an image     : ${ok.filter((r) => r.facts.images.length > 0).length}`);
console.log(`CTA embeds inline SVG   : ${ok.filter((r) => r.facts.svgs > 0).length}`);
console.log(`CTA has button classes  : ${ok.filter((r) => r.facts.buttons > 0).length}`);
console.log(`CTA references KSA      : ${ok.filter((r) => r.facts.mentions_ksa).length}`);
console.log(`CTA contains Arabic     : ${ok.filter((r) => r.facts.arabic).length}`);

for (const r of report.filter((x) => x.error)) console.log(`  ! ${r.slug}: ${r.error}`);

if (dump) {
  const out = path.join(ROOT, ".local", "live-cta-report.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`\nfull report written to ${path.relative(ROOT, out)}`);
}
