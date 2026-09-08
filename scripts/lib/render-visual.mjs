// Rasterize a visual template into a PNG using headless Chromium.
//
// One browser is reused for a whole batch: launching Chromium costs about a
// second, which would dominate the run when rendering hundreds of images.
import fs from "node:fs";
import path from "node:path";
import { TEMPLATES } from "./visual-templates.mjs";

let _browser = null;

export async function getBrowser() {
  if (_browser) return _browser;
  const { chromium } = await import("playwright");
  _browser = await chromium.launch();
  return _browser;
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

/**
 * Render one spec to a PNG.
 * @param {'terminal'|'comparison'|'panel'|'graph'|'flow'} type
 * @param {object} spec  content for the template
 * @param {string} outPath  where to write the .png
 */
export async function renderVisual(type, spec, outPath) {
  const tpl = TEMPLATES[type];
  if (!tpl) throw new Error(`unknown visual type: ${type}`);
  const html = tpl(spec);

  const browser = await getBrowser();
  // deviceScaleFactor 2 = retina-sharp text, which is the whole point of
  // rendering these rather than generating them with an image model.
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "load" });
  const el = await page.$("body");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await el.screenshot({ path: outPath });
  await page.close();
  return outPath;
}
