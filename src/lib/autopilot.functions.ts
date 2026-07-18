import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Get autopilot status + last run result. Dashboard-saved settings (DB) take precedence over .env. */
export const getAutopilotStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { hydrateEnvFromSettings, getAutopilotSettingsSource } = await import("./app-settings");
  await hydrateEnvFromSettings();
  const { getAutopilotConfig, isAutopilotRunning, getLastRun } = await import("./autopilot");
  const cfg = getAutopilotConfig();
  const running = isAutopilotRunning();
  const last = getLastRun();
  const source = await getAutopilotSettingsSource();
  return {
    config: cfg,
    running,
    lastRun: last.result,
    lastRunAt: last.at,
    source,
  };
});

/**
 * Save Autopilot settings from the dashboard — this is the on/off switch and
 * every knob (cadence, quality bar, KLOUDGRAPH usage) without touching .env.
 * Toggling "enabled" starts/stops the live scheduler immediately.
 */
export const saveAutopilotSettingsFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      enabled: z.boolean().optional(),
      intervalMinutes: z.number().min(5).max(1440).optional(),
      maxPublishPerDay: z.number().min(0).max(50).optional(),
      maxPublishPerWeek: z.number().min(0).max(200).optional(),
      minPublishScore: z.number().min(0).max(100).optional(),
      topicsPerRun: z.number().min(0).max(50).optional(),
      progressPerRun: z.number().min(0).max(50).optional(),
      geo: z.string().optional(),
      autoDiscover: z.boolean().optional(),
      autoPublish: z.boolean().optional(),
      kloudgraphEnabled: z.boolean().optional(),
      kloudgraphPerRun: z.number().min(0).max(50).optional(),
      kloudgraphMinRelevance: z.number().min(0).max(1).optional(),
      toolsEnabled: z.boolean().optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { saveAutopilotSettings } = await import("./app-settings");
    return saveAutopilotSettings(data);
  });

/** Start the autopilot scheduler. */
export const startAutopilotFn = createServerFn({ method: "POST" }).handler(async () => {
  const { startAutopilot } = await import("./autopilot");
  const started = startAutopilot();
  return {
    ok: started,
    message: started ? "Autopilot started" : "Enable AUTOPILOT_ENABLED=1 in .env first",
  };
});

/** Stop the autopilot scheduler. */
export const stopAutopilotFn = createServerFn({ method: "POST" }).handler(async () => {
  const { stopAutopilot } = await import("./autopilot");
  stopAutopilot();
  return { ok: true, message: "Autopilot stopped" };
});

/** Run one autopilot cycle manually (for testing). */
export const runAutopilotOnceFn = createServerFn({ method: "POST" }).handler(async () => {
  const { runAutopilotCycle } = await import("./autopilot");
  return runAutopilotCycle();
});
