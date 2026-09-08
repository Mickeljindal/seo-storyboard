// Build a review page of every generated article image, grouped by article,
// with the editor's original slot description next to what was produced.
// Run: node scripts/gen-image-review.mjs [slug ...]
import fs from "node:fs";
import path from "node:path";

const ROOT = "content-studio";
let slugs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!slugs.length) {
  slugs = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && d.name !== "assets")
    .map((d) => d.name)
    .filter((s) => fs.existsSync(path.join(ROOT, s, "images")) &&
      fs.readdirSync(path.join(ROOT, s, "images")).some((f) => f.startsWith("gen-")));
}

let body = "";
let count = 0;
for (const slug of slugs) {
  const htmlPath = path.join(ROOT, slug, `${slug}.html`);
  if (!fs.existsSync(htmlPath)) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  const figs = [...html.matchAll(/<figure>\s*<img src="(images\/gen-[^"]+)" alt="([^"]*)">\s*<figcaption>([\s\S]*?)<\/figcaption>/g)];
  if (!figs.length) continue;
  const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? slug;
  body += `<h2>${title}</h2><p class="slug">${slug}</p>`;
  for (const [, src, alt, cap] of figs) {
    count++;
    const type = src.match(/gen-\d+-([a-z]+)\.png/)?.[1] ?? "";
    body += `<div class="row">
      <div class="meta"><span class="tag">${type}</span>
        <p class="d"><b>The editor asked for:</b><br>${alt}</p>
        <p class="c"><b>Caption used:</b><br>${cap}</p></div>
      <div class="img"><img src="${slug}/${src}" alt=""></div>
    </div>`;
  }
}

const out = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Generated article images</title><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#eef1f7;color:#1c2536;margin:0;padding:30px;line-height:1.6}
h1{font-size:23px;margin:0 0 4px}.sub{color:#64748b;margin:0 0 26px}
h2{font-size:17px;margin:34px 0 2px;max-width:1200px;margin-left:auto;margin-right:auto}
.slug{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#64748b;max-width:1200px;margin:0 auto 12px}
.row{display:grid;grid-template-columns:300px 1fr;gap:18px;max-width:1200px;margin:0 auto 18px;background:#fff;border:1px solid #e6e9f2;border-radius:14px;padding:16px;align-items:start}
.tag{display:inline-block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;padding:3px 9px;border-radius:999px;background:#ede9ff;color:#4F1AF3;margin-bottom:10px}
.d,.c{font-size:12.5px;color:#475569;margin:0 0 10px}.d b,.c b{color:#334155}
.img img{width:100%;border:1px solid #e6e9f2;border-radius:10px;display:block}
</style></head><body>
<h1>Generated article images</h1>
<p class="sub">${count} images across ${slugs.length} article(s). Left = the editor's original slot description. Right = what the generator produced. All rendered from HTML/CSS+SVG at retina scale, no image API.</p>
${body}</body></html>`;

fs.writeFileSync(`${ROOT}/_generated-images-review.html`, out);
console.log(`wrote ${ROOT}/_generated-images-review.html (${count} images)`);
