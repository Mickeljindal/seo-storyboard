/**
 * ELEMENTOR BUILDER
 *
 * Builds the `_elementor_data` JSON tree that WordPress + Elementor render.
 * Two jobs:
 *
 *  1. buildToolElementorData() — full page for a NEW tool: H1 + intro, the
 *     interactive tool (HTML widget), how-to, FAQ, related links, JSON-LD.
 *
 *  2. buildInjectionPlan() — for EXISTING pages, an ADDITIVE plan: extra sections
 *     to prepend (intro) and append (how-to, FAQ, related, JSON-LD). It NEVER
 *     contains the tool itself and NEVER touches the existing widgets or slug.
 *     Injected section titles use H2/H3 only — we never add a second H1 to a page
 *     that may already rank.
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

function textWidget(html: string): ElementorElement {
  return widget("text-editor", { editor: html });
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

// --- 1. NEW tool page -------------------------------------------------------

export function buildToolElementorData(params: {
  seo: ToolSeoContent;
  toolHtml: string;
  related?: { anchor: string; url: string }[];
  schemaJsonld?: object[];
  gate?: GateConfig | null;
}): ElementorElement[] {
  _idCounter = 0;
  const { seo, toolHtml } = params;
  const related = params.related ?? [];
  const sections: ElementorElement[] = [];

  // H1 + answer-first intro
  sections.push(section([headingWidget(seo.h1, "h1"), textWidget(seo.intro_html)]));

  // The interactive tool itself
  sections.push(section([htmlWidget(toolHtml)]));

  // Signup gate (placed right after the tool so its targeting picks the tool).
  if (params.gate) {
    sections.push(section([htmlWidget(buildGateHtml(params.gate))]));
  }

  // How to use
  if (seo.how_to?.steps?.length) {
    sections.push(
      section([
        headingWidget(seo.how_to.title || "How to use this tool", "h2"),
        textWidget(howToHtml(seo.how_to)),
      ]),
    );
  }

  // FAQ
  if (seo.faq?.length) {
    sections.push(
      section([headingWidget("Frequently asked questions", "h2"), textWidget(faqHtml(seo.faq))]),
    );
  }

  // Related tools
  if (related.length) {
    sections.push(
      section([headingWidget("Related free tools", "h2"), textWidget(relatedHtml(related))]),
    );
  }

  // JSON-LD (own HTML widget so schema ships regardless of the SEO plugin)
  const schemaTags = jsonLdScriptTags(params.schemaJsonld ?? []);
  if (schemaTags) {
    sections.push(section([htmlWidget(schemaTags)]));
  }

  return sections;
}

/** A standalone gate section (used to add the gate to an existing page). */
export function buildGateSection(config: GateConfig): ElementorElement {
  _idCounter = 0;
  return section([htmlWidget(buildGateHtml(config))]);
}

// --- 2. EXISTING page additive injection ------------------------------------

export type InjectionFlags = {
  /** Skip the intro section (page already has indexable intro text). */
  hasIntro?: boolean;
  /** Skip the FAQ section (page already has an FAQ). */
  hasFaq?: boolean;
  /** Skip the how-to section. */
  hasHowTo?: boolean;
};

export type InjectionPlan = {
  prepend: ElementorElement[];
  append: ElementorElement[];
  added: string[];
};

/**
 * Build an ADDITIVE injection plan for an existing tool page.
 * - `prepend` goes BEFORE existing content (the intro/answer block).
 * - `append` goes AFTER existing content (how-to, FAQ, related, schema).
 * Section titles use H2/H3 — never H1 — so we never create a duplicate H1 on a
 * page that may already rank. The existing tool widget is left untouched.
 */
export function buildInjectionPlan(params: {
  seo: ToolSeoContent;
  related?: { anchor: string; url: string }[];
  schemaJsonld?: object[];
  flags?: InjectionFlags;
}): InjectionPlan {
  _idCounter = 0;
  const { seo } = params;
  const related = params.related ?? [];
  const flags = params.flags ?? {};
  const prepend: ElementorElement[] = [];
  const append: ElementorElement[] = [];
  const added: string[] = [];

  // Intro (answer-first) — visible heading is H2, NOT H1.
  if (!flags.hasIntro && seo.intro_html) {
    prepend.push(section([headingWidget(seo.h1, "h2"), textWidget(seo.intro_html)]));
    added.push("intro");
  }

  if (!flags.hasHowTo && seo.how_to?.steps?.length) {
    append.push(
      section([
        headingWidget(seo.how_to.title || "How to use this tool", "h2"),
        textWidget(howToHtml(seo.how_to)),
      ]),
    );
    added.push("how_to");
  }

  if (!flags.hasFaq && seo.faq?.length) {
    append.push(
      section([headingWidget("Frequently asked questions", "h2"), textWidget(faqHtml(seo.faq))]),
    );
    added.push("faq");
  }

  if (related.length) {
    append.push(
      section([headingWidget("Related free tools", "h2"), textWidget(relatedHtml(related))]),
    );
    added.push("related");
  }

  const schemaTags = jsonLdScriptTags(params.schemaJsonld ?? []);
  if (schemaTags) {
    append.push(section([htmlWidget(schemaTags)]));
    added.push("schema");
  }

  return { prepend, append, added };
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

/** Apply an injection plan to existing data (used for preview/snapshot). */
export function applyInjectionPlan(raw: unknown, plan: InjectionPlan): ElementorElement[] {
  const data = parseElementorData(raw);
  return [...plan.prepend, ...data, ...plan.append];
}
