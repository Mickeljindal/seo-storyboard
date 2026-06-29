import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server functions for freshness / decay management (roadmap F).
 */

export const freshnessSummaryFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { freshnessSummary, listStaleArticles } = await import("./freshness");
  const [summary, stale] = await Promise.all([freshnessSummary(), listStaleArticles(30)]);
  return { summary, stale };
});

export const markReviewedFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ articleId: z.string().uuid(), rewrite: z.boolean().default(false) }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { markArticleReviewed } = await import("./freshness");
    await markArticleReviewed(data.articleId, { rewrite: data.rewrite });
    return { ok: true };
  });
