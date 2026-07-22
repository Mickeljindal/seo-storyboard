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

function jsonLdScriptTags(blocks: object[]): string {
  if (!blocks?.length) return "";
  return blocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join("\n");
}

function howToHtml(howTo: { title: string; steps: string[] }): string {
  const items = howTo.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  return `<ol>${items}</ol>`;
}

function faqHtml(faq: { q: string; a: string }[]): string {
  return faq.map((f) => `<h3>${escapeHtml(f.q)}</h3>\n<p>${escapeHtml(f.a)}</p>`).join("\n");
}

function relatedHtml(related: { anchor: string; url: string }[]): string {
  if (!related.length) return "";
  const items = related
    .map((r) => `<li><a href="${escapeHtml(r.url)}">${escapeHtml(r.anchor)}</a></li>`)
    .join("");
  return `<ul>${items}</ul>`;
}

// --- markers so re-optimizing is idempotent (replace, never duplicate) -----

export const INTRO_MARKER = "kbseo-intro";
export const HOWTO_MARKER = "kbseo-howto";
export const FAQ_MARKER = "kbseo-faq";
export const RELATED_MARKER = "kbseo-related";
export const SCHEMA_MARKER = "kbseo-schema";

/** Wrap a fragment in a marker comment pair, so it can be found/replaced later. */
function marked(marker: string, html: string): string {
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
  related?: { anchor: string; url: string }[];
  schemaJsonld?: object[];
  flags?: InjectionFlags;
}): InjectionPlan {
  const { seo } = params;
  const related = params.related ?? [];
  const flags = params.flags ?? {};
  const prependParts: string[] = [];
  const appendParts: string[] = [];
  const added: string[] = [];

  // Intro (answer-first) — visible heading is H2, NOT H1.
  if (!flags.hasIntro && seo.intro_html) {
    prependParts.push(marked(INTRO_MARKER, `<h2>${escapeHtml(seo.h1)}</h2>\n${seo.intro_html}`));
    added.push("intro");
  }

  if (!flags.hasHowTo && seo.how_to?.steps?.length) {
    appendParts.push(
      marked(
        HOWTO_MARKER,
        `<h2>${escapeHtml(seo.how_to.title || "How to use this tool")}</h2>\n${howToHtml(seo.how_to)}`,
      ),
    );
    added.push("how_to");
  }

  if (!flags.hasFaq && seo.faq?.length) {
    appendParts.push(
      marked(FAQ_MARKER, `<h2>Frequently asked questions</h2>\n${faqHtml(seo.faq)}`),
    );
    added.push("faq");
  }

  if (related.length) {
    appendParts.push(
      marked(RELATED_MARKER, `<h2>Related free tools</h2>\n${relatedHtml(related)}`),
    );
    added.push("related");
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
  const markers = [INTRO_MARKER, HOWTO_MARKER, FAQ_MARKER, RELATED_MARKER, SCHEMA_MARKER];
  let cleaned = existingHtml;
  for (const m of markers) {
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
  hasFaq: boolean;
  hasJsonLd: boolean;
  hasGate: boolean;
  widgetTypes: string[];
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
    hasJsonLd: false,
    hasGate: false,
    widgetTypes: [],
  };

  const textParts: string[] = [];

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
          if (size === "h1") analysis.h1Count++;
          if (size === "h2") analysis.h2Count++;
        }
      } else if (el.widgetType === "text-editor" || el.widgetType === "theme-post-content") {
        textParts.push(stripTags(String(s.editor ?? "")));
      } else if (el.widgetType === "html") {
        analysis.htmlWidgetCount++;
        const html = String(s.html ?? "");
        if (/application\/ld\+json/i.test(html)) analysis.hasJsonLd = true;
        if (html.includes(GATE_MARKER)) analysis.hasGate = true;
        // HTML-widget text counts toward content, minus scripts/styles
        textParts.push(stripTags(html));
      } else if (el.widgetType === "accordion" || el.widgetType === "toggle") {
        const tabs = Array.isArray(s.tabs) ? (s.tabs as Record<string, unknown>[]) : [];
        for (const t of tabs) {
          textParts.push(
            stripTags(String(t.tab_title ?? "")),
            stripTags(String(t.tab_content ?? "")),
          );
        }
      }
    }
    for (const child of el.elements ?? []) walk(child);
  };

  for (const el of data) walk(el);

  const text = textParts.join(" ").replace(/\s+/g, " ").trim();
  analysis.textLength = text.length;
  analysis.wordCount = text ? text.split(/\s+/).length : 0;
  analysis.hasFaq =
    /frequently asked|faq\b/i.test(text) || analysis.widgetTypes.includes("accordion");

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
