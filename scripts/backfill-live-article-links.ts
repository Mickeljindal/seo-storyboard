#!/usr/bin/env tsx
/**
 * Repair internal links inside the articles that are ALREADY live.
 *
 *   npx tsx scripts/backfill-live-article-links.ts             # dry run, changes nothing
 *   npx tsx scripts/backfill-live-article-links.ts --apply     # republish and fix for real
 *   npx tsx scripts/backfill-live-article-links.ts --apply --limit 5
 *
 * WHY THIS IS NEEDED
 * The live posts went out before link deferral existed, so their WordPress
 * content still holds every link exactly as written. Two kinds are broken:
 *
 *   1. Links to an article that IS live but sits at a different WordPress slug.
 *      Writers link to /blog/<folder-slug>/ while the post lives at, for example,
 *      /blog/server-backups-that-actually-restore-a-practical-guide/. These 404
 *      today and would stay broken forever, because nothing else corrects them.
 *
 *   2. Links to an article that is not published yet. These 404 today and would
 *      fix themselves once the target goes live at the URL we linked to.
 *
 * Republishing an article runs it back through the normal publisher, which now
 * corrects category 1 to the real URL and converts category 2 into ledger rows
 * that the healer completes later. Same code path as any other publish, so it
 * updates the existing post rather than creating a duplicate.
 *
 * WHAT TO KNOW BEFORE --apply
 *   - Republishing rewrites post content from the file on disk. Any edit made by
 *     hand in the WordPress editor and not mirrored back to the file WILL be
 *     overwritten. Check that first if anyone has been editing posts directly.
 *   - This is a genuine content change, so the modified date does move. That is
 *     honest here: the links really did change. (Later single-link repairs by the
 *     healer deliberately preserve the date, since adding one link is not an
 *     update.)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
for (const f of [".env", ".env.local"]) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 && args[limitIdx + 1] ? Number(args[limitIdx + 1]) : Infinity;

const { deferUnpublishedLinks, loadLiveUrls } = await import("../src/lib/internal-link-deferral");
const articlesRepo = await import("../src/server/db/repos/articles");

const liveUrls = await loadLiveUrls();
if (!liveUrls.size) {
  console.error(
    "No published articles found in the database. Run scripts/reconcile-publish-state.ts first.",
  );
  process.exit(1);
}

const norm = (u: string) =>
  u.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "").toLowerCase();
const liveUrlSet = new Set([...liveUrls.values()].map(norm));

type Row = { slug: string; wrongUrl: number; notLive: number };
const rows: Row[] = [];

for (const slug of liveUrls.keys()) {
  const file = path.join(ROOT, "content-studio", slug, `${slug}.html`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const body = html.match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? html;

  let wrongUrl = 0;
  let notLive = 0;
  for (const m of body.matchAll(
    /href="(https?:\/\/(?:www\.)?kloudbean\.com\/blog\/([a-z0-9-]+)\/?)"/g,
  )) {
    const [, href, target] = m;
    if (target === slug) continue;
    if (!liveUrls.has(target)) notLive++;
    else if (!liveUrlSet.has(norm(href))) wrongUrl++;
  }
  if (wrongUrl + notLive > 0) rows.push({ slug, wrongUrl, notLive });
}

rows.sort((a, b) => b.wrongUrl + b.notLive - (a.wrongUrl + a.notLive));

const totalWrong = rows.reduce((n, r) => n + r.wrongUrl, 0);
const totalNotLive = rows.reduce((n, r) => n + r.notLive, 0);

console.log(`published articles          : ${liveUrls.size}`);
console.log(`with broken internal links  : ${rows.length}`);
console.log(`  wrong URL (permanent 404) : ${totalWrong}`);
console.log(`  target not live yet       : ${totalNotLive}`);
console.log(`  total broken on live site : ${totalWrong + totalNotLive}`);
console.log("");

// Confirm the fix would actually work, without touching anything.
let fixedWrong = 0;
let willDefer = 0;
for (const r of rows) {
  const file = path.join(ROOT, "content-studio", r.slug, `${r.slug}.html`);
  const body =
    fs.readFileSync(file, "utf8").match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? "";
  const res = deferUnpublishedLinks(body, r.slug, (s) => liveUrls.get(s) ?? null);
  fixedWrong += res.rewritten;
  willDefer += res.deferred.length;
  const leftBroken = [
    ...res.html.matchAll(/href="(https?:\/\/(?:www\.)?kloudbean\.com\/blog\/[a-z0-9-]+\/?)"/g),
  ].filter((m) => !liveUrlSet.has(norm(m[1]))).length;
  console.log(
    `  ${r.slug.padEnd(46)} fix ${String(res.rewritten).padStart(2)} URL, ` +
      `defer ${String(res.deferred.length).padStart(2)}, broken left ${leftBroken}`,
  );
}

console.log("");
console.log(`URLs that would be corrected : ${fixedWrong}`);
console.log(`links that would be deferred : ${willDefer} (repaired later as targets go live)`);

if (!apply) {
  console.log("");
  console.log("DRY RUN. Nothing was changed.");
  console.log("Re-run with --apply to republish these articles and fix them for real.");
  console.log("Before you do: any hand edits made in the WordPress editor and not");
  console.log("mirrored back to the files on disk would be overwritten.");
  process.exit(0);
}

console.log("");
console.log(`APPLYING: republishing ${Math.min(rows.length, limit)} article(s)...`);
const { publishContentStudioArticle } = await import("../src/lib/wp-publish-content-studio");

let ok = 0;
let failed = 0;
let done = 0;
for (const r of rows) {
  if (done >= limit) break;
  done++;
  const article = await articlesRepo.getArticleBySlug(r.slug);
  if (!article) {
    console.log(`  SKIP ${r.slug}: not found in database`);
    continue;
  }
  const res = await publishContentStudioArticle(article.id, "publish");
  if (res.ok) {
    ok++;
    console.log(
      `  OK   ${r.slug}  (deferred ${res.linksDeferred ?? 0}, healed ${res.linksHealed ?? 0})`,
    );
  } else {
    failed++;
    console.log(`  FAIL ${r.slug}: ${res.error}`);
  }
  // Pace the live writes.
  await new Promise((resolve) => setTimeout(resolve, 800));
}

console.log("");
console.log(`Republished ${ok}, failed ${failed}.`);
console.log("Run scripts/reconcile-publish-state.ts afterwards to refresh the manifest.");
