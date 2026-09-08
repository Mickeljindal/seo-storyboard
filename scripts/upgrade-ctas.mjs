// Upgrade the existing end-of-article CTAs to the premium, conversion-focused
// treatment: a price + trust note line, an animated background layer, a pulsing
// status dot, and a shine sweep on the button.
//
// The 11 topic variants (ai, move, fix, run, db, sec, wp, agency, gov, ksa, ent)
// and their per-article copy already exist and are already matched to the article.
// This does NOT rewrite them. It adds the two things that were missing:
//
//   1. A NOTE LINE. None of the 396 CTAs carried a price or a trust signal, which
//      is the single biggest conversion gap. Pricing is REGION-AWARE, because
//      Kloudbean provisions across 7 clouds at different prices: $8/mo is the
//      Linode entry point, and Linode has NO Saudi data centre, so in-Kingdom
//      hosting runs on GCP Dammam and starts at $36/mo. Quoting $8 on a Saudi
//      article is a promise the pricing page would break.
//   2. AN ANIMATION LAYER, matching the hand-built CTAs: a drifting grid, a
//      floating ambient glow, a pulsing dot, a button shine. All disabled under
//      prefers-reduced-motion.
//
// Idempotent: re-running skips anything already upgraded.
//
// Usage: node scripts/upgrade-ctas.mjs [--dry] [slug ...]
import fs from "node:fs";
import path from "node:path";

const ROOT = "content-studio";
const DRY = process.argv.includes("--dry");
const VARIANTS = ["ai", "move", "fix", "run", "db", "sec", "wp", "agency", "gov", "ksa", "ent"];

/** Saudi/in-Kingdom signals. These articles must quote the Dammam price. */
// Includes the Saudi regulators and frameworks, because an article about CSCC or
// SAMA is inherently about hosting inside the Kingdom.
const KSA_RE = /saudi|ksa|dammam|in-kingdom|pdpl|\bnca\b|cscc|\becc\b|\bccc\b|\bsama\b|vision ?2030|me-central2|riyadh|jeddah/i;
/** Geography only. Framework acronyms are deliberately excluded, see noteFor. */
const STRONG_KSA_G = /saudi|\bksa\b|dammam|in-kingdom|riyadh|jeddah|me-central2/gi;

/**
 * The note line: price first, then the two offers the owner approved
 * (free migration assistance, free trial).
 */
const ENTERPRISE_NOTE =
  "Enterprise from $7,500/mo, custom for wider scope &middot; Dedicated onboarding manager and DevOps engineer &middot; Free migration assistance";
const KSA_NOTE =
  "In-Kingdom plans from $36/mo on Google Cloud Dammam &middot; Free migration assistance &middot; Free trial";
const STANDARD_NOTE = "Plans from $8/mo &middot; Free migration assistance &middot; Free trial";
const BOTH_NOTE =
  "Plans from $8/mo, or from $36/mo for in-Kingdom hosting in Dammam &middot; Free migration assistance &middot; Free trial";

function noteFor(variant, slug, title, body) {
  if (variant === "ent") return ENTERPRISE_NOTE;

  // Whether this is a Saudi article is judged on STRONG geography terms only.
  // Framework acronyms (NCA, CSCC, PDPL) appear in general compliance sections of
  // articles that have nothing to do with hosting in the Kingdom, so counting them
  // put the Dammam price on a database-access explainer.
  const strong = (body.match(STRONG_KSA_G) ?? []).length;
  // The Kingdom is the SUBJECT only when the CTA variant says so or the title
  // says so. Deliberately not a word-count threshold: tuning a number was picking
  // the Dammam-only price for general provider comparisons that merely weigh the
  // region, which mismatches their pitch. Those fall through to BOTH_NOTE below,
  // which is accurate either way.
  const isSubject = variant === "ksa" || KSA_RE.test(`${slug} ${title}`);

  if (isSubject) return KSA_NOTE;

  // Saudi is a real theme here but not the subject (a provider comparison that
  // weighs Dammam, for instance). Quoting either price alone would mislead: $8 is
  // unavailable in the Kingdom, and $36 overstates the entry price everywhere
  // else. So state both, which is accurate and also sells the in-Kingdom option.
  if (strong >= 10) return BOTH_NOTE;

  // Government and compliance engagements are enterprise-scoped, so when such an
  // article is not Saudi-specific the enterprise note is the honest one rather
  // than the $8 self-serve entry price.
  if (variant === "gov") return ENTERPRISE_NOTE;

  return STANDARD_NOTE;
}

/** The animation + note CSS, scoped per variant so nothing leaks. */
function extraCss(v) {
  return `
/* --- premium layer: drifting grid, floating glow, pulse dot, button shine --- */
.kbcta-${v}-wrap::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);
  background-size:42px 42px;
  -webkit-mask-image:linear-gradient(to right,transparent,rgba(0,0,0,.6),transparent);
  mask-image:linear-gradient(to right,transparent,rgba(0,0,0,.6),transparent);
  opacity:.5;animation:kbcta-${v}-grid 18s linear infinite}
.kbcta-${v}-wrap::before{animation:kbcta-${v}-glow 8s ease-in-out infinite alternate}
.kbcta-${v}-dot{position:relative;width:7px;height:7px;flex:0 0 7px;margin-right:9px;border-radius:50%;background:#fff;animation:kbcta-${v}-pulse 2s infinite}
.kbcta-${v}-btn{position:relative;overflow:hidden}
.kbcta-${v}-btn::before{content:"";position:absolute;top:0;left:-120%;width:70%;height:100%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);
  animation:kbcta-${v}-shine 4.5s ease-in-out infinite}
.kbcta-${v}-btn:hover::before{animation-play-state:paused}
/* Carries the price, so it must not be the dimmest thing in the block. */
.kbcta-${v}-note{position:relative;z-index:3;margin:22px 0 0;font-size:13px;line-height:1.55;color:rgba(255,255,255,.74)}
@keyframes kbcta-${v}-grid{0%{transform:translate(0,0)}100%{transform:translate(42px,42px)}}
@keyframes kbcta-${v}-glow{0%{transform:translate(0,0) scale(1);opacity:.7}100%{transform:translate(-60px,-70px) scale(1.2);opacity:1}}
@keyframes kbcta-${v}-pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,.55)}70%{box-shadow:0 0 0 7px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}
@keyframes kbcta-${v}-shine{0%,55%{left:-120%}75%,100%{left:150%}}
@media(prefers-reduced-motion:reduce){
  .kbcta-${v}-wrap::before,.kbcta-${v}-wrap::after,.kbcta-${v}-dot,.kbcta-${v}-btn::before{animation:none!important}
}
@media(max-width:768px){.kbcta-${v}-note{font-size:12px}}`;
}

const titleOf = (html) =>
  html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";

const dirs = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && d.name !== "assets")
  .map((d) => d.name);

let argSlugs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targets = argSlugs.length ? argSlugs : dirs;

let upgraded = 0,
  skipped = 0,
  noCta = 0;
const byVariant = {};

for (const slug of targets) {
  const p = path.join(ROOT, slug, `${slug}.html`);
  if (!fs.existsSync(p)) continue;
  let html = fs.readFileSync(p, "utf8");

  const variant = VARIANTS.find((v) => html.includes(`class="kbcta-${v}-wrap"`));
  if (!variant) {
    noCta++;
    continue;
  }
  if (html.includes(`kbcta-${variant}-note`)) {
    skipped++;
    continue; // already upgraded
  }

  const title = titleOf(html);
  const before = html;

  // 1. note line, inserted right after the buttons row closes
  const btnBlock = new RegExp(
    `(<div class="kbcta-${variant}-buttons">[\\s\\S]*?<\\/div>)`,
  );
  if (btnBlock.test(html)) {
    html = html.replace(
      btnBlock,
      `$1\n    <p class="kbcta-${variant}-note">${noteFor(variant, slug, title, before)}</p>`,
    );
  }

  // 2. pulsing dot at the start of the eyebrow
  const eyebrow = new RegExp(`(<div class="kbcta-${variant}-eyebrow">)`);
  if (eyebrow.test(html))
    html = html.replace(eyebrow, `$1<span class="kbcta-${variant}-dot"></span>`);

  // 3. the animation CSS, appended to the CTA's own <style> block
  const anchor = `@media(max-width:768px){\n  .kbcta-${variant}-wrap{`;
  const idx = html.indexOf(anchor);
  if (idx >= 0) {
    const closeStyle = html.indexOf("</style>", idx);
    if (closeStyle > 0) html = html.slice(0, closeStyle) + extraCss(variant) + "\n" + html.slice(closeStyle);
  } else {
    // fall back to the last </style> before the CTA markup
    const ctaAt = html.indexOf(`class="kbcta-${variant}-wrap"`);
    const closeStyle = html.lastIndexOf("</style>", ctaAt);
    if (closeStyle > 0) html = html.slice(0, closeStyle) + extraCss(variant) + "\n" + html.slice(closeStyle);
  }

  if (html !== before) {
    upgraded++;
    byVariant[variant] = (byVariant[variant] ?? 0) + 1;
    if (!DRY) fs.writeFileSync(p, html);
  }
}

console.log(`${DRY ? "[DRY] " : ""}upgraded: ${upgraded} | already done: ${skipped} | no CTA: ${noCta}`);
console.log("by variant:", JSON.stringify(byVariant));
