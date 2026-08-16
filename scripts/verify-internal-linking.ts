#!/usr/bin/env tsx
/**
 * See the internal linking happen, and prove it works. Read-only.
 *
 *   npx tsx scripts/verify-internal-linking.ts --demo build-a-saas-with-stripe-payments
 *       Show the real before/after for one article: which links survive, which get
 *       redirected to the post's actual URL, and which become plain text plus a
 *       ledger note.
 *
 *   npx tsx scripts/verify-internal-linking.ts --simulate
 *       Publish all 434 articles in memory, hub-first, running the SAME deferral
 *       code the publisher uses and a faithful model of the healer. Proves two
 *       things: no broken link is ever published, and every promised link is
 *       eventually restored.
 *
 *   npx tsx scripts/verify-internal-linking.ts
 *       Both.
 *
 * Nothing is written. No WordPress calls. This exercises the real decision logic
 * in src/lib/internal-link-deferral.ts, so a pass here means the shipped code is
 * behaving, not a reimplementation of it.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CS = path.join(ROOT, "content-studio");
const args = process.argv.slice(2);
const demoIdx = args.indexOf("--demo");
const demoSlug = demoIdx >= 0 ? args[demoIdx + 1] : null;
const wantSimulate = args.includes("--simulate") || (!demoSlug && !args.includes("--demo"));
const wantDemo = Boolean(demoSlug) || (!args.includes("--simulate") && !demoSlug);

const { deferUnpublishedLinks } = await import("../src/lib/internal-link-deferral");

// ---------------------------------------------------------------- live state
const manifest = JSON.parse(fs.readFileSync(path.join(CS, "_published.json"), "utf8"));
const liveUrl = new Map<string, string>(
  manifest.published.map((p: { slug: string; published_url: string }) => [p.slug, p.published_url]),
);
const canonical = (slug: string) => `https://www.kloudbean.com/blog/${slug}/`;
const normUrl = (u: string) =>
  u.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "").toLowerCase();

function bodyOf(slug: string): string | null {
  const f = path.join(CS, slug, `${slug}.html`);
  if (!fs.existsSync(f)) return null;
  const html = fs.readFileSync(f, "utf8");
  return html.match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? null;
}

const allSlugs = fs.readdirSync(CS).filter((s) => bodyOf(s) !== null);

// ---------------------------------------------------------------- DEMO
function runDemo(slug: string) {
  const body = bodyOf(slug);
  if (!body) {
    console.log(`No article found for "${slug}".`);
    return;
  }
  console.log("=".repeat(78));
  console.log(`WHAT HAPPENS WHEN "${slug}" IS PUBLISHED`);
  console.log("=".repeat(78));

  const res = deferUnpublishedLinks(body, slug, (s) => liveUrl.get(s) ?? null);

  // Re-derive per-link detail so each decision can be shown with its reason.
  const RE =
    /<a\b[^>]*href="https?:\/\/(?:www\.)?kloudbean\.com\/blog\/([a-z0-9-]+)\/?"[^>]*>([\s\S]*?)<\/a>/gi;
  const decisions: { target: string; anchor: string; verdict: string; detail: string }[] = [];
  for (const m of body.matchAll(RE)) {
    const target = m[1];
    const anchor = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (target === slug) {
      decisions.push({ target, anchor, verdict: "UNWRAP", detail: "link to itself" });
      continue;
    }
    const url = liveUrl.get(target);
    if (!url) {
      const promised = res.deferred.find((d) => d.targetSlug === target);
      decisions.push({
        target,
        anchor,
        verdict: promised ? "DEFER" : "UNWRAP",
        detail: promised
          ? `not live yet -> ledger note on "${promised.anchorText}"`
          : "not live, and the phrase is too ambiguous to promise",
      });
      continue;
    }
    if (normUrl(url) === normUrl(canonical(target))) {
      decisions.push({ target, anchor, verdict: "KEEP", detail: "already live at this URL" });
    } else {
      decisions.push({ target, anchor, verdict: "REDIRECT", detail: `live, but at ${url}` });
    }
  }

  const pad = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n));
  console.log("");
  for (const d of decisions) {
    console.log(`  [${d.verdict.padEnd(8)}] ${pad(d.anchor, 44)} -> ${d.target}`);
    console.log(`             ${d.detail}`);
  }

  console.log("");
  console.log(`  KEEP     ${res.kept}   link published exactly as written`);
  console.log(`  REDIRECT ${res.rewritten}   href corrected to where the post really is`);
  console.log(`  DEFER    ${res.deferred.length}   words kept, link restored when the target goes live`);
  console.log(`  UNWRAP   ${res.selfLinks + res.unrecoverable}   words kept, no link promised`);

  // Show the actual HTML difference for one deferred link, so the change is concrete.
  const sample = res.deferred[0];
  if (sample) {
    const before = [...body.matchAll(RE)].find((m) => m[1] === sample.targetSlug)?.[0] ?? "";
    console.log("");
    console.log("  THE ACTUAL HTML CHANGE (one example):");
    console.log(`    before: ${before.slice(0, 150)}`);
    console.log(`    after : ${sample.anchorText}`);
    console.log(`    ledger: ${slug} --("${sample.anchorText}")--> ${sample.targetSlug} [pending]`);
    console.log("");
    console.log(`  Later, when "${sample.targetSlug}" is published, the healer finds that note,`);
    console.log(`  searches this post for the phrase, and wraps it in a link to the new URL.`);
  }
}

// ---------------------------------------------------------------- SIMULATION
function runSimulation() {
  console.log("=".repeat(78));
  console.log("SIMULATION: publish everything, then check nothing is left broken");
  console.log("=".repeat(78));

  // Hub-first order: publish the most linked-to articles earliest.
  const inbound = new Map<string, number>();
  for (const s of allSlugs) {
    const b = bodyOf(s)!;
    const seen = new Set<string>();
    for (const m of b.matchAll(/kloudbean\.com\/blog\/([a-z0-9-]+)\//g)) {
      if (m[1] !== s) seen.add(m[1]);
    }
    for (const t of seen) inbound.set(t, (inbound.get(t) ?? 0) + 1);
  }
  const queue = allSlugs
    .filter((s) => !liveUrl.has(s))
    .sort((a, b) => (inbound.get(b) ?? 0) - (inbound.get(a) ?? 0));

  // In-memory model of the live site and the ledger.
  const published = new Map<string, string>(liveUrl); // slug -> url
  const publishedBody = new Map<string, string>(); // slug -> what is live
  type Note = { from: string; target: string; anchor: string; status: string };
  const ledger: Note[] = [];

  let publishedBroken = 0; // broken links that ever reached the live site
  let applied = 0;
  let skipped = 0;

  const healFor = (target: string) => {
    for (const n of ledger) {
      if (n.status !== "pending" || n.target !== target) continue;
      const body = publishedBody.get(n.from);
      if (body === undefined) continue; // source not live yet
      const url = published.get(target);
      if (!url) continue;
      // Same rules the plugin enforces: skip if already linked, else wrap the
      // phrase in place. Strict mode means no fallback insertion.
      if (body.includes(url)) {
        n.status = "skipped";
        skipped++;
        continue;
      }
      if (!body.includes(n.anchor)) {
        n.status = "skipped";
        skipped++;
        continue;
      }
      publishedBody.set(n.from, body.replace(n.anchor, `<a href="${url}">${n.anchor}</a>`));
      n.status = "applied";
      applied++;
    }
  };

  // Seed the model with what is live TODAY. Those posts went out before the
  // deferral existed, so their content still holds the original links, including
  // the ones pointing at a live post's old folder-slug URL. Passing
  // --with-backfill models running scripts/backfill-live-article-links.ts first,
  // which puts them through the same treatment as any new publish.
  const withBackfill = args.includes("--with-backfill");
  for (const s of published.keys()) {
    const b = bodyOf(s);
    if (!b) continue;
    if (withBackfill) {
      const fixed = deferUnpublishedLinks(b, s, (t) => published.get(t) ?? null);
      publishedBody.set(s, fixed.html);
      for (const d of fixed.deferred) {
        ledger.push({ from: s, target: d.targetSlug, anchor: d.anchorText, status: "pending" });
      }
    } else {
      publishedBody.set(s, b);
    }
  }

  for (const slug of queue) {
    const res = deferUnpublishedLinks(bodyOf(slug)!, slug, (s) => published.get(s) ?? null);

    // Would anything broken go live in this body?
    for (const m of res.html.matchAll(
      /href="(https?:\/\/(?:www\.)?kloudbean\.com\/blog\/[a-z0-9-]+\/?)"/g,
    )) {
      const target = [...published.entries()].find(([, u]) => normUrl(u) === normUrl(m[1]));
      if (!target) publishedBroken++;
    }

    publishedBody.set(slug, res.html);
    published.set(slug, canonical(slug));
    for (const d of res.deferred) {
      ledger.push({ from: slug, target: d.targetSlug, anchor: d.anchorText, status: "pending" });
    }
    // Publishing this article makes every note pointing at it honourable.
    healFor(slug);
  }

  // Final audit of the simulated site.
  let liveLinks = 0;
  let liveBroken = 0;
  const urlSet = new Set([...published.values()].map(normUrl));
  for (const [, body] of publishedBody) {
    for (const m of body.matchAll(
      /href="(https?:\/\/(?:www\.)?kloudbean\.com\/blog\/[a-z0-9-]+\/?)"/g,
    )) {
      liveLinks++;
      if (!urlSet.has(normUrl(m[1]))) liveBroken++;
    }
  }
  const stillPending = ledger.filter((n) => n.status === "pending").length;

  console.log("");
  console.log(`articles published in the run   : ${queue.length}`);
  console.log(`ledger notes created            : ${ledger.length}`);
  console.log(`  restored automatically        : ${applied}`);
  console.log(`  skipped (already linked)      : ${skipped}`);
  console.log(`  still waiting                 : ${stillPending}`);
  console.log("");
  console.log(`internal links on the finished site : ${liveLinks}`);
  console.log("");
  console.log("PROOF POINTS");
  console.log(`  broken links that ever went live  : ${publishedBroken}   (must be 0)`);
  console.log(`  broken links at the end           : ${liveBroken}   (must be 0)`);
  console.log(`  notes left unresolved             : ${stillPending}   (must be 0)`);

  // Attribute any residual breakage, so a number is never left unexplained.
  if (liveBroken > 0) {
    const preExisting = new Set(liveUrl.keys());
    let inOldPosts = 0;
    let inNewPosts = 0;
    for (const [slug, body] of publishedBody) {
      for (const m of body.matchAll(
        /href="(https?:\/\/(?:www\.)?kloudbean\.com\/blog\/[a-z0-9-]+\/?)"/g,
      )) {
        if (urlSet.has(normUrl(m[1]))) continue;
        if (preExisting.has(slug)) inOldPosts++;
        else inNewPosts++;
      }
    }
    console.log("");
    console.log("  where the remaining breakage lives:");
    console.log(`    inside posts that were ALREADY live : ${inOldPosts}`);
    console.log(`    inside newly published articles     : ${inNewPosts}   (must be 0)`);
    if (inOldPosts > 0 && inNewPosts === 0) {
      console.log("");
      console.log("  Those are the pre-existing links inside posts published before this");
      console.log("  system existed. Re-run with --with-backfill to model repairing them:");
      console.log("    npx tsx scripts/verify-internal-linking.ts --simulate --with-backfill");
    }
  }

  const newPostsClean = publishedBroken === 0 && stillPending === 0;
  const everythingClean = newPostsClean && liveBroken === 0;
  console.log("");
  if (everythingClean) {
    console.log("PASS. No broken link was ever published, and every promised link was restored.");
  } else if (newPostsClean) {
    console.log(
      "PASS for everything this system controls: nothing broken was published and every " +
        "promised link was restored.\nThe only breakage left is the known pre-existing set, " +
        "which the backfill fixes.",
    );
  } else {
    console.log("FAIL. Investigate before publishing.");
  }
  return newPostsClean;
}

if (wantDemo) runDemo(demoSlug ?? "build-a-saas-with-stripe-payments");
if (wantDemo && wantSimulate) console.log("\n");
if (wantSimulate) {
  const ok = runSimulation();
  process.exit(ok ? 0 : 1);
}
