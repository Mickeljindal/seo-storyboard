import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * SITE-WIDE AUTO INTERNAL LINKING — server functions for the dashboard +
 * autopilot. Orchestrates the sync → score → apply pipeline in site-link-graph.ts.
 */

// ============================================================================
// SCAN — sync live site content + score fresh suggestions
// ============================================================================

export const scanSiteLinksFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      maxPages: z.number().min(1).max(60).default(30),
      minScore: z.number().min(0).max(1).default(0.12),
      limit: z.number().min(1).max(1000).default(300),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { runSiteLinkScan } = await import("./site-link-graph");
    const r = await runSiteLinkScan(data);
    if (!r.ok) throw new Error(r.error ?? "Scan failed");
    return r;
  });

// ============================================================================
// APPLY — push the top pending suggestions live
// ============================================================================

export const applySiteLinksFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ limit: z.number().min(1).max(100).default(10) }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { applyTopSuggestions } = await import("./site-link-graph");
    return applyTopSuggestions(data.limit);
  });

/** Apply ONE specific suggestion (dashboard "Apply" button per row). */
export const applyOneSiteLinkFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ suggestionId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { hasPluginConfigured, applyLink } = await import("./wp-plugin-client");
    if (!hasPluginConfigured()) throw new Error("WordPress plugin not configured.");
    const linkSuggestionsRepo = await import("@/server/db/repos/link-suggestions");
    const sitePagesRepo = await import("@/server/db/repos/site-pages");

    const suggestion = await linkSuggestionsRepo.getLinkSuggestionById(data.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    const sourcePage = await sitePagesRepo.getSitePageById(suggestion.source_page_id);
    const targetPage = await sitePagesRepo.getSitePageById(suggestion.target_page_id);
    if (!sourcePage?.wp_post_id || !targetPage?.published_url) {
      throw new Error("Source/target page missing WordPress linkage.");
    }

    const res = await applyLink({
      source_post_id: sourcePage.wp_post_id,
      target_url: targetPage.published_url,
      anchor_text: suggestion.anchor_text,
    });
    if (!res.ok) {
      await linkSuggestionsRepo.updateLinkSuggestionStatus(data.suggestionId, "pending", res.error);
      throw new Error(res.error ?? "Apply failed");
    }
    if (!res.applied) {
      await linkSuggestionsRepo.updateLinkSuggestionStatus(
        data.suggestionId,
        "skipped",
        "anchor not insertable",
      );
      return { ok: true, applied: false };
    }
    await linkSuggestionsRepo.updateLinkSuggestionStatus(data.suggestionId, "applied");
    await sitePagesRepo.incrementLinkCounts(suggestion.source_page_id, suggestion.target_page_id);
    return { ok: true, applied: true, link: res.link };
  });

export const rejectSiteLinkFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ suggestionId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const linkSuggestionsRepo = await import("@/server/db/repos/link-suggestions");
    await linkSuggestionsRepo.updateLinkSuggestionStatus(data.suggestionId, "rejected");
    return { ok: true };
  });

// ============================================================================
// DASHBOARD reads
// ============================================================================

export const siteLinksStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { hasPluginConfigured, pingPlugin } = await import("./wp-plugin-client");
  const sitePagesRepo = await import("@/server/db/repos/site-pages");
  const linkSuggestionsRepo = await import("@/server/db/repos/link-suggestions");

  const pluginConfigured = hasPluginConfigured();
  let pluginOk = false;
  let pluginVersion: string | undefined;
  if (pluginConfigured) {
    const ping = await pingPlugin();
    pluginOk = ping.ok;
    pluginVersion = ping.version;
  }
  const totalPages = await sitePagesRepo.countSitePages();
  const counts = await linkSuggestionsRepo.countLinkSuggestionsByStatus();
  const appliedLast24h = await linkSuggestionsRepo.countAppliedInWindow(24);

  return {
    pluginConfigured,
    pluginOk,
    pluginVersion,
    totalPages,
    counts,
    appliedLast24h,
  };
});

export const listSiteLinkSuggestionsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      status: z.string().optional(),
      limit: z.number().min(1).max(1000).default(200),
    }).parse,
  )
  .handler(async ({ data }) => {
    const linkSuggestionsRepo = await import("@/server/db/repos/link-suggestions");
    const items = await linkSuggestionsRepo.listLinkSuggestions(data);
    return { ok: true, items };
  });

export const listSitePagesFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ limit: z.number().min(1).max(3000).default(1000) }).parse)
  .handler(async ({ data }) => {
    const sitePagesRepo = await import("@/server/db/repos/site-pages");
    const items = await sitePagesRepo.listSitePages({ limit: data.limit });
    const total = await sitePagesRepo.countSitePages();
    return { ok: true, total, items };
  });
