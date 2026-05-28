import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../client";

const { engineRuns } = schema;

export async function createEngineRun(data: {
  id: string;
  geo: string;
  config: unknown;
  stats: unknown;
  log: unknown[];
}) {
  const db = await getDb();
  try {
    const [row] = await db
      .insert(engineRuns)
      .values({
        id: data.id,
        status: "running",
        geo: data.geo,
        config: data.config,
        stats: data.stats,
        log: data.log,
      })
      .returning();
    return row;
  } catch {
    return null;
  }
}

export async function updateEngineRun(
  id: string,
  patch: Partial<{
    status: string;
    stats: unknown;
    log: unknown[];
    errorMessage: string;
    finishedAt: Date;
  }>,
) {
  const db = await getDb();
  try {
    await db
      .update(engineRuns)
      .set({
        status: patch.status,
        stats: patch.stats,
        log: patch.log,
        errorMessage: patch.errorMessage,
        finishedAt: patch.finishedAt,
      })
      .where(eq(engineRuns.id, id));
  } catch {
    /* table optional */
  }
}

export async function listEngineRuns(limit: number) {
  const db = await getDb();
  try {
    return await db.select().from(engineRuns).orderBy(desc(engineRuns.startedAt)).limit(limit);
  } catch {
    return [];
  }
}

export async function getEngineRun(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(engineRuns).where(eq(engineRuns.id, id)).limit(1);
  return row ?? null;
}
