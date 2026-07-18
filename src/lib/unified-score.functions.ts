import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Unified, revenue-aware score for one article — blends quality + conversions + citations + GSC. */
export const getUnifiedScoreFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ articleId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { computeUnifiedScoreForArticle } = await import("./unified-score");
    const result = await computeUnifiedScoreForArticle(data.articleId);
    return { ok: true, ...result };
  });
