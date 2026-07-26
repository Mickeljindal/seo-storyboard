/**
 * ELEMENTOR BUILDER
 *
 * Builds the `_elementor_data` JSON tree that WordPress + Elementor render.
 * Two jobs:
 *
 *  1. buildToolElementorData() — full page for a NEW tool: H1 + intro, the
 *     interactive tool (HTML widget), how-to, FAQ, related links, JSON-LD.
 *
 *  2. buildInjectionPlan() — for EXISTING pages, ADDITIVE raw HTML to inject
 *     directly INTO the page's existing HTML widget (the same single widget
 *     that already holds the tool) — never as separate native Elementor
 *     blocks (heading/text-editor widgets). This matches how these pages are
 *     actually built: one HTML widget per page, everything as raw HTML inside
 *     it. Content is wrapped in marker comments so re-optimizing a page is
 *     idempotent (old injected content is replaced, never duplicated), and it
 *     NEVER touches the tool's own markup or the page's slug/title.
 *
 * Pure functions, no I/O — safe to unit-test and run anywhere.
 */

import { buildGateHtml, GATE_MARKER, type GateConfig } from "./tool-gate";

export type ElementorElement = {
  id: string;
  elType: "section" | "column" | "widget" | "container";
  settings: Record<string, unknown>;
  elements: ElementorElement[];
  widgetType?: string;
  isInner?: boolean;
};

export type ToolSeoContent = {
  h1: string;
  intro_html: string;
  how_to: { title: string; steps: string[] };
  faq: { q: string; a: string }[];
};

let _idCounter = 0;
/** Elementor uses 7-char alphanumeric IDs. Keep them unique within a build. */
function genId(): string {
  const rand = Math.random().toString(36).slice(2, 7);
  const seq = (_idCounter++).toString(36).padStart(2, "0").slice(-2);
  return (rand + seq).slice(0, 7);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- widget factories -------------------------------------------------------

function widget(widgetType: string, settings: Record<string, unknown>): ElementorElement {
  return { id: genId(), elType: "widget", settings, elements: [], widgetType };
}

function headingWidget(title: string, size: "h1" | "h2" | "h3" = "h2"): ElementorElement {
  return widget("heading", { title, header_size: size });
}

function htmlWidget(html: string): ElementorElement {
  return widget("html", { html });
}

/** Wrap widgets in a single full-width column inside a section. */
function section(widgets: ElementorElement[]): ElementorElement {
  const column: ElementorElement = {
    id: genId(),
    elType: "column",
    settings: { _column_size: 100, _inline_size: null },
    elements: widgets,
  };
  return {
    id: genId(),
    elType: "section",
    settings: {},
    elements: [column],
  };
}

// --- shared content builders ------------------------------------------------
//
// IMPORTANT: this HTML gets spliced directly into an existing page's HTML
// widget, sometimes BEFORE the tool's own <style>/wrapper (prepended) and
// sometimes AFTER it closes (appended) — see spliceInjectionIntoWidgetHtml
// below. It therefore CANNOT rely on any surrounding CSS class (like the
// tool's own .kbt-wrap) to be in scope; a bare <h2>/<p>/<ul> renders in
// whatever color/background happens to be active at that point on the page
// (this is exactly why an injected intro rendered as invisible dark text on
// the page's dark hero section). Every injected section is wrapped via
// styledBlock(), which bundles its OWN scoped <style> tag (class-based, not
// per-tag inline, so multi-paragraph AI-authored HTML like intro_html can be
// dropped in unmodified) — self-contained no matter where it lands.

const INJECTED_CSS = `.kbseo-injected{font-family:'Poppins','Arial',sans-serif;line-height:1.6;color:#333;background:linear-gradient(135deg,#f9f9f9 0%,#f3f0ff 100%);padding:22px;border-radius:12px;margin:20px 0}
.kbseo-injected h2{font-size:1.5rem;color:#171717;font-weight:700;margin:0 0 14px}
.kbseo-injected h3{font-size:1.15rem;color:#171717;font-weight:600;margin:18px 0 8px}
.kbseo-injected p{font-size:1rem;color:#555;margin:0 0 16px}
.kbseo-injected ul,.kbseo-injected ol{margin:0 0 16px;padding-left:22px}
.kbseo-injected li{font-size:1rem;color:#333;margin-bottom:8px}
.kbseo-injected a{color:#4F1AF3;font-weight:500;text-decoration:none}`;

/**
 * Wrap a block in a self-contained, explicitly-styled container (light
 * gradient card matching the tool's own .kbt-wrap background) so it reads as
 * an intentional branded section instead of bare unstyled text, no matter
 * where in the page it ends up. Includes its own <style> tag every time
 * (cheap, and guarantees the block is correct even if it's the ONLY injected
 * section present — e.g. an intro-only prepend with no how-to/FAQ appended).
 */
export function styledBlock(innerHtml: string): string {
  return `<style>${INJECTED_CSS}</style><div class="kbseo-injected">${innerHtml}</div>`;
}

function jsonLdScriptTags(blocks: object[]): string {
  if (!blocks?.length) return "";
  return blocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join("\n");
}

export function howToHtml(howTo: { title: string; steps: string[] }): string {
  const items = howTo.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  return `<ol>${items}</ol>`;
}

function faqHtml(faq: { q: string; a: string }[]): string {
  return faq.map((f) => `<h3>${escapeHtml(f.q)}</h3>\n<p>${escapeHtml(f.a)}</p>`).join("\n");
}

/**
 * Exported so tool-template.ts (new-page assembly) renders "Related free
 * tools" identically to how the optimizer injects it into existing pages —
 * filters out any record with a blank anchor/url so a bad related-link
 * record never produces an empty <li><a></a></li> bullet.
 */
export function relatedHtml(related: { anchor: string; url: string }[]): string {
  const valid = related.filter((r) => r.anchor.trim() && r.url.trim());
  if (!valid.length) return "";
  const items = valid
    .map((r) => `<li><a href="${escapeHtml(r.url)}">${escapeHtml(r.anchor)}</a></li>`)
    .join("");
  return `<ul>${items}</ul>`;
}

// --- markers so re-optimizing is idempotent (replace, never duplicate) -----

export const INTRO_MARKER = "kbseo-intro";
export const BODY_MARKER = "kbseo-body";
export const HOWTO_MARKER = "kbseo-howto";
export const FAQ_MARKER = "kbseo-faq";
export const RELATED_MARKER = "kbseo-related";
export const GUIDES_MARKER = "kbseo-guides";
export const SCHEMA_MARKER = "kbseo-schema";

/** All markers this engine owns — the single source of truth for idempotent
 * strip/replace so adding a new injected block can't be forgotten in one place. */
const ALL_MARKERS = [
  INTRO_MARKER,
  BODY_MARKER,
  HOWTO_MARKER,
  FAQ_MARKER,
  RELATED_MARKER,
  GUIDES_MARKER,
  SCHEMA_MARKER,
];

/** Sanitize AI-authored section HTML for safe injection (no script/style/h1/class). */
function sanitizeInjectedHtml(html: string): string {
  return html
    .replace(/<\/?(?:script|style|h1|iframe|form|input|button)[^>]*>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\sclass="[^"]*"/gi, "");
}

/** Render semantic body sections (h2 + pre-sanitized inner html) as one block. */
function bodySectionsHtml(sections: { h2: string; html: string }[]): string {
  return sections
    .filter((s) => s.h2?.trim() && s.html?.trim())
    .map((s) => `<h2>${escapeHtml(s.h2)}</h2>\n${sanitizeInjectedHtml(s.html)}`)
    .join("\n");
}

/**
 * Wrap a fragment in a marker comment pair, so it can be found/replaced later.
 * Exported so tool-template.ts (new-page assembly) can wrap its how-to/related
 * blocks with the SAME markers + styling this file uses for existing-page
 * injection — otherwise a freshly generated page's how-to/related sections
 * would render fine on first publish (still inside .kbt-wrap) but go unstyled
 * the moment "Optimize" strips + re-splices them outside the wrapper.
 */
export function marked(marker: string, html: string): string {
  return `<!-- ${marker}:start -->\n${html}\n<!-- ${marker}:end -->`;
}

// --- 1. NEW tool page -------------------------------------------------------

/**
 * A new tool page = an Elementor heading widget (the H1 hero) + ONE HTML widget
 * holding the entire branded, self-contained block (tool + content + FAQ + banner
 * + JSON-LD), exactly like the existing kloudbean.com tool pages. The signup gate,
 * if enabled, is appended as a second HTML widget.
 */
export function buildToolElementorData(params: {
  /** The page H1 (hero heading). */
  h1: string;
  /** The fully assembled single-block tool HTML. */
  toolHtml: string;
  gate?: GateConfig | null;
}): ElementorElement[] {
  _idCounter = 0;
  const sections: ElementorElement[] = [];

  // H1 hero (separate heading widget, matching the live pages).
  if (params.h1) sections.push(section([headingWidget(params.h1, "h1")]));

  // The complete branded tool block in a single HTML widget.
  sections.push(section([htmlWidget(params.toolHtml)]));

  // Signup gate (separate widget so it can be toggled/stripped independently).
  if (params.gate) {
    sections.push(section([htmlWidget(buildGateHtml(params.gate))]));
  }

  return sections;
}

/** A standalone gate section (used to add the gate to an existing page). */
export function buildGateSection(config: GateConfig): ElementorElement {
  _idCounter = 0;
  return section([htmlWidget(buildGateHtml(config))]);
}

// --- 2. EXISTING page additive injection ------------------------------------
//
// IMPORTANT: these pages are built with ONE Elementor HTML widget holding all
// the tool's markup as raw HTML (never as separate native heading/text-editor
// widgets/sections). To stay consistent with that structure — and to avoid
// creating a second, disconnected content block that looks out of place next
// to the tool — the additive SEO content below is also raw HTML, meant to be
// spliced directly into the SAME widget's existing HTML string (prepended
// before it / appended after it), not inserted as new Elementor elements.

export type InjectionFlags = {
  /** Skip the intro section (page already has indexable intro text). */
  hasIntro?: boolean;
  /** Skip the FAQ section (page already has an FAQ). */
  hasFaq?: boolean;
  /** Skip the how-to section. */
  hasHowTo?: boolean;
};

export type InjectionPlan = {
  /** Raw HTML to splice in BEFORE the existing widget content (the intro block). */
  prependHtml: string;
  /** Raw HTML to splice in AFTER the existing widget content (how-to/FAQ/related/schema). */
  appendHtml: string;
  added: string[];
};

/**
 * Build an ADDITIVE injection plan for an existing tool page, as raw HTML
 * meant to be spliced into the SAME HTML widget the tool already lives in —
 * never as new native Elementor widgets. Headings inside use H2/H3 — never
 * H1 — so we never create a duplicate H1 on a page that may already rank.
 * The existing tool markup itself is never touched; this is pure addition
 * before/after it, wrapped in marker comments so re-running replaces the
 * previous injection instead of duplicating it.
 */
export function buildInjectionPlan(params: {
  seo: ToolSeoContent;
  /** Semantic body sections (h2 + inner html) — topical depth for the page. */
  sections?: { h2: string; html: string }[];
  /** Related OTHER TOOLS. */
  related?: { anchor: string; url: string }[];
  /** Related Kloudbean GUIDES/articles in the same cluster — topical-authority internal links. */
  relatedGuides?: { anchor: string; url: string }[];
  schemaJsonld?: object[];
  flags?: InjectionFlags;
}): InjectionPlan {
  const { seo } = params;
  const sections = params.sections ?? [];
  const related = params.related ?? [];
  const relatedGuides = params.relatedGuides ?? [];
  const flags = params.flags ?? {};
  const prependParts: string[] = [];
  const appendParts: string[] = [];
  const added: string[] = [];

  // Intro (answer-first) — visible heading is H2, NOT H1. Wrapped in a
  // self-contained styled block (styledBlock) since this can land ANYWHERE
  // on the page (see comment above jsonLdScriptTags) — without it, this is
  // the exact block that rendered invisible on the page's dark hero section.
  if (!flags.hasIntro && seo.intro_html) {
    const introInner = `<h2>${escapeHtml(seo.h1)}</h2>\n${seo.intro_html}`;
    prependParts.push(marked(INTRO_MARKER, styledBlock(introInner)));
    added.push("intro");
  }

  // Semantic body sections — topical-depth content (definitions, how it works,
  // common errors, comparisons) appended right after the tool, before how-to.
  if (sections.length) {
    const bodyInner = bodySectionsHtml(sections);
    if (bodyInner.trim()) {
      appendParts.push(marked(BODY_MARKER, styledBlock(bodyInner)));
      added.push("body");
    }
  }

  if (!flags.hasHowTo && seo.how_to?.steps?.length) {
    const howToInner = `<h2>${escapeHtml(seo.how_to.title || "How to use this tool")}</h2>\n${howToHtml(seo.how_to)}`;
    appendParts.push(marked(HOWTO_MARKER, styledBlock(howToInner)));
    added.push("how_to");
  }

  if (!flags.hasFaq && seo.faq?.length) {
    const faqInner = `<h2>Frequently asked questions</h2>\n${faqHtml(seo.faq)}`;
    appendParts.push(marked(FAQ_MARKER, styledBlock(faqInner)));
    added.push("faq");
  }

  if (related.length) {
    const relatedInnerHtml = relatedHtml(related);
    if (relatedInnerHtml) {
      const relatedInner = `<h2>Related free tools</h2>\n${relatedInnerHtml}`;
      appendParts.push(marked(RELATED_MARKER, styledBlock(relatedInner)));
      added.push("related");
    }
  }

  // Related GUIDES — internal links up into the topical silo (articles in the
  // same content cluster). Distinct from "related tools" so the topical intent
  // is explicit to readers and crawlers.
  if (relatedGuides.length) {
    const guidesInnerHtml = relatedHtml(relatedGuides);
    if (guidesInnerHtml) {
      const guidesInner = `<h2>Related guides</h2>\n${guidesInnerHtml}`;
      appendParts.push(marked(GUIDES_MARKER, styledBlock(guidesInner)));
      added.push("guides");
    }
  }

  const schemaTags = jsonLdScriptTags(params.schemaJsonld ?? []);
  if (schemaTags) {
    appendParts.push(marked(SCHEMA_MARKER, schemaTags));
    added.push("schema");
  }

  return {
    prependHtml: prependParts.join("\n"),
    appendHtml: appendParts.join("\n"),
    added,
  };
}

/**
 * Splice an injection plan's HTML directly into a widget's existing HTML
 * string. Idempotent: any previously-injected marker blocks (from an earlier
 * optimize run) are stripped first, so re-running never duplicates content —
 * it replaces the old injected version with the fresh one. The widget's own
 * original markup (everything NOT inside a kbseo-* marker) is never touched.
 */
export function spliceInjectionIntoWidgetHtml(existingHtml: string, plan: InjectionPlan): string {
  let cleaned = existingHtml;
  for (const m of ALL_MARKERS) {
    const re = new RegExp(`<!--\\s*${m}:start\\s*-->[\\s\\S]*?<!--\\s*${m}:end\\s*-->`, "g");
    cleaned = cleaned.replace(re, "").trim();
  }
  const parts = [plan.prependHtml, cleaned, plan.appendHtml].filter((p) => p && p.trim());
  return parts.join("\n\n");
}

// --- analysis of existing _elementor_data -----------------------------------

export type ElementorAnalysis = {
  ok: boolean;
  wordCount: number;
  textLength: number;
  h1Count: number;
  h2Count: number;
  headings: string[];
  htmlWidgetCount: number;
  /** True only when GENUINELY pre-existing FAQ content is present (i.e. NOT
   *  from our own kbseo-faq marker) — see comment on stripOwnMarkers below. */
  hasFaq: boolean;
  /** True when the page ALREADY has a how-to / step-by-step section of its own
   *  (not our kbseo-howto marker), so we don't inject a duplicate. */
  hasHowTo: boolean;
  hasJsonLd: boolean;
  hasGate: boolean;
  widgetTypes: string[];
  /** Word count of the HTML widget with our own kbseo-* injected blocks
   *  excluded — the number to compare "is this page thin" against, so a
   *  prior (possibly broken) injection never makes a thin page look padded
   *  enough to skip re-injecting the intro. */
  nonInjectedWordCount: number;
  /** Which of our own markers are already present (from a prior optimize/
   *  generate run) — always safe to re-splice/replace regardless of the
   *  hasFaq/hasIntro signals above, since marker-wrapped content is ours. */
  ownMarkers: {
    intro: boolean;
    body: boolean;
    howTo: boolean;
    faq: boolean;
    related: boolean;
    guides: boolean;
    schema: boolean;
  };
  /** True when a kbseo-* marker is present WITHOUT the self-contained
   *  "kbseo-injected" style wrapper — i.e. this page was injected before the
   *  styling fix shipped and needs re-optimizing to pick it up (its intro/
   *  how-to/FAQ/related content currently renders unstyled or invisible). */
  needsRestyle: boolean;
};

/** Accept a JSON string or an already-parsed array. */
export function parseElementorData(raw: unknown): ElementorElement[] {
  if (Array.isArray(raw)) return raw as ElementorElement[];
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ElementorElement[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

/**
 * Strip our OWN kbseo-* marker blocks out of an HTML widget's content before
 * it's used to detect "does this page already have an intro/FAQ/etc". This
 * matters because our own injected content matches the SAME text patterns
 * (e.g. "Frequently asked questions") the detector looks for — without this,
 * a page whose only "FAQ" is a previous (possibly broken/unstyled) injection
 * from THIS engine would be misread as "already has a hand-authored FAQ,
 * skip re-injecting", permanently locking in whatever bug shipped it.
 */
function stripOwnMarkers(html: string): string {
  let cleaned = html;
  for (const m of ALL_MARKERS) {
    const re = new RegExp(`<!--\\s*${m}:start\\s*-->[\\s\\S]*?<!--\\s*${m}:end\\s*-->`, "g");
    cleaned = cleaned.replace(re, "");
  }
  return cleaned;
}

/** Walk the tree and summarize what's already on the page (read-only). */
export function analyzeElementorData(raw: unknown): ElementorAnalysis {
  const data = parseElementorData(raw);
  const analysis: ElementorAnalysis = {
    ok: data.length > 0,
    wordCount: 0,
    textLength: 0,
    h1Count: 0,
    h2Count: 0,
    headings: [],
    htmlWidgetCount: 0,
    hasFaq: false,
    hasHowTo: false,
    hasJsonLd: false,
    hasGate: false,
    widgetTypes: [],
    nonInjectedWordCount: 0,
    ownMarkers: {
      intro: false,
      body: false,
      howTo: false,
      faq: false,
      related: false,
      guides: false,
      schema: false,
    },
    needsRestyle: false,
  };

  const textParts: string[] = [];
  const nonInjectedTextParts: string[] = [];

  const walk = (el: ElementorElement) => {
    if (el.elType === "widget" && el.widgetType) {
      analysis.widgetTypes.push(el.widgetType);
      const s = el.settings ?? {};
      if (el.widgetType === "heading") {
        const title = String(s.title ?? "");
        const size = String(s.header_size ?? "h2").toLowerCase();
        if (title) {
          analysis.headings.push(title);
          textParts.push(title);
          nonInjectedTextParts.push(title);
          if (size === "h1") analysis.h1Count++;
          if (size === "h2") analysis.h2Count++;
        }
      } else if (el.widgetType === "text-editor" || el.widgetType === "theme-post-content") {
        const t = stripTags(String(s.editor ?? ""));
        textParts.push(t);
        nonInjectedTextParts.push(t);
      } else if (el.widgetType === "html") {
        analysis.htmlWidgetCount++;
        const html = String(s.html ?? "");
        if (/application\/ld\+json/i.test(html)) analysis.hasJsonLd = true;
        if (html.includes(GATE_MARKER)) analysis.hasGate = true;
        if (html.includes(`${INTRO_MARKER}:start`)) analysis.ownMarkers.intro = true;
        if (html.includes(`${BODY_MARKER}:start`)) analysis.ownMarkers.body = true;
        if (html.includes(`${HOWTO_MARKER}:start`)) analysis.ownMarkers.howTo = true;
        if (html.includes(`${FAQ_MARKER}:start`)) analysis.ownMarkers.faq = true;
        if (html.includes(`${RELATED_MARKER}:start`)) analysis.ownMarkers.related = true;
        if (html.includes(`${GUIDES_MARKER}:start`)) analysis.ownMarkers.guides = true;
        if (html.includes(`${SCHEMA_MARKER}:start`)) analysis.ownMarkers.schema = true;
        // A content marker present WITHOUT the self-contained style wrapper
        // means it was injected by the OLD, unstyled version of this engine —
        // flag it for re-optimizing.
        const hasContentMarker = [
          INTRO_MARKER,
          BODY_MARKER,
          HOWTO_MARKER,
          FAQ_MARKER,
          RELATED_MARKER,
          GUIDES_MARKER,
        ].some((m) => html.includes(`${m}:start`));
        if (hasContentMarker && !html.includes("kbseo-injected")) analysis.needsRestyle = true;
        // HTML-widget text counts toward content, minus scripts/styles.
        textParts.push(stripTags(html));
        nonInjectedTextParts.push(stripTags(stripOwnMarkers(html)));
      } else if (el.widgetType === "accordion" || el.widgetType === "toggle") {
        const tabs = Array.isArray(s.tabs) ? (s.tabs as Record<string, unknown>[]) : [];
        for (const t of tabs) {
          const title = stripTags(String(t.tab_title ?? ""));
          const content = stripTags(String(t.tab_content ?? ""));
          textParts.push(title, content);
          nonInjectedTextParts.push(title, content);
        }
      }
    }
    for (const child of el.elements ?? []) walk(child);
  };

  for (const el of data) walk(el);

  const text = textParts.join(" ").replace(/\s+/g, " ").trim();
  analysis.textLength = text.length;
  analysis.wordCount = text ? text.split(/\s+/).length : 0;

  const nonInjectedText = nonInjectedTextParts.join(" ").replace(/\s+/g, " ").trim();
  analysis.nonInjectedWordCount = nonInjectedText ? nonInjectedText.split(/\s+/).length : 0;

  // hasFaq must reflect GENUINE pre-existing FAQ content, not our own prior
  // (possibly broken) kbseo-faq injection — otherwise a page would never get
  // re-optimized past whatever bug shipped its first injection.
  analysis.hasFaq =
    !analysis.ownMarkers.faq &&
    (/frequently asked|faq\b/i.test(nonInjectedText) || analysis.widgetTypes.includes("accordion"));

  // Same idea for a how-to section — detect a genuine pre-existing one (not our
  // own kbseo-howto marker) so we don't inject a SECOND "how to use" block
  // (the audit found two how-to H2s on a page from exactly this).
  analysis.hasHowTo =
    !analysis.ownMarkers.howTo &&
    /\bhow[\s-]?to\s+use\b|\bstep[\s-]?by[\s-]?step\b/i.test(nonInjectedText);

  return analysis;
}

/**
 * Find the first HTML widget in an Elementor tree (that's where the tool
 * lives — these pages use exactly one). Returns null if none found.
 */
export function findFirstHtmlWidget(elements: ElementorElement[]): ElementorElement | null {
  for (const el of elements) {
    if (el.elType === "widget" && el.widgetType === "html") return el;
    if (el.elements?.length) {
      const found = findFirstHtmlWidget(el.elements);
      if (found) return found;
    }
  }
  return null;
}
