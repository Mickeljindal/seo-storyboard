/**
 * Builds a self-contained animated storyboard HTML for one video, matched to
 * the Kloudbean brand kit (kloudbean.com/brand-kit): Deep Navy #000f27, Poppins,
 * the real white wordmark, and the approved accent palette (Primary Purple,
 * Success Green, Warning Yellow) chosen per ICP.
 *
 * Editorial split layout: text on the left, the animated scene motif on the
 * right, so nothing collides. window.__seek(ms) drives frame-accurate export.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SCENE_KINDS, sceneMotif, SCENE_CSS } from "./scenes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

export function beatMs(beat) {
  if (typeof beat.dur === "number") return Math.max(1200, beat.dur * 1000);
  const m = String(beat.seconds ?? "").match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (m) return Math.max(1200, Math.min(12000, (parseFloat(m[2]) - parseFloat(m[1])) * 1000));
  return 4200;
}

export function videoDurationMs(video) {
  return video.beats.reduce((s, b) => s + beatMs(b), 0);
}

const DIMS = { "16:9": { w: 1920, h: 1080 }, "9:16": { w: 1080, h: 1920 }, "1:1": { w: 1080, h: 1080 } };

// Brand-approved accents only (Primary Purple lightened for contrast on navy).
const PURPLE = { c: "#7C5CFF", glow: "#4F1AF3" };
const GREEN = { c: "#40B75F", glow: "#40B75F" };
const YELLOW = { c: "#E4B32F", glow: "#E4B32F" };
const ACCENT = {
  vibecoder: PURPLE, saas_founder: GREEN, ai_agency: PURPLE,
  freelance_dev: GREEN, wp_agency: PURPLE, enterprise_gov: YELLOW, general: PURPLE,
};
const EYEBROW = {
  vibecoder: "For AI builders", saas_founder: "For SaaS founders", ai_agency: "For agencies",
  freelance_dev: "For freelance devs", wp_agency: "For WordPress teams",
  enterprise_gov: "Enterprise · KSA", general: "Managed cloud",
};

export function buildStoryboardHtml(video) {
  const aspect = DIMS[video.aspect] ? video.aspect : "16:9";
  const { w, h } = DIMS[aspect];
  const fps = video.fps ?? 30;
  const vertical = aspect === "9:16";
  const a = ACCENT[video.icp] ?? ACCENT.general;
  const eyebrow = EYEBROW[video.icp] ?? "Managed cloud";

  const beats = video.beats.map((b, i) => {
    const kind = SCENE_KINDS.includes(b.scene) ? b.scene : "generic";
    return { ...b, kind, ms: beatMs(b), idx: i };
  });
  const durationMs = beats.reduce((s, b) => s + b.ms, 0);

  const beatSections = beats
    .map((b, i) => {
      const isLast = i === beats.length - 1;
      const hl = esc(b.on_screen);
      const hlSize = b.on_screen.length > 46 ? 60 : b.on_screen.length > 28 ? 72 : 84;
      return `
      <section class="beat" data-idx="${i}">
        <div class="left">
          <div class="eyebrow"><span class="rule"></span>${esc(eyebrow)}</div>
          <h1 style="font-size:${hlSize}px">${hl}</h1>
          <div class="sub">${esc(b.narration)}</div>
          ${isLast && video.cta ? `<div class="cta">${esc(video.cta)}</div>` : ""}
        </div>
        <div class="right">
          <div class="viz"><svg viewBox="0 0 100 100">${sceneMotif(b.kind)}</svg></div>
        </div>
      </section>`;
    })
    .join("\n");

  const segs = beats.map((b) => `<div class="seg"><i></i></div>`).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<title>${esc(video.title)} — Kloudbean</title>
<style>
  :root{ --acc:${a.c}; --glow:${a.glow}; }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:#000f27}
  body{display:flex;align-items:center;justify-content:center;font-family:"Poppins",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  #stage{position:relative;width:${w}px;height:${h}px;overflow:hidden;background:#000f27;transform-origin:center;color:#fff}
  ${SCENE_CSS}
  .bg{position:absolute;inset:0;z-index:0}
  .g1{position:absolute;width:900px;height:900px;right:-180px;top:-260px;border-radius:50%;background:radial-gradient(closest-side,var(--glow)55,transparent 70%);filter:blur(26px)}
  .g2{position:absolute;width:760px;height:760px;left:-220px;bottom:-280px;border-radius:50%;background:radial-gradient(closest-side,#4F1AF340,transparent 70%);filter:blur(26px)}
  .grid{position:absolute;inset:0;opacity:.4;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:64px 64px;-webkit-mask-image:radial-gradient(120% 100% at 78% 12%,#000 20%,transparent 76%);mask-image:radial-gradient(120% 100% at 78% 12%,#000 20%,transparent 76%)}
  .vign{position:absolute;inset:0;box-shadow:inset 0 0 280px 80px rgba(0,5,18,.6)}

  .topbar{position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;padding:${vertical ? "40px 48px" : "48px 64px"}}
  .logo svg{height:${vertical ? "40px" : "46px"};width:auto;display:block}
  .badge{margin-left:auto;font-size:${vertical ? "22px" : "24px"};font-weight:500;color:#cdd6f4;border:1px solid #ffffff26;background:#ffffff0d;padding:9px 22px;border-radius:999px}

  .beat{position:absolute;inset:0;z-index:10;display:flex;flex-direction:${vertical ? "column-reverse" : "row"};align-items:center;
    padding:${vertical ? "150px 64px 150px" : "0 64px 0 88px"};opacity:0}
  .beat.active{opacity:1}
  .left{flex:${vertical ? "0 0 auto" : "1.12"};display:flex;flex-direction:column;justify-content:center;${vertical ? "text-align:center;align-items:center;" : ""}}
  .right{flex:${vertical ? "0 0 auto" : ".88"};display:flex;align-items:center;justify-content:center;${vertical ? "margin-bottom:40px;" : ""}}
  .eyebrow{display:flex;align-items:center;gap:16px;color:var(--acc);font-weight:600;font-size:${vertical ? "22px" : "24px"};letter-spacing:.15em;text-transform:uppercase;margin-bottom:26px}
  .eyebrow .rule{width:46px;height:3px;background:var(--acc);border-radius:3px}
  h1{font-weight:700;line-height:1.06;letter-spacing:-.02em;color:#fff;text-wrap:balance;max-width:${vertical ? "100%" : "980px"}}
  .sub{margin-top:${vertical ? "24px" : "30px"};font-size:${vertical ? "28px" : "30px"};line-height:1.45;color:#aeb6d4;font-weight:400;max-width:${vertical ? "100%" : "820px"}}
  .cta{margin-top:38px;align-self:${vertical ? "center" : "flex-start"};background:linear-gradient(135deg,#4F1AF3,#6c47ff);color:#fff;font-weight:700;font-size:30px;padding:16px 32px;border-radius:999px;box-shadow:0 20px 50px -12px rgba(79,26,243,.7)}

  .viz{position:relative;width:${vertical ? "440px" : "520px"};height:${vertical ? "440px" : "520px"};display:flex;align-items:center;justify-content:center}
  .viz::before{content:"";position:absolute;width:78%;height:78%;border-radius:50%;background:radial-gradient(closest-side,var(--glow)3d,transparent 72%);filter:blur(10px)}
  .viz svg{position:relative;width:88%;height:88%;overflow:visible}

  .foot{position:absolute;left:0;right:0;bottom:0;z-index:20;display:flex;align-items:center;padding:${vertical ? "40px 48px" : "44px 64px"};color:#cdd6f4}
  .handle{font-size:${vertical ? "22px" : "25px"};font-weight:500}
  .url{margin-left:auto;display:flex;align-items:center;gap:10px;font-size:${vertical ? "22px" : "25px"};font-weight:600;color:#fff}
  .url .arw{color:var(--acc)}

  .progress{position:absolute;top:0;left:0;right:0;z-index:30;display:flex;gap:6px;padding:14px 18px 0}
  .seg{flex:1;height:5px;background:rgba(255,255,255,.24);border-radius:99px;overflow:hidden}
  .seg i{display:block;height:100%;width:0;background:#fff;border-radius:99px}
</style></head>
<body>
  <div id="stage">
    <div class="bg"><div class="g1"></div><div class="g2"></div><div class="grid"></div><div class="vign"></div></div>
    <div class="progress">${segs}</div>
    <div class="topbar"><div class="logo">${LOGO_SVG}</div><div class="badge">${esc(video.icpName || "Kloudbean")}</div></div>
    ${beatSections}
    <div class="foot"><div class="handle">@kloudbean</div><div class="url"><span class="arw">→</span> kloudbean.com</div></div>
  </div>
<script>
  const FPS=${fps}, DURATION=${durationMs};
  const BEATS=${JSON.stringify(beats.map((b) => ({ ms: b.ms })))};
  const stage=document.getElementById('stage');
  const sections=[...document.querySelectorAll('.beat')];
  const segs=[...document.querySelectorAll('.seg i')];
  const isExport=new URLSearchParams(location.search).get('export')==='1';

  function fit(){ if(isExport){stage.style.transform='none';return;} const s=Math.min(window.innerWidth/${w},window.innerHeight/${h}); stage.style.transform='scale('+s+')'; }
  window.addEventListener('resize',fit); fit();

  const starts=[]; let acc=0; for(const b of BEATS){ starts.push(acc); acc+=b.ms; }

  function render(ms){
    const t=Math.max(0,Math.min(DURATION-1,ms));
    let idx=0; for(let i=0;i<BEATS.length;i++){ if(t>=starts[i]) idx=i; }
    const local=t-starts[idx];
    sections.forEach((el,i)=>el.classList.toggle('active',i===idx));
    const el=sections[idx];
    const h1=el.querySelector('h1'), sub=el.querySelector('.sub'), cta=el.querySelector('.cta');
    const ein=Math.min(1,local/520);
    if(h1){ h1.style.opacity=ein; h1.style.transform='translateY('+((1-ein)*24).toFixed(1)+'px)'; }
    if(sub){ const c=Math.min(1,local/560); sub.style.opacity=c; sub.style.transform='translateY('+((1-c)*16).toFixed(1)+'px)'; }
    if(cta){ const c=Math.min(1,Math.max(0,(local-500)/500)); cta.style.opacity=c; cta.style.transform='scale('+(0.92+0.08*c)+')'; }
    segs.forEach((s,i)=>{ s.style.width = i<idx?'100%': i>idx?'0%' : ((local/BEATS[idx].ms)*100)+'%'; });
  }

  window.__videoMeta={ durationMs:DURATION, fps:FPS, width:${w}, height:${h}, beats:BEATS.length };
  window.__seek=function(ms){ render(ms); try{ document.getAnimations().forEach(a=>{ try{a.pause();a.currentTime=ms;}catch(e){} }); }catch(e){} };

  if(!isExport){ const t0=performance.now(); (function loop(now){ render((now-t0)%DURATION); requestAnimationFrame(loop); })(performance.now()); }
  else { render(0); }
</script>
</body></html>`;
}
