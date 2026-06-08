import { createServerFn } from "@tanstack/react-start";

/** Get autopilot status + last run result. */
export const getAutopilotStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getAutopilotConfig, isAutopilotRunning, getLastRun } = await import("./autopilot");
  const cfg = getAutopilotConfig();
  const running = isAutopilotRunning();
  const last = getLastRun();
  return {
    config: cfg,
    running,
    lastRun: last.result,
    lastRunAt: last.at,
  };
});

/** Start the autopilot scheduler. */
export const startAutopilotFn = createServerFn({ method: "POST" }).handler(async () => {
  const { startAutopilot } = await import("./autopilot");
  const started = startAutopilot();
  return { ok: started, message: started ? "Autopilot started" : "Enable AUTOPILOT_ENABLED=1 in .env first" };
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
