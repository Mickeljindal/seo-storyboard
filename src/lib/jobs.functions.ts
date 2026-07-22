import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Enqueue a batch of tool jobs (build/optimize/publish) to run server-side. */
export const enqueueToolJobsFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      type: z.enum(["generate_tool", "optimize_tool", "publish_tool"]),
      toolIds: z.array(z.string().uuid()).min(1).max(2000),
      status: z.enum(["draft", "publish"]).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const repo = await import("@/server/db/repos/jobs");
    const queued = await repo.enqueueJobs(
      data.toolIds.map((toolId) => ({
        type: data.type,
        payload: { toolId, status: data.status },
        label: data.type,
      })),
    );
    return { ok: true, queued };
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
