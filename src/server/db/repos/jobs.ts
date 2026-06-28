import { and, asc, count, desc, eq, lte, sql } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiJob, type ApiJob } from "../map";

const { jobs } = schema;

export async function enqueueJobs(
  rows: { type: string; payload?: unknown; label?: string; maxAttempts?: number }[],
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
      })),
    )
    .returning({ id: jobs.id });
  return inserted.length;
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
      .set({ status: "running", attempts: (j.attempts ?? 0) + 1, updatedAt: new Date() })
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
    .set({ status: "done", result: result ?? null, error: null, updatedAt: new Date() })
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
      .set({ status: "error", error: errorMsg.slice(0, 500), updatedAt: new Date() })
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
