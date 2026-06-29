import "@tanstack/react-start/server-only";
import { loadProjectEnv } from "./load-env";

/**
 * MULTI-ENGINE CITATION TRACKING (A2) — the GEO/AIO outcome metric.
 *
 * Traditional SEO measures rank position. In the AI-answer era the metric that
 * matters is CITATION: when someone asks an AI engine a relevant question, does
 * it name and/or link Kloudbean? This module asks the answer engines real
 * questions and records whether Kloudbean was mentioned/cited, where it ranked
 * among sources, and which competitors got cited instead.
 *
 * Engines (each gated by its own API key, all best-effort):
 *   - Perplexity   (PERPLEXITY_API_KEY)  — returns real source citations.
 *   - Gemini       (GEMINI_API_KEY)      — Google-grounded answers + sources.
 *   - OpenAI/ChatGPT(OPENAI_API_KEY)     — brand-mention proxy from model
 *                                          knowledge (no live sources unless
 *                                          the key supports web tools).
 *
 * Results feed the dashboard + the self-learning signal loop so the engine
 * doubles down on clusters/topics that actually earn AI citations.
 */

export type CitationEngine = "perplexity" | "gemini" | "openai";

export type CitationSource = { url: string; title?: string };

export type EngineCitationResult = {
  engine: CitationEngine;
  ok: boolean;
  query: string;
  mentioned: boolean; // Kloudbean named in the answer text
  cited: boolean; // a Kloudbean URL is in the sources
  position: number | null; // rank of the first Kloudbean source (1 = first)
  citedUrl: string | null;
  competitors: string[]; // other source domains
  answerExcerpt: string;
  sources: CitationSource[];
  error?: string;
};

const KLOUDBEAN_HOSTS = ["kloudbean.com"];

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isKloudbean(url: string): boolean {
  const h = hostOf(url);
  return KLOUDBEAN_HOSTS.some((k) => h === k || h.endsWith(`.${k}`));
}

/** Domains we don't count as "competitors" (generic platforms, not rivals). */
const IGNORE_COMPETITOR_HOSTS = new Set([
  "google.com",
  "youtube.com",
  "wikipedia.org",
  "reddit.com",
  "github.com",
  "stackoverflow.com",
  "medium.com",
  "quora.com",
  "linkedin.com",
  "facebook.com",
  "twitter.com",
  "x.com",
]);

/** Analyze an engine answer + sources for Kloudbean mention/citation. */
function analyze(
  answer: string,
  sources: CitationSource[],
): Pick<
  EngineCitationResult,
  "mentioned" | "cited" | "position" | "citedUrl" | "competitors" | "answerExcerpt" | "sources"
> {
  const mentioned = /\bkloudbean\b/i.test(answer);
  let position: number | null = null;
  let citedUrl: string | null = null;
  const competitors = new Set<string>();

  sources.forEach((s, i) => {
    if (!s.url) return;
    if (isKloudbean(s.url)) {
      if (position === null) {
        position = i + 1;
        citedUrl = s.url;
      }
    } else {
      const h = hostOf(s.url);
      if (h && !IGNORE_COMPETITOR_HOSTS.has(h)) competitors.add(h);
    }
  });

  return {
    mentioned,
    cited: citedUrl !== null,
    position,
    citedUrl,
    competitors: [...competitors].slice(0, 12),
    answerExcerpt: answer.slice(0, 600),
    sources: sources.slice(0, 12),
  };
}

// --- Perplexity ---

async function queryPerplexity(query: string): Promise<EngineCitationResult> {
  const key = process.env.PERPLEXITY_API_KEY?.trim();
  const base: EngineCitationResult = {
    engine: "perplexity",
    ok: false,
    query,
    mentioned: false,
    cited: false,
    position: null,
    citedUrl: null,
    competitors: [],
    answerExcerpt: "",
    sources: [],
  };
  if (!key) return { ...base, error: "PERPLEXITY_API_KEY not set" };
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.PERPLEXITY_MODEL?.trim() || "sonar",
        messages: [{ role: "user", content: query }],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(40_000),
    });
    const text = await res.text();
    if (!res.ok) return { ...base, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
    const json = JSON.parse(text) as {
      choices?: { message?: { content?: string } }[];
      citations?: string[];
      search_results?: { url?: string; title?: string }[];
    };
    const answer = json.choices?.[0]?.message?.content ?? "";
    const sources: CitationSource[] = (
      json.search_results?.length
        ? json.search_results.map((s) => ({ url: s.url ?? "", title: s.title }))
        : (json.citations ?? []).map((u) => ({ url: u }))
    ).filter((s) => s.url);
    return { ...base, ok: true, ...analyze(answer, sources) };
  } catch (e) {
    return { ...base, error: String((e as Error)?.message ?? e) };
  }
}

// --- Gemini (Google-grounded) ---

async function queryGemini(query: string): Promise<EngineCitationResult> {
  const key = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim();
  const base: EngineCitationResult = {
    engine: "gemini",
    ok: false,
    query,
    mentioned: false,
    cited: false,
    position: null,
    citedUrl: null,
    competitors: [],
    answerExcerpt: "",
    sources: [],
  };
  if (!key) return { ...base, error: "GEMINI_API_KEY not set" };
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }],
          tools: [{ google_search: {} }],
        }),
        signal: AbortSignal.timeout(40_000),
      },
    );
    const text = await res.text();
    if (!res.ok) return { ...base, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
    const json = JSON.parse(text) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
        groundingMetadata?: {
          groundingChunks?: { web?: { uri?: string; title?: string } }[];
        };
      }[];
    };
    const cand = json.candidates?.[0];
    const answer = (cand?.content?.parts ?? []).map((p) => p.text ?? "").join(" ");
    const sources: CitationSource[] = (cand?.groundingMetadata?.groundingChunks ?? [])
      .map((c) => ({ url: c.web?.uri ?? "", title: c.web?.title }))
      .filter((s) => s.url);
    return { ...base, ok: true, ...analyze(answer, sources) };
  } catch (e) {
    return { ...base, error: String((e as Error)?.message ?? e) };
  }
}

// --- OpenAI / ChatGPT (brand-mention proxy) ---

async function queryOpenAi(query: string): Promise<EngineCitationResult> {
  const key = process.env.OPENAI_API_KEY?.trim();
  const base: EngineCitationResult = {
    engine: "openai",
    ok: false,
    query,
    mentioned: false,
    cited: false,
    position: null,
    citedUrl: null,
    competitors: [],
    answerExcerpt: "",
    sources: [],
  };
  // Only run for a real OpenAI key (not DeepSeek/OpenRouter borrowing the var).
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  if (!key || key.startsWith("sk-or-") || baseUrl.includes("deepseek.com")) {
    return { ...base, error: "OpenAI not configured for citation checks" };
  }
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.CITATION_OPENAI_MODEL?.trim() || "gpt-4o-mini",
        messages: [{ role: "user", content: query }],
        temperature: 0.2,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(40_000),
    });
    const text = await res.text();
    if (!res.ok) return { ...base, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
    const json = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
    const answer = json.choices?.[0]?.message?.content ?? "";
    // No live sources from a plain chat completion — mention-only signal.
    return { ...base, ok: true, ...analyze(answer, []) };
  } catch (e) {
    return { ...base, error: String((e as Error)?.message ?? e) };
  }
}

const ENGINE_FNS: Record<CitationEngine, (q: string) => Promise<EngineCitationResult>> = {
  perplexity: queryPerplexity,
  gemini: queryGemini,
  openai: queryOpenAi,
};

export function configuredEngines(): CitationEngine[] {
  loadProjectEnv();
  const out: CitationEngine[] = [];
  if (process.env.PERPLEXITY_API_KEY?.trim()) out.push("perplexity");
  if (process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim())
    out.push("gemini");
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").toLowerCase();
  if (openaiKey && !openaiKey.startsWith("sk-or-") && !baseUrl.includes("deepseek.com"))
    out.push("openai");
  return out;
}

export function hasCitationTracking(): boolean {
  return configuredEngines().length > 0;
}

/** Run one query across all configured engines (or a chosen subset). */
export async function trackQuery(
  query: string,
  opts: { engines?: CitationEngine[] } = {},
): Promise<EngineCitationResult[]> {
  const engines = (opts.engines ?? configuredEngines()).filter((e) => e in ENGINE_FNS);
  if (!engines.length) return [];
  return Promise.all(engines.map((e) => ENGINE_FNS[e](query)));
}
