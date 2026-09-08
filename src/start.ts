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

/**
 * Serve the unsubscribe endpoint.
 *
 * Every outreach email already carried a signed unsubscribe link and the
 * List-Unsubscribe headers, and nothing answered them. A dead opt-out link is a
 * legal problem under CAN-SPAM and GDPR, and mailbox providers read a working
 * one-click unsubscribe as a strong signal that a sender is legitimate.
 *
 * Handled in middleware rather than as a route file because this version of
 * TanStack Start ships no server-route factory (no createServerRoute or
 * createServerFileRoute anywhere in the installed packages). Middleware is already
 * wired, runs for every request, and can answer before the router is involved,
 * which also means an unsubscribe still works if the SPA fails to boot. That last
 * part matters: the one page that must never depend on client-side JavaScript is
 * the one someone reaches because they are annoyed with us.
 */
const unsubscribeMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const { isUnsubscribePath, handleUnsubscribeRequest } = await import(
      "./lib/unsubscribe-handler"
    );
    const url = new URL(request.url);
    if (isUnsubscribePath(url.pathname)) {
      const res = await handleUnsubscribeRequest(request);
      if (res) return res;
    }
  } catch (e) {
    // Never let this break normal page serving.
    console.warn("[unsubscribe] middleware skipped:", (e as Error)?.message ?? e);
  }
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
  // envMiddleware first so the unsubscribe handler has UNSUBSCRIBE_SECRET loaded,
  // then unsubscribe, so it can answer before the router runs.
  requestMiddleware: [envMiddleware, unsubscribeMiddleware, errorMiddleware],
}));
