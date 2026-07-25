import "@tanstack/react-start/server-only";

/**
 * JOB QUEUE PROCESSOR
 *
 * Drains the durable `jobs` table: claims runnable jobs, runs the matching tool
 * action, and records done/error (with retry + backoff). The autopilot calls
 * drainJobs() each cycle so bulk work runs server-side and survives a closed tab.
 */

export type JobType = "generate_tool" | "optimize_tool" | "publish_tool" | "fix_tool_html";

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
    case "fix_tool_html": {
      if (!p.toolId) throw new Error("missing toolId");
      const r = await tools.fixToolHtmlInternal(p.toolId, false);
      if (!r.ok) throw new Error(r.error ?? "fix failed");
      return r;
    }
    default:
      throw new Error(`unknown job type: ${job.type}`);
  }
}

/** Hard ceiling on a single job so one hung WP/AI call can't freeze the whole
 * queue. The WP client already times out at 30-60s; this is a belt-and-suspenders
 * outer bound so drainJobs (and the background runner's in-flight guard) can
 * never get stuck forever on a pathological job. */
const JOB_TIMEOUT_MS = Number(process.env.JOB_TIMEOUT_MS || 120_000);

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`job timed out after ${Math.round(ms / 1000)}s (${label})`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
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
      // Timeout-guarded so a single stuck job fails (and can retry) instead of
      // blocking every other job behind it forever.
      const result = await withTimeout(processJob(job), JOB_TIMEOUT_MS, `${job.type}`);
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

/**
 * Drain repeatedly until the queue is empty OR a wall-clock budget is hit —
 * lets the UI clear a large backlog (e.g. 1200+ jobs) in one action instead of
 * 10-at-a-time. Time-boxed so the HTTP request that calls it can't run forever.
 */
export async function drainUntilEmpty(
  opts: { batch?: number; maxMs?: number } = {},
): Promise<{ processed: number; done: number; failed: number; timedOut: boolean }> {
  const batch = opts.batch ?? 8;
  const maxMs = opts.maxMs ?? 50_000;
  const started = Date.now();
  let processed = 0;
  let done = 0;
  let failed = 0;
  const repo = await import("@/server/db/repos/jobs");
  while (Date.now() - started < maxMs) {
    const pending = await repo.countPendingJobs().catch(() => 0);
    if (pending <= 0) return { processed, done, failed, timedOut: false };
    const r = await drainJobs(batch);
    processed += r.processed;
    done += r.done;
    failed += r.failed;
    // If a pass claimed nothing (everything left is in backoff), stop looping.
    if (r.processed === 0) return { processed, done, failed, timedOut: false };
  }
  return { processed, done, failed, timedOut: true };
}
