#!/usr/bin/env node
/**
 * READ-ONLY. Saves the full rendered HTML of one or more live posts to
 * .local/live-raw/<slug>.html so a hand-edited CTA can be studied whole,
 * including any <style> block and wrapper markup the summariser trims.
 *
 *   node scripts/fetch-live-post-raw.mjs <slug> [<slug> ...]
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
const auth =
  "Basic " + Buffer.from(`${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`).toString("base64");

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error("Usage: node scripts/fetch-live-post-raw.mjs <slug> [<slug> ...]");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(path.join(CS, "_published.json"), "utf8"));
const outDir = path.join(ROOT, ".local", "live-raw");
fs.mkdirSync(outDir, { recursive: true });

for (const slug of slugs) {
  const entry = manifest.published.find((p) => p.slug === slug || p.wp_slug === slug);
  const wpSlug = entry?.wp_slug ?? slug;
  const res = await fetch(
    `${site}/wp-json/wp/v2/posts?slug=${encodeURIComponent(wpSlug)}&_fields=slug,link,content`,
    { headers: { Authorization: auth } },
  );
  if (!res.ok) {
    console.log(`  ! ${slug}: ${res.status} ${res.statusText}`);
    continue;
  }
  const [post] = await res.json();
  if (!post) {
    console.log(`  ! ${slug}: not found`);
    continue;
  }
  const file = path.join(outDir, `${slug}.html`);
  fs.writeFileSync(file, post.content?.rendered ?? "");
  console.log(`  saved ${path.relative(ROOT, file)} (${(post.content?.rendered ?? "").length} chars)`);
}
