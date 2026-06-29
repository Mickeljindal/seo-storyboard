import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server functions for instant indexing (B1). Thin wrappers around
 * indexing-client so the dashboard / autopilot can push URLs to IndexNow +
 * the Google Indexing API.
 */

export const submitUrlsToIndexFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      urls: z.array(z.string().url()).min(1).max(500),
      type: z.enum(["URL_UPDATED", "URL_DELETED"]).default("URL_UPDATED"),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { pingUrlsForIndexing } = await import("./indexing-client");
    return pingUrlsForIndexing(data.urls, { type: data.type });
  });

export const indexingStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { hasIndexingConfigured, hasGoogleIndexingConfigured } = await import("./indexing-client");
  return {
    configured: hasIndexingConfigured(),
    indexnow: process.env.INDEXNOW_DISABLED !== "1",
    google: hasGoogleIndexingConfigured(),
  };
});
