import "@tanstack/react-start/server-only";

/**
 * Publish-time internal-link deferral.
 *
 * Our articles link to each other, but they go live at different times. Roughly
 * 58% of the internal links across the library currently point at articles that
 * are not published yet, so publishing as-written would ship hundreds of 404s.
 *
 * The rule applied here: never publish a link we cannot honour.
 *   - target already live  -> keep the link exactly as written
 *   - target not live yet  -> unwrap the link, leaving the anchor words as plain
 *                             text, and record a pending row
 *
 * Leaving the words behind is what makes the repair possible later: the
 * WordPress plugin's link inserter finds that exact phrase in the post body and
 * wraps it, so the link lands precisely where the writer put it.
 */

/** Matches our own blog links, capturing the target slug and the anchor markup. */
const BLOG_LINK_RE =
  /<a\b[^>]*href="https?:\/\/(?:www\.)?kloudbean\.com\/blog\/([a-z0-9-]+)\/?"[^>]*>([\s\S]*?)<\/a>/gi;

export type DeferredLink = {
  targetSlug: string;
  /** Plain-text anchor, which is what the plugin will search for later. */
  anchorText: string;
};

export type DeferralResult = {
  html: string;
  /** Links kept because their target is already live at the URL we wrote. */
  kept: number;
  /**
   * Links kept but pointed at the target's REAL published URL, because the live
   * post lives at a different slug than the folder name we linked to.
   */
  rewritten: number;
  /** Links unwrapped to plain text, to be restored when the target goes live. */
  deferred: DeferredLink[];
  /** Self-referential links unwrapped and not recorded. */
  selfLinks: number;
  /** Unwrapped, but no phrase long enough to find again, so no repair promised. */
  unrecoverable: number;
};

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function toPlainText(html: string): string {
  return decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

/**
 * A phrase this long is specific enough to find again safely.
 */
const SAFE_ANCHOR_LENGTH = 12;

/**
 * Below the safe length a phrase is only usable if it occurs exactly once in the
 * body, because the inserter wraps the FIRST match. Short repeated words like
 * "staging" or "Django" appear many times in an article, so linking the first
 * one would put the link somewhere the writer never intended.
 */
const MIN_UNIQUE_ANCHOR_LENGTH = 4;

/**
 * The candidate phrase to look for when repairing this link later.
 *
 * The inserter searches the published post body for a literal string, so the
 * anchor has to survive as literal text. A plain anchor is used as-is. When the
 * anchor contains markup, for example
 * `<code>VITE_</code> variables bake into the bundle`, the full plain text never
 * appears literally, so the longest uninterrupted run of text is used instead.
 */
function anchorCandidate(innerHtml: string): string {
  if (!/<[^>]+>/.test(innerHtml)) return toPlainText(innerHtml);
  const runs = innerHtml
    .split(/<[^>]+>/)
    .map((part) => decode(part).replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!runs.length) return "";
  return runs.reduce((a, b) => (b.length > a.length ? b : a));
}

/** Count literal occurrences of a phrase, so ambiguity can be detected. */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

/** Compare URLs ignoring protocol, www, and a trailing slash. */
function normaliseUrl(u: string): string {
  return u
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

/**
 * Rewrite a body so it only contains links we can honour right now.
 *
 * `resolveLiveUrl` returns the real published URL for a slug, or null when that
 * article is not live yet.
 *
 * Returning the URL rather than a boolean matters more than it looks. Writers
 * link to `/blog/<folder-slug>/`, but a WordPress post can live at a different
 * slug: `server-backups-guide` is published at
 * `/blog/server-backups-that-actually-restore-a-practical-guide/`. Treating
 * "is it live?" as the only question would keep 531 links across the library
 * pointing at URLs that 404 even though the article exists. So a live target's
 * href is corrected to wherever the post actually is.
 */
export function deferUnpublishedLinks(
  bodyHtml: string,
  fromSlug: string,
  resolveLiveUrl: (slug: string) => string | null,
): DeferralResult {
  const candidates: { targetSlug: string; anchorText: string }[] = [];
  let kept = 0;
  let rewritten = 0;
  let selfLinks = 0;

  const html = bodyHtml.replace(
    BLOG_LINK_RE,
    (whole: string, targetSlug: string, inner: string) => {
      // A link to the article itself is noise. Drop the link, keep the words.
      if (targetSlug === fromSlug) {
        selfLinks++;
        return inner;
      }
      const liveUrl = resolveLiveUrl(targetSlug);
      if (liveUrl) {
        const writtenUrl = `https://www.kloudbean.com/blog/${targetSlug}/`;
        if (normaliseUrl(liveUrl) === normaliseUrl(writtenUrl)) {
          kept++;
          return whole;
        }
        // The post is live somewhere else. Point at the real URL.
        rewritten++;
        return whole.replace(
          /href="https?:\/\/(?:www\.)?kloudbean\.com\/blog\/[a-z0-9-]+\/?"/i,
          `href="${liveUrl}"`,
        );
      }
      candidates.push({ targetSlug, anchorText: anchorCandidate(inner) });
      return inner;
    },
  );

  // Decide which candidates are safe to promise, now that the final body exists.
  // Ambiguity is judged against what will actually be published, not the source.
  const deferred: DeferredLink[] = [];
  let unrecoverable = 0;
  for (const c of candidates) {
    const len = c.anchorText.length;
    const safe =
      len >= SAFE_ANCHOR_LENGTH ||
      (len >= MIN_UNIQUE_ANCHOR_LENGTH && countOccurrences(html, c.anchorText) === 1);
    if (safe) deferred.push(c);
    else unrecoverable++;
  }

  return { html, kept, rewritten, deferred, selfLinks, unrecoverable };
}

/**
 * Published articles mapped to the URL they actually live at.
 *
 * Trustworthy now that publish state is reconciled against live WordPress on
 * every autopilot cycle (see publish-state-sync.ts). Before that fix this was
 * stale, which is how the engine came to believe 21 articles were live when 38
 * were.
 *
 * Falls back to the canonical folder-slug URL when a published row somehow has
 * no recorded URL, which is the best guess available.
 */
export async function loadLiveUrls(): Promise<Map<string, string>> {
  const articlesRepo = await import("@/server/db/repos/articles");
  const rows = await articlesRepo.listArticles({ limit: 5000 });
  const out = new Map<string, string>();
  for (const r of rows) {
    if (r.status !== "published" || !r.url_slug) continue;
    out.set(r.url_slug, r.published_url ?? `https://www.kloudbean.com/blog/${r.url_slug}/`);
  }
  return out;
}

/** Slugs that are currently published. Thin wrapper over loadLiveUrls(). */
export async function loadLiveSlugs(): Promise<Set<string>> {
  return new Set((await loadLiveUrls()).keys());
}

/**
 * Apply deferral to a body and persist the ledger rows.
 *
 * Pending rows for this article are cleared first, so republishing re-derives
 * the outstanding set from the current file instead of accumulating rows for
 * links that have since been edited away.
 */
export async function applyDeferralAndRecord(
  bodyHtml: string,
  fromSlug: string,
  opts: { liveUrls?: Map<string, string>; log?: (m: string) => void } = {},
): Promise<DeferralResult & { recorded: number }> {
  const log = opts.log ?? (() => {});
  const live = opts.liveUrls ?? (await loadLiveUrls());
  const result = deferUnpublishedLinks(bodyHtml, fromSlug, (s) => live.get(s) ?? null);

  let recorded = 0;
  if (fromSlug) {
    const ledger = await import("@/server/db/repos/pending-internal-links");
    await ledger.clearPendingFrom(fromSlug);
    if (result.deferred.length) {
      const res = await ledger.recordPendingLinks(
        result.deferred.map((d) => ({
          from_slug: fromSlug,
          target_slug: d.targetSlug,
          anchor_text: d.anchorText,
        })),
      );
      recorded = res.inserted;
    }
  }

  if (result.deferred.length || result.selfLinks || result.rewritten) {
    log(
      `internal links: ${result.kept} kept, ${result.rewritten} pointed at real URL, ` +
        `${result.deferred.length} deferred` +
        `${result.selfLinks ? `, ${result.selfLinks} self-link(s) unwrapped` : ""}`,
    );
  }
  return { ...result, recorded };
}
