// Export the company profile deck to a print-ready PDF.
//
// Each .slide is exactly 1280x720 (16:9), so the PDF is generated at that page
// size rather than A4: the deck is read on screen and projected, and forcing it
// into A4 would letterbox every page.
//
// Run: node scripts/export-company-profile.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const SRC = "company-profile/kloudbean-company-profile.html";
const OUT = "company-profile/Kloudbean-Company-Profile-2026.pdf";

if (!fs.existsSync(SRC)) {
  console.error(`missing ${SRC}`);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

// file:// so the local brand/, logos/ and partners/ assets resolve.
await page.goto(`file://${path.resolve(SRC)}`, { waitUntil: "load" });

// Wait for every logo to finish decoding, otherwise a slow tile renders blank.
await page.evaluate(async () => {
  const imgs = [...document.images];
  await Promise.all(
    imgs.map((i) =>
      i.complete && i.naturalWidth > 0
        ? Promise.resolve()
        : new Promise((res) => {
            i.addEventListener("load", res, { once: true });
            i.addEventListener("error", res, { once: true });
          }),
    ),
  );
  if (document.fonts?.ready) await document.fonts.ready;
});
await page.waitForTimeout(700);

const slides = await page.locator("section.slide").count();

// Overflow guard. A slide is a fixed 1280x720 box, so content that runs past it
// is silently CLIPPED in the PDF rather than reflowed, and the piece that gets
// cut is whatever sits at the bottom. On the compliance slide that was the
// non-certification disclaimer, which is the one line that must not vanish.
const overflow = await page.evaluate(() =>
  [...document.querySelectorAll("section.slide")]
    .map((s, i) => ({ i: i + 1, over: Math.round(s.scrollHeight - s.clientHeight) }))
    .filter((x) => x.over > 1),
);
if (overflow.length) {
  console.warn("\n⚠ CONTENT CLIPPED on these slides (scrollHeight exceeds 720px):");
  for (const o of overflow) console.warn(`   slide ${o.i}: ${o.over}px too tall`);
  console.warn("   Trim the copy or reduce spacing; the PDF will cut the bottom.\n");
} else {
  console.log("no overflow: every slide fits 1280x720");
}

// Print styles: one slide per page, no shadows or rounded corners bleeding into
// the page edge, and backgrounds preserved.
await page.addStyleTag({
  content: `
    @page { size: 1280px 720px; margin: 0; }
    html, body { margin:0 !important; padding:0 !important; background:#00081a !important; }
    body > *:not(.deck):not(section) { display:none !important; }
    .deck, main, .wrap { display:block !important; gap:0 !important; padding:0 !important; margin:0 !important; }
    section.slide {
      width:1280px !important; height:720px !important;
      margin:0 !important; border-radius:0 !important; border:0 !important;
      box-shadow:none !important;
      break-inside:avoid; page-break-inside:avoid;
      break-after:page; page-break-after:always;
    }
    section.slide:last-of-type { break-after:auto; page-break-after:auto; }
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  `,
});

await page.pdf({
  path: OUT,
  width: "1280px",
  height: "720px",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
  preferCSSPageSize: true,
});

await browser.close();

const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`exported ${slides} slides -> ${OUT} (${kb} KB)`);
