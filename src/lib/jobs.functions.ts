import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TYPE_LABEL: Record<string, string> = {
  generate_tool: "Building tools",
  optimize_tool: "Optimizing tool pages",
  publish_tool: "Publishing tools",
};

/**
 * Enqueue a batch of tool jobs (build/optimize/publish) to run server-side.
 * All jobs in one call share a batchId, so the dashboard can show a progress
 * bar + per-item log for THIS run specifically (not just an aggregate count
 * across every job ever queued).
 */
export const enqueueToolJobsFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      type: z.enum(["generate_tool", "optimize_tool", "publish_tool"]),
      toolIds: z.array(z.string().uuid()).min(1).max(2000),
      status: z.enum(["draft", "publish"]).optional(),
      batchLabel: z.string().max(120).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/jobs");
    const toolsRepo = await import("@/server/db/repos/tools");
    const { randomUUID } = await import("node:crypto");
    const batchId = randomUUID();
    const batchLabel =
      data.batchLabel ?? `${TYPE_LABEL[data.type] ?? data.type} (${data.toolIds.length})`;

    // Look up each tool's name so the per-item log reads "Fixed <Tool Name>"
    // instead of just the job type — the whole point of the log is knowing
    // exactly WHAT was worked on, not just how many jobs ran.
    const names = await toolsRepo
      .getToolNamesByIds(data.toolIds)
      .catch(() => new Map<string, string>());

    const queued = await repo.enqueueJobs(
      data.toolIds.map((toolId) => ({
        type: data.type,
        payload: { toolId, status: data.status },
        label: names.get(toolId) ?? toolId,
      })),
      { batchId, batchLabel },
    );

    // Kick the background drainer so these start running immediately instead of
    // sitting pending until Autopilot's next tick (or forever, if it's off).
    try {
      const { ensureJobRunner } = await import("./job-runner");
      ensureJobRunner();
    } catch {
      /* runner is best-effort — manual "Run now" still works */
    }

    return { ok: true, queued, batchId, batchLabel };
  });

/** Progress for one batch of jobs — powers the bulk-action progress bar. */
export const batchProgressFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ batchId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/jobs");
    return { ok: true, progress: await repo.batchProgress(data.batchId) };
  });

/** Per-item log for one batch — what happened to each queued tool. */
export const batchItemsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({ batchId: z.string().uuid(), limit: z.number().min(1).max(2000).default(500) }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/jobs");
    const items = await repo.batchItems(data.batchId, data.limit);
    return { ok: true, items };
  });

/** Manually drain the queue now (also runs automatically in autopilot). */
export const drainJobsFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ max: z.number().min(1).max(25).default(10) }).parse)
  .handler(async ({ data }) => {
    const { drainJobs } = await import("./job-queue");
    return drainJobs(data.max);
  });

export const jobsSummaryFn = createServerFn({ method: "GET" }).handler(async () => {
  const repo = await import("@/server/db/repos/jobs");
  const [counts, recent] = await Promise.all([repo.jobCounts(), repo.listJobs(20)]);
  return { counts, recent };
});
