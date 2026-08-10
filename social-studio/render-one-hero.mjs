/**
 * Render the HERO card (2400x1260) for ONE article, without touching the other
 * articles' heroes. Same template + descriptors as render-all-heroes, just
 * filtered to the slug(s) you name.
 *
 * Run from social-studio/ so playwright resolves:
 *   node render-one-hero.mjs <slug> [<slug> ...]
 */
import { readFileSync } from "node:fs";
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

const wanted = new Set(process.argv.slice(2));
if (wanted.size === 0) {
  console.error("Usage: node render-one-hero.mjs <slug> [<slug> ...]");
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

async function main() {
  const heroes = buildAllHeroes().filter((h) => wanted.has(h.slug));
  const found = new Set(heroes.map((h) => h.slug));
  for (const s of wanted) if (!found.has(s)) console.warn(`  ! no descriptor for "${s}" (needs ${s}/${s}.md)`);
  if (!heroes.length) process.exit(1);

  await mkdir(TMP, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2400, height: 1260 }, deviceScaleFactor: 1 });

  for (const post of heroes) {
    const outDir = join(CONTENT, post.slug, "images");
    await mkdir(outDir, { recursive: true });
    const tmpHtml = join(TMP, `${post.slug}.html`);
    await writeFile(tmpHtml, buildHeroHtml(post, { logoSvg: LOGO_SVG }), "utf8");
    await gotoReady(page, pathToFileURL(tmpHtml).href);
    await page.locator("#card").screenshot({ path: join(outDir, "hero.png") });
    console.log(`  rendered ${post.slug} (${post.archetype}/${post.palette}) -> images/hero.png`);
  }

  await browser.close();
  await rm(TMP, { recursive: true, force: true });
  console.log(`done: ${heroes.length} hero(es)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
