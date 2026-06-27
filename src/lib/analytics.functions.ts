import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Test the Google Search Console connection (Settings/health). */
export const testGscConnectionFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { testGscConnection } = await import("./gsc-client");
  return testGscConnection();
});

/**
 * Pull real search performance from Google Search Console and store it.
 * Default window: last 28 days (GSC has ~2-3 day data lag). Idempotent.
 */
export const syncSearchConsoleFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ days: z.number().optional() }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { hasGscCredentials, querySearchAnalytics, isoDaysAgo } = await import("./gsc-client");

    if (!hasGscCredentials()) {
      return {
        ok: false as const,
        error: "Google Search Console not configured. Add GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_SITE_URL in .env.",
      };
    }

    const days = Math.min(480, Math.max(7, data.days ?? 28));
    const startDate = isoDaysAgo(days + 2); // account for GSC data lag
    const endDate = isoDaysAgo(2);

    try {
      const rows = await querySearchAnalytics({ startDate, endDate, dimensions: ["page"], rowLimit: 1000 });
      const { upsertSearchPerformance } = await import("@/server/db/repos/search-performance");
      const { stored, matched } = await upsertSearchPerformance(
        rows.map((r) => ({
          page: r.page,
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
          dateStart: startDate,
          dateEnd: endDate,
        })),
      );
      return { ok: true as const, window: `${startDate} → ${endDate}`, fetched: rows.length, stored, matched };
    } catch (e) {
      return { ok: false as const, error: String((e as Error)?.message ?? e) };
    }
  });

/** Dashboard data: headline totals + top pages by real clicks. */
export const getAnalyticsDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getPerformanceTotals, getLatestPerformance } = await import(
    "@/server/db/repos/search-performance"
  );
  const { hasGscCredentials } = await import("./gsc-client");
  const totals = await getPerformanceTotals();
  const topPages = await getLatestPerformance(25);
  return { configured: hasGscCredentials(), totals, topPages };
});
