import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { topicSignals } = schema;

export type SignalEvent =
  | "generated"
  | "selected"
  | "published"
  | "rejected"
  | "cited"
  | "converted";

export async function recordSignal(data: {
  articleId?: string | null;
  keyword?: string | null;
  clusterId?: number | null;
  geo?: string | null;
  intent?: string | null;
  demandScore?: number | null;
  qualityScore?: number | null;
  event: SignalEvent;
  reward?: number | null;
  features?: unknown;
}) {
  const db = await getDb();
  try {
    await db.insert(topicSignals).values({
      articleId: data.articleId ?? null,
      keyword: data.keyword ?? null,
      clusterId: data.clusterId ?? null,
      geo: data.geo ?? null,
      intent: data.intent ?? null,
      demandScore: data.demandScore ?? null,
      qualityScore: data.qualityScore ?? null,
      event: data.event,
      reward: data.reward != null ? String(data.reward) : null,
      features: data.features ?? null,
    });
  } catch {
    /* signals table optional — never block the pipeline */
  }
}

/** Aggregate learning stats per cluster + intent (used by the discovery ranker). */
export async function getLearningAggregates(): Promise<{
  byCluster: Record<number, { avgReward: number; n: number; published: number }>;
  byIntent: Record<string, { avgReward: number; n: number }>;
  total: number;
}> {
  const db = await getDb();
  const byCluster: Record<number, { avgReward: number; n: number; published: number }> = {};
  const byIntent: Record<string, { avgReward: number; n: number }> = {};
  let total = 0;
  try {
    const rows = await db
      .select()
      .from(topicSignals)
      .orderBy(desc(topicSignals.createdAt))
      .limit(5000);
    total = rows.length;
    for (const r of rows) {
      const reward = r.reward != null ? Number(r.reward) : 0;
      if (r.clusterId != null) {
        const c = (byCluster[r.clusterId] ??= { avgReward: 0, n: 0, published: 0 });
        c.avgReward = (c.avgReward * c.n + reward) / (c.n + 1);
        c.n++;
        if (r.event === "published") c.published++;
      }
      if (r.intent) {
        const it = (byIntent[r.intent] ??= { avgReward: 0, n: 0 });
        it.avgReward = (it.avgReward * it.n + reward) / (it.n + 1);
        it.n++;
      }
    }
  } catch {
    /* table optional */
  }
  return { byCluster, byIntent, total };
}

export async function countSignals(): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(topicSignals);
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

export async function listRecentSignals(limit = 50) {
  const db = await getDb();
  try {
    return await db.select().from(topicSignals).orderBy(desc(topicSignals.createdAt)).limit(limit);
  } catch {
    return [];
  }
}
