import "@tanstack/react-start/server-only";
import { generateText } from "ai";
import { createAiProvider } from "./ai-provider";
import { KLOUDBEAN_PROMPT_CORE } from "./kloudbean-scope";
import { assembleToolPage, type ToolPageParts } from "./tool-template";

/**
 * TOOL ENGINE — generates a complete free-tool page for Kloudbean that looks and
 * works like the existing live pages (e.g. /a-b-test-calculator/).
 *
 * The output `tool_html` is ONE self-contained block (the branded template +
 * working tool + on-page SEO content sections + FAQ + Kloudbean banner + JSON-LD)
 * destined for a single Elementor HTML widget. The page H1 is added separately as
 * an Elementor heading widget by the builder.
 *
 * Per-page SEO is set side-by-side: meta_title/description + focus keyword go to
 * AIOSEO via the plugin, and SoftwareApplication/FAQPage/Breadcrumb JSON-LD is
 * inlined in the block for GEO/rich results.
 */

export type ToolSeo = {
  h1: string;
  intro_html: string;
  how_to: { title: string; steps: string[] };
  faq: { q: string; a: string }[];
};

export type GeneratedTool = {
  ok: boolean;
  tool_html: string;
  h1: string;
  seo: ToolSeo;
  meta_title: string;
  meta_description: string;
  schema_jsonld: object[];
  error?: string;
  log: string[];
};

export type ToolGenInput = {
  name: string;
  slug: string;
  target_keyword: string;
  secondary_keywords?: string[];
  description: string;
  spec: string;
  kloudbean_angle: string;
  tool_type?: string;
  category?: string;
  baseUrl?: string;
};

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:html|json|markdown|md)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJson<T>(raw: string): T | null {
  const s = stripFences(raw);
  try {
    return JSON.parse(s) as T;
  } catch {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** The tool body + working JS + on-page content, generated as JSON. */
type ToolBuildJson = {
  tagline?: string;
  tool_body_html?: string;
  tool_js?: string;
  content_sections?: { h2: string; paragraphs?: string[]; bullets?: string[] }[];
  faq?: { q: string; a: string }[];
};

const TOOL_BUILD_SYSTEM = `You build FREE interactive web tools for Kloudbean (kloudbean.com) that are dropped into a pre-styled branded shell. Return STRICT JSON only.

The shell already provides ALL styling via these CSS classes — USE THEM, do not invent new styles and do NOT include any <style> tag:
- Layout: ".kbt-grid" (responsive input grid), ".kbt-field" (wraps a label + input/select/textarea + optional <small>).
- Buttons: ".kbt-btn" (primary, gradient), ".kbt-btn secondary" (outline). Put buttons in a ".kbt-controls" row.
- Results: ".kbt-results" (container, start with style="display:none"), ".kbt-results-grid", ".kbt-result-card" (with an <h4>), ".kbt-result-item" containing ".kbt-result-label" + ".kbt-result-value". For free-text output use ".kbt-out".
- Status: an element with id="kbt-status" already exists in the shell — set its textContent and add class "valid" | "invalid" | "warning", and style.display='block' to show messages.

HARD RULES:
- Do NOT include <style>, <script>, <h1>, <!DOCTYPE>, <html>, <head>, or <body>. Only the inner body markup (in tool_body_html) and raw JS (in tool_js).
- The tool MUST actually work. tool_js runs inside an IIFE (so top-level const/function are fine). No external libraries, no CDNs, no network calls, no eval. Pure client-side.
- Give every input/button a unique id prefixed with "kbt-". Wire all events in tool_js via addEventListener using those ids (no inline onclick).
- Validate inputs and show friendly messages via #kbt-status. Compute on button click AND run once on load with sensible sample defaults so a result shows immediately.
- Keep it accessible: every input has a <label for>. Mobile friendly (the grid handles layout).

Return JSON with EXACTLY this shape:
{
  "tagline": "one sentence under the tool title describing what it does",
  "tool_body_html": "the inner HTML: inputs in .kbt-grid/.kbt-field, a .kbt-controls button row, and a #... results area using .kbt-results (display:none initially)",
  "tool_js": "vanilla JS that wires the inputs, validates, calculates, fills the results area, toggles .kbt-results display, and updates #kbt-status. Runs inside an IIFE.",
  "content_sections": [ {"h2":"section title","paragraphs":["..."],"bullets":["..."]}, ... 3 to 4 sections of genuinely useful, keyword-aware content for SEO/AIO/GEO/topical authority ],
  "faq": [ {"q":"question","a":"concise answer"}, ... 4 to 6 items ]
}

CONTENT must be accurate, specific, human (no "in today's", "seamless", "robust", "unlock", "leverage", "dive into"), and tie back to running/hosting related workloads on Kloudbean where natural. Return ONLY the JSON object.`;

const META_SYSTEM = `You write SEO meta AND a conversion pitch for a Kloudbean free-tool page. Return STRICT JSON only.

${KLOUDBEAN_PROMPT_CORE}

The visitor is using a free tool. Identify WHO they are and craft a pitch that turns them into a Kloudbean hosting customer. Vary the angle to fit the tool's audience, e.g.:
- developers deploying apps → "deploy and host your app on Kloudbean managed cloud"
- vibe-coders (Lovable/Bolt/Cursor/v0) → "host the app you just built — one click, managed"
- SaaS founders → "launch your mini AI SaaS on Kloudbean without a DevOps team"
- agencies → "host all your client sites/apps on one managed server"
- WordPress owners → "move to faster managed WordPress hosting"
Always end with the idea of launching a server / hosting their site, app, or AI SaaS on Kloudbean. Neutral expert tone, no hype.

Return JSON:
{
  "h1": "page H1 — includes the exact target keyword verbatim, human, <= 70 chars (the hero title)",
  "meta_title": "<= 60 chars, includes the keyword, ends with | Kloudbean",
  "meta_description": "<= 155 chars, includes the keyword, action-oriented, mentions it's free",
  "audience": "1 short phrase naming who this tool's user is",
  "pitch": "1–2 sentences (<= 200 chars) pitching Kloudbean hosting tailored to that audience, ending with launching/hosting on Kloudbean",
  "cta_label": "a short button label tailored to the audience, e.g. 'Deploy your app on Kloudbean' (<= 40 chars)"
}
No banned AI-tell phrases. Return ONLY the JSON object.`;

const SEO_SYSTEM = `You write the SEO wrapper content for an EXISTING Kloudbean free-tool page (used to optimize pages that already have the interactive tool). Return STRICT JSON only.

${KLOUDBEAN_PROMPT_CORE}

Return JSON with EXACTLY this shape:
{
  "h1": "string — includes the exact target keyword verbatim, human (max ~70 chars)",
  "intro_html": "string — 2 short <p> paragraphs; the FIRST is a 40–60 word direct answer with the keyword in the first sentence; mention Kloudbean once",
  "how_to": { "title": "How to use this tool", "steps": ["step 1","step 2","step 3","step 4"] },
  "faq": [ {"q":"question","a":"concise answer"}, ... 4 to 6 items ],
  "meta_title": "<= 60 chars, includes keyword, ends with | Kloudbean",
  "meta_description": "<= 155 chars, includes keyword, mentions it's free"
}
Plain, expert, no hype, no AI-tell phrases. Return ONLY the JSON object.`;

function buildToolSchema(
  input: ToolGenInput,
  meta: { title: string; description: string },
  faq: { q: string; a: string }[],
  pageUrl: string,
): object[] {
  const category =
    input.category?.toLowerCase().includes("developer") || input.tool_type
      ? "DeveloperApplication"
      : "BusinessApplication";

  const blocks: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: input.name,
      applicationCategory: category,
      operatingSystem: "Any (web-based)",
      ...(pageUrl ? { url: pageUrl } : {}),
      description: meta.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@type": "Organization", name: "Kloudbean", url: "https://kloudbean.com" },
    },
  ];

  if (faq.length) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  blocks.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://kloudbean.com" },
      { "@type": "ListItem", position: 2, name: input.category ?? "Tools" },
      { "@type": "ListItem", position: 3, name: input.name, ...(pageUrl ? { item: pageUrl } : {}) },
    ],
  });

  return blocks;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trimTo(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/** Generate a complete, branded, working tool page (single HTML block). */
export async function generateToolPage(input: ToolGenInput): Promise<GeneratedTool> {
  const log: string[] = [];
  let model;
  try {
    model = createAiProvider();
  } catch (e) {
    return emptyTool(`AI not configured: ${String((e as Error)?.message ?? e)}`);
  }

  const baseUrl = (input.baseUrl ?? "https://kloudbean.com").replace(/\/$/, "");
  const pageUrl = `${baseUrl}/${input.slug}`;
  const secondary = (input.secondary_keywords ?? []).join(", ");

  // 1. The tool itself + on-page content (JSON).
  let build: ToolBuildJson | null = null;
  try {
    const raw = (
      await generateText({
        model,
        system: TOOL_BUILD_SYSTEM,
        prompt: `Build this tool:
NAME: ${input.name}
TYPE: ${input.tool_type ?? "tool"}
TARGET KEYWORD: ${input.target_keyword}
WHAT IT DOES: ${input.description}
EXACT SPEC (implement these inputs/outputs): ${input.spec}
Kloudbean angle (work in naturally): ${input.kloudbean_angle}`,
        temperature: 0.5,
        maxOutputTokens: 6000,
      })
    ).text;
    build = extractJson<ToolBuildJson>(raw);
  } catch (e) {
    return emptyTool(`Tool build failed: ${String((e as Error)?.message ?? e)}`);
  }

  if (!build?.tool_body_html || !build?.tool_js) {
    return emptyTool("Tool build returned incomplete output (no body or JS)");
  }

  // 2. Meta + H1 + tailored pitch/CTA (JSON).
  let h1 = `${input.name} Tool`;
  let metaTitle = `${input.name} | Kloudbean`;
  let metaDesc = `Free ${input.target_keyword} from Kloudbean. ${input.description}`.replace(
    /\s+/g,
    " ",
  );
  let pitch = "";
  let ctaLabel = "";
  try {
    const raw = (
      await generateText({
        model,
        system: META_SYSTEM,
        prompt: `Tool: ${input.name}\nTarget keyword (verbatim): "${input.target_keyword}"\nSecondary: ${secondary || "(none)"}\nWhat it does: ${input.description}\nKloudbean angle: ${input.kloudbean_angle}`,
        temperature: 0.6,
        maxOutputTokens: 500,
      })
    ).text;
    const m = extractJson<{
      h1?: string;
      meta_title?: string;
      meta_description?: string;
      pitch?: string;
      cta_label?: string;
    }>(raw);
    if (m?.h1) h1 = m.h1.trim();
    if (m?.meta_title) metaTitle = m.meta_title.trim();
    if (m?.meta_description) metaDesc = m.meta_description.trim();
    if (m?.pitch) pitch = m.pitch.trim();
    if (m?.cta_label) ctaLabel = m.cta_label.trim();
  } catch (e) {
    log.push(`meta generation fallback: ${String((e as Error)?.message ?? e)}`);
  }
  metaTitle = trimTo(metaTitle, 60);
  metaDesc = trimTo(metaDesc, 155);

  const faq = Array.isArray(build.faq) ? build.faq.filter((f) => f?.q && f?.a) : [];
  const contentSections =
    Array.isArray(build.content_sections) && build.content_sections.length
      ? build.content_sections
      : [
          {
            h2: `About this ${input.tool_type ?? "tool"}`,
            paragraphs: [escapeHtml(input.description)],
          },
        ];

  const schema = buildToolSchema(input, { title: metaTitle, description: metaDesc }, faq, pageUrl);

  // 3. Assemble the single branded HTML block.
  const parts: ToolPageParts = {
    name: input.name,
    tagline: build.tagline?.trim() || input.description,
    toolBodyHtml: build.tool_body_html,
    toolJs: build.tool_js,
    contentSections,
    faq,
    schemaJsonld: schema,
    pitch: pitch || undefined,
    ctaLabel: ctaLabel || undefined,
  };
  const tool_html = assembleToolPage(parts);
  log.push(
    `assembled tool page: ${tool_html.length} chars, ${contentSections.length} sections, ${faq.length} FAQ`,
  );

  return {
    ok: true,
    tool_html,
    h1,
    seo: {
      h1,
      intro_html: `<p>${escapeHtml(parts.tagline)}</p>`,
      how_to: { title: "How to use this tool", steps: [] },
      faq,
    },
    meta_title: metaTitle,
    meta_description: metaDesc,
    schema_jsonld: schema,
    log,
  };
}

// ---------------------------------------------------------------------------
// SEO-ONLY generation — used to optimize EXISTING pages (tool already present).
// ---------------------------------------------------------------------------

type SeoJson = ToolSeo & { meta_title?: string; meta_description?: string };

export type GeneratedToolSeo = {
  ok: boolean;
  seo: ToolSeo;
  meta_title: string;
  meta_description: string;
  schema_jsonld: object[];
  source: "ai" | "fallback";
  log: string[];
};

export async function generateToolSeo(input: ToolGenInput): Promise<GeneratedToolSeo> {
  const log: string[] = [];
  let model;
  try {
    model = createAiProvider();
  } catch (e) {
    return seoFallback(input, `AI not configured: ${String((e as Error)?.message ?? e)}`);
  }

  const baseUrl = (input.baseUrl ?? "https://kloudbean.com").replace(/\/$/, "");
  const pageUrl = `${baseUrl}/${input.slug}`;
  const secondary = (input.secondary_keywords ?? []).join(", ");

  let seoJson: SeoJson | null = null;
  try {
    const raw = (
      await generateText({
        model,
        system: SEO_SYSTEM,
        prompt: `Tool: ${input.name}
Target keyword (use verbatim): "${input.target_keyword}"
Secondary keywords: ${secondary || "(none)"}
What it does: ${input.description}
Kloudbean angle (work in naturally, don't be salesy): ${input.kloudbean_angle}`,
        temperature: 0.7,
        maxOutputTokens: 1800,
      })
    ).text;
    seoJson = extractJson<SeoJson>(raw);
  } catch (e) {
    log.push(`seo generation error: ${String((e as Error)?.message ?? e)}`);
  }

  const seo: ToolSeo = {
    h1: seoJson?.h1?.trim() || `${input.name} — Free ${input.tool_type ?? "Tool"}`,
    intro_html:
      seoJson?.intro_html?.trim() ||
      `<p>${escapeHtml(input.description)} This free ${escapeHtml(input.target_keyword)} runs in your browser, with no signup.</p>`,
    how_to:
      seoJson?.how_to && Array.isArray(seoJson.how_to.steps) && seoJson.how_to.steps.length
        ? seoJson.how_to
        : {
            title: "How to use this tool",
            steps: [
              "Enter your values.",
              "Review the result instantly.",
              "Adjust inputs to compare scenarios.",
            ],
          },
    faq: Array.isArray(seoJson?.faq) ? seoJson!.faq.filter((f) => f?.q && f?.a) : [],
  };
  const meta_title = trimTo(seoJson?.meta_title?.trim() || `${input.name} | Kloudbean`, 60);
  const meta_description = trimTo(
    seoJson?.meta_description?.trim() ||
      `Free ${input.target_keyword} from Kloudbean. ${input.description}`.replace(/\s+/g, " "),
    155,
  );
  const schema = buildToolSchema(
    input,
    { title: meta_title, description: meta_description },
    seo.faq,
    pageUrl,
  );
  log.push(`seo: h1="${seo.h1}", faq=${seo.faq.length}, source=${seoJson ? "ai" : "fallback"}`);

  return {
    ok: true,
    seo,
    meta_title,
    meta_description,
    schema_jsonld: schema,
    source: seoJson ? "ai" : "fallback",
    log,
  };
}

function seoFallback(input: ToolGenInput, error: string): GeneratedToolSeo {
  const seo: ToolSeo = {
    h1: `${input.name} — Free ${input.tool_type ?? "Tool"}`,
    intro_html: `<p>${escapeHtml(input.description)}</p>`,
    how_to: {
      title: "How to use this tool",
      steps: ["Enter your values.", "Review the result.", "Adjust inputs."],
    },
    faq: [],
  };
  const baseUrl = (input.baseUrl ?? "https://kloudbean.com").replace(/\/$/, "");
  const meta_title = trimTo(`${input.name} | Kloudbean`, 60);
  const meta_description = trimTo(
    `Free ${input.target_keyword} from Kloudbean. ${input.description}`.replace(/\s+/g, " "),
    155,
  );
  return {
    ok: false,
    seo,
    meta_title,
    meta_description,
    schema_jsonld: buildToolSchema(
      input,
      { title: meta_title, description: meta_description },
      [],
      `${baseUrl}/${input.slug}`,
    ),
    source: "fallback",
    log: [error],
  };
}

function emptyTool(error: string): GeneratedTool {
  return {
    ok: false,
    tool_html: "",
    h1: "",
    seo: { h1: "", intro_html: "", how_to: { title: "", steps: [] }, faq: [] },
    meta_title: "",
    meta_description: "",
    schema_jsonld: [],
    error,
    log: [error],
  };
}
