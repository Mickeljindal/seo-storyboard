/**
 * Builds a self-contained animated storyboard HTML for one video. Open it in a
 * browser to watch; the exporter drives window.__seek(ms) for frame-accurate
 * capture. All CSS/SVG is inline so the file is fully portable.
 */
import { PALETTE, SCENE_KINDS, sceneMarkup, SCENE_CSS } from "./scenes.mjs";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Duration (ms) of a beat: prefer explicit dur, else parse "a-b" seconds. */
export function beatMs(beat) {
  if (typeof beat.dur === "number") return Math.max(1200, beat.dur * 1000);
  const m = String(beat.seconds ?? "").match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (m) return Math.max(1200, Math.min(12000, (parseFloat(m[2]) - parseFloat(m[1])) * 1000));
  return 4200;
}

export function videoDurationMs(video) {
  return video.beats.reduce((s, b) => s + beatMs(b), 0);
}

const DIMS = {
  "16:9": { w: 1920, h: 1080 },
  "9:16": { w: 1080, h: 1920 },
  "1:1": { w: 1080, h: 1080 },
};

export function buildStoryboardHtml(video) {
  const aspect = DIMS[video.aspect] ? video.aspect : "16:9";
  const { w, h } = DIMS[aspect];
  const fps = video.fps ?? 30;
  const vertical = aspect === "9:16";

  const beats = video.beats.map((b, i) => {
    const kind = SCENE_KINDS.includes(b.scene) ? b.scene : "generic";
    return { ...b, kind, ms: beatMs(b), idx: i };
  });
  const durationMs = beats.reduce((s, b) => s + b.ms, 0);

  const beatSections = beats
    .map((b, i) => {
      const isLast = i === beats.length - 1;
      return `
      <section class="beat" data-idx="${i}" data-ms="${b.ms}">
        ${sceneMarkup(b.kind)}
        <div class="scrim"></div>
        <div class="content">
          <div class="on-screen">${esc(b.on_screen)}</div>
          ${isLast && video.cta ? `<div class="cta">${esc(video.cta)}</div>` : ""}
        </div>
        <div class="caption"><span>${esc(b.narration)}</span></div>
      </section>`;
    })
    .join("\n");

  const segs = beats
    .map((b) => `<div class="seg" data-ms="${b.ms}"><i></i></div>`)
    .join("");

  const icpLabel = video.icpName ? esc(video.icpName) : "Kloudbean";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(video.title)} — Kloudbean video</title>
<style>
  :root{ --brand:#4F1AF3; --brandto:#6c47ff; }
  *{ box-sizing:border-box; margin:0; padding:0; }
  html,body{ height:100%; background:#05060f; }
  body{ display:flex; align-items:center; justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  #stage{ position:relative; width:${w}px; height:${h}px; overflow:hidden; background:#05060f;
    transform-origin:center; }
  ${SCENE_CSS}
  .beat{ position:absolute; inset:0; opacity:0; }
  .beat.active{ opacity:1; }
  .scrim{ position:absolute; inset:0; background:
    linear-gradient(180deg, rgba(0,0,0,.35), transparent 30%, transparent 55%, rgba(0,0,0,.72)); }
  .content{ position:absolute; inset:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center; text-align:center;
    padding:${vertical ? "0 8%" : "0 12%"}; }
  .on-screen{ color:#fff; font-weight:800; letter-spacing:-.02em; line-height:1.05;
    font-size:${vertical ? "62px" : "76px"}; text-shadow:0 4px 30px rgba(0,0,0,.5);
    max-width:${vertical ? "100%" : "80%"}; text-wrap:balance; }
  .cta{ margin-top:${vertical ? "26px" : "34px"}; display:inline-block;
    background:linear-gradient(135deg,var(--brand),var(--brandto)); color:#fff;
    font-weight:700; font-size:${vertical ? "30px" : "34px"}; padding:16px 30px;
    border-radius:999px; box-shadow:0 20px 50px -12px rgba(79,26,243,.7); }
  .caption{ position:absolute; left:0; right:0; bottom:${vertical ? "9%" : "8%"};
    display:flex; justify-content:center; padding:0 10%; }
  .caption span{ color:#fff; font-size:${vertical ? "30px" : "32px"}; font-weight:500;
    line-height:1.3; background:rgba(0,0,0,.32); padding:10px 20px; border-radius:14px;
    backdrop-filter:blur(4px); max-width:100%; text-wrap:balance; }
  .topbar{ position:absolute; top:0; left:0; right:0; z-index:20;
    display:flex; align-items:center; gap:14px; padding:${vertical ? "26px 28px" : "30px 40px"}; }
  .brand{ display:flex; align-items:center; gap:10px; color:#fff; font-weight:700;
    font-size:${vertical ? "26px" : "28px"}; }
  .brand .dot{ width:16px; height:16px; border-radius:5px;
    background:linear-gradient(135deg,var(--brand),var(--brandto)); box-shadow:0 0 18px var(--brandto); }
  .badge{ margin-left:auto; color:#fff; font-size:${vertical ? "20px" : "22px"};
    background:rgba(255,255,255,.12); padding:7px 16px; border-radius:999px; font-weight:600; }
  .progress{ position:absolute; top:0; left:0; right:0; z-index:30; display:flex; gap:6px;
    padding:12px 16px 0; }
  .seg{ flex:1; height:6px; background:rgba(255,255,255,.28); border-radius:99px; overflow:hidden; }
  .seg i{ display:block; height:100%; width:0; background:#fff; border-radius:99px; }
</style>
</head>
<body>
  <div id="stage">
    <div class="progress">${segs}</div>
    <div class="topbar"><div class="brand"><span class="dot"></span>Kloudbean</div><div class="badge">${icpLabel}</div></div>
    ${beatSections}
  </div>
<script>
  const FPS = ${fps};
  const DURATION = ${durationMs};
  const BEATS = ${JSON.stringify(beats.map((b) => ({ ms: b.ms })))};
  const stage = document.getElementById('stage');
  const sections = [...document.querySelectorAll('.beat')];
  const segs = [...document.querySelectorAll('.seg i')];
  const isExport = new URLSearchParams(location.search).get('export') === '1';

  // Fit the fixed-size stage into the viewport for comfortable in-browser viewing.
  function fit(){
    if (isExport) { stage.style.transform = 'none'; return; }
    const s = Math.min(window.innerWidth / ${w}, window.innerHeight / ${h});
    stage.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit); fit();

  const starts = []; let acc = 0;
  for (const b of BEATS){ starts.push(acc); acc += b.ms; }

  function render(ms){
    const t = Math.max(0, Math.min(DURATION - 1, ms));
    let idx = 0;
    for (let i = 0; i < BEATS.length; i++){ if (t >= starts[i]) idx = i; }
    const local = t - starts[idx];
    sections.forEach((el,i)=> el.classList.toggle('active', i===idx));
    // Entrance: headline slides/fades in over the first 520ms of the beat.
    const el = sections[idx];
    const os = el.querySelector('.on-screen');
    const cap = el.querySelector('.caption span');
    const ein = Math.min(1, local/520);
    const eout = Math.min(1, Math.max(0, (BEATS[idx].ms - local)/360));
    const appear = Math.min(ein, eout);
    if (os){ os.style.opacity = appear; os.style.transform = 'translateY(' + ((1-ein)*26).toFixed(1) + 'px)'; }
    if (cap){ const c = Math.min(1, local/420); cap.style.opacity = c; cap.style.transform = 'translateY(' + ((1-c)*14).toFixed(1) + 'px)'; }
    const ctaEl = el.querySelector('.cta');
    if (ctaEl){ const c = Math.min(1, Math.max(0,(local-500)/500)); ctaEl.style.opacity = c; ctaEl.style.transform='scale('+(0.9+0.1*c)+')'; }
    // Progress segments.
    segs.forEach((s,i)=>{ s.style.width = i<idx ? '100%' : i>idx ? '0%' : ((local/BEATS[idx].ms)*100)+'%'; });
  }

  // Deterministic export hook: position the timeline AND freeze decorative CSS
  // animations at a fixed phase so every capture of frame N is identical.
  window.__videoMeta = { durationMs: DURATION, fps: FPS, width: ${w}, height: ${h}, beats: BEATS.length };
  window.__seek = function(ms){
    render(ms);
    try{
      document.getAnimations().forEach(a=>{ try{ a.pause(); a.currentTime = ms; }catch(e){} });
    }catch(e){}
  };

  if (!isExport){
    const t0 = performance.now();
    (function loop(now){ render((now - t0) % DURATION); requestAnimationFrame(loop); })(performance.now());
  } else {
    render(0);
  }
</script>
</body>
</html>`;
}
