import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * ACTIVITY CENTER — one unified feed of every long-running operation in the
 * system, so the whole pipeline is visible in one place:
 *
 *   - process_runs   → Semrush import, WordPress sync, Autopilot cycles
 *   - job batches     → bulk build / optimize / fix-HTML (the durable queue)
 *
 * For each it exposes a normalized "operation" with a progress %, live counts
 * (pending / running / done / failed), a status, and whether it's stuck or
 * retryable — everything the /activity page needs to draw a progress bar, a
 * log, and Retry / Fix-stuck / Cancel buttons.
 *
 * A run/job is considered STUCK when it's still "running" but hasn't been
 * touched for a while (default 15 min) — almost always a crashed background
 * task or a server restart. Surfacing + requeuing those is the whole point:
 * nothing silently disappears.
 */

// How long without an update before a still-"running" item is called stuck.
const STALE_MINUTES = 15;

// The process-run kinds we know how to RETRY (re-run with the same input).
const RETRYABLE_RUN_KINDS = new Set(["semrush_import", "sync_tools", "autopilot_cycle"]);

const LOG_PREVIEW_LINES = 15;

export type ActivityLog = { at: string; level: string; message: string };

export type ActivityOp = {
  source: "run" | "batch";
  id: string;
  kind: string;
  label: string;
  /** running | pending | done | error | cancelled */
  status: string;
  total: number;
  pending: number;
  running: number;
  done: number;
  failed: number;
  pct: number;
  startedAt: string | null;
  updatedAt: string | null;
  error: string | null;
  stuck: boolean;
  retryable: boolean;
  canCancel: boolean;
  /** last few log lines (runs only) for an at-a-glance preview */
  logPreview: ActivityLog[];
};

function isStale(updatedAt: string | null | undefined, minutes = STALE_MINUTES): boolean {
  if (!updatedAt) return false;
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t > minutes * 60_000;
}

function humanKind(kind: string): string {
  const map: Record<string, string> = {
    semrush_import: "Semrush import",
    sync_tools: "WordPress sync",
    autopilot_cycle: "Autopilot cycle",
    generate_tool: "Build tools",
    optimize_tool: "Optimize pages",
    publish_tool: "Publish tools",
    fix_tool_html: "Fix tool HTML",
    idea_discovery: "Idea discovery",
    bulk_optimize: "Bulk optimize",
    bulk_generate: "Bulk build",
    fix_html: "Fix HTML",
    kg_rebuild: "Knowledge graph rebuild",
  };
  return map[kind] ?? kind.replace(/_/g, " ");
}

/**
 * The unified feed + a top-line summary. Read-only and cheap; the page polls
 * this every few seconds while anything is active.
 */
export const getActivityFeedFn = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({ limit: z.number().min(1).max(100).default(40) })
      .optional()
      .transform((v) => v ?? { limit: 40 }),
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const runsRepo = await import("@/server/db/repos/process-runs");
    const jobsRepo = await import("@/server/db/repos/jobs");

    const [runs, batches] = await Promise.all([
      runsRepo.listRecentProcessRuns(data.limit),
      jobsRepo.listBatchSummaries(data.limit),
    ]);

    const ops: ActivityOp[] = [];

    for (const r of runs) {
      const settled = (r.completed ?? 0) + (r.failed ?? 0);
      const pct =
        r.total > 0
          ? Math.min(100, Math.round((settled / r.total) * 100))
          : r.status !== "running"
            ? 100
            : 0;
      const running = r.status === "running";
      const stuck = running && isStale(r.updated_at);
      const logs = (r.logs ?? []) as ActivityLog[];
      ops.push({
        source: "run",
        id: r.id,
        kind: r.kind,
        label: r.label,
        status: stuck ? "error" : r.status,
        total: r.total ?? 0,
        pending: running ? Math.max(0, (r.total ?? 0) - settled) : 0,
        running: running ? 1 : 0,
        done: r.completed ?? 0,
        failed: r.failed ?? 0,
        pct,
        startedAt: r.started_at ?? null,
        updatedAt: r.updated_at ?? null,
        error: stuck
          ? "No activity for a while — likely crashed or the server restarted. Retry to run it again."
          : (r.error ?? null),
        stuck,
        // A run is retryable once it's no longer live AND we know how to re-run
        // its kind (we stored its input). A stuck run is treated as failed.
        retryable:
          (r.status === "error" || r.status === "cancelled" || stuck) &&
          RETRYABLE_RUN_KINDS.has(r.kind),
        canCancel: running && !stuck,
        logPreview: logs.slice(-LOG_PREVIEW_LINES),
      });
    }

    for (const b of batches) {
      const settled = b.done + b.error;
      const active = b.pending + b.running;
      const status = active > 0 ? "running" : b.error > 0 ? "error" : "done";
      const stuck = b.running > 0 && isStale(b.updated_at);
      const pct = b.total > 0 ? Math.min(100, Math.round((settled / b.total) * 100)) : 0;
      ops.push({
        source: "batch",
        id: b.batch_id,
        kind: b.type,
        label: b.batch_label ?? `${humanKind(b.type)} (${b.total})`,
        status,
        total: b.total,
        pending: b.pending,
        running: b.running,
        done: b.done,
        failed: b.error,
        pct,
        startedAt: b.started_at,
        updatedAt: b.updated_at,
        error: b.error > 0 ? `${b.error} item(s) failed` : null,
        stuck,
        // A batch is retryable whenever any item failed — retry re-queues just
        // the failed ones. Stuck (running-forever) items are requeued too.
        retryable: b.error > 0 || stuck,
        canCancel: false,
        logPreview: [],
      });
    }

    // Newest activity first across both sources.
    ops.sort((a, b) => {
      const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bt - at;
    });

    const summary = {
      running: ops.filter((o) => o.status === "running").length,
      done: ops.filter((o) => o.status === "done").length,
      failed: ops.filter((o) => o.status === "error").length,
      stuck: ops.filter((o) => o.stuck).length,
      pendingItems: ops.reduce((s, o) => s + o.pending, 0),
      runningItems: ops.reduce((s, o) => s + o.running, 0),
    };

    // Anything still live tells the page to keep polling fast.
    const hasActive = summary.running > 0 || summary.pendingItems > 0 || summary.runningItems > 0;

    return { ok: true as const, ops, summary, hasActive, staleMinutes: STALE_MINUTES };
  });

/** Full detail (all log lines) for one process run — fetched on expand. */
export const getActivityRunFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const runsRepo = await import("@/server/db/repos/process-runs");
    const run = await runsRepo.getProcessRun(data.id);
    return { ok: !!run, run };
  });

/** Per-item log for one job batch — fetched on expand. */
export const getActivityBatchItemsFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({ batchId: z.string().uuid(), limit: z.number().min(1).max(2000).default(500) }).parse,
  )
  .handler(async ({ data }) => {
    const jobsRepo = await import("@/server/db/repos/jobs");
    const items = await jobsRepo.batchItems(data.batchId, data.limit);
    return {
      ok: true as const,
      items: items.map((it) => ({
        id: it.id,
        label: it.label,
        status: it.status,
        error: it.error,
        updated_at: it.updatedAt?.toISOString?.() ?? null,
      })),
    };
  });

/**
 * RETRY one operation. For a job batch this re-queues its failed items; for a
 * process run it re-launches the same work with the input we stored when it
 * first ran, so nothing has to be re-entered by hand.
 */
export const retryOperationFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      source: z.enum(["run", "batch"]),
      id: z.string().uuid(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();

    // --- Job batch: re-queue failed items, then kick the queue immediately. ---
    if (data.source === "batch") {
      const jobsRepo = await import("@/server/db/repos/jobs");
      const requeued = await jobsRepo.retryFailedJobs(data.id);
      if (requeued > 0) {
        // Drain a slice now so the user sees progress without waiting for the
        // autopilot's next queue-drain tick.
        try {
          const { drainJobs } = await import("./job-queue");
          void drainJobs(10);
        } catch {
          /* drain best-effort */
        }
      }
      return {
        ok: true as const,
        source: "batch" as const,
        requeued,
        message: requeued
          ? `Re-queued ${requeued} failed item(s) — running now.`
          : "Nothing to retry — no failed items in this batch.",
      };
    }

    // --- Process run: re-run with its stored input. ---
    const runsRepo = await import("@/server/db/repos/process-runs");
    const run = await runsRepo.getProcessRun(data.id);
    if (!run) return { ok: false as const, error: "Run not found." };

    const input = (run.input ?? {}) as Record<string, unknown>;

    if (run.kind === "semrush_import") {
      const root = typeof input.root === "string" ? input.root : "kloudgraph-semrush-export";
      const newRun = await runsRepo.createProcessRun({
        kind: "semrush_import",
        label: `Importing Semrush exports from ${root} (retry)`,
        input: { root },
      });
      void (async () => {
        const { importSemrushFolder } = await import("./kloudgraph/semrush-import");
        try {
          const result = await importSemrushFolder(root, async (file, _idx, total) => {
            await runsRepo.appendProcessLog(
              newRun.id,
              file.error
                ? `${file.file} (${file.competitor}) — error: ${file.error.slice(0, 150)}`
                : file.skipped
                  ? `${file.file} (${file.competitor}) — skipped: ${file.reason ?? "unrecognized"}`
                  : `${file.file} (${file.competitor}) — imported ${file.rows.toLocaleString()} rows`,
              file.error ? "error" : file.skipped ? "warn" : "success",
              { completed: 1, failed: file.error ? 1 : 0, total },
            );
          });
          if (!result.ok) {
            await runsRepo.finishProcessRun(newRun.id, {
              status: "error",
              error: result.error,
              result,
            });
            return;
          }
          await runsRepo.appendProcessLog(
            newRun.id,
            `Done — ${result.totalRows.toLocaleString()} total rows across ${result.competitors.length} competitor(s)`,
            "success",
          );
          await runsRepo.finishProcessRun(newRun.id, { status: "done", result });
        } catch (e) {
          const error = String((e as Error)?.message ?? e);
          await runsRepo.appendProcessLog(newRun.id, `Import crashed: ${error}`, "error");
          await runsRepo.finishProcessRun(newRun.id, { status: "error", error });
        }
      })();
      return {
        ok: true as const,
        source: "run" as const,
        processRunId: newRun.id,
        message: "Re-running the Semrush import.",
      };
    }

    if (run.kind === "sync_tools") {
      const category = typeof input.category === "string" ? input.category : "Developer Tools";
      const maxPages = typeof input.maxPages === "number" ? input.maxPages : 20;
      const perPage = typeof input.perPage === "number" ? input.perPage : 50;
      const newRun = await runsRepo.createProcessRun({
        kind: "sync_tools",
        label: `Syncing "${category}" pages from WordPress (retry)`,
        input: { category, maxPages, perPage },
      });
      void (async () => {
        try {
          const tools = await import("./tools.functions");
          const result = await tools.syncExistingToolsInternal(
            { category, maxPages, perPage },
            newRun.id,
          );
          await runsRepo.finishProcessRun(newRun.id, {
            status: result.ok ? "done" : "error",
            error: result.error,
            result,
          });
        } catch (e) {
          const error = String((e as Error)?.message ?? e);
          await runsRepo.appendProcessLog(newRun.id, `Sync crashed: ${error}`, "error");
          await runsRepo.finishProcessRun(newRun.id, { status: "error", error });
        }
      })();
      return {
        ok: true as const,
        source: "run" as const,
        processRunId: newRun.id,
        message: "Re-running the WordPress sync.",
      };
    }

    if (run.kind === "autopilot_cycle") {
      // runAutopilotCycle creates its own tracked run, so retry = run a fresh
      // cycle now (independent of the schedule).
      void (async () => {
        try {
          const { runAutopilotCycle } = await import("./autopilot");
          await runAutopilotCycle();
        } catch {
          /* the cycle records its own error into its own run */
        }
      })();
      return {
        ok: true as const,
        source: "run" as const,
        message: "Started a new Autopilot cycle.",
      };
    }

    return { ok: false as const, error: `Don't know how to retry a "${run.kind}" run.` };
  });

/**
 * FIX STUCK — sweep everything that's been "running" too long: mark stuck
 * process runs as failed (so they stop showing a live spinner and become
 * retryable) and requeue stuck jobs. One button so a crashed/restarted server
 * never leaves the pipeline in a frozen state.
 */
export const fixStuckFn = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({ staleMinutes: z.number().min(1).max(240).default(STALE_MINUTES) })
      .optional()
      .transform((v) => v ?? { staleMinutes: STALE_MINUTES }),
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const runsRepo = await import("@/server/db/repos/process-runs");
    const jobsRepo = await import("@/server/db/repos/jobs");

    const stuckRuns = await runsRepo.markStuckRunsAsError(data.staleMinutes);
    const requeuedJobs = await jobsRepo.requeueStuckRunningJobs(data.staleMinutes);

    // Kick the queue so requeued jobs start moving right away.
    if (requeuedJobs > 0) {
      try {
        const { drainJobs } = await import("./job-queue");
        void drainJobs(10);
      } catch {
        /* best-effort */
      }
    }

    return {
      ok: true as const,
      runsCleared: stuckRuns.length,
      jobsRequeued: requeuedJobs,
    };
  });

/** Cancel a still-running process run. */
export const cancelActivityRunFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const runsRepo = await import("@/server/db/repos/process-runs");
    const run = await runsRepo.cancelProcessRun(data.id);
    return { ok: !!run, run };
  });

/** Manually drain the durable job queue now (also runs on each autopilot cycle). */
export const drainQueueNowFn = createServerFn({ method: "POST" })
  .inputValidator(
    z
      .object({ max: z.number().min(1).max(25).default(10) })
      .optional()
      .transform((v) => v ?? { max: 10 }),
  )
  .handler(async ({ data }) => {
    const { loadProjectEnv } = await import("./load-env");
    loadProjectEnv();
    const { drainJobs } = await import("./job-queue");
    return drainJobs(data.max);
  });
