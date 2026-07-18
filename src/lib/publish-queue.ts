import "@tanstack/react-start/server-only";

/**
 * PRE-PUBLISH REVIEW QUEUE.
 *
 * Nothing Autopilot writes reaches WordPress immediately. Instead, a finished,
 * passing article is QUEUED with a scheduled_publish_at timestamp (now + hold
 * hours). It shows up in the /publish-queue dashboard for the full hold
 * window so a human can preview everything — title, meta, quick answer, FAQ,
 * quality/unified scores, distribution drafts — before it goes live.
 *
 * Two ways an article leaves the queue:
 *   1. A human clicks Approve & Publish (or Reject) any time during the hold.
 *   2. If AUTOPILOT_AUTO_APPROVE_AFTER_HOLD is on, Autopilot itself approves
 *      and publishes anything still queued once its hold window has passed —
 *      "review it if you want, but don't require it forever."
 *
 * This is intentionally separate from the existing `review` status: `review`
 * meant "a human should look at this before it's writeable"; `approval_status`
 * governs the specific "about to go live on kloudbean.com" gate.
 */

export type QueueEntry = {
  id: string;
  title: string;
  target_keyword: string | null;
  cluster_name: string | null;
  quality_score: number | null;
  approval_status: string;
  queued_at: string | null;
  scheduled_publish_at: string | null;
  hours_until_publish: number | null;
};

/**
 * Queue an article for review instead of publishing it immediately. Also
 * kicks off distribution draft generation in the background (best-effort) so
 * the LinkedIn/X/newsletter drafts are ready to preview alongside the article.
 */
export async function queueForReview(
  articleId: string,
  holdHours: number,
): Promise<{ ok: boolean; scheduledPublishAt: string; error?: string }> {
  const repo = await import("@/server/db/repos/articles");
  const article = await repo.getArticleById(articleId);
  if (!article) return { ok: false, scheduledPublishAt: "", error: "Article not found" };

  const now = new Date();
  const scheduledPublishAt = new Date(now.getTime() + Math.max(1, holdHours) * 3600_000);

  await repo.updateArticle(articleId, {
    approval_status: "queued",
    queued_at: now,
    scheduled_publish_at: scheduledPublishAt,
    status: article.status === "idea" ? "review" : article.status,
  });

  // Best-effort: pre-generate distribution drafts so they're ready to preview
  // in the queue, not just after the article goes live.
  try {
    const { generateDistribution } = await import("./distribution-engine");
    const brief = (article.brief ?? {}) as Record<string, unknown>;
    const url = article.url_slug
      ? `https://kloudbean.com/${article.url_slug}`
      : "https://kloudbean.com";
    const summary = String(brief.tldr ?? article.meta_description ?? "") || article.title;
    const keyTakeaways = Array.isArray(brief.key_takeaways)
      ? (brief.key_takeaways as string[])
      : [];
    const result = await generateDistribution({ title: article.title, summary, keyTakeaways, url });
    if (result.ok) {
      const distRepo = await import("@/server/db/repos/distributions");
      if (result.linkedin)
        await distRepo.upsertDistribution({
          articleId,
          channel: "linkedin",
          content: result.linkedin,
        });
      if (result.x_thread)
        await distRepo.upsertDistribution({
          articleId,
          channel: "x_thread",
          content: result.x_thread,
        });
      if (result.newsletter)
        await distRepo.upsertDistribution({
          articleId,
          channel: "newsletter",
          content: result.newsletter,
        });
    }
  } catch {
    /* distribution drafts are a nice-to-have, never block queueing */
  }

  return { ok: true, scheduledPublishAt: scheduledPublishAt.toISOString() };
}

/** List everything currently sitting in the queue, soonest-scheduled first. */
export async function listQueue(): Promise<QueueEntry[]> {
  const repo = await import("@/server/db/repos/articles");
  const all = await repo.listArticles({ limit: 2000 });
  const queued = all.filter((a) => a.approval_status === "queued");
  const now = Date.now();
  return queued
    .map((a) => {
      const scheduled = a.scheduled_publish_at ? new Date(a.scheduled_publish_at).getTime() : null;
      return {
        id: a.id,
        title: a.title,
        target_keyword: a.target_keyword,
        cluster_name: a.cluster_name,
        quality_score: a.quality_score,
        approval_status: a.approval_status,
        queued_at: a.queued_at,
        scheduled_publish_at: a.scheduled_publish_at,
        hours_until_publish: scheduled
          ? Math.round(((scheduled - now) / 3600_000) * 10) / 10
          : null,
      };
    })
    .sort((a, b) => (a.hours_until_publish ?? 0) - (b.hours_until_publish ?? 0));
}

/** Approve now and publish immediately, regardless of remaining hold time. */
export async function approveAndPublish(
  articleId: string,
): Promise<{ ok: boolean; link?: string; error?: string }> {
  const repo = await import("@/server/db/repos/articles");
  const article = await repo.getArticleById(articleId);
  if (!article) return { ok: false, error: "Article not found" };

  await repo.updateArticle(articleId, { approval_status: "approved", approved_at: new Date() });

  const result = await publishOne(articleId);
  if (result.ok) {
    await repo.updateArticle(articleId, { approval_status: "published" });
  }
  return result;
}

/** Reject — pulls it out of the queue without publishing. Article stays as a draft. */
export async function rejectFromQueue(articleId: string, reason: string): Promise<{ ok: boolean }> {
  const repo = await import("@/server/db/repos/articles");
  await repo.updateArticle(articleId, {
    approval_status: "rejected",
    rejected_reason: reason || "Rejected in review queue",
    scheduled_publish_at: null,
  });
  return { ok: true };
}

/** Push the hold window back by N more hours without rejecting or publishing. */
export async function snoozeQueueItem(
  articleId: string,
  extraHours: number,
): Promise<{ ok: boolean; scheduledPublishAt: string }> {
  const repo = await import("@/server/db/repos/articles");
  const article = await repo.getArticleById(articleId);
  const base = article?.scheduled_publish_at ? new Date(article.scheduled_publish_at) : new Date();
  const next = new Date(base.getTime() + Math.max(1, extraHours) * 3600_000);
  await repo.updateArticle(articleId, { scheduled_publish_at: next });
  return { ok: true, scheduledPublishAt: next.toISOString() };
}

/** Shared publish logic — WP plugin if configured, else basic WP REST. */
async function publishOne(
  articleId: string,
): Promise<{ ok: boolean; link?: string; error?: string }> {
  const repo = await import("@/server/db/repos/articles");
  const article = await repo.getArticleById(articleId);
  if (!article) return { ok: false, error: "Article not found" };

  try {
    const { hasPluginConfigured, publishViaPlugin } = await import("./wp-plugin-client");
    if (hasPluginConfigured()) {
      const { generateHeroImage } = await import("./image-generator");
      const { renderArticleHtml, buildJsonLd } = await import("./content-render");
      const { CLUSTERS } = await import("./pillars");

      const brief = (article.brief ?? {}) as Record<string, unknown>;
      const cluster = CLUSTERS.find((c) => c.id === article.cluster_id);
      const image = await generateHeroImage(article.title, article.target_keyword ?? "");
      const nowIso = new Date().toISOString();
      const html = renderArticleHtml(article.content_draft!, brief, {
        clusterName: cluster?.name,
        imageUrl: image.url,
        datePublished: nowIso,
        dateModified: nowIso,
      });
      const schema = buildJsonLd(brief, {
        title: article.title,
        clusterName: cluster?.name,
        imageUrl: image.url,
        datePublished: nowIso,
        dateModified: nowIso,
        howTo: null,
        includeService: false,
      });

      const r = await publishViaPlugin({
        title: String(brief.h1 ?? article.title),
        content: html,
        slug: article.url_slug ?? undefined,
        status: "publish",
        meta_title: article.meta_title ?? String(brief.meta_title ?? ""),
        meta_description: article.meta_description ?? String(brief.meta_description ?? ""),
        focus_keyword: article.target_keyword ?? "",
        secondary_keywords: article.secondary_keywords ?? [],
        featured_image_url: image.url,
        og_image_url: image.url,
        category: cluster?.name ?? "Managed Cloud",
        tags: (article.secondary_keywords ?? []).slice(0, 5),
        schema_jsonld: schema,
        toc: true,
        reading_time: Math.ceil((article.word_count_target ?? 2000) / 250),
        excerpt: String(brief.meta_description ?? article.meta_description ?? ""),
        existing_post_id:
          (article.performance_data as { wordpress_post_id?: number })?.wordpress_post_id ?? null,
      });

      if (!r.ok) return { ok: false, error: r.error ?? "Plugin publish failed" };

      await repo.updateArticle(articleId, {
        status: "published",
        published_url: r.link,
        published_at: new Date(),
        performance_data: {
          ...((article.performance_data as Record<string, unknown>) ?? {}),
          wordpress_post_id: r.post_id,
          wordpress_last_sync: new Date().toISOString(),
          featured_image: image.url,
        },
      });
      try {
        const { pingUrlsForIndexing } = await import("./indexing-client");
        if (r.link) await pingUrlsForIndexing([r.link]);
      } catch {
        /* indexing best-effort */
      }
      return { ok: true, link: r.link };
    }
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }

  // Fallback: basic WordPress REST publish (no plugin configured).
  try {
    const { publishArticleInternal } = await import("./wordpress.functions");
    const r = await publishArticleInternal(articleId, "publish");
    return { ok: r.ok, link: r.link, error: r.error };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/**
 * Called every Autopilot cycle: publish anything in the queue whose hold
 * window has fully elapsed — but only if auto-approve-after-hold is enabled.
 * When disabled, queued items sit until a human acts, no matter how long.
 */
export async function processReviewQueue(autoApprove: boolean): Promise<{
  stillQueued: number;
  autoPublished: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let autoPublished = 0;
  const queue = await listQueue();

  if (autoApprove) {
    const due = queue.filter((q) => (q.hours_until_publish ?? 1) <= 0);
    for (const item of due) {
      const r = await approveAndPublish(item.id);
      if (r.ok) autoPublished++;
      else errors.push(`${item.title}: ${r.error}`);
    }
  }

  const remaining = await listQueue();
  return { stillQueued: remaining.length, autoPublished, errors };
}
