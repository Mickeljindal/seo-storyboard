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

  .beat{position:absolute;inset:0;z-index:10;display:flex;flex-direction:${vertical ? "column-reverse" : "row"};align-items:center;justify-content:center;
    padding:${vertical ? "170px 72px" : "0 64px 0 88px"};gap:${vertical ? "40px" : "0"};opacity:0}
  .beat.active{opacity:1}
  .left{flex:${vertical ? "0 0 auto" : "1.12"};display:flex;flex-direction:column;justify-content:center;${vertical ? "text-align:center;align-items:center;" : ""}}
  .right{flex:${vertical ? "0 0 auto" : ".88"};display:flex;align-items:center;justify-content:center}
  .eyebrow{display:flex;align-items:center;gap:16px;color:var(--acc);font-weight:600;font-size:${vertical ? "22px" : "24px"};letter-spacing:.15em;text-transform:uppercase;margin-bottom:26px}
  .eyebrow .rule{width:46px;height:3px;background:var(--acc);border-radius:3px}
  h1{font-weight:700;line-height:1.06;letter-spacing:-.02em;color:#fff;text-wrap:balance;max-width:${vertical ? "100%" : "980px"}}
  .sub{margin-top:${vertical ? "24px" : "30px"};font-size:${vertical ? "28px" : "30px"};line-height:1.45;color:#aeb6d4;font-weight:400;max-width:${vertical ? "100%" : "820px"}}
  .cta{margin-top:38px;align-self:${vertical ? "center" : "flex-start"};background:linear-gradient(135deg,#4F1AF3,#6c47ff);color:#fff;font-weight:700;font-size:30px;padding:16px 32px;border-radius:999px;box-shadow:0 20px 50px -12px rgba(79,26,243,.7)}

  .viz{position:relative;width:${vertical ? "540px" : "520px"};height:${vertical ? "540px" : "520px"};display:flex;align-items:center;justify-content:center}
  .viz::before{content:"";position:absolute;width:78%;height:78%;border-radius:50%;background:radial-gradient(closest-side,var(--glow)3d,transparent 72%);filter:blur(10px)}
  .viz svg{position:relative;width:88%;height:88%;overflow:visible}

  .foot{position:absolute;left:0;right:0;bottom:0;z-index:20;display:flex;align-items:center;padding:${vertical ? "40px 48px" : "44px 64px"};color:#cdd6f4}
  .handle{font-size:${vertical ? "22px" : "25px"};font-weight:500}
  .url{margin-left:auto;display:flex;align-items:center;gap:10px;font-size:${vertical ? "22px" : "25px"};font-weight:600;color:#fff}
  .url .arw{color:var(--acc)}

  .progress{position:absolute;top:0;left:0;right:0;z-index:30;display:flex;gap:6px;padding:14px 18px 0}
  .seg{flex:1;height:5px;background:rgba(255,255,255,.24);border-radius:99px;overflow:hidden}
  .seg i{display:block;height:100%;width:0;background:#fff;border-radius:99px}

  /* Download toolbar — screen only, never part of the exported frame */
  .rs-tools{position:fixed;right:16px;bottom:16px;z-index:99999;display:flex;gap:10px;align-items:center;font-family:"Poppins",-apple-system,BlinkMacSystemFont,sans-serif}
  .rs-tools .st{color:#aeb6d4;font-size:13px;font-weight:500;max-width:240px;text-align:right;line-height:1.35}
  .rs-tools button{cursor:pointer;border:1px solid #ffffff2e;background:#0b1c40ee;color:#fff;font:600 14px/1 "Poppins",sans-serif;padding:12px 16px;border-radius:10px;box-shadow:0 12px 34px -12px rgba(0,0,0,.75);transition:background .15s ease}
  .rs-tools button:hover{background:#16295e}
  .rs-tools button:disabled{opacity:.5;cursor:default}
  @media print{.rs-tools{display:none}}
</style></head>
<body>
  <div id="stage">
    <div class="bg"><div class="g1"></div><div class="g2"></div><div class="grid"></div><div class="vign"></div></div>
    <div class="progress">${segs}</div>
    <div class="topbar"><div class="logo">${LOGO_SVG}</div><div class="badge">${esc(video.icpName || "Kloudbean")}</div></div>
    ${beatSections}
    <div class="foot"><div class="handle">@kloudbean</div><div class="url"><span class="arw">→</span> kloudbean.com</div></div>
  </div>
  <div class="rs-tools" id="rsTools">
    <span class="st" id="rsStatus"></span>
    <button id="rsSlides" title="Download one branded PNG per slide">Download slides</button>
    <button id="rsVideo" title="Record the reel and download it as a video you can upload">Download video</button>
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

  // ── In-browser export: download the reel as a video (MP4/WebM) or per-slide PNGs.
  // Re-draws the storyboard on a canvas (reusing the page's own motif SVGs + the
  // loaded Poppins font) so nothing external is needed. Hidden during ?export=1.
  if(isExport){ var _tb=document.getElementById('rsTools'); if(_tb&&_tb.parentNode){ _tb.parentNode.removeChild(_tb); } }
  else { (function(){
    var W=${w}, H=${h}, VERT=${vertical ? "true" : "false"};
    var ACC=${JSON.stringify(a.c)}, GLOW=${JSON.stringify(a.glow)};
    var SLUG=${JSON.stringify(video.slug)}, EYE=${JSON.stringify(eyebrow)}, BADGE=${JSON.stringify(video.icpName || "Kloudbean")}, CTA=${JSON.stringify(video.cta || "")};
    var BEATX=${JSON.stringify(beats.map((b) => ({ on: b.on_screen, sub: b.narration })))};
    var statusEl=document.getElementById('rsStatus');
    var btnSlides=document.getElementById('rsSlides');
    var btnVideo=document.getElementById('rsVideo');
    if(!btnVideo||!btnSlides) return;

    function hexA(h,al){h=String(h).replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];var n=parseInt(h,16);return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+al+')';}
    function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
    function wrap(c,text,maxW){var words=String(text).split(/\\s+/),lines=[],line='';for(var i=0;i<words.length;i++){var t=line?line+' '+words[i]:words[i];if(c.measureText(t).width>maxW&&line){lines.push(line);line=words[i];}else{line=t;}}if(line){lines.push(line);}return lines;}
    function loadImg(src){return new Promise(function(res,rej){var im=new Image();im.onload=function(){res(im);};im.onerror=rej;im.src=src;});}
    function svg2img(el,injectVars){
      var clone=el.cloneNode(true);
      clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
      var vb=(clone.getAttribute('viewBox')||'0 0 100 100').split(/\\s+/).map(Number);
      clone.setAttribute('width',vb[2]||100);clone.setAttribute('height',vb[3]||100);
      var s=new XMLSerializer().serializeToString(clone);
      if(injectVars){ s=s.replace(/<svg([^>]*)>/, '<svg$1><style>*{--acc:'+ACC+';--glow:'+GLOW+'}</style>'); }
      return loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s));
    }
    var ASSETS=null;
    function prepareAssets(){
      if(ASSETS){ return Promise.resolve(ASSETS); }
      var fp=(document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();
      return fp['catch'](function(){}).then(function(){
        var jobs=[];
        var logoEl=document.querySelector('.logo svg');
        jobs.push(logoEl?svg2img(logoEl,false)['catch'](function(){return null;}):Promise.resolve(null));
        for(var i=0;i<sections.length;i++){ (function(el){ var m=el.querySelector('.viz svg'); jobs.push(m?svg2img(m,true)['catch'](function(){return null;}):Promise.resolve(null)); })(sections[i]); }
        return Promise.all(jobs).then(function(imgs){ ASSETS={logo:imgs[0],motifs:imgs.slice(1)}; return ASSETS; });
      });
    }
    function paint(ctx,tMs){
      var t=Math.max(0,Math.min(DURATION-1,tMs));
      var idx=0; for(var i=0;i<BEATS.length;i++){ if(t>=starts[i]){ idx=i; } }
      var local=t-starts[idx], beat=BEATX[idx]||{on:'',sub:''}, isLast=idx===BEATS.length-1, A=ASSETS||{};
      ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.textBaseline='alphabetic';
      ctx.fillStyle='#000f27'; ctx.fillRect(0,0,W,H);
      var g=ctx.createRadialGradient(W-180,-40,0,W-180,-40,720); g.addColorStop(0,hexA(GLOW,0.32)); g.addColorStop(1,hexA(GLOW,0)); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      g=ctx.createRadialGradient(-120,H+80,0,-120,H+80,780); g.addColorStop(0,'rgba(79,26,243,0.22)'); g.addColorStop(1,'rgba(79,26,243,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.32,W/2,H/2,Math.max(W,H)*0.72); g.addColorStop(0,'rgba(0,5,18,0)'); g.addColorStop(1,'rgba(0,5,18,0.5)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      var mimg=(A.motifs||[])[idx];
      if(mimg){ var size=VERT?560:500; var bob=Math.sin(t/900+idx)*(size*0.012); var cx=VERT?W/2:W*0.72; var cy=(VERT?H*0.33:H*0.5)+bob;
        var gg=ctx.createRadialGradient(cx,cy,0,cx,cy,size*0.5); gg.addColorStop(0,hexA(GLOW,0.22)); gg.addColorStop(0.72,hexA(GLOW,0)); ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(cx,cy,size*0.5,0,7); ctx.fill();
        ctx.drawImage(mimg,cx-size/2,cy-size/2,size,size); }
      var pX=18,pW=W-36,pH=5,pY=16,n=BEATS.length,gap=6,segW=(pW-gap*(n-1))/n;
      for(var s2=0;s2<n;s2++){ var xx=pX+s2*(segW+gap); ctx.fillStyle='rgba(255,255,255,0.24)'; rr(ctx,xx,pY,segW,pH,pH/2); ctx.fill(); var fr=s2<idx?1:(s2>idx?0:local/BEATS[idx].ms); if(fr>0){ ctx.fillStyle='#fff'; rr(ctx,xx,pY,Math.max(pH,segW*Math.min(1,fr)),pH,pH/2); ctx.fill(); } }
      var barX=VERT?48:64, barTop=VERT?40:48, logoH=VERT?40:46;
      if(A.logo){ var lw=A.logo.naturalWidth||A.logo.width||180, lh=A.logo.naturalHeight||A.logo.height||46, sc=logoH/lh; ctx.drawImage(A.logo,barX,barTop,lw*sc,logoH); }
      ctx.font='500 '+(VERT?22:24)+'px Poppins,sans-serif'; var bt=BADGE, btw=ctx.measureText(bt).width, bpw=btw+44, bph=42, bx=W-barX-bpw, by=barTop+(logoH-bph)/2;
      ctx.fillStyle='rgba(255,255,255,0.05)'; rr(ctx,bx,by,bpw,bph,bph/2); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.16)'; ctx.lineWidth=1; rr(ctx,bx,by,bpw,bph,bph/2); ctx.stroke();
      ctx.fillStyle='#cdd6f4'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(bt,bx+22,by+bph/2+1); ctx.textBaseline='alphabetic';
      var tx=VERT?W/2:88, maxW=VERT?(W-144):Math.min(980,W*0.54-88);
      var h1px=beat.on.length>46?60:(beat.on.length>28?72:84), subpx=VERT?28:30, eyePx=VERT?22:24;
      ctx.font='700 '+h1px+'px Poppins,sans-serif'; var h1lines=wrap(ctx,beat.on,maxW);
      ctx.font='400 '+subpx+'px Poppins,sans-serif'; var sublines=wrap(ctx,beat.sub,maxW);
      var h1LH=h1px*1.08, subLH=subpx*1.45;
      var blockH=eyePx+(VERT?24:28)+h1lines.length*h1LH+24+sublines.length*subLH+((isLast&&CTA)?100:0);
      var y=VERT?H*0.54:Math.max(150,(H-blockH)/2+20);
      var ein=Math.min(1,local/520), csub=Math.min(1,local/560);
      ctx.save(); ctx.globalAlpha=Math.min(1,local/380); ctx.font='600 '+eyePx+'px Poppins,sans-serif'; ctx.fillStyle=ACC;
      try{ctx.letterSpacing='0.14em';}catch(e){}
      if(VERT){ ctx.textAlign='center'; ctx.fillText(EYE.toUpperCase(),W/2,y+eyePx); }
      else{ ctx.textAlign='left'; ctx.fillRect(tx,y+eyePx*0.5-1,46,3); ctx.fillText(EYE.toUpperCase(),tx+62,y+eyePx); }
      try{ctx.letterSpacing='0px';}catch(e){}
      ctx.restore();
      y+=eyePx+(VERT?24:28);
      ctx.save(); ctx.globalAlpha=ein; ctx.translate(0,(1-ein)*24); ctx.font='700 '+h1px+'px Poppins,sans-serif'; ctx.fillStyle='#fff'; ctx.textAlign=VERT?'center':'left';
      var yy=y; for(var a1=0;a1<h1lines.length;a1++){ ctx.fillText(h1lines[a1],tx,yy+h1px); yy+=h1LH; }
      ctx.restore();
      y+=h1lines.length*h1LH+24;
      ctx.save(); ctx.globalAlpha=csub; ctx.translate(0,(1-csub)*16); ctx.font='400 '+subpx+'px Poppins,sans-serif'; ctx.fillStyle='#aeb6d4'; ctx.textAlign=VERT?'center':'left';
      var ys=y; for(var a2=0;a2<sublines.length;a2++){ ctx.fillText(sublines[a2],tx,ys+subpx); ys+=subLH; }
      ctx.restore();
      y+=sublines.length*subLH;
      if(isLast&&CTA){ var cq=Math.min(1,Math.max(0,(local-500)/500)); ctx.save(); ctx.globalAlpha=cq; ctx.font='700 30px Poppins,sans-serif';
        var tw=ctx.measureText(CTA).width, pw=tw+64, ph=62, px=VERT?(W/2-pw/2):tx, py=y+38, scc=0.92+0.08*cq;
        ctx.translate(px+pw/2,py+ph/2); ctx.scale(scc,scc); ctx.translate(-(px+pw/2),-(py+ph/2));
        var lg=ctx.createLinearGradient(px,py,px+pw,py+ph); lg.addColorStop(0,'#4F1AF3'); lg.addColorStop(1,'#6c47ff'); ctx.fillStyle=lg; rr(ctx,px,py,pw,ph,ph/2); ctx.fill();
        ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(CTA,px+pw/2,py+ph/2+1); ctx.textBaseline='alphabetic'; ctx.restore(); }
      var fY=H-(VERT?40:44)-14; ctx.textBaseline='middle';
      ctx.font='500 '+(VERT?22:25)+'px Poppins,sans-serif'; ctx.fillStyle='#cdd6f4'; ctx.textAlign='left'; ctx.fillText('@kloudbean',barX,fY);
      var uf=VERT?22:25; ctx.font='600 '+uf+'px Poppins,sans-serif'; var url='kloudbean.com', arrow='\\u2192 '; var uw=ctx.measureText(url).width, aw=ctx.measureText(arrow).width, ux=W-barX-uw-aw;
      ctx.fillStyle=ACC; ctx.fillText(arrow,ux,fY); ctx.fillStyle='#fff'; ctx.fillText(url,ux+aw,fY); ctx.textBaseline='alphabetic';
    }
    function setStatus(s){ if(statusEl){ statusEl.textContent=s||''; } }
    function dl(blob,name){ var u=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=u; a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ if(a.parentNode){a.parentNode.removeChild(a);} URL.revokeObjectURL(u); },1500); }
    function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
    function pad2(k){ return k<10?('0'+k):(''+k); }

    btnSlides.addEventListener('click',function(){
      btnSlides.disabled=true; btnVideo.disabled=true; setStatus('Preparing slides\\u2026');
      prepareAssets().then(function(){
        var cv=document.createElement('canvas'); cv.width=W; cv.height=H; var ctx=cv.getContext('2d');
        var i=0; (function next(){
          if(i>=BEATS.length){ setStatus('Saved '+BEATS.length+' slides.'); btnSlides.disabled=false; btnVideo.disabled=false; setTimeout(function(){setStatus('');},4000); return; }
          paint(ctx,starts[i]+BEATS[i].ms-1);
          cv.toBlob(function(b){ if(b){ dl(b,SLUG+'-'+pad2(i+1)+'.png'); } i++; setStatus('Saved slide '+i+' / '+BEATS.length+'\\u2026'); sleep(250).then(next); },'image/png');
        })();
      })['catch'](function(e){ setStatus('Slides failed: '+((e&&e.message)||e)); btnSlides.disabled=false; btnVideo.disabled=false; });
    });

    function pickMime(){ var c=['video/mp4;codecs=avc1.4d002a','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']; for(var i=0;i<c.length;i++){ try{ if(window.MediaRecorder&&MediaRecorder.isTypeSupported(c[i])){ return c[i]; } }catch(e){} } return ''; }
    btnVideo.addEventListener('click',function(){
      if(!window.MediaRecorder){ setStatus('This browser can\\u2019t record video \\u2014 use \\u201cDownload slides\\u201d.'); return; }
      btnSlides.disabled=true; btnVideo.disabled=true; setStatus('Preparing\\u2026');
      prepareAssets().then(function(){
        var cv=document.createElement('canvas'); cv.width=W; cv.height=H; cv.style.position='fixed'; cv.style.left='-99999px'; cv.style.top='0'; document.body.appendChild(cv);
        var ctx=cv.getContext('2d'); paint(ctx,0);
        var stream=cv.captureStream(FPS); var mime=pickMime();
        var rec; try{ rec=new MediaRecorder(stream, mime?{mimeType:mime,videoBitsPerSecond:9000000}:{videoBitsPerSecond:9000000}); }catch(e){ setStatus('Recorder error: '+e.message); btnSlides.disabled=false; btnVideo.disabled=false; if(cv.parentNode){cv.parentNode.removeChild(cv);} return; }
        var chunks=[]; rec.ondataavailable=function(e){ if(e.data&&e.data.size){ chunks.push(e.data); } };
        rec.onstop=function(){ var isMp4=(mime&&mime.indexOf('mp4')>=0); var type=isMp4?'video/mp4':'video/webm'; var blob=new Blob(chunks,{type:type}); dl(blob,SLUG+(isMp4?'.mp4':'.webm')); if(cv.parentNode){cv.parentNode.removeChild(cv);} setStatus('Saved '+(isMp4?'MP4':'WebM')+'.'); btnSlides.disabled=false; btnVideo.disabled=false; setTimeout(function(){setStatus('');},6000); };
        rec.start(250); var t0=performance.now();
        (function loop(now){ var t=now-t0; paint(ctx,Math.min(t,DURATION-1)); var pct=Math.min(100,Math.round(t/DURATION*100)); setStatus('Recording\\u2026 '+pct+'%'); if(t>=DURATION+140){ try{rec.stop();}catch(e){} return; } requestAnimationFrame(loop); })(performance.now());
      })['catch'](function(e){ setStatus('Record failed: '+((e&&e.message)||e)); btnSlides.disabled=false; btnVideo.disabled=false; });
    });
  })(); }
</script>
</body></html>`;
}
