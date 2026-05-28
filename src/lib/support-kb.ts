import fs from "node:fs";
import path from "node:path";
import { SUPPORT_DOC_PATHS, SUPPORT_KB_BASE } from "./kloudbean-knowledge";

const CACHE_DIR = path.join(process.cwd(), ".local");
const CACHE_FILE = path.join(CACHE_DIR, "support-kb-cache.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry = { path: string; title: string; excerpt: string; fetchedAt: string };
type CacheFile = { entries: CacheEntry[]; updatedAt: string };

const DEFAULT_PATHS = Object.values(SUPPORT_DOC_PATHS);

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (m?.[1]) return stripHtml(m[1]);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) return stripHtml(h1[1]);
  return "Kloudbean docs";
}

async function fetchDocExcerpt(docPath: string): Promise<CacheEntry | null> {
  const url = `${SUPPORT_KB_BASE}${docPath.startsWith("/") ? docPath : `/${docPath}`}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": "Kloudbean-SEO-Storyboard/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = stripHtml(html).slice(0, 2200);
    if (text.length < 80) return null;
    return {
      path: docPath,
      title: extractTitle(html),
      excerpt: text,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function readCache(): CacheFile | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) as CacheFile;
  } catch {
    return null;
  }
}

function writeCache(entries: CacheEntry[]) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(
    CACHE_FILE,
    JSON.stringify({ entries, updatedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

function cacheFresh(cache: CacheFile | null): boolean {
  if (!cache?.updatedAt) return false;
  return Date.now() - new Date(cache.updatedAt).getTime() < CACHE_TTL_MS;
}

/** Pull excerpts from support.kloudbean.com (cached 24h). */
export async function refreshSupportKnowledge(paths = DEFAULT_PATHS): Promise<{
  ok: boolean;
  count: number;
  message: string;
}> {
  const entries: CacheEntry[] = [];
  for (const docPath of paths) {
    const row = await fetchDocExcerpt(docPath);
    if (row) entries.push(row);
    await new Promise((r) => setTimeout(r, 150));
  }
  if (entries.length === 0) {
    return { ok: false, count: 0, message: "Could not fetch support.kloudbean.com — check network or doc paths" };
  }
  writeCache(entries);
  return { ok: true, count: entries.length, message: `Cached ${entries.length} doc excerpts from ${SUPPORT_KB_BASE}` };
}

/** Injected into AI prompts — uses cache or fetches once if empty. */
export async function getSupportKnowledgeContext(maxChars = 4500): Promise<string> {
  let cache = readCache();
  if (!cacheFresh(cache)) {
    await refreshSupportKnowledge();
    cache = readCache();
  }
  const entries = cache?.entries ?? [];
  if (entries.length === 0) {
    return `SUPPORT KB (${SUPPORT_KB_BASE}): Use only documented Kloudbean capabilities. For KSA GCP, anchor on me-central2 (Dammam).`;
  }

  const lines = [`LIVE SUPPORT KB EXCERPTS (${SUPPORT_KB_BASE}) — treat as source of truth; do not contradict or over-promise:`];
  let used = lines.join("\n").length;
  for (const e of entries) {
    const block = `\n[${e.path}] ${e.title}\n${e.excerpt.slice(0, 900)}`;
    if (used + block.length > maxChars) break;
    lines.push(block);
    used += block.length;
  }
  return lines.join("\n");
}

export function getSupportCacheStatus(): { cached: boolean; count: number; updatedAt: string | null } {
  const cache = readCache();
  return {
    cached: cacheFresh(cache),
    count: cache?.entries?.length ?? 0,
    updatedAt: cache?.updatedAt ?? null,
  };
}
