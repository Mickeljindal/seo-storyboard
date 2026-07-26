/**
 * Renders each post's post.html to post.png (one screenshot of the #card).
 *
 * CLI:
 *   node render.mjs                    # render all
 *   node render.mjs --only 001,005     # by number prefix
 *   node render.mjs --skip-existing    # resume
 * Requires: playwright (+ chromium) installed  ->  npm run setup
 */
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output");

async function main() {
  const args = process.argv.slice(2);
  const onlyArg = args.indexOf("--only");
  const only = onlyArg >= 0 ? new Set(args[onlyArg + 1].split(",").map((s) => s.trim())) : null;
  const skipExisting = args.includes("--skip-existing");

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("Playwright not installed. From social-studio/ run:  npm run setup");
    process.exit(1);
  }

  const dirs = (await readdir(OUT, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => !only || only.has(n.slice(0, 3)))
    .sort();

  if (!dirs.length) {
    console.error("No post folders. Run `node build.mjs` first.");
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 1 });
  let ok = 0;
  for (const name of dirs) {
    const html = join(OUT, name, "post.html");
    const png = join(OUT, name, "post.png");
    if (!existsSync(html)) continue;
    if (skipExisting && existsSync(png)) {
      ok++;
      continue;
    }
    await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const card = page.locator("#card");
    await card.screenshot({ path: png });
    ok++;
    if (ok % 20 === 0) process.stdout.write(`  …${ok}/${dirs.length}\n`);
  }
  await browser.close();
  console.log(`✓ Rendered ${ok}/${dirs.length} post PNGs → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
