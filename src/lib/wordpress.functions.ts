import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildPostPayload,
  createOrUpdateWpPost,
  getStoredWpPostId,
  getWpConfig,
  testWordPressConnection,
} from "./wordpress-client";

export const wpStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { config, missing } = getWpConfig();
  if (!config) {
    return {
      connected: false,
      missing,
      configured: false,
      error: `Missing: ${missing.join(", ")}`,
      hint: "Add WP_SITE_URL, WP_USERNAME, and WP_APP_PASSWORD to .env (restart the server after saving).",
    };
  }
  const result = await testWordPressConnection(config);
  return {
    ...result,
    missing: [],
    configured: true,
  };
});

export async function publishArticleInternal(
  articleId: string,
  status: "draft" | "publish",
): Promise<{
  ok: boolean;
  link?: string;
  postId?: number;
  updated?: boolean;
  message?: string;
  error?: string;
}> {
  const { config, missing } = getWpConfig();
  if (!config) {
    return { ok: false, error: `WordPress not configured. Add to .env: ${missing.join(", ")}.` };
  }

  const articlesRepo = await import("@/server/db/repos/articles");
  const article = await articlesRepo.getArticleById(articleId);
  if (!article) return { ok: false, error: "Article not found" };
  if (!article.brief && !article.content_draft) {
    return {
      ok: false,
      error: "Generate a brief or draft content before publishing to WordPress.",
    };
  }

  // Quality gate: never publish content with blocking (false/banned) claims.
  const quality = article.quality_report as { blocking?: boolean; banned_claims?: string[] } | null;
  if (quality?.blocking && status === "publish") {
    return {
      ok: false,
      error: `Publishing blocked by quality gate: ${(quality.banned_claims ?? []).join("; ") || "banned claims detected"}.`,
    };
  }

  const payload = buildPostPayload(article, status);
  const existingPostId = getStoredWpPostId(article.performance_data);
  const post = await createOrUpdateWpPost(config, payload, existingPostId);

  const perf = (article.performance_data as Record<string, unknown> | null) ?? {};
  await articlesRepo.updateArticle(articleId, {
    published_url: post.link,
    status:
      status === "publish" ? "published" : article.status === "idea" ? "review" : article.status,
    published_at: status === "publish" ? new Date() : (article.published_at ?? null),
    performance_data: {
      ...perf,
      wordpress_post_id: post.id,
      wordpress_last_sync: new Date().toISOString(),
    },
    url_slug: payload.slug ?? article.url_slug,
    meta_title: payload.meta?._yoast_wpseo_title ?? article.meta_title,
    meta_description: payload.meta?._yoast_wpseo_metadesc ?? article.meta_description,
  });

  if (status === "publish") {
    try {
      const signalsRepo = await import("@/server/db/repos/signals");
      const { computeReward } = await import("./learning-ranker");
      await signalsRepo.recordSignal({
        articleId,
        keyword: article.target_keyword,
        clusterId: article.cluster_id,
        geo: article.geo_target,
        intent: (article.keyword_data as { search_intent?: string } | null)?.search_intent ?? null,
        demandScore: article.demand_score,
        qualityScore: article.quality_score,
        event: "published",
        reward: computeReward({ event: "published", qualityScore: article.quality_score }),
      });
    } catch {
      /* signals optional */
    }
  }

  if (status === "publish" && post.link) {
    try {
      const { pingUrlsForIndexing } = await import("./indexing-client");
      await pingUrlsForIndexing([post.link]);
    } catch {
      /* indexing is best-effort */
    }
  }

  return {
    ok: true,
    link: post.link,
    postId: post.id,
    updated: !!existingPostId,
    message: existingPostId ? "WordPress post updated" : "WordPress post created",
  };
}

export const publishToWordPress = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      articleId: z.string().uuid(),
      status: z.enum(["draft", "publish"]).default("draft"),
    }).parse,
  )
  .handler(async ({ data }) => {
    const r = await publishArticleInternal(data.articleId, data.status);
    if (!r.ok) throw new Error(r.error ?? "WordPress publish failed");
    return { ok: true, link: r.link, postId: r.postId, updated: r.updated, message: r.message };
  });

/**
 * Manual "mark as published" — for when the user publishes a blog themselves
 * (outside auto-publish) and wants to signal the system that it's done. Updates
 * status + published_at and records the strongest learning reward.
 */
export const markArticlePublished = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      articleId: z.string().uuid(),
      publishedUrl: z.string().url().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const articlesRepo = await import("@/server/db/repos/articles");
    const article = await articlesRepo.getArticleById(data.articleId);
    if (!article) throw new Error("Article not found");
    await articlesRepo.updateArticle(data.articleId, {
      status: "published",
      published_at: new Date(),
      published_url: data.publishedUrl ?? article.published_url ?? null,
    });
    try {
      const signalsRepo = await import("@/server/db/repos/signals");
      const { computeReward } = await import("./learning-ranker");
      await signalsRepo.recordSignal({
        articleId: data.articleId,
        keyword: article.target_keyword,
        clusterId: article.cluster_id,
        geo: article.geo_target,
        intent: (article.keyword_data as { search_intent?: string } | null)?.search_intent ?? null,
        demandScore: article.demand_score,
        qualityScore: article.quality_score,
        event: "published",
        reward: computeReward({ event: "published", qualityScore: article.quality_score }),
      });
      const { rebuildSilo } = await import("./silo-map");
      await rebuildSilo(article.geo_target ?? undefined);
    } catch {
      /* optional */
    }
    return { ok: true };
  });
