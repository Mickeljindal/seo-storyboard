#!/usr/bin/env node
/**
 * Starts the autopilot scheduler in a long-running process.
 * Self-hosted on Kloudbean, run this as a background service:
 *   AUTOPILOT_ENABLED=1 node scripts/autopilot-start.mjs
 *
 * Or use pm2/systemd:
 *   pm2 start scripts/autopilot-start.mjs --name kb-autopilot
 */
import { loadProjectEnv } from "../src/lib/load-env.ts";
loadProjectEnv();
process.env.AUTOPILOT_ENABLED = "1";

const { startAutopilot, getAutopilotConfig } = await import("../src/lib/autopilot.ts");
const cfg = getAutopilotConfig();
console.log("[autopilot] Config:", JSON.stringify(cfg, null, 2));

const started = startAutopilot();
if (!started) {
  console.error("[autopilot] Failed to start. Set AUTOPILOT_ENABLED=1 in .env");
  process.exit(1);
}
console.log(`[autopilot] Running. Cycle every ${Math.round(cfg.intervalMs / 60000)} minutes.`);
console.log("[autopilot] Press Ctrl+C to stop.\n");

// Keep process alive
process.on("SIGINT", async () => {
  const { stopAutopilot } = await import("../src/lib/autopilot.ts");
  stopAutopilot();
  process.exit(0);
});
