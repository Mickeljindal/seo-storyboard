/**
 * Standalone silo + internal-linking map for the content-studio corpus.
 *
 * Reads every article folder on disk (no engine DB, no ingestion needed):
 *   - cluster/silo   ← brief.md  ("Cluster N." or "Silo N (…)")
 *   - title          ← <title> / <h1>
 *   - internal links ← <a href="https://www.kloudbean.com/blog/<slug>/">
 *
 * Emits a self-contained, brand-styled silo-map.html:
 *   - summary stats (articles, links, orphans, dangling links)
 *   - an inline-SVG network map: 10 silo "islands", node size = inbound links,
 *     intra-silo edges in the silo colour, cross-silo edges faint
 *   - a per-silo legend + a cross-silo link matrix + drill-down article lists
 *
 * Run:  node build-silo-map.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

// 10 topical-authority clusters (mirrors src/lib/pillars.ts CLUSTERS).
const CLUSTERS = [
  { id: 1, name: "Deploy AI / Vibe-Coded Apps", short: "Deploy AI Apps" },
  { id: 2, name: "Self-Hosted Tools (n8n, Supabase, GitLab)", short: "Self-host" },
  { id: 3, name: "App Deployment Tutorials", short: "Deploy Stacks" },
  { id: 4, name: "Managed Cloud vs Competitors", short: "vs Competitors" },
  { id: 5, name: "Agency & Multi-App Hosting", short: "Agencies" },
  { id: 6, name: "WordPress & Frontend Hosting", short: "WordPress" },
  { id: 7, name: "Databases, Storage & S3", short: "Data" },
  { id: 8, name: "Pricing, Cost & SaaS Consolidation", short: "Pricing" },
  { id: 9, name: "Security, Scaling & Load Balancing", short: "Security/Scale" },
  { id: 10, name: "Enterprise & Data Residency (KSA)", short: "Enterprise" },
  { id: 0, name: "Uncategorised", short: "Uncategorised" },
];
const COLORS = {
  1: "#7C5CFF", 2: "#40B75F", 3: "#E4B32F", 4: "#FF6B6B", 5: "#4FC3F7",
  6: "#FF9F43", 7: "#26C6DA", 8: "#EC7FD3", 9: "#9CCC65", 10: "#B39DFF", 0: "#5b6b78",
};
const clusterMeta = (id) => CLUSTERS.find((c) => c.id === id) ?? CLUSTERS.find((c) => c.id === 0);

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Fallback: infer a cluster from the slug when the brief has no numbered silo.
function inferCluster(slug) {
  const s = slug.toLowerCase();
  const rules = [
    [/connect-|prisma|drizzle|sequelize|typeorm|mongoose|sqlalchemy|pg_dump|mysqldump/, 7],
    [/-vs-|alternative|cloudways|vercel|render|railway|heroku|netlify|bluehost|siteground|hostinger|kinsta|wp-?engine/, 4],
    [/lovable|bolt|cursor|claude|replit|v0|vibe|ai-built|ai-app|chatgpt|windsurf/, 1],
    [/n8n|supabase|gitlab|ghost|plausible|self-?host|open-?webui|penpot|postiz/, 2],
    [/wordpress|woocommerce|wp-|elementor/, 6],
    [/next|nuxt|node|laravel|django|flask|fastapi|express|rails|fastify|nestjs|vue|react|angular|svelte|remix|astro|golang|deploy-/, 3],
    [/agency|reseller|multi-app|white-?label|client-/, 5],
    [/pricing|cost|cheap|price|budget/, 8],
    [/security|ssl|firewall|scal|load-?balanc|backup|ddos|waf|fail2ban/, 9],
    [/enterprise|compliance|nca|dammam|ksa|residency|gov|hipaa|gdpr|soc-?2|audit/, 10],
    [/database|postgres|mysql|mongo|redis|elasticsearch|mariadb|s3|storage|celery|bucket/, 7],
  ];
  for (const [re, id] of rules) if (re.test(s)) return id;
  return 0;
}

// ── Scan the corpus ─────────────────────────────────────────────────────────
const entries = readdirSync(ROOT).filter((n) => {
  if (n === "assets" || n.startsWith(".")) return false;
  const p = join(ROOT, n);
  return statSync(p).isDirectory() && existsSync(join(p, `${n}.html`));
});

const articles = new Map(); // slug -> { slug, cluster, title, out:Set }
for (const slug of entries) {
  const html = readFileSync(join(ROOT, slug, `${slug}.html`), "utf8");
  let cluster = 0;
  const briefPath = join(ROOT, slug, "brief.md");
  const brief = existsSync(briefPath) ? readFileSync(briefPath, "utf8") : "";
  const m = brief.match(/(?:cluster|silo)\D{0,4}(\d{1,2})/i);
  if (m && +m[1] >= 1 && +m[1] <= 10) cluster = +m[1];
  else cluster = inferCluster(slug);
  let title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  if (!title) title = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
  title = title.replace(/\s*[—|]\s*Kloudbean.*$/i, "").trim() || slug;
  const out = new Set();
  const re = /href="https:\/\/www\.kloudbean\.com\/blog\/([a-z0-9-]+)\/?"/gi;
  let mm;
  while ((mm = re.exec(html))) out.add(mm[1]);
  out.delete(slug); // never self-link
  articles.set(slug, { slug, cluster, title, out });
}

// ── Build the internal link graph (corpus → corpus) ─────────────────────────
const slugs = [...articles.keys()];
const inDeg = new Map(slugs.map((s) => [s, 0]));
const edges = []; // { src, tgt, cross }
let danglingLinks = 0; // links to slugs not in the corpus (pillar pages / not-yet-written)
const seenPair = new Set();
for (const a of articles.values()) {
  for (const tgt of a.out) {
    if (!articles.has(tgt)) { danglingLinks++; continue; }
    const key = a.slug + ">" + tgt;
    if (seenPair.has(key)) continue;
    seenPair.add(key);
    inDeg.set(tgt, inDeg.get(tgt) + 1);
    edges.push({ src: a.slug, tgt, cross: articles.get(tgt).cluster !== a.cluster });
  }
}
const internalLinks = edges.length;
const maxIn = Math.max(1, ...slugs.map((s) => inDeg.get(s)));
const orphans = slugs.filter((s) => inDeg.get(s) === 0);

// group by cluster
const byCluster = new Map(CLUSTERS.map((c) => [c.id, []]));
for (const s of slugs) byCluster.get(articles.get(s).cluster)?.push(s) ?? byCluster.set(articles.get(s).cluster, [s]);
const usedClusters = CLUSTERS.filter((c) => (byCluster.get(c.id) || []).length > 0);

// ── Layout: silo "islands" on a grid, nodes on a golden-angle spiral ─────────
const W = 1800, H = 1500, cols = 4;
const rows = Math.ceil(usedClusters.length / cols);
const cellW = W / cols, cellH = H / rows;
const pos = new Map(); // slug -> {x,y,r}
usedClusters.forEach((c, idx) => {
  const col = idx % cols, row = Math.floor(idx / cols);
  const cx = col * cellW + cellW / 2, cy = row * cellH + cellH / 2 + 18;
  const list = (byCluster.get(c.id) || []).slice().sort((a, b) => inDeg.get(b) - inDeg.get(a));
  const islandR = Math.min(cellW, cellH) * 0.40;
  const n = list.length;
  list.forEach((s, i) => {
    const rr = islandR * Math.sqrt((i + 0.5) / n) * 0.94;
    const th = i * 2.399963229; // golden angle
    const nodeR = 3 + 8 * Math.sqrt(inDeg.get(s) / maxIn);
    pos.set(s, { x: cx + rr * Math.cos(th), y: cy + rr * Math.sin(th), r: nodeR });
  });
  c._cx = cx; c._cy = cy; c._r = islandR;
});

// ── SVG ──────────────────────────────────────────────────────────────────────
const svgEdges = edges.map((e) => {
  const a = pos.get(e.src), b = pos.get(e.tgt);
  if (!a || !b) return "";
  const col = e.cross ? "#8aa0c8" : COLORS[articles.get(e.src).cluster];
  const op = e.cross ? 0.06 : 0.20;
  return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${col}" stroke-width="${e.cross ? 0.6 : 1}" stroke-opacity="${op}"/>`;
}).join("");

const svgNodes = slugs.map((s) => {
  const p = pos.get(s), a = articles.get(s);
  const col = COLORS[a.cluster];
  const orphan = inDeg.get(s) === 0;
  return `<a href="https://www.kloudbean.com/blog/${s}/" target="_blank"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${col}" fill-opacity="${orphan ? 0.28 : 0.92}" stroke="${orphan ? "#ff6b6b" : "#0b1c40"}" stroke-width="${orphan ? 1.4 : 0.8}"><title>${esc(a.title)}\n${clusterMeta(a.cluster).short} · in:${inDeg.get(s)} · out:${a.out.size}${orphan ? " · ORPHAN" : ""}</title></circle></a>`;
}).join("");

const svgLabels = usedClusters.map((c) => {
  const count = (byCluster.get(c.id) || []).length;
  return `<g><circle cx="${c._cx.toFixed(1)}" cy="${(c._cy - c._r - 26).toFixed(1)}" r="5" fill="${COLORS[c.id]}"/><text x="${(c._cx + 10).toFixed(1)}" y="${(c._cy - c._r - 22).toFixed(1)}" fill="#e8ecf8" font-size="18" font-weight="700" font-family="Poppins,sans-serif">${esc(c.short)} <tspan fill="#8aa0c8" font-weight="500">(${count})</tspan></text></g>`;
}).join("");

// ── Cross-silo link matrix (source row → target col) ─────────────────────────
const mtx = {};
for (const e of edges) {
  const sc = articles.get(e.src).cluster, tc = articles.get(e.tgt).cluster;
  mtx[sc] = mtx[sc] || {};
  mtx[sc][tc] = (mtx[sc][tc] || 0) + 1;
}
const matrixRows = usedClusters.map((rc) => {
  const cells = usedClusters.map((cc) => {
    const v = (mtx[rc.id] || {})[cc.id] || 0;
    const bg = v === 0 ? "transparent" : `${COLORS[rc.id]}${v >= 10 ? "cc" : v >= 4 ? "88" : "44"}`;
    return `<td style="background:${bg};text-align:center;color:${v ? "#fff" : "#4a5a78"}">${v || "·"}</td>`;
  }).join("");
  return `<tr><th style="text-align:left;white-space:nowrap;color:${COLORS[rc.id]}">${esc(rc.short)}</th>${cells}</tr>`;
}).join("");
const matrixHead = `<tr><th></th>${usedClusters.map((c) => `<th style="color:${COLORS[c.id]};font-size:11px">${esc(c.short)}</th>`).join("")}</tr>`;

// ── Per-silo drill-down ───────────────────────────────────────────────────────
const details = usedClusters.map((c) => {
  const list = (byCluster.get(c.id) || []).slice().sort((a, b) => inDeg.get(b) - inDeg.get(a));
  const rows2 = list.map((s) => {
    const a = articles.get(s), orphan = inDeg.get(s) === 0;
    return `<tr${orphan ? ' class="orphan"' : ""}><td><a href="https://www.kloudbean.com/blog/${s}/" target="_blank">${esc(a.title)}</a><div class="slug">${esc(s)}</div></td><td class="num">${inDeg.get(s)}</td><td class="num">${a.out.size}</td><td>${orphan ? '<span class="badge">orphan</span>' : ""}</td></tr>`;
  }).join("");
  const orphanCount = list.filter((s) => inDeg.get(s) === 0).length;
  return `<details><summary><span class="dot" style="background:${COLORS[c.id]}"></span> ${esc(c.name)} <span class="muted">— ${list.length} articles${orphanCount ? `, ${orphanCount} orphan` : ""}</span></summary>
    <table class="list"><thead><tr><th>Article</th><th class="num">In</th><th class="num">Out</th><th></th></tr></thead><tbody>${rows2}</tbody></table></details>`;
}).join("");

const gen = new Date().toISOString().slice(0, 10);
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<title>Kloudbean content-studio — silo & internal-linking map</title>
<style>
  *{box-sizing:border-box} body{margin:0;background:#000f27;color:#e8ecf8;font-family:Poppins,-apple-system,sans-serif;padding:28px 32px 60px}
  h1{font-size:26px;margin:0 0 4px} .sub{color:#8aa0c8;margin:0 0 22px;font-size:14px}
  .stats{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:24px}
  .stat{background:#0b1c40;border:1px solid #ffffff1a;border-radius:12px;padding:14px 18px;min-width:130px}
  .stat b{display:block;font-size:28px;font-weight:700} .stat span{color:#8aa0c8;font-size:12px}
  .card{background:#08152f;border:1px solid #ffffff14;border-radius:16px;padding:16px;margin-bottom:24px}
  h2{font-size:16px;margin:0 0 12px;color:#cdd6f4}
  svg{width:100%;height:auto;display:block;background:radial-gradient(120% 90% at 80% 0%,#0a1a3a,#000f27 70%);border-radius:12px}
  a{color:#9cc0ff;text-decoration:none} a:hover{text-decoration:underline}
  table{border-collapse:collapse;width:100%;font-size:12px}
  .matrix td,.matrix th{border:1px solid #ffffff10;padding:6px 8px;font-size:12px}
  .muted,.slug{color:#8aa0c8} .slug{font-size:11px} .num{text-align:center;color:#aeb6d4;width:52px}
  details{background:#0b1c40;border:1px solid #ffffff14;border-radius:10px;margin-bottom:8px;padding:6px 12px}
  summary{cursor:pointer;padding:6px 2px;font-weight:600} .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}
  table.list td,table.list th{border-bottom:1px solid #ffffff0d;padding:7px 8px;text-align:left;vertical-align:top}
  tr.orphan td{background:#ff6b6b12} .badge{background:#ff6b6b28;color:#ff9a9a;border:1px solid #ff6b6b55;border-radius:99px;padding:1px 8px;font-size:11px}
  .legend{display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:12px;font-size:12px;color:#aeb6d4}
  .legend i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:middle}
</style></head><body>
  <h1>Content-studio silo &amp; internal-linking map</h1>
  <p class="sub">${slugs.length} articles on disk · generated ${gen} · nodes sized by inbound internal links · red-ringed = orphan (0 inbound). Click any node to open its intended URL.</p>

  <div class="stats">
    <div class="stat"><b>${slugs.length}</b><span>articles</span></div>
    <div class="stat"><b>${usedClusters.length}</b><span>silos used</span></div>
    <div class="stat"><b>${internalLinks}</b><span>internal links (corpus→corpus)</span></div>
    <div class="stat"><b>${edges.filter((e) => e.cross).length}</b><span>cross-silo links</span></div>
    <div class="stat"><b>${orphans.length}</b><span>orphan articles</span></div>
    <div class="stat"><b>${danglingLinks}</b><span>links to non-corpus slugs</span></div>
  </div>

  <div class="card">
    <h2>Silo map</h2>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Article silo and internal linking network">
      <g>${svgEdges}</g>
      <g>${svgNodes}</g>
      <g>${svgLabels}</g>
    </svg>
    <div class="legend">${usedClusters.map((c) => `<span><i style="background:${COLORS[c.id]}"></i>${esc(c.short)}</span>`).join("")}<span><i style="background:#0b1c40;border:1.4px solid #ff6b6b"></i>orphan</span></div>
  </div>

  <div class="card">
    <h2>Cross-silo link matrix <span class="muted" style="font-weight:400;font-size:12px">(row links to column — diagonal = within-silo)</span></h2>
    <table class="matrix">${matrixHead}${matrixRows}</table>
  </div>

  <div class="card">
    <h2>Articles by silo <span class="muted" style="font-weight:400;font-size:12px">(sorted by inbound links; expand a silo)</span></h2>
    ${details}
  </div>
</body></html>`;

const outPath = join(ROOT, "silo-map.html");
writeFileSync(outPath, html, "utf8");

console.log(`Silo map → ${outPath}`);
console.log(`  articles: ${slugs.length} | internal links: ${internalLinks} (cross-silo: ${edges.filter((e) => e.cross).length}) | orphans: ${orphans.length} | dangling: ${danglingLinks}`);
console.log(`  per silo: ${usedClusters.map((c) => `${c.short}:${(byCluster.get(c.id) || []).length}`).join("  ")}`);
if (orphans.length) console.log(`  orphans: ${orphans.slice(0, 12).join(", ")}${orphans.length > 12 ? ` … +${orphans.length - 12}` : ""}`);
