import "@tanstack/react-start/server-only";

/**
 * SITE-WIDE AUTO INTERNAL LINKING — the engine's own content (articles/tools)
 * can already resolve internal links to each other (see internal-links.ts).
 * This module extends that to the ENTIRE live WordPress site: every post and
 * page, regardless of who/what authored it, so link opportunities are found
 * and applied across content this engine never touched.
 *
 * Pipeline:
 *   1. SYNC    — pull every post/page from the plugin's /site-content endpoint
 *                into the site_pages table (title, excerpt, body text, current
 *                outbound link count).
 *   2. SCORE   — for every page, find the best-matching OTHER pages by topical
 *                similarity (token overlap on title/excerpt/body + cluster
 *                match), and propose an anchor phrase actually present in the
 *                source page's text (so the link reads naturally).
 *   3. APPLY   — for the highest-scoring pending suggestions, call the
 *                plugin's /apply-link endpoint to insert the link live, then
 *                mark the suggestion applied (or record the error).
 *
 * SAFETY:
 *   - Never touches slugs/titles. Only inserts an anchor link into content.
 *   - A page is never linked to itself, and a pair is only suggested once
 *     (unique index on source+target) — re-scanning never duplicates work.
 *   - Applying is rate-capped per run so a single cycle can't spam the site
 *     with dozens of edits at once.
 */

import { classifyCluster, relevanceScore } from "./kloudgraph/opportunity-engine";

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  const STOP = new Set([
    "the",
    "and",
    "for",
    "with",
    "your",
    "you",
    "are",
    "this",
    "that",
    "from",
    "how",
    "what",
    "why",
    "can",
    "will",
    "have",
    "has",
    "our",
    "all",
    "into",
    "when",
    "where",
    "which",
    "their",
    "them",
    "was",
    "were",
    "been",
    "not",
    "but",
    "get",
    "use",
    "using",
    "used",
    "one",
    "more",
    "most",
    "than",
  ]);
  return new Set(
    norm(s)
      .split(" ")
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Find a short phrase from `text` that reasonably represents `targetTitle`,
 * to use as the anchor. Falls back to the target's own title if nothing
 * better is found in the source text — the plugin's classic-content inserter
 * will then append a linking sentence instead of wrapping in-place.
 */
function pickAnchor(sourceText: string, targetTitle: string): string {
  const cleanTitle = targetTitle.replace(/\s*[-–—|]\s*kloudbean.*$/i, "").trim();
  const hay = norm(sourceText);
  // Exact title phrase present verbatim in the source body — best case.
  if (hay.includes(norm(cleanTitle))) return cleanTitle;
  // Try dropping generic lead words ("what is", "how to", "the best") to find
  // a shorter phrase that's more likely to appear naturally.
  const trimmed = cleanTitle
    .replace(/^(what is|how to|the best|top \d+|a guide to|guide to)\s+/i, "")
    .trim();
  if (trimmed && trimmed !== cleanTitle && hay.includes(norm(trimmed))) return trimmed;
  return cleanTitle;
}

export type SyncSiteContentResult = {
  ok: boolean;
  synced: number;
  totalOnSite: number;
  error?: string;
};

/** Pull every post/page from WordPress into site_pages (paginated, all pages). */
export async function syncSiteContent(opts: {
  postTypes?: string;
  maxPages?: number;
  perPage?: number;
}): Promise<SyncSiteContentResult> {
  const { hasPluginConfigured, listSiteContent } = await import("./wp-plugin-client");
  if (!hasPluginConfigured()) {
    return { ok: false, synced: 0, totalOnSite: 0, error: "WordPress plugin not configured." };
  }
  const sitePagesRepo = await import("@/server/db/repos/site-pages");

  let synced = 0;
  let totalOnSite = 0;
  const maxPages = opts.maxPages ?? 30;
  const perPage = opts.perPage ?? 50;

  for (let page = 1; page <= maxPages; page++) {
    const res = await listSiteContent({
      postTypes: opts.postTypes ?? "post,page",
      status: "publish",
      perPage,
      page,
    });
    if (!res.ok) {
      return {
        ok: synced > 0,
        synced,
        totalOnSite,
        error: res.error ?? "site-content fetch failed",
      };
    }
    totalOnSite = res.total;
    for (const item of res.items) {
      const cluster = classifyCluster(`${item.title} ${item.excerpt}`);
      await sitePagesRepo.upsertSitePage({
        wp_post_id: item.id,
        post_type: item.post_type,
        title: item.title,
        slug: item.slug,
        published_url: item.link,
        status: item.status,
        excerpt: item.excerpt,
        content_text: item.content_text,
        word_count: item.word_count,
        cluster_id: cluster?.id ?? null,
        modified_at: item.modified ? new Date(item.modified) : null,
      });
      synced++;
    }
    if (page >= res.total_pages) break;
  }

  return { ok: true, synced, totalOnSite };
}

export type LinkOpportunity = {
  sourcePageId: string;
  targetPageId: string;
  anchorText: string;
  score: number;
  reason: string;
};

/**
 * Score every page against every other page for topical link opportunities.
 * O(n^2) token-similarity — fine at hundreds of pages (in-memory, no DB calls
 * inside the loop). Returns the top N pairs overall, skipping pages that
 * already have "enough" outbound links (default cap 8) to avoid over-linking
 * a single page.
 */
export async function scoreLinkOpportunities(opts: {
  minScore?: number;
  maxOutboundPerPage?: number;
  limit?: number;
}): Promise<LinkOpportunity[]> {
  const sitePagesRepo = await import("@/server/db/repos/site-pages");
  const pages = await sitePagesRepo.listSitePages({ limit: 3000 });
  const minScore = opts.minScore ?? 0.12;
  const maxOutbound = opts.maxOutboundPerPage ?? 8;

  // Pre-tokenize once.
  const tok = new Map<string, Set<string>>();
  for (const p of pages) {
    tok.set(p.id, tokens(`${p.title} ${p.excerpt ?? ""} ${(p.content_text ?? "").slice(0, 1500)}`));
  }

  const out: LinkOpportunity[] = [];
  for (const src of pages) {
    if ((src.outbound_link_count ?? 0) >= maxOutbound) continue;
    const srcTok = tok.get(src.id)!;
    let bestForThisSource: LinkOpportunity | null = null;

    for (const tgt of pages) {
      if (tgt.id === src.id) continue;
      // Relevance floor: don't link to off-topic pages even if token overlap
      // happens to be nonzero (e.g. both mention "free").
      if (relevanceScore(tgt.title) < 0.15) continue;

      const tgtTok = tok.get(tgt.id)!;
      let score = jaccard(srcTok, tgtTok);
      if (src.cluster_id != null && src.cluster_id === tgt.cluster_id) score += 0.08;
      if (score < minScore) continue;

      if (!bestForThisSource || score > bestForThisSource.score) {
        const anchor = pickAnchor(
          `${src.title} ${src.excerpt ?? ""} ${src.content_text ?? ""}`,
          tgt.title,
        );
        bestForThisSource = {
          sourcePageId: src.id,
          targetPageId: tgt.id,
          anchorText: anchor,
          score: Math.round(score * 1000) / 1000,
          reason:
            src.cluster_id != null && src.cluster_id === tgt.cluster_id
              ? `Same topic cluster + ${Math.round(score * 100)}% content overlap`
              : `${Math.round(score * 100)}% content overlap`,
        };
      }
    }
    if (bestForThisSource) out.push(bestForThisSource);
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, opts.limit ?? 300);
}

export type RunScanResult = {
  ok: boolean;
  sync: SyncSiteContentResult;
  found: number;
  saved: number;
  skipped: number;
  error?: string;
};

/** Full scan cycle: sync live content, then score + persist fresh suggestions. */
export async function runSiteLinkScan(opts: {
  maxPages?: number;
  minScore?: number;
  limit?: number;
}): Promise<RunScanResult> {
  const sync = await syncSiteContent({ maxPages: opts.maxPages ?? 30 });
  if (!sync.ok && sync.synced === 0) {
    return { ok: false, sync, found: 0, saved: 0, skipped: 0, error: sync.error };
  }

  const opportunities = await scoreLinkOpportunities({
    minScore: opts.minScore ?? 0.12,
    limit: opts.limit ?? 300,
  });

  const linkSuggestionsRepo = await import("@/server/db/repos/link-suggestions");
  const { inserted, skipped } = await linkSuggestionsRepo.insertLinkSuggestions(
    opportunities.map((o) => ({
      source_page_id: o.sourcePageId,
      target_page_id: o.targetPageId,
      anchor_text: o.anchorText,
      score: o.score,
      reason: o.reason,
    })),
  );

  return { ok: true, sync, found: opportunities.length, saved: inserted, skipped };
}

export type ApplySuggestionsResult = {
  ok: boolean;
  applied: number;
  failed: number;
  errors: string[];
};

/** Apply the top N pending suggestions live via the plugin, then update their status. */
export async function applyTopSuggestions(limit = 10): Promise<ApplySuggestionsResult> {
  const { hasPluginConfigured, applyLink } = await import("./wp-plugin-client");
  if (!hasPluginConfigured()) {
    return { ok: false, applied: 0, failed: 0, errors: ["WordPress plugin not configured."] };
  }
  const linkSuggestionsRepo = await import("@/server/db/repos/link-suggestions");
  const sitePagesRepo = await import("@/server/db/repos/site-pages");

  const pending = await linkSuggestionsRepo.listPendingSuggestions(limit);
  let applied = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const s of pending) {
    try {
      const sourcePage = await sitePagesRepo.getSitePageById(s.source_page_id);
      const targetPage = await sitePagesRepo.getSitePageById(s.target_page_id);
      if (!sourcePage?.wp_post_id || !targetPage?.published_url) {
        await linkSuggestionsRepo.updateLinkSuggestionStatus(
          s.id,
          "skipped",
          "missing source wp_post_id or target URL",
        );
        continue;
      }
      const res = await applyLink({
        source_post_id: sourcePage.wp_post_id,
        target_url: targetPage.published_url,
        anchor_text: s.anchor_text,
      });
      if (res.ok && res.applied) {
        await linkSuggestionsRepo.updateLinkSuggestionStatus(s.id, "applied");
        await sitePagesRepo.incrementLinkCounts(s.source_page_id, s.target_page_id);
        applied++;
      } else if (res.ok && !res.applied) {
        // Anchor text wasn't found and no room to append — not an error, just
        // not actionable for this pair.
        await linkSuggestionsRepo.updateLinkSuggestionStatus(
          s.id,
          "skipped",
          "anchor not insertable",
        );
      } else {
        await linkSuggestionsRepo.updateLinkSuggestionStatus(s.id, "pending", res.error);
        failed++;
        errors.push(`${s.source_title} -> ${s.target_title}: ${res.error}`);
      }
    } catch (e) {
      failed++;
      errors.push(`${s.source_title} -> ${s.target_title}: ${String((e as Error)?.message ?? e)}`);
    }
  }

  return { ok: true, applied, failed, errors };
}
