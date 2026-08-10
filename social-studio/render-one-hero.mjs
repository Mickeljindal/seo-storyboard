/**
 * Render the HERO card (2400x1260) for ONE article, without touching the other
 * articles' heroes. Same template + descriptors as render-all-heroes, just
 * filtered to the slug(s) you name.
 *
 * Run from social-studio/ so playwright resolves:
 *   node render-one-hero.mjs <slug> [<slug> ...]
 */
import { readFileSync, statSync } from "node:fs";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { buildHeroHtml } from "../content-studio/hero-studio/hero-card.mjs";
import { buildAllHeroes } from "../content-studio/hero-studio/hero-data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT = join(ROOT, "content-studio");
const TMP = join(CONTENT, "hero-studio", ".render-one-tmp");

const args = process.argv.slice(2);
const MISSING_MODE = args.includes("--missing");
const wanted = new Set(args.filter((a) => a !== "--missing"));
if (!MISSING_MODE && wanted.size === 0) {
  console.error("Usage: node render-one-hero.mjs <slug> [<slug> ...]");
  console.error("       node render-one-hero.mjs --missing   (render every article whose images/hero.png is absent)");
  process.exit(1);
}

const LOGO_SVG = readFileSync(join(__dirname, "assets/kb-primary.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>/i, "")
  .replace(/<!DOCTYPE[^>]*>/i, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/\swidth="[^"]*"/i, "")
  .replace(/\sheight="[^"]*"/i, "")
  .trim();

async function gotoReady(page, url) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
  }
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
}

function heroPngExists(slug) {
  try {
    return statSync(join(CONTENT, slug, "images", "hero.png")).isFile();
  } catch {
    return false;
  }
}

async function main() {
  const all = buildAllHeroes();
  const heroes = MISSING_MODE
    ? all.filter((h) => !heroPngExists(h.slug))
    : all.filter((h) => wanted.has(h.slug));
  if (MISSING_MODE) {
    console.log(`--missing: ${heroes.length} of ${all.length} articles have no hero.png`);
  } else {
    const found = new Set(heroes.map((h) => h.slug));
    for (const s of wanted) if (!found.has(s)) console.warn(`  ! no descriptor for "${s}" (needs ${s}/${s}.md)`);
  }
  if (!heroes.length) {
    console.log("nothing to render");
    return;
  }

  await mkdir(TMP, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2400, height: 1260 }, deviceScaleFactor: 1 });

  const failures = [];
  let ok = 0;
  for (const post of heroes) {
    try {
      const outDir = join(CONTENT, post.slug, "images");
      await mkdir(outDir, { recursive: true });
      const tmpHtml = join(TMP, `${post.slug}.html`);
      await writeFile(tmpHtml, buildHeroHtml(post, { logoSvg: LOGO_SVG }), "utf8");
      await gotoReady(page, pathToFileURL(tmpHtml).href);
      await page.locator("#card").screenshot({ path: join(outDir, "hero.png") });
      ok++;
      console.log(`  [${ok}/${heroes.length}] ${post.slug} (${post.archetype}/${post.palette})`);
    } catch (e) {
      failures.push({ slug: post.slug, error: String(e && e.message ? e.message : e) });
      console.log(`  FAILED ${post.slug}: ${e && e.message ? e.message : e}`);
    }
  }

  await browser.close();
  await rm(TMP, { recursive: true, force: true });
  console.log(`done: ${ok}/${heroes.length} hero(es) rendered`);
  if (failures.length) {
    console.log(`${failures.length} failed:`);
    for (const f of failures) console.log(`   - ${f.slug}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
