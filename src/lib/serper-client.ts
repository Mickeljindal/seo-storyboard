import type { SearchIntent } from "./seo-types";
import { loadProjectEnv } from "./load-env";

/**
 * Serper.dev client — cheap, fast Google SERP API.
 *
 * Used as the PRIMARY keyword/idea discovery source (DataForSEO is expensive and
 * noisy). Serper gives us:
 *   - autocomplete  → keyword expansion (the idea goldmine)
 *   - search        → organic results (SERP competitors), People Also Ask, related searches
 *
 * Serper does NOT provide search volume / CPC / keyword difficulty. We derive a
 * pragmatic opportunity score from SERP signals (PAA presence, related breadth,
 * SERP competition, intent) instead of paying for volume APIs.
 *
 * 1 credit per call. Endpoints: https://google.serper.dev/{search,autocomplete}
 */

const SEARCH_URL = "https://google.serper.dev/search";
const AUTOCOMPLETE_URL = "https://google.serper.dev/autocomplete";

/** Serper uses ISO country codes (gl), not numeric location codes. */
export const GEO_GL: Record<string, string> = {
  sa: "sa",
  ae: "ae",
  in: "in",
  global: "us",
};

export function serperGl(geo: string): string {
  return GEO_GL[geo] ?? "us";
}

export function hasSerperCredentials(): boolean {
  loadProjectEnv();
  return !!process.env.SERPER_API_KEY?.trim();
}

function serperKey(): string | null {
  return process.env.SERPER_API_KEY?.trim() || null;
}

async function serperPost<T = Record<string, unknown>>(url: string, body: unknown): Promise<T> {
  loadProjectEnv();
  const key = serperKey();
  if (!key) {
    throw new Error("Serper not configured. Add SERPER_API_KEY in .env (get it at https://serper.dev).");
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    throw new Error(`Cannot reach google.serper.dev (${msg}). Check internet/firewall.`);
  }
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 300);
    try {
      const j = JSON.parse(text) as { message?: string };
      detail = j.message ?? detail;
    } catch {
      /* raw */
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Serper auth failed (${res.status}). Check SERPER_API_KEY. ${detail}`);
    }
    throw new Error(`Serper ${res.status}: ${detail}`);
  }
  return JSON.parse(text) as T;
}

export type SerperOrganic = { title: string; link: string; snippet?: string; position?: number };
export type SerperSearchResult = {
  organic: SerperOrganic[];
  peopleAlsoAsk: { question: string; snippet?: string; link?: string }[];
  relatedSearches: string[];
  credits: number;
};

/** Single SERP fetch: organic + PAA + related searches. */
export async function serperSearch(query: string, geo: string): Promise<SerperSearchResult> {
  const data = await serperPost<{
    organic?: SerperOrganic[];
    peopleAlsoAsk?: { question?: string; snippet?: string; link?: string }[];
    relatedSearches?: { query?: string }[];
    credits?: number;
  }>(SEARCH_URL, { q: query, gl: serperGl(geo), hl: "en" });

  return {
    organic: (data.organic ?? []).filter((o) => o.title && o.link),
    peopleAlsoAsk: (data.peopleAlsoAsk ?? [])
      .map((p) => ({ question: String(p.question ?? "").trim(), snippet: p.snippet, link: p.link }))
      .filter((p) => p.question),
    relatedSearches: (data.relatedSearches ?? [])
      .map((r) => String(r.query ?? "").trim())
      .filter(Boolean),
    credits: data.credits ?? 1,
  };
}

/** Keyword expansion via Google autocomplete suggestions. */
export async function serperAutocomplete(query: string, geo: string): Promise<string[]> {
  const data = await serperPost<{ suggestions?: { value?: string }[] }>(AUTOCOMPLETE_URL, {
    q: query,
    gl: serperGl(geo),
    hl: "en",
  });
  return (data.suggestions ?? [])
    .map((s) => String(s.value ?? "").trim())
    .filter(Boolean);
}

/** Lightweight intent inference from a keyword string (no volume API available). */
export function inferIntentFromKeyword(keyword: string): SearchIntent {
  const k = keyword.toLowerCase();
  if (/\b(buy|price|pricing|cost|cheap|plan|plans|trial|deal|discount|hire)\b/.test(k)) return "transactional";
  if (/\b(best|top|vs|versus|alternative|alternatives|compare|comparison|review|reviews)\b/.test(k)) return "commercial";
  if (/\b(login|sign in|dashboard|official|website|docs|documentation)\b/.test(k)) return "navigational";
  if (/\b(how to|what is|guide|tutorial|setup|install|deploy|meaning|example|examples)\b/.test(k)) return "informational";
  return "informational";
}

/**
 * Derive an opportunity score (0–100) from SERP signals when no volume data exists.
 * Signals: PAA presence (demand depth), related breadth (topic richness),
 * fewer strong brand competitors = easier, intent weighting.
 */
export function serperOpportunityScore(opts: {
  paaCount: number;
  relatedCount: number;
  organicCount: number;
  intent: SearchIntent;
  competitorStrength: number; // 0..1 (1 = SERP dominated by big brands)
}): number {
  const demand = Math.min(1, (opts.paaCount + opts.relatedCount) / 12); // depth of interest
  const richness = Math.min(1, opts.relatedCount / 8);
  const winnability = 1 - opts.competitorStrength;
  const intentBoost =
    opts.intent === "commercial" ? 1.15 : opts.intent === "transactional" ? 1.12 : opts.intent === "informational" ? 1.0 : 0.9;
  const base = demand * 38 + richness * 22 + winnability * 30 + 10;
  return Math.round(Math.min(100, base * intentBoost));
}

const BIG_BRANDS = [
  "aws.amazon", "cloud.google", "azure.microsoft", "cloudflare", "wikipedia",
  "reddit", "youtube", "medium.com", "hostinger", "godaddy", "bluehost",
  "digitalocean", "kinsta", "wpengine", "cloudways", "ibm.com", "oracle.com",
];

/** Estimate how brand-dominated a SERP is (0 easy → 1 hard). */
export function estimateCompetitorStrength(organic: SerperOrganic[]): number {
  if (!organic.length) return 0.5;
  let hits = 0;
  for (const o of organic.slice(0, 10)) {
    const link = o.link.toLowerCase();
    if (BIG_BRANDS.some((b) => link.includes(b))) hits++;
  }
  return Math.min(1, hits / 8);
}

/** Quick connectivity test for Settings/health. */
export async function testSerperConnection(): Promise<{ ok: boolean; message: string }> {
  if (!hasSerperCredentials()) {
    return { ok: false, message: "Set SERPER_API_KEY in .env (https://serper.dev)" };
  }
  try {
    const r = await serperAutocomplete("kloudbean", "global");
    return { ok: true, message: `Serper connected · ${r.length} suggestions` };
  } catch (e) {
    return { ok: false, message: String((e as Error)?.message ?? e) };
  }
}
