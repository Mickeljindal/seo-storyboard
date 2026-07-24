import { and, asc, count, desc, eq, lte, sql } from "drizzle-orm";
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
