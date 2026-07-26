/**
 * Generates one folder per post under output/NNN-slug/ containing:
 *   - post.html     (1080x1080 branded card — open in a browser / render to PNG)
 *   - caption.txt   (the ready-to-paste caption + hashtags)
 *   - post.png      (added by render.mjs)
 * Plus output/gallery.html (a browsable dashboard with copy-caption buttons and
 * a "generate more" panel), INDEX.md and posts.json.
 *
 * Run:  node build.mjs                # all curated posts (100+)
 *       node build.mjs --count 150    # generate MORE (overflow composed on-brand)
 *       node build.mjs --shape portrait
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPosts, POSTS, ICP_NAMES } from "./content.mjs";
import { buildPostHtml, buildCaption, slugify } from "./card.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output");

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function main() {
  const count = Number(arg("--count", "")) || undefined;
  const shape = arg("--shape", "square");
  const fresh = process.argv.includes("--fresh");
  if (fresh) await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const posts = getPosts(count);
  const index = [];
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const id = String(i + 1).padStart(3, "0");
    const folder = `${id}-${slugify(post.headline) || post.icp}`;
    const dir = join(OUT, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "post.html"), buildPostHtml(post, shape), "utf8");
    await writeFile(join(dir, "caption.txt"), buildCaption(post), "utf8");
    index.push({
      id,
      folder,
      icp: post.icp,
      icpName: ICP_NAMES[post.icp] ?? "Kloudbean",
      type: post.type,
      platform: post.platform ?? "any",
      headline: post.headline.replace(/\n/g, " "),
      caption: buildCaption(post).trim(),
      extra: !!post.extra,
    });
  }

  await writeFile(join(OUT, "gallery.html"), gallery(index, { curated: POSTS.length, total: posts.length }), "utf8");
  await writeFile(join(OUT, "posts.json"), JSON.stringify(index, null, 2), "utf8");
  await writeFile(
    join(OUT, "INDEX.md"),
    [
      `# Kloudbean Social Studio — ${posts.length} posts`,
      "",
      "Open `gallery.html` to browse every post with a copy-caption button. Render images with `npm run render`.",
      "",
      "| # | Headline | Audience | Platform | Folder |",
      "|---|----------|----------|----------|--------|",
      ...index.map((r) => `| ${r.id} | ${r.headline} | ${r.icpName} | ${r.platform} | \`${r.folder}\` |`),
      "",
    ].join("\n"),
    "utf8",
  );

  const byIcp = index.reduce((m, r) => ((m[r.icpName] = (m[r.icpName] || 0) + 1), m), {});
  console.log(`Generated ${posts.length} posts → ${OUT}`);
  console.log(Object.entries(byIcp).map(([k, v]) => `  ${k}: ${v}`).join("\n"));
  console.log(`\nNext: "npm run setup" (once) then "npm run render" to make the PNGs, then open output/gallery.html.`);
}

/** The browsable "dashboard": grid of posts + copy buttons + generate-more panel. */
function gallery(index, { curated, total }) {
  const cards = index
    .map(
      (r) => `
    <figure class="card">
      <img src="./${r.folder}/post.png" alt="${esc(r.headline)}" loading="lazy"
        onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:'render pending — run npm run render'}))"/>
      <figcaption>
        <div class="row"><span class="badge">${esc(r.icpName)}</span><span class="muted">${esc(r.platform)} · ${esc(r.type)}</span></div>
        <textarea readonly>${esc(r.caption)}</textarea>
        <button class="copy" data-copy>Copy caption</button>
        <div class="muted small">#${r.id} · ${esc(r.folder)}${r.extra ? " · (generated)" : ""}</div>
      </figcaption>
    </figure>`,
    )
    .join("\n");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Kloudbean Social Studio — ${total} posts</title>
<style>
  :root{--bg:#0a0b16;--card:#12142400;--brand:#6c47ff;--fg:#eef;--muted:#9aa}
  *{box-sizing:border-box}
  body{margin:0;background:#0a0b16;color:var(--fg);font-family:-apple-system,Segoe UI,Roboto,sans-serif}
  header{padding:28px 32px;border-bottom:1px solid #23263a;position:sticky;top:0;background:#0a0b16ee;backdrop-filter:blur(6px);z-index:10}
  h1{margin:0 0 6px;font-size:24px}
  .sub{color:var(--muted);font-size:14px}
  .gen{margin-top:14px;background:#151830;border:1px solid #2a2e4a;border-radius:12px;padding:14px 16px;font-size:13px;color:#cdd}
  .gen code{background:#0a0b16;padding:2px 7px;border-radius:6px;color:#c4b5fd}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;padding:24px 32px}
  .card{background:#101226;border:1px solid #23263a;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
  .card img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:#05060f}
  .ph{width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;color:#889;font-size:13px;background:#0d0f20}
  figcaption{padding:12px 12px 14px;display:flex;flex-direction:column;gap:8px}
  .row{display:flex;align-items:center;gap:8px}
  .badge{background:#241b4d;color:#c4b5fd;font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px}
  .muted{color:var(--muted);font-size:12px}
  .small{font-size:11px}
  textarea{width:100%;height:96px;resize:vertical;background:#0a0b16;color:#dde;border:1px solid #23263a;border-radius:8px;padding:8px;font:inherit;font-size:12px;line-height:1.4}
  .copy{align-self:flex-start;background:linear-gradient(135deg,#4F1AF3,#6c47ff);color:#fff;border:0;border-radius:8px;padding:7px 14px;font-weight:600;cursor:pointer;font-size:13px}
  .copy.done{background:#256c3a}
</style></head>
<body>
  <header>
    <h1>Kloudbean Social Studio — ${total} posts</h1>
    <div class="sub">${curated} curated${total > curated ? ` + ${total - curated} generated` : ""} · image + ready-to-paste caption for each</div>
    <div class="gen"><b>Generate more:</b> from <code>social-studio/</code> run <code>node build.mjs --count ${total + 30}</code> then <code>npm run render</code>. Add curated posts in <code>content.mjs</code>; beyond the curated set, on-brand posts are composed automatically.</div>
  </header>
  <div class="grid">${cards}</div>
<script>
  document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{
    const ta=b.parentElement.querySelector('textarea');
    try{await navigator.clipboard.writeText(ta.value);}catch(e){ta.select();document.execCommand('copy');}
    const t=b.textContent;b.textContent='Copied ✓';b.classList.add('done');
    setTimeout(()=>{b.textContent=t;b.classList.remove('done');},1400);
  }));
</script>
</body></html>`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
