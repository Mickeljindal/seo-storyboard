import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * MARKETING COMMAND server functions.
 *
 *  - planMarketingCommandFn : plan a request WITHOUT running it (preview + approve)
 *  - runMarketingCommandFn  : plan (if needed) then enqueue the steps as jobs
 *  - marketingRunStatusFn   : live progress (batch bar + process-run activity log)
 *  - recentCommandsFn       : recent command runs for a small history list
 */

const stepSchema = z.object({
  type: z.enum([
    "create_article",
    "generate_social",
    "generate_video",
    "hero_image",
    "post_social",
    "send_email",
  ]),
  title: z.string(),
  topic: z.string(),
  keyword: z.string().optional(),
  count: z.number().optional(),
  channel: z.string().optional(),
  geo: z.string().optional(),
});

const planSchema = z.object({
  summary: z.string(),
  steps: z.array(stepSchema),
  outOfScope: z.array(z.object({ request: z.string(), reason: z.string() })),
});

export const planMarketingCommandFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ prompt: z.string().min(1).max(1000) }).parse)
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { planMarketingCommand } = await import("./marketing-command");
    const plan = await planMarketingCommand(data.prompt);
    return { ok: true, plan };
  });

export const runMarketingCommandFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      prompt: z.string().min(1).max(1000),
      // Optional: a plan the user already previewed/edited. If omitted we plan fresh.
      plan: planSchema.optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { planMarketingCommand, enqueueMarketingPlan } = await import("./marketing-command");
    const plan = data.plan ?? (await planMarketingCommand(data.prompt));
    if (!plan.steps.length) {
      return {
        ok: false as const,
        error: "Nothing runnable in this request.",
        plan,
      };
    }
    const r = await enqueueMarketingPlan(data.prompt, plan);
    return { ...r, plan };
  });

export const marketingRunStatusFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ runId: z.string().uuid(), batchId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const jobsRepo = await import("@/server/db/repos/jobs");
    const runs = await import("@/server/db/repos/process-runs");
    const progress = await jobsRepo.batchProgress(data.batchId);
    const items = await jobsRepo.batchItems(data.batchId, 50);
    let run = await runs.getProcessRun(data.runId);

    // Reconcile: once every job has finished, close the process run so it stops
    // showing as "running" (and can't be swept as stuck). Uses batch state, not
    // a per-job coordination flag.
    if (
      run?.status === "running" &&
      progress.total > 0 &&
      progress.pending === 0 &&
      progress.running === 0
    ) {
      await runs.finishProcessRun(data.runId, { status: progress.error > 0 ? "error" : "done" });
      run = await runs.getProcessRun(data.runId);
    }

    return {
      ok: true,
      progress,
      status: run?.status ?? "running",
      logs: run?.logs ?? [],
      items: items.map((i) => ({ label: i.label, status: i.status, error: i.error })),
    };
  });

/** Whether the acting steps (post_social/send_email) will really transmit or dry-run. */
export const commandChannelsStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const { outboundChannelStatus } = await import("./marketing-outbound");
  return { ok: true, ...outboundChannelStatus() };
});

export const recentCommandsFn = createServerFn({ method: "GET" }).handler(async () => {
  const runs = await import("@/server/db/repos/process-runs");
  const rows = await runs.listRecentProcessRuns(10, ["marketing_command"]);
  return {
    ok: true,
    runs: rows.map((r) => ({
      id: r.id,
      label: r.label,
      status: r.status,
      total: r.total,
      completed: r.completed,
      started_at: r.started_at,
    })),
  };
});
