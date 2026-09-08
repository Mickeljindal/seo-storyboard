// Fill an article's .img-slot placeholders with REAL generated visuals.
//
//   structural slots (terminal / graph / comparison / panel / flow)
//     -> AI supplies the content, a fixed template renders it, Playwright
//        rasterizes it to a retina PNG. Crisp text, on-brand, deterministic.
//   console slots
//     -> left alone: those are served by the real support-doc screenshot map.
//   illustration slots
//     -> a LOCAL model on this Mac's GPU (mflux), textless, house style.
//
// Images land in <article>/images/gen-<n>-<type>.png and the slot becomes a real
// <figure><img><figcaption>. The .md mirror is kept in sync.
//
// Usage:
//   node scripts/generate-article-images.mjs <slug> [<slug>...] [--dry] [--limit N]
//   node scripts/generate-article-images.mjs --all [--limit N]
import fs from "node:fs";
import path from "node:path";
import { parseSlots, classifySlot } from "./plan-article-images.mjs";
import { renderVisual, closeBrowser } from "./lib/render-visual.mjs";
import { specFromSlot } from "./lib/spec-from-slot.mjs";
import { generateLocalImage, localModelAvailable } from "./lib/local-image.mjs";

// .env so AI creds are available when run straight from the CLI
for (const line of fs.existsSync(".env") ? fs.readFileSync(".env", "utf8").split("\n") : []) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const ROOT = "content-studio";
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const ALL = argv.includes("--all");
const limIdx = argv.indexOf("--limit");
const LIMIT = limIdx >= 0 ? Number(argv[limIdx + 1]) : Infinity;
const slugs = argv.filter((a) => !a.startsWith("--") && a !== String(LIMIT));

const PUBLISHED = new Set(
  (JSON.parse(fs.readFileSync(`${ROOT}/_published.json`, "utf8")).published ?? []).map((p) => p.slug),
);

const titleOf = (html) =>
  html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ??
  html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ??
  "";

/** A short caption for the figure, derived from the spec we just rendered. */
function captionFor(type, spec, hint) {
  if (spec?.subtitle) return spec.subtitle;
  if (spec?.title) return spec.title;
  return hint.replace(/\s+/g, " ").trim().slice(0, 140);
}

async function processArticle(slug) {
  const dir = path.join(ROOT, slug);
  const htmlPath = path.join(dir, `${slug}.html`);
  const mdPath = path.join(dir, `${slug}.md`);
  if (!fs.existsSync(htmlPath)) return { slug, skipped: "no html" };

  let html = fs.readFileSync(htmlPath, "utf8");
  if (!html.includes('class="img-slot"')) return { slug, skipped: "no slots" };

  const articleTitle = titleOf(html);
  const slots = parseSlots(html);
  const results = [];

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const c = classifySlot(s.hint, s.note);

    // Real product screens come from the screenshot map, not from a generator.
    if (c.renderer === "screenshot") {
      results.push({ n: i + 1, type: c.type, status: "left-for-screenshot" });
      continue;
    }
    // A browser window or another product's UI. Nothing here can render these
    // honestly, so they keep their placeholder and their CAPTURE prompt.
    if (c.renderer === "manual") {
      results.push({ n: i + 1, type: c.type, status: "left-for-manual-capture" });
      continue;
    }

    const file = `gen-${i + 1}-${c.type}.png`;
    const outPath = path.join(dir, "images", file);
    const rel = `images/${file}`;

    if (DRY) {
      results.push({ n: i + 1, type: c.type, renderer: c.renderer, status: "would-generate", rel });
      continue;
    }

    try {
      let caption;
      if (c.renderer === "ai") {
        if (!localModelAvailable()) {
          results.push({ n: i + 1, type: c.type, status: "skip: local model not ready" });
          continue;
        }
        await generateLocalImage({ hint: s.hint, note: s.note, outPath });
        caption = s.hint.replace(/\s+/g, " ").trim().slice(0, 140);
      } else {
        const spec = await specFromSlot(c.type, {
          hint: s.hint,
          note: s.note,
          articleTitle,
          slug,
        });
        await renderVisual(c.type, spec, outPath);
        caption = captionFor(c.type, spec, s.hint);
      }

      // Swap the placeholder for a real figure. Alt text carries the editor's own
      // description, which is the most accurate thing available.
      const alt = s.hint.replace(/"/g, "&quot;").replace(/\s+/g, " ").trim().slice(0, 180);
      const figure = `<figure>\n    <img src="${rel}" alt="${alt}">\n    <figcaption>${caption.replace(/</g, "&lt;")}</figcaption>\n  </figure>`;
      html = html.replace(s.raw, figure);
      results.push({ n: i + 1, type: c.type, renderer: c.renderer, status: "ok", rel, caption });
    } catch (e) {
      results.push({ n: i + 1, type: c.type, status: `error: ${String(e.message ?? e).slice(0, 120)}` });
    }
  }

  const made = results.filter((r) => r.status === "ok");
  if (!DRY && made.length) {
    fs.writeFileSync(htmlPath, html);
    // Mirror into the .md: replace the Nth ADD IMAGE marker with a real image.
    if (fs.existsSync(mdPath)) {
      let md = fs.readFileSync(mdPath, "utf8");
      for (const r of made) {
        md = md.replace(/<!--\s*ADD IMAGE:[\s\S]*?-->/, `![${r.caption.replace(/[[\]]/g, "")}](${r.rel})`);
      }
      fs.writeFileSync(mdPath, md);
    }
  }
  return { slug, total: slots.length, made: made.length, results };
}

// ---- pick targets --------------------------------------------------------
let targets = slugs;
if (ALL) {
  targets = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && d.name !== "assets")
    .map((d) => d.name)
    .filter((s) => !PUBLISHED.has(s))
    .filter((s) => {
      const f = path.join(ROOT, s, `${s}.html`);
      return fs.existsSync(f) && fs.readFileSync(f, "utf8").includes('class="img-slot"');
    });
}
if (!targets.length) {
  console.error("usage: node scripts/generate-article-images.mjs <slug>... | --all [--dry] [--limit N]");
  process.exit(1);
}
targets = targets.slice(0, LIMIT);

let okTotal = 0,
  errTotal = 0;
for (const slug of targets) {
  const r = await processArticle(slug);
  if (r.skipped) {
    console.log(`- ${slug}: ${r.skipped}`);
    continue;
  }
  console.log(`\n${slug}  (${r.made}/${r.total} generated)`);
  for (const x of r.results) {
    const flag = x.status === "ok" ? "ok " : x.status.startsWith("error") ? "ERR" : "-  ";
    console.log(`  ${flag} #${x.n} ${String(x.type).padEnd(11)} ${x.status === "ok" ? x.rel : x.status}`);
    if (x.status === "ok") okTotal++;
    if (String(x.status).startsWith("error")) errTotal++;
  }
}
await closeBrowser();
console.log(`\n${DRY ? "[DRY] " : ""}articles: ${targets.length} | images generated: ${okTotal} | errors: ${errTotal}`);
