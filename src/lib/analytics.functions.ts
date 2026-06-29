import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Save Google Search Console credentials from the dashboard (stored in DB). */
export const saveGscSettingsFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      serviceAccountJson: z.string().optional(),
      clientEmail: z.string().optional(),
      privateKey: z.string().optional(),
      siteUrl: z.string().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { saveGscSettings } = await import("./app-settings");
    const res = await saveGscSettings(data);
    if (!res.ok) return res;
    // Verify the new credentials right away so the user gets instant feedback.
    const { testGscConnection } = await import("./gsc-client");
    const test = await testGscConnection();
    return { ok: true as const, test };
  });

/** Current GSC config status for the Settings page (never returns the key). */
export const gscSettingsStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { hydrateEnvFromSettings, getGscStatus } = await import("./app-settings");
  await hydrateEnvFromSettings();
  return getGscStatus();
});

/** Test the Google Search Console connection (Settings/health). */
export const testGscConnectionFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { hydrateEnvFromSettings } = await import("./app-settings");
  await hydrateEnvFromSettings();
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
    const { hydrateEnvFromSettings } = await import("./app-settings");
    await hydrateEnvFromSettings();
    const { hasGscCredentials, querySearchAnalytics, isoDaysAgo } = await import("./gsc-client");

    if (!hasGscCredentials()) {
      return {
        ok: false as const,
        error:
          "Google Search Console not configured. Add GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_SITE_URL in .env.",
      };
    }

    const days = Math.min(480, Math.max(7, data.days ?? 28));
    const startDate = isoDaysAgo(days + 2); // account for GSC data lag
    const endDate = isoDaysAgo(2);

    try {
      const rows = await querySearchAnalytics({
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: 1000,
      });
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
      return {
        ok: true as const,
        window: `${startDate} → ${endDate}`,
        fetched: rows.length,
        stored,
        matched,
      };
    } catch (e) {
      return { ok: false as const, error: String((e as Error)?.message ?? e) };
    }
  });

/** Dashboard data: headline totals + top pages by real clicks. */
export const getAnalyticsDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { hydrateEnvFromSettings } = await import("./app-settings");
  await hydrateEnvFromSettings();
  const { getPerformanceTotals, getLatestPerformance } =
    await import("@/server/db/repos/search-performance");
  const { hasGscCredentials } = await import("./gsc-client");
  const totals = await getPerformanceTotals();
  const topPages = await getLatestPerformance(25);
  return { configured: hasGscCredentials(), totals, topPages };
});
