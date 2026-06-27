import "@tanstack/react-start/server-only";
import { generateText } from "ai";
import { createAiProvider } from "./ai-provider";
import { KLOUDBEAN_PROMPT_CORE } from "./kloudbean-scope";

/**
 * TOOL ENGINE — generates a complete free-tool landing page for Kloudbean.
 *
 * Output (one idea → one tool page):
 *   1. tool_html  — a self-contained, responsive, interactive tool (HTML + inline
 *                   CSS + JS) destined for the Elementor HTML widget.
 *   2. seo        — the indexable wrapper AIOSEO actually reads: H1, answer-first
 *                   intro, how-to-use, FAQ. This is what lifts the score from ~30.
 *   3. meta       — keyword-optimized title + description.
 *   4. schema     — SoftwareApplication + FAQPage + BreadcrumbList JSON-LD.
 *
 * The tool HTML deliberately contains NO <h1> — the Elementor page supplies the
 * single H1 (the builder adds it as a heading widget) to avoid duplicate H1s.
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

const TOOL_HTML_SYSTEM = `You are a senior front-end engineer building a FREE interactive web tool for Kloudbean (kloudbean.com). You output ONE self-contained block of HTML.

HARD REQUIREMENTS:
- Return a SINGLE block of HTML with an inline <style> and inline <script>. No external libraries, no CDNs, no network calls, no fonts/imports. Everything runs client-side, offline.
- Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags. Return only the inner markup (a wrapping <div> is fine). This goes inside an existing page.
- Do NOT include an <h1>. The page already has one. You may use <h2>/<h3> inside the tool for section labels.
- Scope ALL CSS to a unique wrapper class (e.g. .kb-tool-XXXX) so it never leaks into the host theme. Never style bare tags globally (no naked "button{}", "input{}", "h2{}" — always prefix with the wrapper class).
- Mobile-first and responsive. Accessible: labelled inputs, aria where useful, keyboard usable, good contrast.
- The tool must actually WORK: real calculations/logic in JS, instant results, input validation, sensible defaults so it shows a result on load.
- Tasteful modern UI (cards, soft shadows, rounded corners). Brand accent color #6c47ff is welcome but keep it clean.
- End the tool with a subtle, non-spammy CTA line linking to https://kloudbean.com that fits the tool's purpose.
- No analytics, no tracking, no eval, no inline event-handler attributes that depend on global scope — wire events via the inline <script> using IDs/classes scoped to the wrapper.

Return ONLY the HTML. No explanation, no code fences.`;

const SEO_SYSTEM = `You write the SEO wrapper content for a Kloudbean free-tool page. Return STRICT JSON only.

${KLOUDBEAN_PROMPT_CORE}

Goal: this text is what search engines and AIOSEO read around the interactive tool. It must be genuinely useful, human, and include the exact target keyword naturally.

Return JSON with EXACTLY this shape:
{
  "h1": "string — page H1, includes the exact target keyword verbatim, human (max ~70 chars)",
  "intro_html": "string — 2 short paragraphs of HTML (<p>...</p>). The FIRST paragraph is a direct 40–60 word answer to what the tool does and who it helps, with the exact target keyword in the first sentence. Mention Kloudbean once, naturally.",
  "how_to": { "title": "How to use this tool", "steps": ["step 1", "step 2", "step 3", "step 4"] },
  "faq": [ {"q": "question", "a": "concise 1–3 sentence answer"}, ... 4 to 6 items ],
  "meta_title": "string — <= 60 chars, includes the keyword, ends with | Kloudbean",
  "meta_description": "string — <= 155 chars, includes the keyword, action-oriented, mentions it's free"
}

STYLE: plain, expert, no hype, no banned AI-tell phrases (no "in today's", "seamless", "robust", "unlock", "leverage", "dive into", "elevate"). Be specific. Answers should read like a knowledgeable engineer wrote them.
Return ONLY the JSON object.`;

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

/**
 * Generate ONLY the SEO wrapper + meta + schema for a tool (no interactive HTML).
 * Used to optimize EXISTING tool pages without regenerating their tool.
 */
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

export async function generateToolPage(input: ToolGenInput): Promise<GeneratedTool> {
  const log: string[] = [];
  let model;
  try {
    model = createAiProvider();
  } catch (e) {
    return emptyTool(`AI not configured: ${String((e as Error)?.message ?? e)}`);
  }

  // 1. Interactive tool HTML.
  let toolHtml = "";
  try {
    toolHtml = stripFences(
      (
        await generateText({
          model,
          system: TOOL_HTML_SYSTEM,
          prompt: `Build this tool:
NAME: ${input.name}
TYPE: ${input.tool_type ?? "tool"}
WHAT IT DOES: ${input.description}
EXACT SPEC (inputs/outputs to implement): ${input.spec}
Make it genuinely functional and polished. Scope all CSS to a class like .kb-tool-${input.slug.replace(/[^a-z0-9]/g, "").slice(0, 12)}.`,
          temperature: 0.6,
          maxOutputTokens: 7000,
        })
      ).text,
    );
    log.push(`tool html: ${toolHtml.length} chars`);
  } catch (e) {
    return emptyTool(`Tool HTML generation failed: ${String((e as Error)?.message ?? e)}`);
  }

  if (!toolHtml || toolHtml.length < 200) {
    return emptyTool("Tool HTML generation returned too little content");
  }

  // 2. SEO wrapper + meta + schema (shared path).
  const seoResult = await generateToolSeo(input);
  log.push(...seoResult.log);

  return {
    ok: true,
    tool_html: toolHtml,
    seo: seoResult.seo,
    meta_title: seoResult.meta_title,
    meta_description: seoResult.meta_description,
    schema_jsonld: seoResult.schema_jsonld,
    log,
  };
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

function emptyTool(error: string): GeneratedTool {
  return {
    ok: false,
    tool_html: "",
    seo: { h1: "", intro_html: "", how_to: { title: "", steps: [] }, faq: [] },
    meta_title: "",
    meta_description: "",
    schema_jsonld: [],
    error,
    log: [error],
  };
}
