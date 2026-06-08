#!/usr/bin/env node
/**
 * Standalone automation runner — schedule this with cron when self-hosting.
 *
 * It advances the content pipeline for a batch of articles:
 *   research → brief → multi-pass content + scorecard → (optional) auto-publish.
 *
 * Usage:
 *   node scripts/automate.mjs                       # process 5, no publish
 *   AUTOMATE_LIMIT=10 node scripts/automate.mjs     # process 10
 *   AUTOMATE_PUBLISH=1 AUTOMATE_MIN_SCORE=88 AUTOMATE_PUBLISH_STATUS=publish node scripts/automate.mjs
 *
 * Cron example (every 6 hours), self-hosted on Kloudbean:
 *   0 *\/6 * * * cd /path/to/app && AUTOMATE_PUBLISH=1 AUTOMATE_MIN_SCORE=88 node scripts/automate.mjs >> .local/automate.log 2>&1
 *
 * Requires the same .env as the app (DATABASE_*, DATAFORSEO_*, AI key, WP_* for publish).
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Allow importing the project's TS modules.
try {
  register("tsx/esm", pathToFileURL("./"));
} catch {
  /* tsx may already be active via npx */
}

const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

async function main() {
  const { loadProjectEnv } = await import("../src/lib/load-env.ts");
  loadProjectEnv();

  const cfg = {
    limit: num(process.env.AUTOMATE_LIMIT, 5),
    geo: process.env.AUTOMATE_GEO || undefined,
    doResearch: process.env.AUTOMATE_RESEARCH !== "0",
    doBriefs: process.env.AUTOMATE_BRIEFS !== "0",
    doContent: process.env.AUTOMATE_CONTENT !== "0",
    autoPublish: process.env.AUTOMATE_PUBLISH === "1",
    publishStatus: process.env.AUTOMATE_PUBLISH_STATUS === "publish" ? "publish" : "draft",
    publishMinScore: num(process.env.AUTOMATE_MIN_SCORE, 85),
  };

  console.log(`[automate] ${new Date().toISOString()} starting`, cfg);

  const { runContentAutomationInternal } = await import("../src/lib/automation.functions.ts");
  const result = await runContentAutomationInternal(cfg);

  console.log(
    `[automate] done — processed=${result.processed} researched=${result.researched} briefed=${result.briefed} written=${result.written} published=${result.published} blocked=${result.blocked} lowScore=${result.skippedLowScore}`,
  );
  for (const it of result.items) {
    console.log(`  - [${it.stage}] ${it.title}${it.score != null ? ` (score ${it.score} ${it.grade ?? ""})` : ""}${it.published ? " PUBLISHED" : ""}${it.error ? ` ERROR: ${it.error}` : ""}`);
  }
  if (result.errors.length) {
    console.log(`[automate] ${result.errors.length} error(s):`);
    for (const e of result.errors.slice(0, 10)) console.log(`    ${e}`);
  }
}

main().catch((e) => {
  console.error("[automate] fatal:", e);
  process.exit(1);
});
