import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { formatDbError } from "./db-errors";

export const listArticles = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        geo: z.string().optional(),
        orderBy: z.enum(["scheduled_week", "updated_at"]).optional(),
      })
      .optional()
      .parse,
  )
  .handler(async ({ data }) => {
    try {
      const articlesRepo = await import("@/server/db/repos/articles");
      return await articlesRepo.listArticles({
        geo: data?.geo,
        orderBy: data?.orderBy ?? "scheduled_week",
      });
    } catch (e) {
      throw new Error(formatDbError(e));
    }
  });

export const getArticle = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const articlesRepo = await import("@/server/db/repos/articles");
    const article = await articlesRepo.getArticleById(data.id);
    if (!article) throw new Error("Article not found");
    return article;
  });

export const updateArticle = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ id: z.string().uuid(), patch: z.record(z.unknown()) }).parse,
  )
  .handler(async ({ data }) => {
    const articlesRepo = await import("@/server/db/repos/articles");
    const article = await articlesRepo.updateArticle(data.id, data.patch as Record<string, unknown>);
    if (!article) throw new Error("Update failed");
    return article;
  });

export const countArticles = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const articlesRepo = await import("@/server/db/repos/articles");
    return { count: await articlesRepo.countArticles() };
  } catch (e) {
    throw new Error(formatDbError(e));
  }
});

export const promoteArticlePriority = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const articlesRepo = await import("@/server/db/repos/articles");
    const article = await articlesRepo.updateArticle(data.id, { priority: "high" });
    if (!article) throw new Error("Update failed");
    return article;
  });
