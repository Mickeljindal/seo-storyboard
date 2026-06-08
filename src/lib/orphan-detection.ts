import "@tanstack/react-start/server-only";
import * as articlesRepo from "@/server/db/repos/articles";

/**
 * ORPHAN DETECTION — finds articles with zero inbound internal links.
 *
 * An "orphan" article has no other article linking to it, which means:
 *   - Google may not crawl it (poor discoverability)
 *   - It doesn't benefit from the topical authority mesh
 *   - AI engines are less likely to find/cite it
 *
 * This module identifies orphans so the autopilot or the UI can trigger
 * link injection via the WP plugin to fix them.
 */

export type OrphanArticle = {
  id: string;
  title: string;
  url_slug: string | null;
  target_keyword: string | null;
  cluster_id: number | null;
  status: string;
  published_url: string | null;
  inbound_count: number;
};

/** Find articles that have zero inbound internal links from other articles. */
export async function findOrphans(geo?: string): Promise<OrphanArticle[]> {
  const all = await articlesRepo.listArticles({ geo, limit: 5000 });

  // Build a set of all slugs/URLs that are linked TO from any article's content
  const linkedSlugs = new Set<string>();
  const linkedUrls = new Set<string>();

  for (const a of all) {
    const draft = a.content_draft ?? "";
    const html = a.content_html ?? "";
    const combined = draft + " " + html;

    // internal:slug links
    const internalMatches = combined.matchAll(/\(internal:([^)]+)\)/g);
    for (const m of internalMatches) linkedSlugs.add(m[1].trim().toLowerCase());

    // absolute links to the site
    const urlMatches = combined.matchAll(/href=["']https?:\/\/[^"']*\/([^"'?#]+)/gi);
    for (const m of urlMatches) linkedSlugs.add(m[1].replace(/\/$/, "").toLowerCase());

    // internal_link_targets array
    for (const t of a.internal_link_targets ?? []) {
      linkedSlugs.add(t.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
    }
  }

  // Find articles NOT in the linked set
  const orphans: OrphanArticle[] = [];
  for (const a of all) {
    const slug = (a.url_slug ?? "").toLowerCase();
    const isLinked = linkedSlugs.has(slug) || (a.published_url && linkedUrls.has(a.published_url));
    const inboundCount = isLinked ? 1 : 0; // simplified: 0 or at-least-1

    if (inboundCount === 0 && a.status !== "idea") {
      orphans.push({
        id: a.id,
        title: a.title,
        url_slug: a.url_slug,
        target_keyword: a.target_keyword,
        cluster_id: a.cluster_id,
        status: a.status,
        published_url: a.published_url,
        inbound_count: 0,
      });
    }
  }

  return orphans;
}
