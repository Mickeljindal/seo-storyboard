import { desc, eq, sql } from "drizzle-orm";
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

/** Recent runs (any kind), newest first — for the "activity" panel. */
export async function listRecentProcessRuns(limit = 20): Promise<ApiProcessRun[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(processRuns)
    .orderBy(desc(processRuns.startedAt))
    .limit(limit);
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
