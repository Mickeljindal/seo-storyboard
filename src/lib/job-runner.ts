import "@tanstack/react-start/server-only";

/**
 * BACKGROUND JOB RUNNER — the always-on drainer for the durable `jobs` queue.
 *
 * Bulk actions (Optimize ALL, Queue build, Fix-HTML-all) enqueue jobs and
 * return immediately so the tab can close. Something has to actually RUN those
 * jobs. Previously the only things that drained the queue were:
 *   - the Autopilot cycle (only if Autopilot was turned on), and
 *   - the manual "Run now" button (10 at a time).
 * So with Autopilot off — the default — clicking "Optimize ALL (417)" queued
 * 417 jobs that never moved. That's the "processing all tool pages does
 * nothing" bug.
 *
 * This runs a lightweight timer for the whole server process: whenever there
 * are pending jobs it drains a batch, paced, until the queue is empty, then
 * idles (a single cheap COUNT every few seconds). It's started on server boot
 * and also kicked immediately whenever new jobs are enqueued, so bulk work
 * starts within a second without anyone enabling Autopilot or clicking a
 * button.
 *
 * Concurrency-safe: claimJobs uses a conditional UPDATE, so even if Autopilot
 * and this runner drain at the same time a job is only ever claimed once.
 *
 * Kill switch: JOBS_RUNNER_DISABLED=1 (leaves manual "Run now" working).
 */

const g = globalThis as typeof globalThis & {
  __seoJobRunner?: ReturnType<typeof setInterval> | null;
  __seoJobRunnerBusy?: boolean;
};

const INTERVAL_MS = Number(process.env.JOBS_RUNNER_INTERVAL_MS || 4000);
const BATCH = Number(process.env.JOBS_RUNNER_BATCH || 8);

function isDisabled(): boolean {
  return process.env.JOBS_RUNNER_DISABLED === "1";
}

/**
 * One drain tick. If any jobs are waiting, process a batch. Guarded so ticks
 * never overlap (a slow batch of WP/AI calls can take longer than the interval).
 */
export async function runJobRunnerOnce(
  batch = BATCH,
): Promise<{ processed: number; done: number; failed: number } | null> {
  if (g.__seoJobRunnerBusy) return null;
  g.__seoJobRunnerBusy = true;
  try {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { countPendingJobs } = await import("@/server/db/repos/jobs");
    const pending = await countPendingJobs();
    if (pending <= 0) return { processed: 0, done: 0, failed: 0 };
    const { drainJobs } = await import("./job-queue");
    return await drainJobs(batch);
  } catch (e) {
    console.warn("[job-runner] tick failed (non-fatal):", (e as Error)?.message ?? e);
    return null;
  } finally {
    g.__seoJobRunnerBusy = false;
  }
}

/**
 * Start the background drainer. Idempotent + once per process, so it's safe to
 * call from the boot middleware on every request and from every enqueue path.
 * Returns true if the runner is (now) active.
 */
export function ensureJobRunner(): boolean {
  if (isDisabled()) return false;
  if (g.__seoJobRunner) {
    // Already running — give it an immediate nudge so freshly-enqueued jobs
    // don't wait for the next interval tick.
    void runJobRunnerOnce();
    return true;
  }
  g.__seoJobRunner = setInterval(() => {
    void runJobRunnerOnce();
  }, INTERVAL_MS);
  console.log(
    `[job-runner] Background queue drainer started (every ${INTERVAL_MS}ms, batch ${BATCH}).`,
  );
  // Kick one immediately so work starts right away, not after a full interval.
  void runJobRunnerOnce();
  return true;
}

export function stopJobRunner(): void {
  if (g.__seoJobRunner) {
    clearInterval(g.__seoJobRunner);
    g.__seoJobRunner = null;
    console.log("[job-runner] Stopped.");
  }
}

export function isJobRunnerActive(): boolean {
  return !!g.__seoJobRunner;
}
