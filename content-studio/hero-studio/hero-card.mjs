/**
 * Kloudbean blog HERO card generator (2400x1260).
 *
 * ONE shared brand shell (navy base, radial glows, faint grid, vignette, logo
 * top-left, eyebrow+rule, headline, subhead, @kloudbean / kloudbean.com footer)
 * with SWAPPABLE layout ARCHETYPES + PALETTES + topical GLYPHS, so no two
 * articles share a visual. Pure string builder, no dependencies. The render
 * runner passes in the inlined Kloudbean logo SVG.
 *
 * Brand-approved palette only (kloudbean.com/brand-kit): Deep Navy #000f27
 * foundation, Primary Purple #4F1AF3, Success Green #40B75F, plus tasteful
 * on-navy accent hues. Poppins typeface.
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** On-navy palettes: accent = legible text/line hue, glow/glow2 = background wash. */
export const PALETTES = {
  violet: { accent: "#8f7bff", glow: "#4F1AF3", glow2: "#6c47ff" },
  green: { accent: "#54c878", glow: "#40B75F", glow2: "#1f8f49" },
  teal: { accent: "#2dd4bf", glow: "#0ea5a3", glow2: "#0e7490" },
  blue: { accent: "#5a92ff", glow: "#2563eb", glow2: "#1e40af" },
  magenta: { accent: "#f472b6", glow: "#db2777", glow2: "#9d174d" },
  amber: { accent: "#eec14a", glow: "#c98a1e", glow2: "#8a5a12" },
  maroon: { accent: "#f2727b", glow: "#c02636", glow2: "#7f1d1d" },
  indigo: { accent: "#9a8cff", glow: "#6d28d9", glow2: "#4c1d95" },
};

/** Single-stroke line glyphs (24x24 viewBox) used as motif/texture. */
export function glyph(name) {
  const g = {
    backup:
      '<path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z"/><path d="M4 7v10c0 1.7 3.6 3 8 3 1.4 0 2.8-.14 4-.4M20 7v5"/><path d="M17 15l3 3 3-3M20 18v-6"/>',
    database:
      '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    terminal:
      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12.5 15H17"/>',
    compare: '<rect x="4" y="10" width="6" height="11" rx="1"/><rect x="14" y="4" width="6" height="17" rx="1"/>',
    shield: '<path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3Z"/><path d="M9.5 12l1.8 1.8L15 10"/>',
    cost: '<path d="M4 20V10M9 20V5M14 20v-7M19 20V8"/>',
    bot: '<rect x="5" y="8" width="14" height="10" rx="3"/><path d="M12 8V4M9 3.5h6"/><circle cx="9.5" cy="13" r="1.1"/><circle cx="14.5" cy="13" r="1.1"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5 3.75 3.75 0 0 1 17.5 18Z"/>',
    network:
      '<circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="19" r="2.4"/><circle cx="19" cy="19" r="2.4"/><path d="M12 7.4 6.4 16.6M12 7.4l5.6 9.2M7.4 19h9.2"/>',
    scale: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    ssl: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/>',
    migrate: '<path d="M3 12h13M12 7l5 5-5 5"/><path d="M19 5v14"/>',
    speed: '<path d="M4 15a8 8 0 0 1 16 0"/><path d="M12 15l4-4"/><circle cx="12" cy="15" r="1.4"/>',
    container: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    wordpress: '<circle cx="12" cy="12" r="9"/><path d="M4 9h5l2.2 7 2-6-1-1h3l2.4 7 2-7"/>',
    code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12"/>',
    generic: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
  };
  return g[name] || g.generic;
}

/** Shared background + logo + eyebrow + footer wrapper. `inner` is the body. */
function shell({ p, logoSvg, eyebrow, motif, layoutClass, body, glowPos = "78% 16%" }) {
  const hl = ""; // reserved
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#000f27}
  #card{position:relative;width:2400px;height:1260px;overflow:hidden;background:#000f27;
    font-family:"Poppins",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff}
  .g1{position:absolute;width:1500px;height:1500px;border-radius:50%;
    background:radial-gradient(closest-side, ${p.glow}55, transparent 70%);filter:blur(30px);
    right:-360px;top:-520px}
  .g2{position:absolute;width:1300px;height:1300px;border-radius:50%;
    background:radial-gradient(closest-side, ${p.glow2}44, transparent 70%);filter:blur(30px);
    left:-420px;bottom:-560px}
  .grid{position:absolute;inset:0;opacity:.5;
    background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);
    background-size:96px 96px;
    -webkit-mask-image:radial-gradient(120% 90% at ${glowPos}, #000 18%, transparent 74%);
    mask-image:radial-gradient(120% 90% at ${glowPos}, #000 18%, transparent 74%)}
  .vign{position:absolute;inset:0;box-shadow:inset 0 0 460px 120px rgba(0,5,18,.55)}
  .cnr{position:absolute;right:-120px;bottom:-150px;width:880px;height:880px;color:#fff;opacity:.05}
  .cnr svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1;stroke-linecap:round;stroke-linejoin:round}
  .pad{position:absolute;inset:0;padding:150px 168px;display:flex;flex-direction:column}
  .top{display:flex;align-items:center;gap:26px;z-index:3}
  .logo svg{height:76px;width:auto;display:block}
  .eyebrow{display:flex;align-items:center;gap:24px;color:${p.accent};font-weight:600;font-size:38px;
    letter-spacing:.16em;text-transform:uppercase;margin-bottom:38px}
  .eyebrow .rule{width:74px;height:5px;background:${p.accent};border-radius:5px}
  h1{font-weight:700;line-height:1.05;letter-spacing:-.02em;color:#fff;text-wrap:balance}
  .sub{margin-top:40px;font-size:46px;line-height:1.4;color:#aeb6d4;font-weight:400}
  .foot{display:flex;align-items:center;gap:20px;padding-top:40px;border-top:1px solid #ffffff20;z-index:3}
  .handle{font-size:40px;font-weight:500;color:#cdd6f4}
  .url{margin-left:auto;display:flex;align-items:center;gap:16px;font-size:40px;font-weight:600;color:#fff}
  .url .arw{color:${p.accent}}

  /* layout: left text + right visual */
  .lr{display:flex;flex:1;align-items:center;gap:90px;margin:36px 0}
  .lr .txt{flex:1;min-width:0}
  .lr .vis{width:900px;flex:none;display:flex;align-items:center;justify-content:center}
  /* layout: centered */
  .ctr{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
  .ctr .sub{max-width:1500px}
  /* layout: text top + bottom strip */
  .tb{flex:1;display:flex;flex-direction:column;justify-content:center;margin:24px 0}

  /* visual: terminal */
  .term{width:100%;background:#0a1430;border:1px solid #24345f;border-radius:26px;overflow:hidden;box-shadow:0 40px 90px -30px #00000088}
  .term .bar{display:flex;align-items:center;gap:14px;padding:26px 30px;background:#0d1838;border-bottom:1px solid #24345f}
  .term .bar i{width:20px;height:20px;border-radius:50%;display:block}
  .term .name{margin-left:16px;color:#7f8db5;font:500 28px "JetBrains Mono",monospace}
  .term pre{margin:0;padding:38px 40px;font:500 34px/1.62 "JetBrains Mono",monospace;color:#d7e0ff}
  .term .c{color:#6b7aa8}.term .g{color:${p.accent}}.term .w{color:#fff}
  /* visual: stat card */
  .stat{width:100%;background:linear-gradient(160deg,#0c1836,#0a1430);border:1px solid #24345f;border-radius:32px;
    padding:96px 60px;text-align:center;box-shadow:0 40px 90px -30px #00000088}
  .stat .big{font-weight:800;font-size:320px;line-height:.9;letter-spacing:-.04em;color:${p.accent}}
  .stat .lab{margin-top:28px;font-size:44px;color:#cdd6f4;font-weight:500}
  /* visual: versus */
  .vs{width:100%;display:flex;flex-direction:column;gap:26px;position:relative}
  .vs .row{display:flex;align-items:center;gap:26px;background:#0b1531;border:1px solid #24345f;border-radius:24px;padding:40px 44px}
  .vs .row.hot{border-color:${p.accent};background:linear-gradient(120deg,#111c3f,#0b1531)}
  .vs .tick{width:56px;height:56px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:${p.accent}22;color:${p.accent};font-size:34px;font-weight:700}
  .vs .nm{font-size:46px;font-weight:600;color:#fff}
  .vs .nm small{display:block;font-size:30px;font-weight:400;color:#8f9bc4;margin-top:4px}
  .vs .pill{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#000f27;border:1px solid ${p.accent};
    color:${p.accent};font-weight:700;font-size:34px;padding:14px 30px;border-radius:999px}
  /* visual: checklist */
  .chk{width:100%;background:#0b1531;border:1px solid #24345f;border-radius:32px;padding:64px 60px;box-shadow:0 40px 90px -30px #00000088}
  .chk .item{display:flex;align-items:center;gap:32px;padding:30px 0;border-bottom:1px solid #ffffff12;font-size:46px;color:#e7ecff;font-weight:500}
  .chk .item:last-child{border-bottom:0}
  .chk .tick{width:60px;height:60px;flex:none;border-radius:16px;background:${p.accent}22;color:${p.accent};
    display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:800}
  /* visual: bottom flow strip */
  .flow{display:flex;align-items:stretch;gap:0;margin-top:20px}
  .flow .node{flex:1;background:#0b1531;border:1px solid #24345f;border-radius:24px;padding:44px 40px}
  .flow .node .k{color:${p.accent};font:600 30px/1 "Poppins";letter-spacing:.1em;text-transform:uppercase;margin-bottom:18px}
  .flow .node .v{font-size:44px;font-weight:600;color:#fff}
  .flow .node .d{margin-top:12px;font-size:30px;color:#8f9bc4}
  .flow .arw{display:flex;align-items:center;justify-content:center;width:96px;color:${p.accent};font-size:64px;flex:none}
  .flow .node.hot{border-color:${p.accent}}
</style></head>
<body>
  <div id="card">
    <div class="g1"></div><div class="g2"></div><div class="grid"></div><div class="vign"></div>
    <div class="cnr"><svg viewBox="0 0 24 24">${glyph(motif)}</svg></div>
    <div class="pad">
      <div class="top"><div class="logo">${logoSvg}</div></div>
      ${body}
      <div class="foot">
        <div class="handle">@kloudbean</div>
        <div class="url"><span class="arw">&#8594;</span> kloudbean.com</div>
      </div>
    </div>
  </div>
</body></html>`;
}

function headlineHtml(headline, sizePx) {
  return `<h1 style="font-size:${sizePx}px">${esc(headline).replace(/\n/g, "<br>")}</h1>`;
}

/** Pick a headline size that fits the archetype's text column. */
function hlSize(headline, wide) {
  const n = headline.replace(/\n/g, " ").length;
  if (wide) return n > 42 ? 118 : n > 26 ? 140 : 158; // centered/top layouts
  return n > 42 ? 92 : n > 26 ? 108 : 122; // left column (visual on right)
}

function eyebrowHtml(p, eyebrow) {
  return `<div class="eyebrow"><span class="rule"></span>${esc(eyebrow)}</div>`;
}
function subHtml(sub) {
  return sub ? `<div class="sub">${esc(sub)}</div>` : "";
}

/** ARCHETYPE builders → return the inner body markup between logo and footer. */
const ARCHETYPES = {
  terminal(post, p) {
    const lines = (post.terminal ?? [])
      .map((l) => `<span class="${l.k ?? "w"}">${esc(l.t)}</span>`)
      .join("\n");
    const vis = `<div class="term"><div class="bar">
      <i style="background:#ff5f56"></i><i style="background:#ffbd2e"></i><i style="background:#27c93f"></i>
      <span class="name">${esc(post.termName ?? "deploy")}</span></div><pre>${lines}</pre></div>`;
    return `<div class="lr"><div class="txt">${eyebrowHtml(p, post.eyebrow)}${headlineHtml(post.headline, hlSize(post.headline, false))}${subHtml(post.sub)}</div><div class="vis">${vis}</div></div>`;
  },
  stat(post, p) {
    const vis = `<div class="stat"><div class="big">${esc(post.statBig ?? "")}</div><div class="lab">${esc(post.statLabel ?? "")}</div></div>`;
    return `<div class="lr"><div class="txt">${eyebrowHtml(p, post.eyebrow)}${headlineHtml(post.headline, hlSize(post.headline, false))}${subHtml(post.sub)}</div><div class="vis">${vis}</div></div>`;
  },
  versus(post, p) {
    const rows = (post.versus ?? [])
      .map(
        (r) =>
          `<div class="row ${r.hot ? "hot" : ""}">${r.hot ? `<span class="tick">&#10003;</span>` : `<span class="tick" style="background:#20294a;color:#6b7aa8">·</span>`}<div class="nm">${esc(r.name)}${r.note ? `<small>${esc(r.note)}</small>` : ""}</div></div>`,
      )
      .join("\n");
    const vis = `<div class="vs">${rows}<span class="pill">vs</span></div>`;
    return `<div class="lr"><div class="txt">${eyebrowHtml(p, post.eyebrow)}${headlineHtml(post.headline, hlSize(post.headline, false))}${subHtml(post.sub)}</div><div class="vis">${vis}</div></div>`;
  },
  checklist(post, p) {
    const items = (post.checklist ?? [])
      .map((t) => `<div class="item"><span class="tick">&#10003;</span>${esc(t)}</div>`)
      .join("\n");
    const vis = `<div class="chk">${items}</div>`;
    return `<div class="lr"><div class="txt">${eyebrowHtml(p, post.eyebrow)}${headlineHtml(post.headline, hlSize(post.headline, false))}${subHtml(post.sub)}</div><div class="vis">${vis}</div></div>`;
  },
  centered(post, p) {
    return `<div class="ctr">${eyebrowHtml(p, post.eyebrow)}${headlineHtml(post.headline, hlSize(post.headline, true))}${subHtml(post.sub)}</div>`;
  },
  flow(post, p) {
    const nodes = post.flow ?? [];
    const strip = nodes
      .map(
        (n, i) =>
          `${i ? `<div class="arw">&#8594;</div>` : ""}<div class="node ${n.hot ? "hot" : ""}"><div class="k">${esc(n.k)}</div><div class="v">${esc(n.v)}</div>${n.d ? `<div class="d">${esc(n.d)}</div>` : ""}</div>`,
      )
      .join("\n");
    return `<div class="tb">${eyebrowHtml(p, post.eyebrow)}${headlineHtml(post.headline, hlSize(post.headline, true))}${subHtml(post.sub)}<div class="flow">${strip}</div></div>`;
  },
};

/** Build the full 2400x1260 hero HTML for one article `post`. */
export function buildHeroHtml(post, { logoSvg }) {
  const p = PALETTES[post.palette] ?? PALETTES.violet;
  const build = ARCHETYPES[post.archetype] ?? ARCHETYPES.centered;
  const body = build(post, p);
  const glowPos = post.archetype === "centered" ? "50% 12%" : post.archetype === "flow" ? "50% 8%" : "78% 16%";
  return shell({ p, logoSvg, eyebrow: post.eyebrow, motif: post.motif, body, glowPos });
}
