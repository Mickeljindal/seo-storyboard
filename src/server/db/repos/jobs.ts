import { and, asc, count, desc, eq, isNotNull, lt, lte, sql } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiJob, type ApiJob } from "../map";

const { jobs } = schema;

export async function enqueueJobs(
  rows: { type: string; payload?: unknown; label?: string; maxAttempts?: number }[],
  batch?: { batchId: string; batchLabel: string },
): Promise<number> {
  if (!rows.length) return 0;
  const db = await getDb();
  const inserted = await db
    .insert(jobs)
    .values(
      rows.map((r) => ({
        type: r.type,
        payload: r.payload ?? null,
        label: r.label ?? null,
        maxAttempts: r.maxAttempts ?? 3,
        status: "pending",
        batchId: batch?.batchId ?? null,
        batchLabel: batch?.batchLabel ?? null,
      })),
    )
    .returning({ id: jobs.id });
  return inserted.length;
}

/** Progress summary for one batch of jobs (drives the bulk-action progress bar). */
export async function batchProgress(batchId: string): Promise<{
  total: number;
  pending: number;
  running: number;
  done: number;
  error: number;
}> {
  const db = await getDb();
  const rows = await db
    .select({ status: jobs.status, c: sql<number>`count(*)::int` })
    .from(jobs)
    .where(eq(jobs.batchId, batchId))
    .groupBy(jobs.status);
  const out = { total: 0, pending: 0, running: 0, done: 0, error: 0 };
  for (const r of rows) {
    const n = Number(r.c);
    out.total += n;
    if (r.status === "pending") out.pending = n;
    else if (r.status === "running") out.running = n;
    else if (r.status === "done") out.done = n;
    else if (r.status === "error") out.error = n;
  }
  return out;
}

/** Per-item log for one batch — label + status + error, newest-updated first. */
export async function batchItems(
  batchId: string,
  limit = 500,
): Promise<
  { id: string; label: string | null; status: string; error: string | null; updatedAt: Date }[]
> {
  const db = await getDb();
  const rows = await db
    .select({
      id: jobs.id,
      label: jobs.label,
      status: jobs.status,
      error: jobs.error,
      updatedAt: jobs.updatedAt,
      payload: jobs.payload,
    })
    .from(jobs)
    .where(eq(jobs.batchId, batchId))
    .orderBy(desc(jobs.updatedAt))
    .limit(limit);
  return rows;
}

/** Claim up to `limit` runnable jobs (pending + run_after due), mark running. */
export async function claimJobs(limit: number): Promise<ApiJob[]> {
  const db = await getDb();
  const due = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "pending"), lte(jobs.runAfter, new Date())))
    .orderBy(asc(jobs.runAfter))
    .limit(limit);
  const claimed: ApiJob[] = [];
  for (const j of due) {
    const [row] = await db
      .update(jobs)
      .set({
        status: "running",
        attempts: (j.attempts ?? 0) + 1,
        startedAt: j.startedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(jobs.id, j.id), eq(jobs.status, "pending")))
      .returning();
    if (row) claimed.push(toApiJob(row));
  }
  return claimed;
}

export async function completeJob(id: string, result: unknown): Promise<void> {
  const db = await getDb();
  await db
    .update(jobs)
    .set({
      status: "done",
      result: result ?? null,
      error: null,
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, id));
}

/** Mark failed: retry with backoff until max_attempts, then mark error. */
export async function failJob(id: string, errorMsg: string): Promise<void> {
  const db = await getDb();
  const [j] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!j) return;
  const attempts = j.attempts ?? 0;
  const max = j.maxAttempts ?? 3;
  if (attempts >= max) {
    await db
      .update(jobs)
      .set({
        status: "error",
        error: errorMsg.slice(0, 500),
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));
  } else {
    const backoff = new Date(Date.now() + attempts * 60_000); // attempts × 1 min
    await db
      .update(jobs)
      .set({
        status: "pending",
        error: errorMsg.slice(0, 500),
        runAfter: backoff,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));
  }
}

export async function listJobs(limit = 50): Promise<ApiJob[]> {
  const db = await getDb();
  const rows = await db.select().from(jobs).orderBy(desc(jobs.updatedAt)).limit(limit);
  return rows.map(toApiJob);
}

export async function jobCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const out: Record<string, number> = { pending: 0, running: 0, done: 0, error: 0 };
  try {
    const rows = await db
      .select({ status: jobs.status, c: sql<number>`count(*)::int` })
      .from(jobs)
      .groupBy(jobs.status);
    for (const r of rows) out[r.status] = Number(r.c);
  } catch {
    /* table optional */
  }
  return out;
}

export async function countPendingJobs(): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db.select({ c: count() }).from(jobs).where(eq(jobs.status, "pending"));
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

/** Clear finished jobs older than N days (housekeeping). */
export async function purgeFinishedJobs(): Promise<void> {
  const db = await getDb();
  try {
    await db.execute(
      sql`DELETE FROM jobs WHERE status IN ('done','error') AND updated_at < now() - interval '7 days'`,
    );
  } catch {
    /* optional */
  }
}

export type BatchSummary = {
  batch_id: string;
  batch_label: string | null;
  type: string;
  total: number;
  pending: number;
  running: number;
  done: number;
  error: number;
  started_at: string;
  updated_at: string;
};

function toIso(v: unknown): string {
  try {
    const d = v instanceof Date ? v : new Date(v as string);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * One summary row per bulk-action batch (build/optimize/fix-html), newest
 * activity first — the job-queue half of the Activity Center's unified list.
 * Grouped client-side across the per-status rows so a batch with a mix of
 * pending/running/done/error collapses into one card with full counts.
 */
export async function listBatchSummaries(limit = 30): Promise<BatchSummary[]> {
  const db = await getDb();
  const rows = await db
    .select({
      batchId: jobs.batchId,
      batchLabel: jobs.batchLabel,
      status: jobs.status,
      type: jobs.type,
      c: sql<number>`count(*)::int`,
      minCreated: sql`min(${jobs.createdAt})`,
      maxUpdated: sql`max(${jobs.updatedAt})`,
    })
    .from(jobs)
    .where(isNotNull(jobs.batchId))
    .groupBy(jobs.batchId, jobs.batchLabel, jobs.status, jobs.type);

  const map = new Map<string, BatchSummary>();
  for (const r of rows) {
    const id = r.batchId as string;
    if (!id) continue;
    const started = toIso(r.minCreated);
    const updated = toIso(r.maxUpdated);
    const existing = map.get(id);
    const b: BatchSummary = existing ?? {
      batch_id: id,
      batch_label: r.batchLabel,
      type: r.type,
      total: 0,
      pending: 0,
      running: 0,
      done: 0,
      error: 0,
      started_at: started,
      updated_at: updated,
    };
    const n = Number(r.c);
    b.total += n;
    if (r.status === "pending") b.pending += n;
    else if (r.status === "running") b.running += n;
    else if (r.status === "done") b.done += n;
    else if (r.status === "error") b.error += n;
    if (started < b.started_at) b.started_at = started;
    if (updated > b.updated_at) b.updated_at = updated;
    map.set(id, b);
  }

  return [...map.values()].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)).slice(0, limit);
}

/**
 * Reset every "error" job in a batch back to pending so the next drain picks
 * them up again — the one-click "Retry failed" action. Clears attempts/error/
 * timestamps so it gets a fresh set of retry attempts, not a continuation of
 * the old exhausted count.
 */
export async function retryFailedJobs(batchId: string): Promise<number> {
  const db = await getDb();
  const rows = await db
    .update(jobs)
    .set({
      status: "pending",
      attempts: 0,
      error: null,
      runAfter: new Date(),
      startedAt: null,
      finishedAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.batchId, batchId), eq(jobs.status, "error")))
    .returning({ id: jobs.id });
  return rows.length;
}

/**
 * Jobs stuck in "running" past `staleMinutes` almost always mean the process
 * that claimed them crashed or the server restarted mid-job — they'll never
 * complete on their own. Requeue them as pending so the next drain retries.
 */
export async function requeueStuckRunningJobs(staleMinutes = 15): Promise<number> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - staleMinutes * 60_000);
  const rows = await db
    .update(jobs)
    .set({
      status: "pending",
      error: "Requeued — no update for a while (likely a crashed/restarted process).",
      runAfter: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.status, "running"), lt(jobs.updatedAt, cutoff)))
    .returning({ id: jobs.id });
  return rows.length;
}

/** Count jobs stuck in "running" past staleMinutes (for the Activity Center's stuck-count badge). */
export async function countStuckJobs(staleMinutes = 15): Promise<number> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - staleMinutes * 60_000);
  try {
    const [r] = await db
      .select({ c: count() })
      .from(jobs)
      .where(and(eq(jobs.status, "running"), lt(jobs.updatedAt, cutoff)));
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

/** All jobs in the batch that have not yet run (pending) plus a count still running, for progress display. */
export async function batchTypeAndLabel(
  batchId: string,
): Promise<{ type: string; label: string | null } | null> {
  const db = await getDb();
  const [row] = await db
    .select({ type: jobs.type, label: jobs.batchLabel })
    .from(jobs)
    .where(eq(jobs.batchId, batchId))
    .limit(1);
  return row ?? null;
}
