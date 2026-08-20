/**
 * SUPPORT KB CRAWLER — support.kloudbean.com
 *
 * This is the LOCAL product-truth layer that gets injected into brief and
 * article prompts. It is distinct from `rag-client.ts`, which queries a remote
 * hosted RAG endpoint we cannot ingest into from this repo.
 *
 * WHY IT WAS REWRITTEN (audit, Aug 2026)
 * The previous version fetched a hardcoded list of seven doc paths. Six of the
 * seven had been renamed or removed as the docs site grew, and because the site
 * is a Docusaurus SPA that answers unknown paths with a 200 and a generic
 * "User guides & support" shell, those six silently cached the same navigation
 * menu instead of a document. The one surviving path cached correctly but its
 * excerpt was mostly the sidebar, because extraction stripped the whole page
 * rather than the article body. Net effect: the writer prompt was being fed six
 * copies of a nav menu and one half-useful excerpt, presented as source of truth.
 *
 * WHAT THIS VERSION DOES
 *   - Discovers pages from /sitemap.xml instead of a hardcoded list, so new docs
 *     are picked up automatically and renamed ones stop being guessed at.
 *   - Extracts the Docusaurus article body (`theme-doc-markdown`) so the text is
 *     the document, not the chrome around it.
 *   - Detects the generic fallback shell and refuses to cache it, so a dead path
 *     fails loudly as a skip rather than quietly as a nav menu.
 *   - Hashes each page body, so a re-crawl can report exactly what was added,
 *     changed, or removed since last time.
 *   - Honours robots.txt: /search, /docs/tags/, and query strings are excluded.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { SUPPORT_KB_BASE } from "./kloudbean-knowledge";

const CACHE_DIR = path.join(process.cwd(), ".local");
const CACHE_FILE = path.join(CACHE_DIR, "support-kb-cache.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const UA = "Kloudbean-SEO-Storyboard/1.0 (+https://www.kloudbean.com)";

/** Paths robots.txt disallows, plus anything with a query string. */
const DISALLOWED = [/^\/search\b/, /^\/docs\/tags\//];

/**
 * The site answers unknown /docs paths with its generic shell rather than a 404,
 * so a title check is the only reliable way to tell a real document from a miss.
 * Kept as a list because the shell title has changed once already.
 */
const FALLBACK_TITLES = [/^user guides\s*&\s*support/i, /^page not found/i, /^404\b/i];

export type SupportDoc = {
  path: string;
  url: string;
  title: string;
  /** Docusaurus category pages are indexes; useful to know when weighting. */
  kind: "doc" | "category" | "page";
  section: string | null;
  text: string;
  words: number;
  hash: string;
  fetchedAt: string;
};

type CacheFile = {
  version: 2;
  base: string;
  entries: SupportDoc[];
  updatedAt: string;
  /** Paths that were discovered but could not be cached, with the reason. */
  skipped?: { path: string; reason: string }[];
};

export type CrawlDiff = {
  added: string[];
  changed: string[];
  removed: string[];
  unchanged: number;
  skipped: { path: string; reason: string }[];
};

// ---------------------------------------------------------------- extraction

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      // Keep block boundaries as spaces so words do not run together.
      .replace(/<\/(p|div|li|h[1-6]|tr|pre|blockquote)>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pull the article body out of a Docusaurus page.
 *
 * Order matters: `theme-doc-markdown` is the tightest container and excludes the
 * sidebar, the table of contents, breadcrumbs, and the prev/next footer. The
 * <article> and <main> fallbacks exist for category and standalone pages, which
 * do not always carry the markdown wrapper.
 */
function extractBody(html: string): string {
  const md = html.match(
    /<div[^>]*class="[^"]*theme-doc-markdown[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:footer|nav)/i,
  );
  if (md?.[1]) return stripTags(md[1]);

  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (article?.[1]) return stripTags(article[1]);

  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (main?.[1]) return stripTags(main[1]);

  return stripTags(html);
}

function extractTitle(html: string): string {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) {
    const t = stripTags(h1[1]);
    if (t) return t;
  }
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (title?.[1]) return decodeEntities(title[1]).replace(/\s*\|\s*KloudBean Support\s*$/i, "").trim();
  return "Kloudbean docs";
}

function classify(docPath: string): { kind: SupportDoc["kind"]; section: string | null } {
  const parts = docPath.split("/").filter(Boolean);
  if (parts[0] !== "docs") return { kind: "page", section: null };
  if (parts[1] === "category") return { kind: "category", section: parts[2] ?? null };
  return { kind: "doc", section: parts[1] ?? null };
}

function hashOf(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

// ------------------------------------------------------------------ fetching

async function fetchText(url: string, timeoutMs = 20_000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow", // sitemap URLs 301 to their trailing-slash form
      headers: { Accept: "text/html,application/xhtml+xml,application/xml", "User-Agent": UA },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Discover every crawlable page from the sitemap. Falls back to [] on failure. */
export async function discoverSupportPaths(): Promise<string[]> {
  const xml = await fetchText(`${SUPPORT_KB_BASE}/sitemap.xml`, 30_000);
  if (!xml) return [];
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  const paths = new Set<string>();
  for (const loc of locs) {
    let p: string;
    try {
      const u = new URL(loc);
      if (u.host !== new URL(SUPPORT_KB_BASE).host) continue;
      if (u.search) continue; // robots: Disallow /*?
      p = u.pathname;
    } catch {
      continue;
    }
    p = p.replace(/\/+$/, "") || "/";
    if (DISALLOWED.some((re) => re.test(p))) continue;
    paths.add(p);
  }
  return [...paths].sort();
}

async function fetchDoc(docPath: string): Promise<{ doc: SupportDoc } | { skip: string }> {
  const url = `${SUPPORT_KB_BASE}${docPath === "/" ? "/" : docPath}`;
  const html = await fetchText(url);
  if (!html) return { skip: "fetch failed" };

  const title = extractTitle(html);
  if (FALLBACK_TITLES.some((re) => re.test(title))) {
    // The generic shell. Caching this is what broke the previous version.
    return { skip: `generic shell page (title: ${title})` };
  }

  const text = extractBody(html);
  if (text.length < 120) return { skip: `body too short (${text.length} chars)` };

  const { kind, section } = classify(docPath);
  return {
    doc: {
      path: docPath,
      url,
      title,
      kind,
      section,
      text,
      words: (text.match(/\b[\w'-]+\b/g) ?? []).length,
      hash: hashOf(text),
      fetchedAt: new Date().toISOString(),
    },
  };
}

// --------------------------------------------------------------------- cache

function readCache(): CacheFile | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) as CacheFile;
  } catch {
    return null;
  }
}

function writeCache(entries: SupportDoc[], skipped: { path: string; reason: string }[]) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const payload: CacheFile = {
    version: 2,
    base: SUPPORT_KB_BASE,
    entries,
    updatedAt: new Date().toISOString(),
    skipped,
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), "utf8");
}

function cacheFresh(cache: CacheFile | null): boolean {
  if (!cache?.updatedAt) return false;
  if (cache.version !== 2) return false; // force a re-crawl off the old schema
  return Date.now() - new Date(cache.updatedAt).getTime() < CACHE_TTL_MS;
}

// --------------------------------------------------------------------- crawl

/**
 * Crawl the whole support site and rewrite the cache.
 *
 * Returns a diff against the previous cache so a re-crawl can report what
 * actually changed on the docs site rather than just "done".
 */
export async function refreshSupportKnowledge(
  opts: { paths?: string[]; concurrency?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<{ ok: boolean; count: number; message: string; diff: CrawlDiff }> {
  const previous = readCache();
  const prevByPath = new Map((previous?.entries ?? []).map((e) => [e.path, e]));

  const paths = opts.paths ?? (await discoverSupportPaths());
  const emptyDiff: CrawlDiff = { added: [], changed: [], removed: [], unchanged: 0, skipped: [] };
  if (paths.length === 0) {
    return {
      ok: false,
      count: 0,
      message: `Could not discover any pages from ${SUPPORT_KB_BASE}/sitemap.xml — check network`,
      diff: emptyDiff,
    };
  }

  const entries: SupportDoc[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 5, 8));
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (cursor < paths.length) {
      const p = paths[cursor++];
      const r = await fetchDoc(p);
      if ("doc" in r) entries.push(r.doc);
      else skipped.push({ path: p, reason: r.skip });
      done++;
      opts.onProgress?.(done, paths.length);
      await new Promise((r) => setTimeout(r, 120)); // stay polite
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, paths.length) }, worker));

  if (entries.length === 0) {
    return {
      ok: false,
      count: 0,
      message: `Discovered ${paths.length} pages but extracted none — extraction or network problem`,
      diff: { ...emptyDiff, skipped },
    };
  }

  entries.sort((a, b) => a.path.localeCompare(b.path));

  const diff: CrawlDiff = { added: [], changed: [], removed: [], unchanged: 0, skipped };
  for (const e of entries) {
    const prev = prevByPath.get(e.path);
    if (!prev) diff.added.push(e.path);
    else if (prev.hash !== e.hash) diff.changed.push(e.path);
    else diff.unchanged++;
  }
  const nowPaths = new Set(entries.map((e) => e.path));
  for (const p of prevByPath.keys()) if (!nowPaths.has(p)) diff.removed.push(p);

  writeCache(entries, skipped);
  return {
    ok: true,
    count: entries.length,
    message: `Cached ${entries.length} docs from ${SUPPORT_KB_BASE} (+${diff.added.length} new, ~${diff.changed.length} changed, -${diff.removed.length} gone, ${skipped.length} skipped)`,
    diff,
  };
}

// ---------------------------------------------------------------- prompt use

/**
 * Build the grounding block injected into brief and article prompts.
 *
 * With 130-plus docs cached, dumping everything would blow the context window,
 * so when a topic is supplied the block is scored for relevance and only the
 * best-matching docs are included. Category index pages are de-prioritised
 * because they are mostly link lists.
 */
export async function getSupportKnowledgeContext(
  maxChars = 4500,
  topic?: string,
): Promise<string> {
  let cache = readCache();
  if (!cacheFresh(cache)) {
    await refreshSupportKnowledge();
    cache = readCache();
  }
  const all = cache?.entries ?? [];
  if (all.length === 0) {
    return `SUPPORT KB (${SUPPORT_KB_BASE}): Use only documented Kloudbean capabilities. For KSA GCP, anchor on me-central2 (Dammam).`;
  }

  let ranked = all;
  if (topic?.trim()) {
    // Two-character minimum, not three. Infrastructure topics hinge on short
    // acronyms: "ip", and by extension ssl, dns, s3, tls. A three-char floor
    // silently dropped "ip", which made an IP-access-control topic rank the
    // database and SSH docs above the actual IP doc.
    const terms = [
      ...new Set(
        topic
          .toLowerCase()
          .match(/\b[a-z][a-z0-9+.-]{1,}\b/g)
          ?.filter((t) => !STOPWORDS.has(t)) ?? [],
      ),
    ];
    ranked = all
      .map((e) => {
        const hay = `${e.title} ${e.path} ${e.section ?? ""} ${e.text}`.toLowerCase();
        let score = 0;
        for (const t of terms) {
          if (e.title.toLowerCase().includes(t)) score += 6;
          else if (e.path.includes(t)) score += 4;
          else if (hay.includes(t)) score += 1;
        }
        if (e.kind === "category") score -= 3; // index pages are link lists
        return { e, score };
      })
      .sort((a, b) => b.score - a.score)
      .filter((r) => r.score > 0)
      .map((r) => r.e);
    if (ranked.length === 0) ranked = all.filter((e) => e.kind === "doc");
  }

  const header = `LIVE SUPPORT KB (${SUPPORT_KB_BASE}, ${all.length} docs crawled ${cache?.updatedAt?.slice(0, 10) ?? "recently"}) — treat as SOURCE OF TRUTH for what the product does; never contradict it and never extend it:`;
  const lines = [header];
  let used = header.length;
  const perDoc = ranked.length > 6 ? 700 : 1100;
  for (const e of ranked) {
    const block = `\n[${e.path}] ${e.title}\n${e.text.slice(0, perDoc)}`;
    if (used + block.length > maxChars) break;
    lines.push(block);
    used += block.length;
  }
  return lines.join("\n");
}

const STOPWORDS = new Set(
  "the a an and or for with your you how what why when to of in on is are it that this from can do does not into best guide tutorial".split(
    " ",
  ),
);

export function getSupportCacheStatus(): {
  cached: boolean;
  count: number;
  updatedAt: string | null;
  skipped: number;
} {
  const cache = readCache();
  return {
    cached: cacheFresh(cache),
    count: cache?.entries?.length ?? 0,
    updatedAt: cache?.updatedAt ?? null,
    skipped: cache?.skipped?.length ?? 0,
  };
}

/** Read-only accessor for tooling and reports. */
export function readSupportDocs(): SupportDoc[] {
  return readCache()?.entries ?? [];
}
