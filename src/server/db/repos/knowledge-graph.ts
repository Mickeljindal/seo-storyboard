import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiKgNode, toApiKgEdge, type ApiKgNode, type ApiKgEdge } from "../map";

const { kgNodes, kgEdges } = schema;

export type UpsertNode = {
  type: string;
  key: string;
  label: string;
  description?: string | null;
  data?: unknown;
  clusterId?: number | null;
  geo?: string | null;
  source?: string | null;
  /** weight added on this upsert (accumulates) */
  weightDelta?: number;
};

/** Insert or bump a node. Returns its id. Dedupe on (type, node_key). */
export async function upsertNode(n: UpsertNode): Promise<string> {
  const db = await getDb();
  const key = n.key.trim().toLowerCase().slice(0, 200);
  const delta = n.weightDelta ?? 1;
  const [existing] = await db
    .select({ id: kgNodes.id, weight: kgNodes.weight, mentions: kgNodes.mentions })
    .from(kgNodes)
    .where(and(eq(kgNodes.type, n.type), eq(kgNodes.nodeKey, key)))
    .limit(1);

  if (existing) {
    await db
      .update(kgNodes)
      .set({
        label: n.label,
        description: n.description ?? undefined,
        data: n.data ?? undefined,
        clusterId: n.clusterId ?? undefined,
        geo: n.geo ?? undefined,
        weight: String(Number(existing.weight ?? 1) + delta),
        mentions: (existing.mentions ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(kgNodes.id, existing.id));
    return existing.id;
  }

  const [row] = await db
    .insert(kgNodes)
    .values({
      type: n.type,
      nodeKey: key,
      label: n.label,
      description: n.description ?? null,
      data: n.data ?? null,
      clusterId: n.clusterId ?? null,
      geo: n.geo ?? null,
      source: n.source ?? "seed",
      weight: String(delta),
      mentions: 1,
    })
    .returning({ id: kgNodes.id });
  return row.id;
}

/** Insert or bump an edge between two node ids. */
export async function upsertEdge(
  sourceId: string,
  targetId: string,
  relation: string,
  weightDelta = 1,
): Promise<void> {
  if (sourceId === targetId) return;
  const db = await getDb();
  const [existing] = await db
    .select({ id: kgEdges.id, weight: kgEdges.weight, mentions: kgEdges.mentions })
    .from(kgEdges)
    .where(
      and(
        eq(kgEdges.sourceId, sourceId),
        eq(kgEdges.targetId, targetId),
        eq(kgEdges.relation, relation),
      ),
    )
    .limit(1);
  if (existing) {
    await db
      .update(kgEdges)
      .set({
        weight: String(Number(existing.weight ?? 1) + weightDelta),
        mentions: (existing.mentions ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(kgEdges.id, existing.id));
    return;
  }
  await db
    .insert(kgEdges)
    .values({ sourceId, targetId, relation, weight: String(weightDelta), mentions: 1 });
}

/** Add reward to a node (learning signal). */
export async function addNodeReward(type: string, key: string, reward: number): Promise<void> {
  const db = await getDb();
  const k = key.trim().toLowerCase().slice(0, 200);
  const [existing] = await db
    .select({ id: kgNodes.id, reward: kgNodes.reward, weight: kgNodes.weight })
    .from(kgNodes)
    .where(and(eq(kgNodes.type, type), eq(kgNodes.nodeKey, k)))
    .limit(1);
  if (!existing) return;
  await db
    .update(kgNodes)
    .set({
      reward: String(Number(existing.reward ?? 0) + reward),
      weight: String(Number(existing.weight ?? 1) + Math.max(0, reward)),
      updatedAt: new Date(),
    })
    .where(eq(kgNodes.id, existing.id));
}

export async function listNodes(opts?: { type?: string; limit?: number }): Promise<ApiKgNode[]> {
  const db = await getDb();
  let q = db.select().from(kgNodes).$dynamic();
  if (opts?.type) q = q.where(eq(kgNodes.type, opts.type));
  q = q.orderBy(desc(kgNodes.weight));
  if (opts?.limit) q = q.limit(opts.limit);
  return (await q).map(toApiKgNode);
}

export async function listEdges(limit = 2000): Promise<ApiKgEdge[]> {
  const db = await getDb();
  return (await db.select().from(kgEdges).limit(limit)).map(toApiKgEdge);
}

export async function countNodes(): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(kgNodes);
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

export async function countEdges(): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(kgEdges);
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

/** Degree (edge count) per node id — used to find under-connected entities (gaps). */
export async function edgeDegrees(): Promise<Record<string, number>> {
  const edges = await listEdges(5000);
  const deg: Record<string, number> = {};
  for (const e of edges) {
    deg[e.source_id] = (deg[e.source_id] ?? 0) + 1;
    deg[e.target_id] = (deg[e.target_id] ?? 0) + 1;
  }
  return deg;
}
