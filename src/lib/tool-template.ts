/**
 * KLOUDBEAN TOOL TEMPLATE
 *
 * The fixed, branded shell that every generated tool page is assembled into, so
 * new tools look IDENTICAL to the existing kloudbean.com tool pages (e.g.
 * /a-b-test-calculator/). The design system, colors, FAQ styling and the
 * Kloudbean banner CTA are curated here — the AI only fills the tool body, the
 * working JS, the SEO content sections, and the FAQ.
 *
 * Output is ONE self-contained HTML block (style + markup + script + JSON-LD)
 * meant for a single Elementor HTML widget — matching how the live pages are built.
 */

import { howToHtml, relatedHtml, styledBlock } from "./elementor-builder";

/** Kloudbean design system (palette #4F1AF3 / #6D3EF7 / #B399FF), generic to any tool. */
export const KLOUDBEAN_TOOL_CSS = `
.kbt-wrap{font-family:'Poppins','Arial',sans-serif;line-height:1.6;color:#333;background:linear-gradient(135deg,#f9f9f9 0%,#f3f0ff 100%);padding:20px;border-radius:12px}
.kbt-wrap *{box-sizing:border-box}
.kbt-wrap h2{font-size:1.6rem;color:#171717;font-weight:700;margin:30px 0 15px}
.kbt-wrap h3{font-size:1.2rem;color:#171717;font-weight:600;margin:24px 0 12px}
.kbt-wrap p{font-size:1.05rem;color:#555;margin-bottom:18px}
.kbt-wrap ul,.kbt-wrap ol{margin:0 0 18px;padding-left:22px}
.kbt-wrap li{font-size:1rem;color:#333;margin-bottom:10px}
.kbt-card{background:#fff;border:1px solid rgba(79,26,243,.1);border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(79,26,243,.1);margin:20px 0}
.kbt-header{background:linear-gradient(135deg,rgba(79,26,243,.08) 0%,rgba(109,62,247,.05) 100%);padding:24px;text-align:center;border-bottom:1px solid rgba(79,26,243,.1)}
.kbt-header h2{font-size:1.8rem;margin:0 0 8px;color:#4F1AF3;font-weight:700}
.kbt-header p{font-size:1rem;color:#666;margin:0}
.kbt-body{padding:32px}
.kbt-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-bottom:24px}
.kbt-field{margin-bottom:16px}
.kbt-field label{display:block;margin-bottom:6px;font-weight:600;color:#4F1AF3;font-size:.95rem}
.kbt-field input,.kbt-field select,.kbt-field textarea{width:100%;padding:12px 16px;border:2px solid rgba(79,26,243,.15);border-radius:8px;font-size:14px;background:#fff;transition:all .3s ease}
.kbt-field input:focus,.kbt-field select:focus,.kbt-field textarea:focus{outline:none;border-color:#4F1AF3;box-shadow:0 0 0 3px rgba(79,26,243,.1)}
.kbt-field small{display:block;color:#666;font-size:.8rem;margin-top:4px}
.kbt-controls{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px}
.kbt-btn{background:linear-gradient(45deg,#4F1AF3,#6D3EF7,#B399FF);background-size:300% 300%;animation:kbtGrad 5s ease infinite;color:#fff;border:none;border-radius:8px;padding:12px 24px;font-size:1rem;font-weight:500;cursor:pointer;transition:all .3s ease;box-shadow:0 4px 15px rgba(79,26,243,.2)}
.kbt-btn:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(79,26,243,.4);color:#fff}
.kbt-btn.secondary{background:#fff;color:#4F1AF3;border:2px solid rgba(79,26,243,.2);animation:none;box-shadow:none}
@keyframes kbtGrad{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.kbt-status{padding:12px 16px;border-radius:10px;font-size:.9rem;margin-bottom:20px;font-weight:500;display:none}
.kbt-status.valid{background:rgba(40,200,64,.1);border:1px solid rgba(40,200,64,.3);color:#1a8d3b}
.kbt-status.invalid{background:rgba(255,95,87,.1);border:1px solid rgba(255,95,87,.3);color:#d73a31}
.kbt-status.warning{background:rgba(255,165,0,.1);border:1px solid rgba(255,165,0,.3);color:#cc7a00}
.kbt-results{background:linear-gradient(135deg,rgba(40,200,64,.05) 0%,rgba(40,200,64,.02) 100%);border:2px solid rgba(40,200,64,.2);border-radius:12px;padding:24px;margin-top:24px}
.kbt-results-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.kbt-result-card{background:#fff;border:1px solid rgba(79,26,243,.1);border-radius:10px;padding:16px}
.kbt-result-card h4{color:#4F1AF3;margin:0 0 12px;font-weight:600}
.kbt-result-item{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(79,26,243,.05)}
.kbt-result-item:last-child{border-bottom:none}
.kbt-result-label{font-weight:600;color:#333;font-size:.9rem}
.kbt-result-value{font-weight:700;color:#4F1AF3;font-family:'Menlo','Monaco','Courier New',monospace;font-size:.95rem}
.kbt-out{background:#fff;border:1px solid rgba(79,26,243,.1);border-radius:10px;padding:16px;font-family:'Menlo','Monaco','Courier New',monospace;font-size:.9rem;white-space:pre-wrap;word-break:break-word}
.kbt-footer{text-align:center;padding:18px 0;font-size:.85rem;color:#666;border-top:1px solid rgba(79,26,243,.1)}
.kbt-footer a{color:#4F1AF3;text-decoration:none;font-weight:500}
.kbt-faq{background:linear-gradient(135deg,rgba(79,26,243,.05) 0%,rgba(109,62,247,.03) 100%);padding:24px;border-radius:12px;margin-top:30px;border:1px solid rgba(79,26,243,.1)}
.kbt-faq h3{color:#4F1AF3;font-size:1.4rem;margin-bottom:14px}
.kbt-faq p{margin-bottom:14px}
.kbt-cta-row{text-align:center;margin:28px 0}
/* Kloudbean banner */
.kbt-banner{position:relative;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;font-family:'Poppins',sans-serif;padding:28px 20px;border-radius:12px;overflow:hidden;margin:30px 0;background:linear-gradient(135deg,#0d1028 0%,#1a1145 100%)}
.kbt-banner h3{color:#FFC107;font-size:22px;margin:0 0 10px;line-height:1.4}
.kbt-banner h3 span{color:#fff;font-weight:bold}
.kbt-banner p{color:#d6d6d6;font-size:15px;margin:0 0 18px}
.kbt-banner a{display:inline-block;background:linear-gradient(45deg,#4F1AF3,#6D3EF7,#B399FF);color:#fff;font-size:15px;font-weight:600;padding:12px 26px;border-radius:50px;text-decoration:none}
@media(max-width:768px){.kbt-body{padding:20px}.kbt-results-grid,.kbt-grid{grid-template-columns:1fr}.kbt-controls{flex-direction:column}}
`;

export type ToolPageParts = {
  /** Card sub-title under the tool header. */
  tagline: string;
  /** Inner HTML of the tool body (inputs/controls/results), using kbt-* classes. */
  toolBodyHtml: string;
  /** The tool's JavaScript (runs inside an IIFE; scoped to the wrapper). */
  toolJs: string;
  /** SEO content sections rendered after the tool. */
  contentSections: { h2: string; paragraphs?: string[]; bullets?: string[] }[];
  /** How-to steps, rendered marker-wrapped so the optimizer can find/replace it later without duplicating. */
  howTo?: { title: string; steps: string[] };
  faq: { q: string; a: string }[];
  /** Related-tool links, rendered marker-wrapped (same as the optimizer's "Related free tools" block). */
  related?: { anchor: string; url: string }[];
  /** Display name shown in the card header. */
  name: string;
  /** JSON-LD blocks to inline for GEO/rich results. */
  schemaJsonld?: object[];
  /** Optional extra HTML appended right after the tool (e.g. a signup gate widget). */
  extraHtml?: string;
  /** Audience-tailored Kloudbean pitch (shown in the banner + CTA block). */
  pitch?: string;
  /** CTA button label, tailored to the audience. */
  ctaLabel?: string;
  /** Attributed console URL for the CTA + banner (carries source params). */
  ctaHref?: string;
};

const DEFAULT_CTA_HREF = "https://console.kloudbean.com/register";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildBanner(pitch?: string, ctaHref?: string): string {
  const sub = pitch
    ? esc(pitch)
    : "Powerful, cost-effective managed cloud hosting for developers, founders and agencies.";
  return `<div class="kbt-banner"><div>
<h3><span>Build it here? Launch it on Kloudbean.</span></h3>
<p>${sub}</p>
<a href="${esc(ctaHref || DEFAULT_CTA_HREF)}" rel="noopener" target="_blank">Launch your server — Start Free</a>
</div></div>`;
}

function renderSections(sections: ToolPageParts["contentSections"]): string {
  return sections
    .map((s) => {
      const ps = (s.paragraphs ?? []).map((p) => `<p>${p}</p>`).join("\n");
      const lis = (s.bullets ?? []).map((b) => `<li>${b}</li>`).join("\n");
      const ul = lis ? `<ul>${lis}</ul>` : "";
      return `<h2>${esc(s.h2)}</h2>\n${ps}\n${ul}`;
    })
    .join("\n");
}

function renderFaq(faq: ToolPageParts["faq"]): string {
  if (!faq.length) return "";
  const items = faq.map((f) => `<p><strong>Q. ${esc(f.q)}</strong><br>${f.a}</p>`).join("\n");
  return `<div class="kbt-faq"><h3>Frequently asked questions</h3>\n${items}</div>`;
}

// Markers + rendering match elementor-builder.ts's kbseo-* markers/styledBlock
// exactly, so a page built by THIS template and later run through the
// optimizer's marker-strip/replace logic is handled identically — no
// special-casing between "new" and "existing" pages. Crucially, these two
// blocks are wrapped in a SELF-CONTAINED styled block (own <style> tag) even
// though they still sit inside .kbt-wrap right now — because the very first
// "Optimize" run on this page will strip + re-splice them OUTSIDE the wrapper
// (before/after the whole widget), where .kbt-wrap's CSS is no longer in
// scope. Without self-contained styling, that first optimize run would make
// a previously fine-looking section go unstyled.
const HOWTO_MARKER = "kbseo-howto";
const RELATED_MARKER = "kbseo-related";

function marked(marker: string, html: string): string {
  return `<!-- ${marker}:start -->\n${html}\n<!-- ${marker}:end -->`;
}

function renderHowTo(howTo?: ToolPageParts["howTo"]): string {
  if (!howTo?.steps?.length) return "";
  const inner = `<h2>${esc(howTo.title || "How to use this tool")}</h2>\n${howToHtml(howTo)}`;
  return marked(HOWTO_MARKER, styledBlock(inner));
}

function renderRelated(related?: ToolPageParts["related"]): string {
  if (!related?.length) return "";
  const listHtml = relatedHtml(related);
  if (!listHtml) return "";
  const inner = `<h2>Related free tools</h2>\n${listHtml}`;
  return marked(RELATED_MARKER, styledBlock(inner));
}

function jsonLdTags(blocks?: object[]): string {
  if (!blocks?.length) return "";
  return blocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join("\n");
}

/**
 * Assemble the full single-widget HTML block for a tool page — visually
 * identical to the existing Kloudbean tool pages.
 */
export function assembleToolPage(parts: ToolPageParts): string {
  return `<style>${KLOUDBEAN_TOOL_CSS}</style>
<div class="kbt-wrap">
  <div class="kbt-card">
    <div class="kbt-header">
      <h2>${esc(parts.name)}</h2>
      <p>${esc(parts.tagline)}</p>
    </div>
    <div class="kbt-body">
      <div id="kbt-status" class="kbt-status"></div>
      ${parts.toolBodyHtml}
    </div>
    <div class="kbt-footer">Powered by <a href="https://www.kloudbean.com" target="_blank" rel="noopener">Kloudbean</a> — your trusted managed cloud hosting partner.</div>
  </div>

  ${parts.extraHtml ?? ""}

  ${buildBanner(parts.pitch, parts.ctaHref)}

  ${renderSections(parts.contentSections)}

  ${renderHowTo(parts.howTo)}

  ${renderFaq(parts.faq)}

  ${renderRelated(parts.related)}

  <div class="kbt-cta-row"><a class="kbt-btn" href="${esc(parts.ctaHref || DEFAULT_CTA_HREF)}" target="_blank" rel="noopener">${esc(parts.ctaLabel || "Host with Kloudbean — Start Free")}</a></div>
</div>
${jsonLdTags(parts.schemaJsonld)}
<script>
(function(){
try{
${parts.toolJs}
}catch(e){console.error('Kloudbean tool error:',e);}
})();
</script>`;
}
