/**
 * SCENES — framework-free animated scene motifs for the storyboard HTML.
 * Brand-aligned: motifs are drawn in white + the current accent (var(--acc))
 * on the shared Deep Navy background, so every video matches the Kloudbean
 * brand kit. Motion is CSS-keyframe based; the exporter freezes each frame
 * deterministically via window.__seek (see template.mjs).
 */

export const SCENE_KINDS = [
  "deploy", "network", "speed", "database", "security", "cost", "compare",
  "cdn", "scale", "code", "cloud", "ai", "wordpress", "generic",
];

const pt = (cx, cy, r, deg) => [
  cx + r * Math.cos((deg * Math.PI) / 180),
  cy + r * Math.sin((deg * Math.PI) / 180),
];

/** Inner SVG motif (0..100 viewBox). White = primary, var(--acc) = accent. */
export function sceneMotif(kind) {
  switch (kind) {
    case "deploy":
      return `
        <g class="rs-rise" style="transform-origin:50px 50px">
          <path d="M50 18 C61 30 61 52 50 64 C39 52 39 30 50 18 Z" fill="#fff" opacity=".96"/>
          <circle cx="50" cy="38" r="6" fill="var(--acc)"/>
          <path d="M43 60 L50 74 L57 60 Z" class="rs-exhaust" fill="var(--acc)"/>
        </g>
        ${[0, 1, 2, 3].map((i) => `<circle class="rs-float" style="animation-delay:${i * 0.4}s" cx="${18 + i * 20}" cy="${22 + i * 12}" r="1.7" fill="#fff" opacity=".7"/>`).join("")}`;
    case "network":
      return `
        <g fill="none" stroke="var(--acc)" stroke-width="1.6" class="rs-flow" opacity=".9">
          <line x1="50" y1="50" x2="22" y2="24"/><line x1="50" y1="50" x2="80" y2="26"/>
          <line x1="50" y1="50" x2="24" y2="78"/><line x1="50" y1="50" x2="78" y2="76"/>
        </g>
        <circle cx="50" cy="50" r="9" fill="#fff" class="rs-pulse"/>
        ${[[22, 24], [80, 26], [24, 78], [78, 76]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--acc)" class="rs-pulse" style="animation-delay:${i * 0.3}s"/>`).join("")}`;
    case "speed":
      return `
        <path d="M22 66 A30 30 0 0 1 78 66" fill="none" stroke="#fff" stroke-width="6" opacity=".25" stroke-linecap="round"/>
        <path d="M22 66 A30 30 0 0 1 78 66" fill="none" stroke="var(--acc)" stroke-width="6" stroke-linecap="round" class="rs-draw"/>
        <g class="rs-needle" style="transform-origin:50px 66px"><line x1="50" y1="66" x2="50" y2="34" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>
        <circle cx="50" cy="66" r="4" fill="#fff"/>`;
    case "database":
      return `
        ${[0, 1, 2].map((i) => `<g class="rs-stack" style="animation-delay:${i * 0.18}s"><ellipse cx="50" cy="${34 + i * 14}" rx="20" ry="6" fill="#fff" opacity="${0.95 - i * 0.14}"/><rect x="30" y="${34 + i * 14}" width="40" height="10" fill="#fff" opacity="${0.5 - i * 0.1}"/></g>`).join("")}
        <circle class="rs-ping" cx="50" cy="34" r="8" fill="none" stroke="var(--acc)" stroke-width="2"/>`;
    case "security":
      return `
        <path d="M50 22 L72 32 V50 C72 64 62 74 50 78 C38 74 28 64 28 50 V32 Z" fill="#fff" opacity=".95" class="rs-float-slow"/>
        <path d="M43 50 l5 5 9 -10" fill="none" stroke="var(--acc)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <circle class="rs-ping" cx="50" cy="50" r="20" fill="none" stroke="var(--acc)" stroke-width="2"/>`;
    case "cost":
      return `
        ${[0, 1, 2, 3].map((i) => `<rect x="${26 + i * 13}" y="${30 + i * 8}" width="9" height="${44 - i * 8}" rx="2" fill="${i === 3 ? "var(--acc)" : "#fff"}" opacity=".92" class="rs-grow" style="animation-delay:${i * 0.15}s"/>`).join("")}
        <path d="M24 34 L74 58" stroke="var(--acc)" stroke-width="2.5" fill="none" class="rs-draw"/>`;
    case "compare":
      return `
        <rect x="24" y="30" width="20" height="44" rx="3" fill="#fff" opacity=".28"/>
        <rect x="24" y="48" width="20" height="26" rx="3" fill="#fff" class="rs-grow"/>
        <rect x="56" y="20" width="20" height="54" rx="3" fill="#fff" opacity=".28"/>
        <rect x="56" y="26" width="20" height="48" rx="3" fill="var(--acc)" class="rs-grow" style="animation-delay:.2s"/>`;
    case "cdn":
      return `
        <circle cx="50" cy="50" r="24" fill="none" stroke="#fff" stroke-width="1.5" opacity=".65"/>
        <ellipse cx="50" cy="50" rx="24" ry="9" fill="none" stroke="#fff" stroke-width="1.2" opacity=".4"/>
        <ellipse cx="50" cy="50" rx="9" ry="24" fill="none" stroke="#fff" stroke-width="1.2" opacity=".4"/>
        <g class="rs-orbit" style="transform-origin:50px 50px">
          ${[0, 120, 240].map((d) => { const [x, y] = pt(50, 50, 24, d); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="var(--acc)"/>`; }).join("")}
        </g>
        <circle cx="50" cy="50" r="5" fill="#fff" class="rs-pulse"/>`;
    case "scale":
      return `
        ${[0, 1, 2, 3, 4].map((i) => `<rect x="${24 + (i % 3) * 18}" y="${30 + Math.floor(i / 3) * 20}" width="14" height="14" rx="3" fill="${i === 4 ? "var(--acc)" : "#fff"}" opacity=".92" class="rs-stack" style="animation-delay:${i * 0.16}s"/>`).join("")}
        <circle class="rs-ping" cx="42" cy="44" r="10" fill="none" stroke="var(--acc)" stroke-width="2"/>`;
    case "code":
      return `
        <rect x="20" y="26" width="60" height="48" rx="5" fill="#0a1630" stroke="#ffffff30" stroke-width="1"/>
        <rect x="20" y="26" width="60" height="10" rx="5" fill="#ffffff14"/>
        <circle cx="27" cy="31" r="1.6" fill="var(--acc)"/><circle cx="33" cy="31" r="1.6" fill="#ffffff55"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="27" y="${44 + i * 8}" width="${i === 3 ? 18 : 34 - i * 5}" height="3" rx="1.5" fill="${i === 3 ? "var(--acc)" : "#fff"}" opacity="${i === 3 ? 1 : 0.65}"/>`).join("")}
        <rect x="48" y="68" width="4" height="4" fill="var(--acc)" class="rs-blink"/>`;
    case "cloud":
      return `
        <g class="rs-float-slow"><path d="M34 58 a13 13 0 0 1 2 -25 a17 17 0 0 1 32 4 a11 11 0 0 1 -2 21 Z" fill="#fff" opacity=".96"/></g>
        ${[40, 50, 60].map((x, i) => `<rect x="${x - 4}" y="62" width="8" height="13" rx="1.5" fill="var(--acc)" class="rs-float" style="animation-delay:${i * 0.3}s"/>`).join("")}`;
    case "ai":
      return `
        <g class="rs-spin-slow" style="transform-origin:50px 50px">
          ${[0, 60, 120].map((d) => `<ellipse cx="50" cy="50" rx="27" ry="10.5" fill="none" stroke="#fff" stroke-width="1.4" opacity=".55" transform="rotate(${d} 50 50)"/>`).join("")}
        </g>
        <circle cx="50" cy="50" r="7" fill="var(--acc)" class="rs-pulse"/>
        ${[[30, 30], [70, 32], [32, 70], [70, 68]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.8" fill="#fff" class="rs-float" style="animation-delay:${i * 0.35}s"/>`).join("")}`;
    case "wordpress":
      return `
        <circle cx="50" cy="50" r="26" fill="none" stroke="#fff" stroke-width="2.4" opacity=".9" class="rs-float-slow"/>
        <text x="50" y="62" text-anchor="middle" font-size="30" font-weight="800" fill="#fff" font-family="Poppins,sans-serif">W</text>
        <circle class="rs-ping" cx="50" cy="50" r="26" fill="none" stroke="var(--acc)" stroke-width="1.6"/>`;
    default:
      return `
        ${[0, 1, 2].map((i) => `<circle cx="${34 + i * 16}" cy="50" r="${9 - i * 2}" fill="${i === 1 ? "var(--acc)" : "#fff"}" opacity="${0.95 - i * 0.15}" class="rs-float" style="animation-delay:${i * 0.4}s"/>`).join("")}
        <circle class="rs-ping" cx="50" cy="50" r="16" fill="none" stroke="var(--acc)" stroke-width="2"/>`;
  }
}

/** Scene animation CSS (keyframes + helpers). Injected once into the HTML. */
export const SCENE_CSS = `
@keyframes rs-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8%)}}
@keyframes rs-float-slow{0%,100%{transform:translateY(0)}50%{transform:translateY(-5%)}}
@keyframes rs-pulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.12);opacity:1}}
@keyframes rs-ping{0%{transform:scale(.6);opacity:.7}100%{transform:scale(2.1);opacity:0}}
@keyframes rs-orbit{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes rs-spin-slow{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes rs-rise{0%{transform:translateY(12%) rotate(-45deg)}50%{transform:translateY(-4%) rotate(-45deg)}100%{transform:translateY(12%) rotate(-45deg)}}
@keyframes rs-exhaust{0%,100%{transform:scaleY(.7);opacity:.5}50%{transform:scaleY(1.25);opacity:1}}
@keyframes rs-needle{0%{transform:rotate(-80deg)}55%{transform:rotate(72deg)}70%{transform:rotate(58deg)}100%{transform:rotate(72deg)}}
@keyframes rs-grow{0%{transform:scaleY(.05)}100%{transform:scaleY(1)}}
@keyframes rs-draw{to{stroke-dashoffset:0}}
@keyframes rs-flow{to{stroke-dashoffset:-40}}
@keyframes rs-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes rs-stack{0%{opacity:0;transform:translateY(30%) scale(.8)}100%{opacity:1;transform:translateY(0) scale(1)}}
.rs-float{animation:rs-float 3.6s ease-in-out infinite}
.rs-float-slow{animation:rs-float-slow 5s ease-in-out infinite}
.rs-pulse{animation:rs-pulse 2.2s ease-in-out infinite}
.rs-ping{animation:rs-ping 2.6s ease-out infinite}
.rs-orbit{animation:rs-orbit 9s linear infinite}
.rs-spin-slow{animation:rs-spin-slow 16s linear infinite}
.rs-rise{animation:rs-rise 3.2s ease-in-out infinite}
.rs-exhaust{animation:rs-exhaust .5s ease-in-out infinite;transform-origin:top center}
.rs-needle{animation:rs-needle 3.4s cubic-bezier(.5,0,.2,1) infinite}
.rs-grow{animation:rs-grow 1.1s cubic-bezier(.2,.7,.2,1) both;transform-origin:bottom center}
.rs-draw{stroke-dasharray:200;stroke-dashoffset:200;animation:rs-draw 1.4s ease-out forwards}
.rs-flow{stroke-dasharray:6 8;animation:rs-flow 1s linear infinite}
.rs-blink{animation:rs-blink 1s step-end infinite}
.rs-stack{animation:rs-stack .7s cubic-bezier(.2,.7,.2,1) both}
`;
