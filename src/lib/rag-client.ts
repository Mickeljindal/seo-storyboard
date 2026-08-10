/**
 * Kloudbean RAG knowledge client.
 *
 * Talks to the Kloudbean RAG chat endpoint (a Supabase Edge Function backed by
 * the live support/help knowledge base). This is the runtime SOURCE OF TRUTH for
 * product facts — providers, regions, features, pricing language — so generated
 * content is grounded in what Kloudbean actually offers, not stale hardcoded copy.
 *
 * Endpoint is configurable via KLOUDBEAN_RAG_URL (defaults to the known function).
 * Results are cached on disk (.local/rag-cache.json) to avoid hammering the API
 * and to keep generation fast + cheap.
 */
import fs from "node:fs";
import path from "node:path";

export const DEFAULT_RAG_URL =
  "https://vhbbmovxfuuqzfywysba.supabase.co/functions/v1/rag-chat";

export type RagSource = {
  title: string;
  url: string;
  category?: string;
  relevance?: string;
  score?: number;
};

export type RagAnswer = {
  ok: boolean;
  answer: string;
  sources: RagSource[];
  error?: string;
};

const CACHE_DIR = path.join(process.cwd(), ".local");
const CACHE_FILE = path.join(CACHE_DIR, "rag-cache.json");
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — KB changes slowly

type CacheEntry = { answer: string; sources: RagSource[]; at: string };
type CacheFile = { entries: Record<string, CacheEntry>; updatedAt: string };

function getRagUrl(): string {
  return (process.env.KLOUDBEAN_RAG_URL?.trim() || DEFAULT_RAG_URL).replace(/\/$/, "");
}

export function hasRagConfigured(): boolean {
  // Always available (public endpoint) unless explicitly disabled.
  return process.env.KLOUDBEAN_RAG_DISABLED !== "1";
}

function readCache(): CacheFile {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) as CacheFile;
    }
  } catch {
    /* ignore */
  }
  return { entries: {}, updatedAt: new Date().toISOString() };
}

function writeCache(cache: CacheFile) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  } catch {
    /* best effort */
  }
}

function cacheKey(message: string): string {
  return message.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200);
}

/** Ask the Kloudbean RAG KB a question. Cached on disk for 7 days. */
export async function askKloudbeanRag(
  message: string,
  opts: { fresh?: boolean; timeoutMs?: number } = {},
): Promise<RagAnswer> {
  if (!hasRagConfigured()) {
    return { ok: false, answer: "", sources: [], error: "RAG disabled" };
  }
  const key = cacheKey(message);
  const cache = readCache();
  if (!opts.fresh) {
    const hit = cache.entries[key];
    if (hit && Date.now() - new Date(hit.at).getTime() < CACHE_TTL_MS) {
      return { ok: true, answer: hit.answer, sources: hit.sources };
    }
  }

  try {
    const res = await fetch(getRagUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 45_000),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, answer: "", sources: [], error: `RAG HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    const json = JSON.parse(text) as {
      success?: boolean;
      answer?: string;
      sources?: RagSource[];
      error?: string;
    };
    if (!json.answer) {
      return { ok: false, answer: "", sources: [], error: json.error ?? "RAG returned no answer" };
    }
    const entry: CacheEntry = {
      answer: json.answer,
      sources: Array.isArray(json.sources) ? json.sources.slice(0, 8) : [],
      at: new Date().toISOString(),
    };
    cache.entries[key] = entry;
    cache.updatedAt = new Date().toISOString();
    writeCache(cache);
    return { ok: true, answer: entry.answer, sources: entry.sources };
  } catch (e: unknown) {
    const msg = String((e as Error)?.message ?? e);
    // Serve stale cache on network failure if we have it.
    const stale = cache.entries[key];
    if (stale) return { ok: true, answer: stale.answer, sources: stale.sources };
    return { ok: false, answer: "", sources: [], error: `RAG fetch failed: ${msg}` };
  }
}

/**
 * Build a grounding block for a topic by asking the RAG KB targeted questions.
 * Returns a compact, citation-aware context string for AI prompts.
 */
export async function ragGroundingForTopic(
  title: string,
  keyword: string | null | undefined,
  geo: string,
  maxChars = 3500,
): Promise<{ block: string; sources: RagSource[] }> {
  if (!hasRagConfigured()) return { block: "", sources: [] };

  const q = keyword || title;
  const questions = [
    `For an article titled "${title}" (keyword: ${q}), what does Kloudbean actually offer that is relevant? Include exact product names, features, and how to set it up.`,
  ];
  if (geo === "sa") {
    questions.push(
      `For Saudi Arabia / KSA data residency, which Kloudbean cloud provider and region should be used, and what compliance (NCA/CSCC/SAMA) applies?`,
    );
  }

  const answers = await Promise.all(questions.map((m) => askKloudbeanRag(m)));
  const sources = new Map<string, RagSource>();
  const parts: string[] = [
    "LIVE KLOUDBEAN KNOWLEDGE (from support/help KB via RAG — treat as source of truth for product facts; do not contradict or over-promise):",
  ];

  for (const a of answers) {
    if (!a.ok || !a.answer) continue;
    parts.push(a.answer.trim());
    for (const s of a.sources) {
      if (s.url) sources.set(s.url, s);
    }
  }

  if (sources.size) {
    const srcLines = [...sources.values()]
      .slice(0, 6)
      .map((s) => `- ${s.title}: ${s.url}`);
    parts.push(`KB SOURCES (cite/link where natural):\n${srcLines.join("\n")}`);
  }

  let block = parts.join("\n\n");
  if (block.length > maxChars) block = block.slice(0, maxChars) + "…";
  return { block, sources: [...sources.values()] };
}
