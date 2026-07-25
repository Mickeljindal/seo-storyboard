import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { loadProjectEnv } from "./lib/load-env";

let autopilotBootChecked = false;

/**
 * Auto-start Autopilot on server boot if it was left enabled from the
 * dashboard (DB setting) or .env — so "set and forget" survives restarts and
 * deploys without anyone needing to click a button or run a script.
 * Runs once per process, best-effort (never blocks a request on failure).
 */
async function bootAutopilotIfEnabled() {
  if (autopilotBootChecked) return;
  autopilotBootChecked = true;
  try {
    const { hydrateEnvFromSettings } = await import("./lib/app-settings");
    await hydrateEnvFromSettings(true);
    const { startAutopilot, getAutopilotConfig } = await import("./lib/autopilot");
    if (getAutopilotConfig().enabled) {
      startAutopilot();
      console.log("[autopilot] Auto-started on server boot (was enabled).");
    }
  } catch (e) {
    console.warn("[autopilot] Boot check failed (non-fatal):", e);
  }
  // Always start the background job-queue drainer (independent of Autopilot).
  // Without this, bulk actions (Optimize ALL, Queue build) enqueue jobs that
  // never run unless Autopilot is on — the whole point of a durable queue is
  // that it drains itself. Idempotent; the runner idles when the queue is empty.
  try {
    const { ensureJobRunner } = await import("./lib/job-runner");
    ensureJobRunner();
  } catch (e) {
    console.warn("[job-runner] Boot start failed (non-fatal):", e);
  }
}

const envMiddleware = createMiddleware().server(async ({ next }) => {
  loadProjectEnv();
  void bootAutopilotIfEnabled();
  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [envMiddleware, errorMiddleware],
}));
