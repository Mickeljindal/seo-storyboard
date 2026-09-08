// Generate a visual review page from screenshot-map.json: every synthetic slot
// next to its full REAL step sequence, plus framework + DB-engine overrides.
// Run: node scripts/gen-screenshot-review.mjs
import fs from "node:fs";

const OUT = "content-studio/assets/console-real";
const map = JSON.parse(fs.readFileSync(`${OUT}/screenshot-map.json`, "utf8"));
const real = (rel) => rel.replace(/^assets\//, "assets/"); // page lives in content-studio/
const synth = (slot) => `assets/console/${slot}.png`;

const seqHtml = (steps) =>
  steps
    .map(
      (s, i) =>
        `<figure><img src="${real(s.local)}" alt="${s.base}"><figcaption><b>${i + 1}.</b> ${s.caption}</figcaption></figure>`,
    )
    .join("");

const block = (title, slotForSynth, entry) => `
  <div class="row">
    <div class="cell left"><span class="t old">synthetic (1 image)</span><h3>${title}</h3>
      <img src="${synth(slotForSynth)}" alt="old"></div>
    <div class="cell"><span class="t new">real sequence (${entry.steps.length})</span><h3>${title}</h3>
      <div class="seq">${seqHtml(entry.steps)}</div>
      <p class="note">lead (used for passing mentions): <b>${entry.lead?.base}</b></p></div>
  </div>`;

let slots = "";
for (const [slot, entry] of Object.entries(map.slots)) slots += block(slot, slot, entry);
for (const slot of map.noMatch)
  slots += `<div class="row"><div class="cell left"><span class="t old">synthetic</span><h3>${slot}</h3><img src="${synth(slot)}" alt="old"></div><div class="cell"><span class="t none">no support doc — kept as-is</span><h3>${slot}</h3><div class="none">No matching Kloudbean doc screenshot. Left untouched. Flag if you have shots.</div></div></div>`;

let fw = "";
for (const [name, over] of Object.entries(map.frameworks)) {
  fw += `<h2 class="fwh">${name}</h2>`;
  for (const [slot, entry] of Object.entries(over)) fw += block(`${name} · ${slot}`, slot, entry);
}
let db = "";
for (const [engine, over] of Object.entries(map.dbEngines))
  db += block(`launch-database · ${engine}`, "launch-database", over["launch-database"]);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Screenshot map review (sequences)</title><style>
body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f6f7fb;color:#1c2536;margin:0;padding:28px}
h1{font-size:22px;margin:0 0 4px}.sub{color:#64748b;margin:0 0 24px}
h2.fwh{margin:34px auto 8px;font-size:16px;color:#4F1AF3;text-transform:capitalize;max-width:1180px}
.row{display:grid;grid-template-columns:340px 1fr;gap:16px;max-width:1180px;margin:0 auto 16px;align-items:start}
.cell{background:#fff;border:1px solid #e6e9f2;border-radius:12px;padding:14px}
.left img{position:sticky;top:14px}
h3{font-size:13px;margin:4px 0 10px;color:#334155}
img{width:100%;border:1px solid #e6e9f2;border-radius:8px;display:block;background:#fff}
.seq{display:grid;grid-template-columns:1fr 1fr;gap:12px}
figure{margin:0}figcaption{font-size:11px;color:#475569;margin-top:5px;line-height:1.4}
.t{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:999px;margin-bottom:8px}
.old{background:#fee2e2;color:#b91c1c}.new{background:#dcfce7;color:#15803d}.none{background:#fef9c3;color:#854d0e}
.note{font-size:11px;color:#64748b;margin:10px 0 0}
.none{padding:26px;text-align:center;color:#94a3b8;border:1px dashed #cbd5e1;border-radius:8px;font-size:13px}
.legend{max-width:1180px;margin:0 auto 20px;background:#fff;border:1px solid #e6e9f2;border-radius:12px;padding:14px 18px;font-size:14px;line-height:1.6}
</style></head><body>
<h1>Screenshot map — real dashboard step sequences</h1>
<p class="sub">Left = the single fake render. Right = the full real Kloudbean dashboard flow from the support docs, in order, with captions. Generated ${new Date().toISOString().slice(0, 10)}.</p>
<div class="legend"><b>Each slot now maps to a step sequence, not one navigation shot.</b> For a deep-dive article on a feature, the blog shows the whole flow; for a passing mention it uses the single <b>lead</b> image. 3 slots have no doc match (staging, cloudflare, cron-jobs) and are left as-is. <b>add-server</b>/<b>env-vars</b> get framework sequences; <b>launch-database</b> gets per-engine sequences.</div>
<h2 class="fwh" style="color:#0f172a">Generic slot sequences</h2>
${slots}
<h2 class="fwh" style="color:#0f172a">Framework overrides</h2>
${fw}
<h2 class="fwh" style="color:#0f172a">Database-engine overrides</h2>
${db}
</body></html>`;

fs.writeFileSync("content-studio/_screenshot-map-review.html", html);
console.log("wrote content-studio/_screenshot-map-review.html");
