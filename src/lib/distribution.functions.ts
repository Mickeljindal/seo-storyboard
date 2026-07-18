import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * DISTRIBUTION ENGINE — server functions. Generates LinkedIn/X-thread/newsletter
 * drafts for a published (or draft) article and lets the dashboard mark one as
 * posted (manual posting — no auto-posting to social accounts).
 */

export const listDistributionsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ articleId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/distributions");
    const items = await repo.listDistributionsForArticle(data.articleId);
    return { ok: true, items };
  });

export const generateDistributionFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ articleId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const articlesRepo = await import("@/server/db/repos/articles");
    const article = await articlesRepo.getArticleById(data.articleId);
    if (!article) throw new Error("Article not found");

    const brief = (article.brief ?? {}) as Record<string, unknown>;
    const url =
      article.published_url ||
      (article.url_slug ? `https://kloudbean.com/${article.url_slug}` : "https://kloudbean.com");
    const summary = String(brief.tldr ?? article.meta_description ?? "") || article.title;
    const keyTakeaways = Array.isArray(brief.key_takeaways)
      ? (brief.key_takeaways as string[])
      : [];

    const { generateDistribution } = await import("./distribution-engine");
    const result = await generateDistribution({
      title: article.title,
      summary,
      keyTakeaways,
      url,
    });
    if (!result.ok) throw new Error(result.error ?? "Distribution generation failed");

    const repo = await import("@/server/db/repos/distributions");
    const saved: Record<string, unknown> = {};
    if (result.linkedin) {
      saved.linkedin = await repo.upsertDistribution({
        articleId: data.articleId,
        channel: "linkedin",
        content: result.linkedin,
      });
    }
    if (result.x_thread) {
      saved.x_thread = await repo.upsertDistribution({
        articleId: data.articleId,
        channel: "x_thread",
        content: result.x_thread,
      });
    }
    if (result.newsletter) {
      saved.newsletter = await repo.upsertDistribution({
        articleId: data.articleId,
        channel: "newsletter",
        content: result.newsletter,
      });
    }
    return { ok: true, ...saved };
  });

export const markDistributionPostedFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), postedUrl: z.string().url() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/distributions");
    await repo.markDistributionPosted(data.id, data.postedUrl);
    return { ok: true };
  });
