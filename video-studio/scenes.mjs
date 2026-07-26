/**
 * SCENES — vanilla (framework-free) animated scene motifs for the storyboard
 * HTML. Each scene is a gradient backdrop + an SVG motif animated with CSS
 * keyframes. Beat text + progress are JS-driven (see template.mjs) so export
 * stays deterministic; only these decorative motifs use CSS animations.
 *
 * Mirrors the in-app ReelStoryboard scene language so AI-generated reels can
 * later feed this same exporter.
 */

export const PALETTE = {
  deploy: { from: "#4F1AF3", to: "#ec4899", accent: "#f9a8d4", label: "Deploy" },
  network: { from: "#2563eb", to: "#6c47ff", accent: "#93c5fd", label: "Network" },
  speed: { from: "#0d9488", to: "#40B75F", accent: "#6ee7b7", label: "Speed" },
  database: { from: "#4338ca", to: "#6c47ff", accent: "#c4b5fd", label: "Data" },
  security: { from: "#0e7490", to: "#40B75F", accent: "#5eead4", label: "Security" },
  cost: { from: "#b45309", to: "#6c47ff", accent: "#fcd34d", label: "Cost" },
  compare: { from: "#6c47ff", to: "#2563eb", accent: "#a5b4fc", label: "Compare" },
  cdn: { from: "#0284c7", to: "#22d3ee", accent: "#67e8f9", label: "Global" },
  scale: { from: "#7c3aed", to: "#ec4899", accent: "#d8b4fe", label: "Scale" },
  code: { from: "#334155", to: "#6c47ff", accent: "#a5b4fc", label: "Code" },
  cloud: { from: "#0ea5e9", to: "#6c47ff", accent: "#bae6fd", label: "Cloud" },
  ai: { from: "#a21caf", to: "#7c3aed", accent: "#f0abfc", label: "AI" },
  wordpress: { from: "#1e3a8a", to: "#6c47ff", accent: "#93c5fd", label: "WordPress" },
  generic: { from: "#4F1AF3", to: "#6c47ff", accent: "#c4b5fd", label: "Kloudbean" },
};

export const SCENE_KINDS = Object.keys(PALETTE);

const pt = (cx, cy, r, deg) => [
  cx + r * Math.cos((deg * Math.PI) / 180),
  cy + r * Math.sin((deg * Math.PI) / 180),
];

/** SVG motif (inside a 0..100 viewBox) for a scene kind. */
function motif(kind) {
  const p = PALETTE[kind] ?? PALETTE.generic;
  const a = p.accent;
  switch (kind) {
    case "deploy":
      return `
        <g class="rs-rise" style="transform-origin:50px 50px">
          <path d="M50 18 C61 30 61 52 50 64 C39 52 39 30 50 18 Z" fill="#fff" opacity=".95"/>
          <circle cx="50" cy="38" r="6" fill="${p.from}"/>
          <path d="M43 60 L50 74 L57 60 Z" class="rs-exhaust" fill="${a}"/>
        </g>
        ${[0, 1, 2, 3].map((i) => `<circle class="rs-float" style="animation-delay:${i * 0.4}s" cx="${18 + i * 20}" cy="${22 + i * 12}" r="1.7" fill="#fff" opacity=".8"/>`).join("")}`;
    case "network":
      return `
        <g fill="none" stroke="#fff" stroke-width="1.4" class="rs-flow" opacity=".85">
          <line x1="50" y1="50" x2="22" y2="24"/><line x1="50" y1="50" x2="80" y2="26"/>
          <line x1="50" y1="50" x2="24" y2="78"/><line x1="50" y1="50" x2="78" y2="76"/>
        </g>
        <circle cx="50" cy="50" r="9" fill="#fff" class="rs-pulse"/>
        ${[[22, 24], [80, 26], [24, 78], [78, 76]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="${p.from}" stroke="#fff" class="rs-pulse" style="animation-delay:${i * 0.3}s"/>`).join("")}`;
    case "speed":
      return `
        <path d="M22 66 A30 30 0 0 1 78 66" fill="none" stroke="#fff" stroke-width="6" opacity=".3" stroke-linecap="round"/>
        <path d="M22 66 A30 30 0 0 1 78 66" fill="none" stroke="${a}" stroke-width="6" stroke-linecap="round" class="rs-draw"/>
        <g class="rs-needle" style="transform-origin:50px 66px"><line x1="50" y1="66" x2="50" y2="34" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>
        <circle cx="50" cy="66" r="4" fill="#fff"/>`;
    case "database":
      return `
        ${[0, 1, 2].map((i) => `<g class="rs-stack" style="animation-delay:${i * 0.18}s"><ellipse cx="50" cy="${34 + i * 14}" rx="20" ry="6" fill="#fff" opacity="${0.95 - i * 0.12}"/><rect x="30" y="${34 + i * 14}" width="40" height="10" fill="#fff" opacity="${0.55 - i * 0.1}"/></g>`).join("")}
        <circle class="rs-ping" cx="50" cy="34" r="8" fill="none" stroke="${a}" stroke-width="2"/>`;
    case "security":
      return `
        <path d="M50 22 L72 32 V50 C72 64 62 74 50 78 C38 74 28 64 28 50 V32 Z" fill="#fff" opacity=".95" class="rs-float-slow"/>
        <rect x="43" y="46" width="14" height="12" rx="2" fill="${p.from}"/>
        <path d="M46 46 V42 a4 4 0 0 1 8 0 V46" fill="none" stroke="${p.from}" stroke-width="2"/>
        <circle class="rs-ping" cx="50" cy="50" r="20" fill="none" stroke="${a}" stroke-width="2"/>`;
    case "cost":
      return `
        ${[0, 1, 2, 3].map((i) => `<rect x="${26 + i * 13}" y="${30 + i * 8}" width="9" height="${44 - i * 8}" rx="2" fill="${i === 3 ? "#6ee7b7" : "#fff"}" opacity=".92" class="rs-grow" style="animation-delay:${i * 0.15}s"/>`).join("")}
        <path d="M24 34 L74 58" stroke="#6ee7b7" stroke-width="2.5" fill="none" class="rs-draw"/>`;
    case "compare":
      return `
        <rect x="24" y="30" width="20" height="44" rx="3" fill="#fff" opacity=".3"/>
        <rect x="24" y="48" width="20" height="26" rx="3" fill="#fff" class="rs-grow"/>
        <rect x="56" y="20" width="20" height="54" rx="3" fill="#fff" opacity=".3"/>
        <rect x="56" y="26" width="20" height="48" rx="3" fill="${a}" class="rs-grow" style="animation-delay:.2s"/>
        <text x="34" y="86" text-anchor="middle" font-size="7" fill="#fff" opacity=".8">Others</text>
        <text x="66" y="86" text-anchor="middle" font-size="7" fill="#fff">KB</text>`;
    case "cdn":
      return `
        <circle cx="50" cy="50" r="24" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/>
        <ellipse cx="50" cy="50" rx="24" ry="9" fill="none" stroke="#fff" stroke-width="1.2" opacity=".4"/>
        <ellipse cx="50" cy="50" rx="9" ry="24" fill="none" stroke="#fff" stroke-width="1.2" opacity=".4"/>
        <g class="rs-orbit" style="transform-origin:50px 50px">
          ${[0, 120, 240].map((d) => { const [x, y] = pt(50, 50, 24, d); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${a}"/>`; }).join("")}
        </g>
        <circle cx="50" cy="50" r="5" fill="#fff" class="rs-pulse"/>`;
    case "scale":
      return `
        ${[0, 1, 2, 3, 4].map((i) => `<rect x="${24 + (i % 3) * 18}" y="${30 + Math.floor(i / 3) * 20}" width="14" height="14" rx="3" fill="#fff" opacity=".92" class="rs-stack" style="animation-delay:${i * 0.16}s"/>`).join("")}
        <circle class="rs-ping" cx="42" cy="44" r="10" fill="none" stroke="${a}" stroke-width="2"/>`;
    case "code":
      return `
        <rect x="22" y="26" width="56" height="48" rx="4" fill="#0b1020" opacity=".85"/>
        <rect x="22" y="26" width="56" height="9" rx="4" fill="#fff" opacity=".15"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="28" y="${42 + i * 8}" width="${i === 3 ? 18 : 30 - i * 4}" height="3" rx="1.5" fill="${i === 3 ? a : "#fff"}" opacity="${i === 3 ? 1 : 0.7}"/>`).join("")}
        <rect x="47" y="66" width="4" height="4" fill="${a}" class="rs-blink"/>`;
    case "cloud":
      return `
        <g class="rs-float-slow"><path d="M34 56 a12 12 0 0 1 2 -23 a16 16 0 0 1 30 4 a10 10 0 0 1 -2 19 Z" fill="#fff" opacity=".96"/></g>
        ${[38, 50, 62].map((x, i) => `<rect x="${x - 4}" y="60" width="8" height="12" rx="1.5" fill="${a}" class="rs-float" style="animation-delay:${i * 0.3}s"/>`).join("")}`;
    case "ai":
      return `
        <g class="rs-spin-slow" style="transform-origin:50px 50px">
          ${[0, 60, 120].map((d) => `<ellipse cx="50" cy="50" rx="26" ry="10" fill="none" stroke="#fff" stroke-width="1.3" opacity=".55" transform="rotate(${d} 50 50)"/>`).join("")}
        </g>
        <circle cx="50" cy="50" r="7" fill="#fff" class="rs-pulse"/>
        ${[[30, 30], [70, 32], [32, 70], [70, 68]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${a}" class="rs-float" style="animation-delay:${i * 0.35}s"/>`).join("")}`;
    case "wordpress":
      return `
        <circle cx="50" cy="48" r="24" fill="none" stroke="#fff" stroke-width="2" opacity=".85" class="rs-float-slow"/>
        <text x="50" y="58" text-anchor="middle" font-size="26" font-weight="800" fill="#fff" class="rs-float-slow">W</text>
        ${[36, 50, 64].map((x, i) => `<rect x="${x - 5}" y="78" width="10" height="6" rx="1.5" fill="${a}" class="rs-float" style="animation-delay:${i * 0.3}s"/>`).join("")}`;
    default:
      return `
        ${[0, 1, 2].map((i) => `<circle cx="${34 + i * 16}" cy="50" r="${8 - i}" fill="#fff" opacity="${0.9 - i * 0.2}" class="rs-float" style="animation-delay:${i * 0.4}s"/>`).join("")}
        <circle class="rs-ping" cx="50" cy="50" r="16" fill="none" stroke="${a}" stroke-width="2"/>`;
  }
}

/** Full scene block (backdrop + motif) for a kind. */
export function sceneMarkup(kind) {
  const p = PALETTE[kind] ?? PALETTE.generic;
  return `
  <div class="scene" style="background:linear-gradient(150deg, ${p.from}, ${p.to})">
    <div class="blob" style="width:70%;height:40%;left:-10%;top:8%;background:${p.accent};opacity:.25"></div>
    <div class="blob" style="width:60%;height:38%;right:-12%;bottom:6%;background:#fff;opacity:.12;animation-delay:1.2s"></div>
    <div class="grid"></div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" class="motif">${motif(kind)}</svg>
  </div>`;
}

/** Scene CSS (keyframes + helpers). Injected once into the storyboard HTML. */
export const SCENE_CSS = `
.scene{position:absolute;inset:0;overflow:hidden}
.scene .blob{position:absolute;border-radius:9999px;filter:blur(20px);animation:bgshift 9s ease-in-out infinite}
.scene .grid{position:absolute;inset:0;opacity:.5;background-image:linear-gradient(rgba(255,255,255,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.10) 1px,transparent 1px);background-size:5% 5%;-webkit-mask-image:radial-gradient(circle at 50% 45%,#000 30%,transparent 75%);mask-image:radial-gradient(circle at 50% 45%,#000 30%,transparent 75%)}
.scene .motif{position:absolute;inset:0;padding:16%}
@keyframes bgshift{0%,100%{transform:translate(0,0) scale(1.1)}50%{transform:translate(-3%,3%) scale(1.2)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8%)}}
@keyframes floatSlow{0%,100%{transform:translateY(0)}50%{transform:translateY(-5%)}}
@keyframes pulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.12);opacity:1}}
@keyframes ping{0%{transform:scale(.6);opacity:.7}100%{transform:scale(2.2);opacity:0}}
@keyframes orbit{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes spinSlow{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes rise{0%{transform:translateY(14%) rotate(-45deg)}50%{transform:translateY(-4%) rotate(-45deg)}100%{transform:translateY(14%) rotate(-45deg)}}
@keyframes exhaust{0%,100%{transform:scaleY(.7);opacity:.5}50%{transform:scaleY(1.25);opacity:1}}
@keyframes needle{0%{transform:rotate(-80deg)}55%{transform:rotate(72deg)}70%{transform:rotate(58deg)}100%{transform:rotate(72deg)}}
@keyframes grow{0%{transform:scaleY(.05)}100%{transform:scaleY(1)}}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes flow{to{stroke-dashoffset:-40}}
@keyframes scan{0%{transform:translateY(-120%)}100%{transform:translateY(320%)}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes stack{0%{opacity:0;transform:translateY(30%) scale(.8)}100%{opacity:1;transform:translateY(0) scale(1)}}
.rs-float{animation:float 3.6s ease-in-out infinite}
.rs-float-slow{animation:floatSlow 5s ease-in-out infinite}
.rs-pulse{animation:pulse 2.2s ease-in-out infinite}
.rs-ping{animation:ping 2.4s ease-out infinite}
.rs-orbit{animation:orbit 9s linear infinite}
.rs-spin-slow{animation:spinSlow 16s linear infinite}
.rs-rise{animation:rise 3.2s ease-in-out infinite}
.rs-exhaust{animation:exhaust .5s ease-in-out infinite;transform-origin:top center}
.rs-needle{animation:needle 3.4s cubic-bezier(.5,0,.2,1) infinite}
.rs-grow{animation:grow 1.1s cubic-bezier(.2,.7,.2,1) both;transform-origin:bottom center}
.rs-draw{stroke-dasharray:200;stroke-dashoffset:200;animation:draw 1.4s ease-out forwards}
.rs-flow{stroke-dasharray:6 8;animation:flow 1s linear infinite}
.rs-blink{animation:blink 1s step-end infinite}
.rs-stack{animation:stack .7s cubic-bezier(.2,.7,.2,1) both}
`;
