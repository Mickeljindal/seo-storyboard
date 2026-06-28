/**
 * SIGNUP GATE
 *
 * A self-contained HTML+CSS+JS snippet that turns a free tool into a lead-gen
 * asset: human visitors must create / sign in to a Kloudbean account
 * (console.kloudbean.com) to keep using the tool.
 *
 * DESIGN PRINCIPLES:
 *  - CRAWLER-SAFE: search engine bots are never gated, so all SEO text + the
 *    tool stay indexable and rankings are protected. The gate is a UX layer for
 *    humans only.
 *  - NON-DESTRUCTIVE: it lives in its own widget and targets the tool container
 *    by heuristic — it never needs to know the tool's internals, so it works on
 *    both new and existing pages.
 *  - REMOVABLE: every gate carries GATE_MARKER so it can be detected and stripped.
 *
 * MODES:
 *  - "soft" (default): the tool is usable for `freeUses` interactions, then a
 *    modal requires an account to continue. Best for SEO + conversions.
 *  - "hard": the tool is locked behind the modal immediately. Maximum capture,
 *    higher bounce — use deliberately.
 */

export const GATE_MARKER = "kb-signup-gate";

export type GateConfig = {
  /** Signup/login base URL (Kloudbean console). */
  signupUrl?: string;
  mode?: "soft" | "hard";
  /** Free interactions before the gate triggers (soft mode). */
  freeUses?: number;
  /** Tool slug, passed to the signup URL as ?ref for attribution. */
  toolSlug?: string;
  /** Product name shown in copy. */
  brand?: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Build the gate HTML (markup + scoped CSS + JS) for embedding in an Elementor
 * HTML widget. Returns a single string.
 */
export function buildGateHtml(config: GateConfig = {}): string {
  const signupUrl = (config.signupUrl ?? "https://console.kloudbean.com").replace(/\/+$/, "");
  const mode = config.mode === "hard" ? "hard" : "soft";
  const freeUses = Math.max(0, config.freeUses ?? 1);
  const toolSlug = config.toolSlug ?? "";
  const brand = config.brand ?? "Kloudbean";

  // NOTE: kept dependency-free and scoped. The marker class lets us detect/strip
  // the gate later. data-* attributes carry config so the same JS works anywhere.
  return `<div class="${GATE_MARKER}" data-signup="${esc(signupUrl)}" data-mode="${mode}" data-free="${freeUses}" data-tool="${esc(toolSlug)}" data-brand="${esc(brand)}" aria-hidden="true"></div>
<style>
.kbg-modal{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(15,18,40,.72);backdrop-filter:blur(4px);padding:20px}
.kbg-modal.kbg-open{display:flex}
.kbg-card{max-width:420px;width:100%;background:#fff;color:#15172b;border-radius:16px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:inherit;text-align:center}
.kbg-badge{display:inline-block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6c47ff;font-weight:700;margin-bottom:10px}
.kbg-card h3{margin:0 0 8px;font-size:21px;line-height:1.25;color:#15172b}
.kbg-card p{margin:0 0 18px;font-size:14px;line-height:1.5;color:#4a4d68}
.kbg-btn{display:block;width:100%;box-sizing:border-box;padding:13px 18px;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;cursor:pointer;border:0}
.kbg-primary{background:#6c47ff;color:#fff;margin-bottom:10px}
.kbg-primary:hover{background:#5a38e0}
.kbg-secondary{background:transparent;color:#6c47ff;font-size:13px;padding:8px}
.kbg-secondary:hover{text-decoration:underline}
.kbg-note{margin-top:10px;font-size:11px;color:#8a8da6}
.kbg-locked{position:relative}
.kbg-locked .kbg-veil{position:absolute;inset:0;z-index:50;background:rgba(255,255,255,.55);backdrop-filter:blur(3px);border-radius:12px;display:flex;align-items:center;justify-content:center}
.kbg-veil-btn{background:#6c47ff;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-weight:600;font-size:14px;cursor:pointer}
</style>
<script>
(function(){
  var cfg=document.currentScript&&document.currentScript.previousElementSibling;
  if(!cfg||!cfg.classList||!cfg.classList.contains("${GATE_MARKER}")){cfg=document.querySelector(".${GATE_MARKER}");}
  if(!cfg)return;
  var signup=cfg.getAttribute("data-signup");
  var mode=cfg.getAttribute("data-mode")||"soft";
  var free=parseInt(cfg.getAttribute("data-free")||"1",10);
  var brand=cfg.getAttribute("data-brand")||"Kloudbean";
  var tool=cfg.getAttribute("data-tool")||"";
  var KEY="kb_tool_unlocked";

  // 1) Never gate crawlers — protects SEO/indexing.
  var ua=(navigator.userAgent||"").toLowerCase();
  if(/bot|crawl|spider|slurp|bingpreview|googlebot|google-inspectiontool|chrome-lighthouse|headless/.test(ua))return;

  // 2) Honor unlock from a return trip or a previous session.
  try{
    var qp=new URLSearchParams(location.search);
    if(qp.get("kb_unlocked")==="1"){localStorage.setItem(KEY,"1");}
    if(localStorage.getItem(KEY)==="1")return;
  }catch(e){}

  function buildReturn(){
    var sep=location.search?"&":"?";
    var ret=location.href.split("#")[0]+sep+"kb_unlocked=1";
    var u=signup+"/signup?ref=tool&tool="+encodeURIComponent(tool)+"&return="+encodeURIComponent(ret);
    return u;
  }

  // Conversion beacon — count signup-CTA clicks per tool (same-origin plugin).
  function fireHit(){
    try{
      var url=location.origin+"/wp-json/kbseo/v1/gate-hit?tool="+encodeURIComponent(tool);
      if(navigator.sendBeacon){navigator.sendBeacon(url);}else{fetch(url,{mode:"no-cors",keepalive:true});}
    }catch(e){}
  }

  // 3) Find the tool container (the widget with the most form controls).
  function findTool(){
    var candidates=[].slice.call(document.querySelectorAll('[class*="kb-tool-"], .elementor-widget-html .elementor-widget-container, .elementor-widget-html'));
    var best=null,bestScore=-1;
    candidates.forEach(function(el){
      if(el.querySelector(".${GATE_MARKER}")||(el.innerHTML||"").indexOf("application/ld+json")>-1)return;
      var n=el.querySelectorAll("input,select,textarea,button").length;
      if(n>bestScore){bestScore=n;best=el;}
    });
    return bestScore>0?best:null;
  }

  var modal=null;
  function makeModal(){
    if(modal)return modal;
    modal=document.createElement("div");
    modal.className="kbg-modal";
    modal.innerHTML='<div class="kbg-card" role="dialog" aria-modal="true">'+
      '<span class="kbg-badge">Free with a '+brand+' account</span>'+
      '<h3>Create your free account to keep using this tool</h3>'+
      '<p>Sign up in seconds at the '+brand+' console — no credit card needed. Your free account also unlocks every other tool on the site.</p>'+
      '<a class="kbg-btn kbg-primary" href="'+buildReturn()+'">Create free account</a>'+
      '<a class="kbg-btn kbg-secondary" href="'+signup+'/login?return='+encodeURIComponent(location.href)+'">I already have an account — log in</a>'+
      '<a class="kbg-btn kbg-secondary kbg-continue" href="#">I\\'ve created my account — continue</a>'+
      '<div class="kbg-note">You\\'ll be redirected to '+signup.replace(/^https?:\\/\\//,"")+'</div>'+
    '</div>';
    document.body.appendChild(modal);
    modal.querySelector(".kbg-continue").addEventListener("click",function(ev){
      ev.preventDefault();
      try{localStorage.setItem(KEY,"1");}catch(e){}
      closeModal();
    });
    var primary=modal.querySelector(".kbg-primary");
    if(primary)primary.addEventListener("click",fireHit);
    return modal;
  }
  function openModal(){makeModal().classList.add("kbg-open");}
  function closeModal(){if(modal)modal.classList.remove("kbg-open");if(toolEl)toolEl.classList.remove("kbg-locked");var v=toolEl&&toolEl.querySelector(".kbg-veil");if(v)v.remove();}

  var toolEl=findTool();
  if(!toolEl){return;}

  if(mode==="hard"){
    // Lock immediately with a veil over the tool.
    toolEl.classList.add("kbg-locked");
    var veil=document.createElement("div");
    veil.className="kbg-veil";
    veil.innerHTML='<button class="kbg-veil-btn" type="button">🔒 Sign up free to use this tool</button>';
    toolEl.appendChild(veil);
    veil.querySelector("button").addEventListener("click",openModal);
    return;
  }

  // soft: allow a few interactions, then gate.
  var uses=0,gated=false;
  function onUse(){
    if(gated)return;
    uses++;
    if(uses>free){gated=true;openModal();}
  }
  toolEl.addEventListener("click",function(e){
    var t=e.target;
    if(t&&(t.tagName==="BUTTON"||t.tagName==="A"||(t.tagName==="INPUT"&&(t.type==="submit"||t.type==="button")))){onUse();}
  },true);
  toolEl.addEventListener("change",onUse,true);
})();
</script>`;
}
