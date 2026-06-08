import "@tanstack/react-start/server-only";

async function getRepo() {
  return import("@/server/db/repos/articles");
}

/**
 * Real internal-link resolution — turns the "topical authority mesh" from an
 * aspiration into reality.
 *
 * The AI brief emits internal_links: [{ anchor, target_topic }] and the writer
 * emits [anchor](internal:slug). Previously nothing connected those to actual
 * articles. This module:
 *   1. Builds an index of existing articles (slug, title, keyword, cluster).
 *   2. Resolves a target_topic / slug guess to the BEST real article.
 *   3. Rewrites internal: links in markdown to real published URLs or slugs.
 */

export type LinkCandidate = {
  id: string;
  title: string;
  slug: string;
  keyword: string | null;
  clusterId: number | null;
  publishedUrl: string | null;
  status: string;
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((w) => w.length > 2));
}

function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.sqrt(ta.size * tb.size);
}

/** Build a link index from current articles (excludes the article being linked from). */
export async function buildLinkIndex(excludeId?: string, geo?: string): Promise<LinkCandidate[]> {
  const articlesRepo = await getRepo();
  const rows = await articlesRepo.listArticles({ geo, limit: 2000 });
  return rows
    .filter((r) => r.id !== excludeId)
    .map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.url_slug ?? slugify(r.title),
      keyword: r.target_keyword,
      clusterId: r.cluster_id,
      publishedUrl: r.published_url,
      status: r.status,
    }));
}

/** Resolve a topic/slug string to the best matching article. */
export function resolveTarget(
  query: string,
  index: LinkCandidate[],
  opts: { preferClusterId?: number | null } = {},
): LinkCandidate | null {
  if (!query || !index.length) return null;
  const qNorm = norm(query);
  const qSlug = slugify(query);

  let best: LinkCandidate | null = null;
  let bestScore = 0;

  for (const cand of index) {
    let score = 0;
    // exact slug match
    if (cand.slug === qSlug) score += 1.0;
    // keyword / title similarity
    score += similarity(query, cand.title) * 0.7;
    if (cand.keyword) score += similarity(query, cand.keyword) * 0.9;
    // exact phrase containment
    if (cand.keyword && norm(cand.keyword) === qNorm) score += 0.6;
    // same-cluster bonus (keeps links topically tight)
    if (opts.preferClusterId != null && cand.clusterId === opts.preferClusterId) score += 0.15;
    // prefer already-published targets (live links)
    if (cand.publishedUrl) score += 0.1;

    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }

  // require a minimum confidence so we don't link to unrelated articles
  return bestScore >= 0.45 ? best : null;
}

export type ResolvedLink = {
  anchor: string;
  targetTopic: string;
  resolved: LinkCandidate | null;
  href: string | null;
};

/** Resolve the brief's internal_links array to real targets. */
export async function resolveInternalLinks(
  internalLinks: { anchor?: string; target_topic?: string }[],
  fromArticleId: string,
  clusterId: number | null,
  geo?: string,
): Promise<ResolvedLink[]> {
  const index = await buildLinkIndex(fromArticleId, geo);
  const out: ResolvedLink[] = [];
  for (const link of internalLinks ?? []) {
    const anchor = link.anchor?.trim() || link.target_topic?.trim() || "";
    const topic = link.target_topic?.trim() || link.anchor?.trim() || "";
    if (!anchor && !topic) continue;
    const resolved = resolveTarget(topic, index, { preferClusterId: clusterId });
    out.push({
      anchor,
      targetTopic: topic,
      resolved,
      href: resolved ? resolved.publishedUrl ?? `/${resolved.slug}` : null,
    });
  }
  return out;
}

const INTERNAL_LINK_RE = /\[([^\]]+)\]\(internal:([^)]+)\)/g;

/**
 * Rewrite [anchor](internal:slug-or-topic) links in markdown to real targets.
 * - If a matching article exists → its published URL (or /slug).
 * - If no match and dropUnresolved → unwrap to plain text (avoids dead links).
 */
export async function rewriteInternalLinksInMarkdown(
  markdown: string,
  fromArticleId: string,
  clusterId: number | null,
  geo: string | undefined,
  opts: { dropUnresolved?: boolean; baseUrl?: string } = {},
): Promise<{ markdown: string; resolved: number; unresolved: number }> {
  if (!markdown || !markdown.includes("internal:")) {
    return { markdown, resolved: 0, unresolved: 0 };
  }
  const index = await buildLinkIndex(fromArticleId, geo);
  let resolved = 0;
  let unresolved = 0;
  const base = (opts.baseUrl ?? "").replace(/\/$/, "");

  const out = markdown.replace(INTERNAL_LINK_RE, (_m, anchor: string, target: string) => {
    const match = resolveTarget(target.trim(), index, { preferClusterId: clusterId });
    if (match) {
      resolved++;
      const href = match.publishedUrl ?? `${base}/${match.slug}`;
      return `[${anchor}](${href})`;
    }
    unresolved++;
    if (opts.dropUnresolved) return anchor; // unwrap to plain text
    return `[${anchor}](${base}/${slugify(target)})`; // best-effort slug
  });

  return { markdown: out, resolved, unresolved };
}
