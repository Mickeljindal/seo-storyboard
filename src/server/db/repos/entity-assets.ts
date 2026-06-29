import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiEntityAsset, type ApiEntityAsset } from "../map";

const { entityAssets } = schema;

export type NewEntityAsset = {
  platform: string;
  assetType?: string;
  name: string;
  url?: string | null;
  status?: string;
  priority?: number;
  notes?: string | null;
};

/** Insert assets, skipping any (platform,name) that already exist. Returns inserted count. */
export async function seedEntityAssets(rows: NewEntityAsset[]): Promise<number> {
  if (!rows.length) return 0;
  const db = await getDb();
  let inserted = 0;
  for (const r of rows) {
    try {
      const res = await db
        .insert(entityAssets)
        .values({
          platform: r.platform,
          assetType: r.assetType ?? "listing",
          name: r.name,
          url: r.url ?? null,
          status: r.status ?? "todo",
          priority: r.priority ?? 2,
          notes: r.notes ?? null,
        })
        .onConflictDoNothing()
        .returning({ id: entityAssets.id });
      inserted += res.length;
    } catch {
      /* dupe / optional */
    }
  }
  return inserted;
}

export async function upsertEntityAsset(data: {
  id?: string;
  platform: string;
  assetType?: string;
  name: string;
  url?: string | null;
  status?: string;
  priority?: number;
  notes?: string | null;
  nameConsistent?: boolean | null;
}): Promise<ApiEntityAsset> {
  const db = await getDb();
  if (data.id) {
    const [row] = await db
      .update(entityAssets)
      .set({
        platform: data.platform,
        assetType: data.assetType ?? "listing",
        name: data.name,
        url: data.url ?? null,
        status: data.status ?? "todo",
        priority: data.priority ?? 2,
        notes: data.notes ?? null,
        nameConsistent: data.nameConsistent ?? null,
        updatedAt: new Date(),
      })
      .where(eq(entityAssets.id, data.id))
      .returning();
    return toApiEntityAsset(row);
  }
  const [row] = await db
    .insert(entityAssets)
    .values({
      platform: data.platform,
      assetType: data.assetType ?? "listing",
      name: data.name,
      url: data.url ?? null,
      status: data.status ?? "todo",
      priority: data.priority ?? 2,
      notes: data.notes ?? null,
      nameConsistent: data.nameConsistent ?? null,
    })
    .returning();
  return toApiEntityAsset(row);
}

export async function updateEntityAssetStatus(
  id: string,
  patch: { status?: string; nameConsistent?: boolean | null; url?: string | null },
): Promise<void> {
  const db = await getDb();
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.status !== undefined) set.status = patch.status;
  if (patch.nameConsistent !== undefined) set.nameConsistent = patch.nameConsistent;
  if (patch.url !== undefined) set.url = patch.url;
  if (patch.status === "live" || patch.status === "verified") set.lastCheckedAt = new Date();
  await db.update(entityAssets).set(set).where(eq(entityAssets.id, id));
}

export async function deleteEntityAsset(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(entityAssets).where(eq(entityAssets.id, id));
}

export async function listEntityAssets(): Promise<ApiEntityAsset[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(entityAssets)
    .orderBy(entityAssets.priority, desc(entityAssets.updatedAt));
  return rows.map(toApiEntityAsset);
}

export type EntityDistributionSummary = {
  total: number;
  byStatus: Record<string, number>;
  liveRate: number; // (live + verified) / total
  highPriorityTodo: number;
};

export async function entityDistributionSummary(): Promise<EntityDistributionSummary> {
  const db = await getDb();
  const byStatus: Record<string, number> = { todo: 0, in_progress: 0, live: 0, verified: 0 };
  let total = 0;
  let highPriorityTodo = 0;
  try {
    const rows = await db.select().from(entityAssets);
    total = rows.length;
    for (const r of rows) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      if ((r.priority ?? 2) === 1 && (r.status === "todo" || r.status === "in_progress"))
        highPriorityTodo++;
    }
  } catch {
    /* table optional */
  }
  const live = (byStatus.live ?? 0) + (byStatus.verified ?? 0);
  return { total, byStatus, liveRate: total ? live / total : 0, highPriorityTodo };
}

export async function countEntityAssets(): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(entityAssets);
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}
