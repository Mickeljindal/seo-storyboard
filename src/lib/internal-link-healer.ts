import "@tanstack/react-start/server-only";

/**
 * The internal-link healer.
 *
 * Companion to internal-link-deferral.ts. When an article publishes, any link
 * whose target was not live yet got unwrapped to plain text and recorded in the
 * pending-links ledger. This module does the repair: once the target IS live, it
 * finds every article waiting on it and turns those exact words back into links
 * inside the already-published posts, using the WordPress plugin's inserter.
 *
 * Design notes worth knowing:
 *   - The plugin refuses to add a link when the post already references the
 *     target URL, so re-running this is safe.
 *   - A miss is not a failure. If the anchor phrase is no longer in the post
 *     (someone edited it), the row is closed as "skipped" rather than retried
 *     forever.
 *   - Real failures (network, auth) increment an attempt counter, so a broken
 *     row parks itself after three tries instead of looping.
 *   - Live writes are paced, because this can touch many posts in a row.
 */

export type HealResult = {
  ok: boolean;
  considered: number;
  applied: number;
  skipped: number;
  failed: number;
  errors: string[];
};

const PACE_MS = Number(process.env.LINK_HEAL_PACE_MS || 400);

const empty = (): HealResult => ({
  ok: true,
  considered: 0,
  applied: 0,
  skipped: 0,
  failed: 0,
  errors: [],
});

type SourceInfo = { wpPostId: number | null; isPublished: boolean };

/** Resolve an article slug to its WordPress post id and publish state. */
async function resolveSource(slug: string): Promise<SourceInfo> {
  const articlesRepo = await import("@/server/db/repos/articles");
  const article = await articlesRepo.getArticleBySlug(slug);
  if (!article) return { wpPostId: null, isPublished: false };
  const perf = (article.performance_data as Record<string, unknown> | null) ?? {};
  // The publisher stores it as wordpress_post_id; the reconciler stores wp_post_id.
  const raw = perf.wordpress_post_id ?? perf.wp_post_id;
  const id = typeof raw === "number" ? raw : Number(raw);
  return {
    wpPostId: Number.isFinite(id) && id > 0 ? id : null,
    isPublished: article.status === "published",
  };
}

/** The public URL of a published article, needed as the link href. */
async function resolveTargetUrl(slug: string): Promise<string | null> {
  const articlesRepo = await import("@/server/db/repos/articles");
  const article = await articlesRepo.getArticleBySlug(slug);
  if (!article || article.status !== "published") return null;
  return article.published_url ?? `https://www.kloudbean.com/blog/${slug}/`;
}

/**
 * Apply a batch of pending rows. Shared by the per-target and drain entry points
 * so both behave identically.
 */
async function applyRows(
  rows: { id: string; from_slug: string; target_slug: string; anchor_text: string }[],
  log: (m: string) => void,
): Promise<HealResult> {
  const out = empty();
  out.considered = rows.length;
  if (!rows.length) return out;

  const { hasPluginConfigured, applyLink } = await import("./wp-plugin-client");
  if (!hasPluginConfigured()) {
    return { ...out, ok: false, errors: ["WordPress plugin not configured."] };
  }
  const ledger = await import("@/server/db/repos/pending-internal-links");

  // Cache lookups: a single target usually has many waiting sources.
  const targetUrls = new Map<string, string | null>();
  const sources = new Map<string, SourceInfo>();

  for (const row of rows) {
    try {
      if (!targetUrls.has(row.target_slug)) {
        targetUrls.set(row.target_slug, await resolveTargetUrl(row.target_slug));
      }
      const targetUrl = targetUrls.get(row.target_slug) ?? null;
      if (!targetUrl) {
        // Target is not actually live. Leave the row pending; it is simply not
        // its turn yet, and no attempt is spent on it.
        continue;
      }

      if (!sources.has(row.from_slug)) sources.set(row.from_slug, await resolveSource(row.from_slug));
      const src = sources.get(row.from_slug)!;
      if (!src.isPublished) {
        // The article holding the link is not live yet, so there is nothing to
        // edit. It will be handled when that article publishes.
        continue;
      }
      if (!src.wpPostId) {
        await ledger.markSkipped(row.id, "source article has no WordPress post id");
        out.skipped++;
        continue;
      }

      const res = await applyLink({
        source_post_id: src.wpPostId,
        target_url: targetUrl,
        anchor_text: row.anchor_text,
        // We unwrapped this exact phrase at publish time, so it should be in the
        // body. If it is not, the post was edited: close the row instead of
        // appending the link into some other paragraph.
        strict: true,
        // A link-only edit must not look like a content refresh.
        preserve_modified: true,
      });

      if (res.ok && res.applied) {
        await ledger.markApplied(row.id);
        out.applied++;
      } else if (res.ok && !res.applied) {
        // Either the post already links to the target, or the anchor phrase is
        // no longer present. Both mean "nothing to do", not "try again".
        await ledger.markSkipped(row.id, "anchor not found or already linked");
        out.skipped++;
      } else {
        await ledger.markAttemptFailed(row.id, res.error ?? "unknown plugin error");
        out.failed++;
        out.errors.push(`${row.from_slug} -> ${row.target_slug}: ${res.error}`);
      }
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      await ledger.markAttemptFailed(row.id, msg);
      out.failed++;
      out.errors.push(`${row.from_slug} -> ${row.target_slug}: ${msg}`);
    }
    // Pace live writes so we do not hammer the site.
    await new Promise((r) => setTimeout(r, PACE_MS));
  }

  if (out.applied || out.skipped || out.failed) {
    log(
      `link healing: ${out.applied} applied, ${out.skipped} skipped, ${out.failed} failed ` +
        `of ${out.considered} considered`,
    );
  }
  return out;
}

/**
 * Repair every pending link that points at `targetSlug`.
 * Called right after an article publishes, which is the moment its inbound links
 * become honourable.
 */
export async function healLinksForTarget(
  targetSlug: string,
  opts: { limit?: number; log?: (m: string) => void } = {},
): Promise<HealResult> {
  const log = opts.log ?? (() => {});
  const ledger = await import("@/server/db/repos/pending-internal-links");
  const rows = await ledger.listPendingForTarget(targetSlug, { limit: opts.limit ?? 500 });
  if (!rows.length) return empty();
  log(`link healing: ${rows.length} pending link(s) were waiting for ${targetSlug}`);
  return applyRows(rows, log);
}

/**
 * Catch-up pass across all live targets.
 *
 * The per-target call covers the normal path, but this exists so nothing is lost
 * if a publish happened outside the engine, a run was interrupted, or rows were
 * backfilled. Safe to run on a schedule.
 */
export async function drainPendingLinks(
  opts: { limit?: number; log?: (m: string) => void } = {},
): Promise<HealResult> {
  const log = opts.log ?? (() => {});
  const { loadLiveSlugs } = await import("./internal-link-deferral");
  const live = await loadLiveSlugs();
  if (!live.size) return empty();

  const ledger = await import("@/server/db/repos/pending-internal-links");
  const rows = await ledger.listApplicablePending([...live], { limit: opts.limit ?? 50 });
  if (!rows.length) return empty();
  return applyRows(rows, log);
}
