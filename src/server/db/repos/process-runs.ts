import { and, desc, eq, lt, sql } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiProcessRun, type ApiProcessRun } from "../map";

const { processRuns } = schema;

export type LogLevel = "info" | "success" | "warn" | "error";
export type LogEntry = { at: string; level: LogLevel; message: string };

const MAX_LOG_LINES = 500;

export async function createProcessRun(data: {
  kind: string;
  label: string;
  total?: number;
  /** Parameters this run was started with — stored so it can be retried later with the same input. */
  input?: unknown;
}): Promise<ApiProcessRun> {
  const db = await getDb();
  const [row] = await db
    .insert(processRuns)
    .values({
      kind: data.kind,
      label: data.label,
      status: "running",
      total: data.total ?? 0,
      completed: 0,
      failed: 0,
      logs: [],
      input: data.input ?? null,
    })
    .returning();
  return toApiProcessRun(row);
}

/** Append a log line and optionally bump total/completed/failed in one write. */
export async function appendProcessLog(
  id: string,
  message: string,
  level: LogLevel = "info",
  deltas?: { completed?: number; failed?: number; total?: number },
): Promise<void> {
  const db = await getDb();
  const [current] = await db.select().from(processRuns).where(eq(processRuns.id, id)).limit(1);
  if (!current) return;
  const logs = (current.logs as LogEntry[] | null) ?? [];
  logs.push({ at: new Date().toISOString(), level, message });
  // Cap log size so a run with thousands of items never blows up the row.
  const trimmed = logs.length > MAX_LOG_LINES ? logs.slice(logs.length - MAX_LOG_LINES) : logs;

  const set: Record<string, unknown> = { logs: trimmed, updatedAt: new Date() };
  if (deltas?.completed != null)
    set.completed = sql`${processRuns.completed} + ${deltas.completed}`;
  if (deltas?.failed != null) set.failed = sql`${processRuns.failed} + ${deltas.failed}`;
  if (deltas?.total != null) set.total = deltas.total;

  await db
    .update(processRuns)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(set as any)
    .where(eq(processRuns.id, id));
}

export async function setProcessTotal(id: string, total: number): Promise<void> {
  const db = await getDb();
  await db.update(processRuns).set({ total, updatedAt: new Date() }).where(eq(processRuns.id, id));
}

export async function finishProcessRun(
  id: string,
  data: { status: "done" | "error" | "cancelled"; result?: unknown; error?: string },
): Promise<void> {
  const db = await getDb();
  await db
    .update(processRuns)
    .set({
      status: data.status,
      result: data.result ?? null,
      error: data.error ?? null,
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(processRuns.id, id));
}

export async function getProcessRun(id: string): Promise<ApiProcessRun | null> {
  const db = await getDb();
  const [row] = await db.select().from(processRuns).where(eq(processRuns.id, id)).limit(1);
  return row ? toApiProcessRun(row) : null;
}

/** Recent runs (any kind), newest first — for the "activity" panel. Optionally filtered to specific kinds. */
export async function listRecentProcessRuns(
  limit = 20,
  kinds?: string[],
): Promise<ApiProcessRun[]> {
  const db = await getDb();
  let q = db.select().from(processRuns).$dynamic();
  if (kinds?.length) {
    const { inArray } = await import("drizzle-orm");
    q = q.where(inArray(processRuns.kind, kinds));
  }
  const rows = await q.orderBy(desc(processRuns.startedAt)).limit(limit);
  return rows.map(toApiProcessRun);
}

/** Any run still marked "running" — used to resume showing a progress bar
 * after a page reload, and to detect stuck runs (e.g. server restarted mid-run). */
export async function listActiveProcessRuns(): Promise<ApiProcessRun[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(processRuns)
    .where(eq(processRuns.status, "running"))
    .orderBy(desc(processRuns.startedAt));
  return rows.map(toApiProcessRun);
}

/**
 * A run counts as STUCK when it's still "running" but hasn't appended a log
 * line or moved its counters in `staleMinutes` — almost always means the dev
 * server restarted, crashed, or the background task threw somewhere that
 * skipped finishProcessRun. Surfacing these (instead of a forever spinner) is
 * what lets the Activity Center offer a "Fix stuck" / retry action.
 */
export async function listStuckProcessRuns(staleMinutes = 10): Promise<ApiProcessRun[]> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - staleMinutes * 60_000);
  const rows = await db
    .select()
    .from(processRuns)
    .where(and(eq(processRuns.status, "running"), lt(processRuns.updatedAt, cutoff)))
    .orderBy(desc(processRuns.startedAt));
  return rows.map(toApiProcessRun);
}

/**
 * Sweep stuck runs and mark them "error" so they stop showing a live spinner
 * and become retryable. Returns the runs that were flipped. Safe to call
 * repeatedly (idempotent — only touches rows still "running" past the cutoff).
 */
export async function markStuckRunsAsError(staleMinutes = 10): Promise<ApiProcessRun[]> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - staleMinutes * 60_000);
  const rows = await db
    .update(processRuns)
    .set({
      status: "error",
      error: `No activity for ${staleMinutes}+ minutes — the process likely crashed or the server restarted. Use Retry to run it again.`,
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(processRuns.status, "running"), lt(processRuns.updatedAt, cutoff)))
    .returning();
  return rows.map(toApiProcessRun);
}

/** Explicit user cancel — distinct from "error" so the log reads clearly. */
export async function cancelProcessRun(id: string): Promise<ApiProcessRun | null> {
  const db = await getDb();
  const [row] = await db
    .update(processRuns)
    .set({
      status: "cancelled",
      error: "Cancelled by user.",
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(processRuns.id, id))
    .returning();
  return row ? toApiProcessRun(row) : null;
}

/** Housekeeping: drop finished runs older than 7 days. */
export async function purgeOldProcessRuns(): Promise<void> {
  const db = await getDb();
  try {
    await db.execute(
      sql`DELETE FROM process_runs WHERE status IN ('done','error','cancelled') AND updated_at < now() - interval '7 days'`,
    );
  } catch {
    /* optional */
  }
}
