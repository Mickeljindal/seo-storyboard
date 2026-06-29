import "@tanstack/react-start/server-only";
import { loadProjectEnv } from "./load-env";
import type { ApiArticle } from "@/server/db/map";

/**
 * FRESHNESS / DECAY MANAGEMENT (roadmap F).
 *
 * AI engines and Google favour recently-reviewed, dated content. This module
 * tracks WHEN each published article was last reviewed (separate from when it
 * was first published), schedules the next review, and produces a prioritised
 * queue of articles that are due — so the autopilot refreshes the ones most
 * worth refreshing instead of blindly rewriting by age.
 *
 * Priority blends: how overdue it is + real Search Console signal (declining or
 * high-impression-but-low-CTR pages are worth refreshing first).
 */

export function reviewIntervalDays(): number {
  loadProjectEnv();
  return Math.max(
    14,
    Number(process.env.CONTENT_REVIEW_DAYS || process.env.AUTOPILOT_REFRESH_DAYS || 90),
  );
}

/** The effective "last touched" time: most recent of review or publish. */
export function effectiveFreshnessDate(a: ApiArticle): number {
  const reviewed = a.last_reviewed_at ? new Date(a.last_reviewed_at).getTime() : 0;
  const published = a.published_at ? new Date(a.published_at).getTime() : 0;
  return Math.max(reviewed, published);
}

export type StaleArticle = {
  id: string;
  title: string;
  url: string | null;
  cluster_id: number | null;
  published_at: string | null;
  last_reviewed_at: string | null;
  age_days: number;
  priority: number; // higher = refresh sooner
  reason: string;
};

function daysSince(ms: number): number {
  if (!ms) return 9999;
  return Math.floor((Date.now() - ms) / 86400_000);
}

/**
 * Build a prioritised list of published articles due for review.
 * Pulls Search Console performance (best-effort) to rank decay candidates.
 */
export async function listStaleArticles(limit = 25): Promise<StaleArticle[]> {
  const articlesRepo = await import("@/server/db/repos/articles");
  const intervalDays = reviewIntervalDays();
  const cutoff = Date.now() - intervalDays * 86400_000;

  const all = await articlesRepo.listArticles({ limit: 5000 });
  const live = all.filter(
    (a) => (a.status === "published" || a.status === "promoted") && effectiveFreshnessDate(a) > 0,
  );

  // Best-effort: map published_url → GSC performance for decay scoring.
  const perfByPage = new Map<string, { clicks: number; impressions: number; position: number }>();
  try {
    const perfRepo = await import("@/server/db/repos/search-performance");
    const rows = await perfRepo.getLatestPerformance(1000);
    for (const r of rows) {
      const key = normalizeUrl(r.page);
      if (key)
        perfByPage.set(key, {
          clicks: r.clicks ?? 0,
          impressions: r.impressions ?? 0,
          position: r.position ?? 0,
        });
    }
  } catch {
    /* performance optional */
  }

  const stale: StaleArticle[] = [];
  for (const a of live) {
    const eff = effectiveFreshnessDate(a);
    if (eff >= cutoff) continue; // still fresh
    const ageDays = daysSince(eff);
    const overdueDays = ageDays - intervalDays;

    let priority = Math.min(60, Math.max(0, overdueDays)); // age component (cap 60)
    let reason = `${ageDays}d since last review`;

    const perf = a.published_url ? perfByPage.get(normalizeUrl(a.published_url)) : undefined;
    if (perf) {
      // High impressions + weak position = big refresh upside.
      if (perf.impressions >= 100 && perf.position > 8) {
        priority += 30;
        reason = `${perf.impressions} impr at avg pos ${perf.position.toFixed(1)} — refresh upside`;
      } else if (perf.impressions >= 50 && perf.clicks === 0) {
        priority += 20;
        reason = `${perf.impressions} impr, 0 clicks — title/intro decay`;
      } else if (perf.clicks > 0) {
        // Earning clicks → still refresh on schedule but lower urgency.
        priority += 5;
        reason = `${perf.clicks} clicks/${perf.impressions} impr — scheduled review`;
      }
    }

    stale.push({
      id: a.id,
      title: a.title,
      url: a.published_url,
      cluster_id: a.cluster_id,
      published_at: a.published_at,
      last_reviewed_at: a.last_reviewed_at,
      age_days: ageDays,
      priority,
      reason,
    });
  }

  stale.sort((x, y) => y.priority - x.priority);
  return stale.slice(0, limit);
}

function normalizeUrl(u: string | null | undefined): string {
  if (!u) return "";
  try {
    const url = new URL(u);
    return (url.host + url.pathname).replace(/\/$/, "").toLowerCase();
  } catch {
    return String(u).replace(/\/$/, "").toLowerCase();
  }
}

/**
 * Mark an article reviewed: stamp last_reviewed_at + schedule next_review_at.
 * If `rewrite` is true, clear the draft/score so the next cycle regenerates it.
 */
export async function markArticleReviewed(
  id: string,
  opts: { rewrite?: boolean } = {},
): Promise<void> {
  const articlesRepo = await import("@/server/db/repos/articles");
  const now = new Date();
  const next = new Date(now.getTime() + reviewIntervalDays() * 86400_000);
  const article = await articlesRepo.getArticleById(id);
  const patch: Record<string, unknown> = {
    last_reviewed_at: now,
    next_review_at: next,
    review_count: (article?.review_count ?? 0) + 1,
  };
  if (opts.rewrite) {
    patch.quality_score = null;
    patch.quality_report = null;
    patch.content_draft = null;
  }
  await articlesRepo.updateArticle(id, patch);
}

export type FreshnessSummary = {
  totalLive: number;
  fresh: number;
  due: number;
  intervalDays: number;
  oldestDays: number;
};

export async function freshnessSummary(): Promise<FreshnessSummary> {
  const articlesRepo = await import("@/server/db/repos/articles");
  const intervalDays = reviewIntervalDays();
  const cutoff = Date.now() - intervalDays * 86400_000;
  const all = await articlesRepo.listArticles({ limit: 5000 });
  const live = all.filter(
    (a) => (a.status === "published" || a.status === "promoted") && effectiveFreshnessDate(a) > 0,
  );
  let due = 0;
  let oldestDays = 0;
  for (const a of live) {
    const eff = effectiveFreshnessDate(a);
    if (eff < cutoff) due++;
    oldestDays = Math.max(oldestDays, daysSince(eff));
  }
  return {
    totalLive: live.length,
    fresh: live.length - due,
    due,
    intervalDays,
    oldestDays,
  };
}
