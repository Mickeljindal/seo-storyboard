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

export const publishToWordPress = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({
        articleId: z.string().uuid(),
        status: z.enum(["draft", "publish"]).default("draft"),
      })
      .parse,
  )
  .handler(async ({ data }) => {
    const { config, missing } = getWpConfig();
    if (!config) {
      throw new Error(
        `WordPress not configured. Add to .env: ${missing.join(", ")}. Application passwords must be created in WP Admin → Users → Profile.`,
      );
    }

    const articlesRepo = await import("@/server/db/repos/articles");
    const article = await articlesRepo.getArticleById(data.articleId);
    if (!article) throw new Error("Article not found");
    if (!article.brief && !article.content_draft) {
      throw new Error("Generate a brief or draft content before publishing to WordPress.");
    }

    const payload = buildPostPayload(article, data.status);
    const existingPostId = getStoredWpPostId(article.performance_data);

    const post = await createOrUpdateWpPost(config, payload, existingPostId);

    const perf = (article.performance_data as Record<string, unknown> | null) ?? {};
    await articlesRepo.updateArticle(data.articleId, {
      published_url: post.link,
      status: data.status === "publish" ? "published" : article.status === "idea" ? "review" : article.status,
      performance_data: {
        ...perf,
        wordpress_post_id: post.id,
        wordpress_last_sync: new Date().toISOString(),
      },
      url_slug: payload.slug ?? article.url_slug,
      meta_title: payload.meta?._yoast_wpseo_title ?? article.meta_title,
      meta_description: payload.meta?._yoast_wpseo_metadesc ?? article.meta_description,
    });

    return {
      ok: true,
      link: post.link,
      postId: post.id,
      updated: !!existingPostId,
      message: existingPostId ? "WordPress post updated" : "WordPress post created",
    };
  });
