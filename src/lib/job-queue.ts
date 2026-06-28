import "@tanstack/react-start/server-only";

/**
 * JOB QUEUE PROCESSOR
 *
 * Drains the durable `jobs` table: claims runnable jobs, runs the matching tool
 * action, and records done/error (with retry + backoff). The autopilot calls
 * drainJobs() each cycle so bulk work runs server-side and survives a closed tab.
 */

export type JobType = "generate_tool" | "optimize_tool" | "publish_tool";

async function processJob(job: { id: string; type: string; payload: unknown }): Promise<unknown> {
  const p = (job.payload ?? {}) as { toolId?: string; status?: "draft" | "publish" };
  const tools = await import("./tools.functions");
  switch (job.type as JobType) {
    case "generate_tool": {
      if (!p.toolId) throw new Error("missing toolId");
      const r = await tools.generateToolInternal(p.toolId);
      if (!r.ok) throw new Error(r.error ?? "generate failed");
      return r;
    }
    case "optimize_tool": {
      if (!p.toolId) throw new Error("missing toolId");
      const r = await tools.optimizeToolInternal(p.toolId, false);
      if (!r.ok) throw new Error(r.error ?? "optimize failed");
      return r;
    }
    case "publish_tool": {
      if (!p.toolId) throw new Error("missing toolId");
      const r = await tools.publishToolInternal(p.toolId, p.status ?? "draft");
      if (!r.ok) throw new Error(r.error ?? "publish failed");
      return r;
    }
    default:
      throw new Error(`unknown job type: ${job.type}`);
  }
}

export async function drainJobs(
  max = 5,
): Promise<{ processed: number; done: number; failed: number }> {
  const { loadProjectEnv } = await import("./load-env");
  loadProjectEnv();
  const repo = await import("@/server/db/repos/jobs");
  const claimed = await repo.claimJobs(max);
  let done = 0;
  let failed = 0;
  for (const job of claimed) {
    try {
      const result = await processJob(job);
      await repo.completeJob(job.id, result ?? { ok: true });
      done++;
    } catch (e) {
      await repo.failJob(job.id, String((e as Error)?.message ?? e));
      failed++;
    }
    // pace live writes
    await new Promise((r) => setTimeout(r, 300));
  }
  if (done + failed > 0) {
    try {
      await repo.purgeFinishedJobs();
    } catch {
      /* housekeeping optional */
    }
  }
  return { processed: claimed.length, done, failed };
}
