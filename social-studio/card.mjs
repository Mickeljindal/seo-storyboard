/**
 * Premium 1080x1080 social card for Kloudbean — matched to the official brand
 * kit (kloudbean.com/brand-kit):
 *   - Deep Navy #000f27 background, Primary Purple #4F1AF3, Success Green
 *     #40B75F, Warning Yellow #E4B32F accents (approved palette only).
 *   - Poppins typeface.
 *   - The real Kloudbean wordmark (white/dark-background SVG), inlined.
 * Editorial, typography-forward, with a faint corner glyph as texture so
 * nothing collides with the headline.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ICP_NAMES } from "./content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// The official white Kloudbean logo (for dark backgrounds), inlined so each
// card is self-contained. Strip the XML preamble + fixed width/height so CSS
// controls the size; keep the viewBox for crisp scaling.
const LOGO_SVG = readFileSync(join(__dirname, "assets/kb-primary.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>/i, "")
  .replace(/<!DOCTYPE[^>]*>/i, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/\swidth="[^"]*"/i, "")
  .replace(/\sheight="[^"]*"/i, "")
  .trim();

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function slugify(s) {
  return String(s)
    .replace(/\n/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildCaption(post) {
  const tags = (post.tags ?? []).map((t) => `#${t.replace(/^#/, "")}`).join(" ");
  const parts = [post.caption.trim()];
  if (tags) parts.push("", tags);
  return parts.join("\n") + "\n";
}

// Brand-approved accents only. `c` = legible on-navy accent (Primary Purple is
// lightened for contrast on Deep Navy); `glow` = the true brand hue behind it.
const PURPLE = { c: "#7C5CFF", glow: "#4F1AF3" };
const GREEN = { c: "#40B75F", glow: "#40B75F" };
const YELLOW = { c: "#E4B32F", glow: "#E4B32F" };
const ACCENT = {
  vibecoder: PURPLE,
  saas_founder: GREEN,
  ai_agency: PURPLE,
  freelance_dev: GREEN,
  wp_agency: PURPLE,
  enterprise_gov: YELLOW,
  general: PURPLE,
};

function eyebrow(post) {
  const byIcp = {
    vibecoder: "For AI builders",
    saas_founder: "For SaaS founders",
    ai_agency: "For agencies",
    freelance_dev: "For freelance devs",
    wp_agency: "For WordPress teams",
    enterprise_gov: "Enterprise · KSA",
  };
  if (byIcp[post.icp]) return byIcp[post.icp];
  const byType = { feature: "The platform", myth: "Myth, busted", compare: "Comparison", tip: "Pro tip", hook: "Managed cloud", quote: "Kloudbean", usecase: "Use case", cta: "Managed cloud" };
  return byType[post.type] || "Managed cloud";
}

function subline(post) {
  const first = String(post.caption || "").split(/(?<=[.!?])\s/)[0].trim();
  if (!first || first.length < 12) return "";
  return first.length > 104 ? first.slice(0, 101).trim() + "…" : first;
}

/** Minimal single-stroke line glyphs (24x24) — large + faint corner texture. */
function glyph(scene) {
  const g = {
    deploy: '<path d="M12 3c3 2 4.5 6 4.5 9 0 2-1.5 4-4.5 6-3-2-4.5-4-4.5-6 0-3 1.5-7 4.5-9Z"/><circle cx="12" cy="9.5" r="1.8"/><path d="M8.5 17c-2 .8-3 2.4-3 4 1.6 0 3.2-1 4-3M15.5 17c2 .8 3 2.4 3 4-1.6 0-3.2-1-4-3"/>',
    code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12"/>',
    database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    security: '<path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3Z"/><path d="M9.5 12l1.8 1.8L15 10"/>',
    cost: '<path d="M4 20V10M9 20V5M14 20v-7M19 20V8"/>',
    compare: '<rect x="4" y="10" width="6" height="11" rx="1"/><rect x="14" y="4" width="6" height="17" rx="1"/>',
    cdn: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><path d="M3 12h18M12 3v18"/>',
    scale: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    network: '<circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="19" r="2.4"/><circle cx="19" cy="19" r="2.4"/><path d="M12 7.4 6.4 16.6M12 7.4l5.6 9.2M7.4 19h9.2"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5 3.75 3.75 0 0 1 17.5 18Z"/>',
    ai: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)"/>',
    speed: '<path d="M4 14a8 8 0 0 1 16 0"/><path d="M12 14l4-4"/><circle cx="12" cy="14" r="1.4"/>',
    wordpress: '<circle cx="12" cy="12" r="9"/><path d="M4 9h5l2.2 7 2-6-1-1h3l2.4 7 2-7"/>',
    generic: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
  };
  return g[scene] || g.generic;
}

const DIMS = { square: [1080, 1080], portrait: [1080, 1350], wide: [1200, 630] };

export function buildPostHtml(post, shape = "square") {
  const [w, h] = DIMS[shape] ?? DIMS.square;
  const a = ACCENT[post.icp] ?? ACCENT.general;
  const badge = esc(ICP_NAMES[post.icp] ?? "Kloudbean");
  const headline = esc(post.headline).replace(/\n/g, "<br>");
  const flat = post.headline.replace(/\n/g, " ");
  const hlSize = flat.length > 46 ? 68 : flat.length > 30 ? 82 : 94;
  const sub = esc(subline(post));

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<title>${esc(flat)} — Kloudbean</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#000f27}
  #card{position:relative;width:${w}px;height:${h}px;overflow:hidden;background:#000f27;
    font-family:"Poppins",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#fff}
  .bg{position:absolute;inset:0}
  .g1{position:absolute;width:820px;height:820px;right:-160px;top:-220px;border-radius:50%;
    background:radial-gradient(closest-side, ${a.glow}55, transparent 70%);filter:blur(24px)}
  .g2{position:absolute;width:720px;height:720px;left:-200px;bottom:-260px;border-radius:50%;
    background:radial-gradient(closest-side, #4F1AF345, transparent 70%);filter:blur(24px)}
  .grid{position:absolute;inset:0;opacity:.45;
    background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);
    background-size:60px 60px;
    -webkit-mask-image:radial-gradient(120% 90% at 72% 12%, #000 20%, transparent 78%);
    mask-image:radial-gradient(120% 90% at 72% 12%, #000 20%, transparent 78%)}
  .vign{position:absolute;inset:0;box-shadow:inset 0 0 260px 70px rgba(0,5,18,.6)}
  .glyph{position:absolute;right:-70px;bottom:-90px;width:520px;height:520px;color:#fff;opacity:.05}
  .glyph svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round}

  .pad{position:absolute;inset:0;padding:84px 88px;display:flex;flex-direction:column}
  .top{display:flex;align-items:center;gap:16px}
  .logo svg{height:44px;width:auto;display:block}
  .pill{margin-left:auto;font-size:22px;font-weight:500;color:#cdd6f4;
    border:1px solid #ffffff26;background:#ffffff0d;padding:9px 20px;border-radius:999px}

  .body{margin-top:auto;margin-bottom:auto;max-width:850px}
  .eyebrow{display:flex;align-items:center;gap:16px;color:${a.c};font-weight:600;font-size:23px;
    letter-spacing:.15em;text-transform:uppercase;margin-bottom:26px}
  .eyebrow .rule{width:46px;height:3px;background:${a.c};border-radius:3px}
  h1{font-weight:700;font-size:${hlSize}px;line-height:1.08;letter-spacing:-.02em;color:#fff;text-wrap:balance}
  .sub{margin-top:28px;font-size:29px;line-height:1.45;color:#aeb6d4;font-weight:400;max-width:770px}

  .foot{display:flex;align-items:center;gap:16px;padding-top:26px;border-top:1px solid #ffffff1f}
  .handle{font-size:25px;font-weight:500;color:#cdd6f4}
  .url{margin-left:auto;display:flex;align-items:center;gap:10px;font-size:25px;font-weight:600;color:#fff}
  .url .arw{color:${a.c}}
</style></head>
<body>
  <div id="card">
    <div class="bg">
      <div class="g1"></div><div class="g2"></div>
      <div class="grid"></div><div class="vign"></div>
    </div>
    <div class="glyph"><svg viewBox="0 0 24 24">${glyph(post.scene)}</svg></div>
    <div class="pad">
      <div class="top">
        <div class="logo">${LOGO_SVG}</div>
        <div class="pill">${badge}</div>
      </div>
      <div class="body">
        <div class="eyebrow"><span class="rule"></span>${esc(eyebrow(post))}</div>
        <h1>${headline}</h1>
        ${sub ? `<div class="sub">${sub}</div>` : ""}
      </div>
      <div class="foot">
        <div class="handle">@kloudbean</div>
        <div class="url"><span class="arw">→</span> kloudbean.com</div>
      </div>
    </div>
  </div>
</body></html>`;
}
