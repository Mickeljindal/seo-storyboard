import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { formatDbError } from "./db-errors";

/**
 * Ingest the local content-studio/ folders into the engine through the app's
 * single PGlite connection (safe while the dev server is running). "upsert"
 * refreshes existing rows too; "new-only" just adds folders not yet in the DB.
 */
export const syncContentStudioFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ mode: z.enum(["upsert", "new-only"]).optional() }).optional().parse)
  .handler(async ({ data }) => {
    try {
      const { getPgliteClient } = await import("@/server/db/client");
      const { ingestContentStudio } = await import("@/server/db/ingest-content-studio");
      const client = await getPgliteClient();
      return await ingestContentStudio(client, { mode: data?.mode ?? "upsert" });
    } catch (e) {
      throw new Error(formatDbError(e));
    }
  });

/**
 * Return a fully self-contained HTML version of an article (stylesheet + images
 * inlined) so it can be read INSIDE the engine, exactly as written. Read-only;
 * needs no WordPress setup.
 */
export const readContentStudioArticleFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ articleId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const articlesRepo = await import("@/server/db/repos/articles");
    const article = await articlesRepo.getArticleById(data.articleId);
    if (!article) throw new Error("Article not found");
    const { buildReaderHtml } = await import("./wp-publish-content-studio");
    return { html: buildReaderHtml(article.url_slug ?? "", article.content_html), title: article.title };
  });

/**
 * Publish one content-studio article to WordPress, uploading its images to the
 * WP media library and rewriting the links so nothing 404s. status "publish"
 * goes live; "draft" creates a WordPress draft you can review first.
 */
export const publishContentStudioFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      articleId: z.string().uuid(),
      status: z.enum(["draft", "publish"]).default("publish"),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { publishContentStudioArticle } = await import("./wp-publish-content-studio");
    const r = await publishContentStudioArticle(data.articleId, data.status);
    if (!r.ok) throw new Error(r.error ?? "WordPress publish failed");
    return r;
  });
