#!/usr/bin/env node
/**
 * Reconcile "what is published" against the one durable source of truth: what is
 * actually LIVE on WordPress. Writes content-studio/_published.json.
 *
 *   node scripts/sync-published-from-wordpress.mjs
 *
 * WHY THIS EXISTS
 * The engine's PGlite database is gitignored and, in the container, lives on an
 * ephemeral filesystem (Dockerfile does `mkdir -p .local`, no volume). So every
 * restart rebuilds the DB from scratch and every article comes back as "review".
 * Ticking the publish tracker cannot survive that on its own.
 *
 * The fix is to keep the list of published articles in a COMMITTED file that
 * ships with every deploy, and have the boot sync re-apply it (see
 * applyPublishedManifest in ingest-content-studio.ts). This script regenerates
 * that file from WordPress so it is accurate, then you commit + push it.
 *
 * It matches WP posts to content-studio folders by, in order: identical slug,
 * identical title, WP-slug-starts-with-folder-slug, and a small set of verified
 * hand-pinned overrides where the live slug bears no relation to the folder name.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CS = path.join(ROOT, "content-studio");
const OUT = path.join(CS, "_published.json");

// --- load env (WP_SITE_URL / WP_USERNAME / WP_APP_PASSWORD) from .env ---
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

// Verified by reading both titles side by side. The live WP slug bears no
// reliable relation to the folder slug for these, so they are pinned explicitly.
const OVERRIDES = {
  "server-backups-that-actually-restore-a-practical-guide": "server-backups-guide",
  "ksa-wordpress-hosting": "arabic-wordpress-hosting",
  "how-to-add-a-managed-database-postgresql-or-mysql-to-your-app": "add-managed-database-to-your-app",
  "the-ai-built-app-security-checklist-secure-your-vibe-coded-app": "ai-built-app-security-checklist",
};

async function fetchPublished() {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 30000);
    let res;
    try {
      res = await fetch(
        `${site}/wp-json/wp/v2/posts?status=publish&per_page=100&page=${page}&_fields=id,slug,link,date_gmt,title`,
        { headers: { Authorization: auth }, signal: ctl.signal },
      );
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 400) break; // past last page
    if (!res.ok) throw new Error(`WordPress responded ${res.status} ${res.statusText}`);
    const batch = await res.json();
    if (!batch.length) break;
    all.push(...batch);
    const totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1");
    if (page >= totalPages) break;
  }
  return all;
}

/** Read title + meta title straight from the article's HTML file. */
function readArticleMeta(slug) {
  const html = fs.readFileSync(path.join(CS, slug, `${slug}.html`), "utf8");
  let title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
  const metaTitle = title || h1;
  title = (title || h1).replace(/\s*[—|]\s*Kloudbean.*$/i, "").trim();
  return { title, metaTitle };
}

function listSlugs() {
  return fs.readdirSync(CS).filter((n) => {
    if (n.startsWith("_") || n.startsWith(".") || n === "assets" || n === "images") return false;
    return fs.existsSync(path.join(CS, n, `${n}.html`));
  });
}

const decode = (s) => (s || "")
  .replace(/&#8217;|&#039;|&apos;|&#8216;/g, "'")
  .replace(/&#8220;|&#8221;|&quot;/g, '"')
  .replace(/&amp;/g, "&").replace(/&#8211;|&#8212;/g, "-").replace(/&nbsp;/g, " ");
const norm = (s) => decode(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const posts = await fetchPublished();
console.log(`WordPress: ${posts.length} published posts`);

const slugs = listSlugs();
const meta = new Map(slugs.map((s) => [s, readArticleMeta(s)]));
console.log(`content-studio: ${slugs.length} articles on disk`);

const used = new Set();
const claimed = new Set();
const manifest = [];
const take = (post, slug, how) => {
  if (!slug || used.has(post.id) || claimed.has(slug)) return;
  used.add(post.id);
  claimed.add(slug);
  manifest.push({
    slug,
    wp_slug: post.slug,
    published_url: post.link,
    published_at: new Date(post.date_gmt + "Z").toISOString(),
    matched_by: how,
  });
};

// 1. hand-verified overrides
for (const [wpSlug, folder] of Object.entries(OVERRIDES)) {
  const p = posts.find((x) => x.slug === wpSlug);
  if (p && meta.has(folder)) take(p, folder, "verified");
}
// 2. identical slug
for (const p of posts) if (meta.has(p.slug)) take(p, p.slug, "slug");
// 3. identical normalised title (title or meta title)
for (const p of posts) {
  const pt = norm(p.title.rendered);
  const s = slugs.find((x) => norm(meta.get(x).title) === pt || norm(meta.get(x).metaTitle) === pt);
  if (s) take(p, s, "title");
}
// 4. WP slug is the folder slug plus extra words; longest folder slug wins
const byLen = [...slugs].sort((a, b) => b.length - a.length);
for (const p of posts) {
  const s = byLen.find((x) => p.slug === x || p.slug.startsWith(x + "-"));
  if (s) take(p, s, "slug-prefix");
}

manifest.sort((a, b) => b.published_at.localeCompare(a.published_at));
fs.writeFileSync(OUT, JSON.stringify({
  note: "Published articles, reconciled from live WordPress. Committed on purpose: the "
    + "engine DB is ephemeral, so the boot sync re-applies this on every start. "
    + "Regenerate with: node scripts/sync-published-from-wordpress.mjs",
  generated_at: new Date().toISOString(),
  count: manifest.length,
  published: manifest,
}, null, 2) + "\n");

console.log(`\nMatched ${manifest.length} live posts to content-studio articles:`);
for (const m of manifest) console.log(`  ${m.published_at.slice(0, 10)}  ${m.slug}  [${m.matched_by}]`);
const leftover = posts.filter((p) => !used.has(p.id));
console.log(`\n${leftover.length} live WP posts have no content-studio counterpart (legacy blog content, ignored).`);
console.log(`\nWrote ${path.relative(ROOT, OUT)}`);
