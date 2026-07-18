import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { experienceSnippets } = schema;

export type ExperienceSnippet = {
  id: string;
  title: string;
  kind: string;
  body: string;
  tags: string[];
  cluster_id: number | null;
  usage_count: number;
  source: string;
  active: boolean;
  created_at: string;
};

function toApi(row: typeof experienceSnippets.$inferSelect): ExperienceSnippet {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    body: row.body,
    tags: row.tags ?? [],
    cluster_id: row.clusterId ?? null,
    usage_count: row.usageCount ?? 0,
    source: row.source ?? "manual",
    active: row.active ?? true,
    created_at: row.createdAt?.toISOString?.() ?? "",
  };
}

export async function listExperienceSnippets(opts?: {
  activeOnly?: boolean;
  limit?: number;
}): Promise<ExperienceSnippet[]> {
  const db = await getDb();
  let q = db.select().from(experienceSnippets).$dynamic();
  if (opts?.activeOnly) q = q.where(eq(experienceSnippets.active, true));
  q = q.orderBy(desc(experienceSnippets.createdAt));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  return rows.map(toApi);
}

export async function insertExperienceSnippet(row: {
  title: string;
  kind: string;
  body: string;
  tags?: string[];
  clusterId?: number | null;
  source?: string;
}): Promise<ExperienceSnippet> {
  const db = await getDb();
  const [inserted] = await db
    .insert(experienceSnippets)
    .values({
      title: row.title,
      kind: row.kind,
      body: row.body,
      tags: row.tags ?? [],
      clusterId: row.clusterId ?? null,
      source: row.source ?? "manual",
    })
    .returning();
  return toApi(inserted);
}

export async function insertExperienceSnippets(
  rows: {
    title: string;
    kind: string;
    body: string;
    tags?: string[];
    clusterId?: number | null;
    source?: string;
  }[],
): Promise<number> {
  if (!rows.length) return 0;
  const db = await getDb();
  const inserted = await db
    .insert(experienceSnippets)
    .values(
      rows.map((r) => ({
        title: r.title,
        kind: r.kind,
        body: r.body,
        tags: r.tags ?? [],
        clusterId: r.clusterId ?? null,
        source: r.source ?? "manual",
      })),
    )
    .returning({ id: experienceSnippets.id });
  return inserted.length;
}

export async function updateExperienceSnippet(
  id: string,
  patch: Partial<{
    title: string;
    kind: string;
    body: string;
    tags: string[];
    clusterId: number | null;
    active: boolean;
  }>,
): Promise<void> {
  const db = await getDb();
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.kind !== undefined) set.kind = patch.kind;
  if (patch.body !== undefined) set.body = patch.body;
  if (patch.tags !== undefined) set.tags = patch.tags;
  if (patch.clusterId !== undefined) set.clusterId = patch.clusterId;
  if (patch.active !== undefined) set.active = patch.active;
  await db.update(experienceSnippets).set(set).where(eq(experienceSnippets.id, id));
}

export async function deleteExperienceSnippet(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(experienceSnippets).where(eq(experienceSnippets.id, id));
}

export async function countExperienceSnippets(): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(experienceSnippets);
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Find snippets relevant to a topic: matches tags against the topic text, and
 * optionally the cluster. Ranked by tag-overlap count, then least-recently-used
 * (usage_count ascending) so variety rotates instead of always citing the same
 * lesson. Bumps usage_count for whatever gets returned.
 */
export async function findRelevantSnippets(
  topicText: string,
  clusterId: number | null,
  limit = 2,
): Promise<ExperienceSnippet[]> {
  const db = await getDb();
  const all = await db.select().from(experienceSnippets).where(eq(experienceSnippets.active, true));

  const hay = topicText.toLowerCase();
  const scored = all
    .map((row) => {
      const tags = row.tags ?? [];
      const overlap = tags.reduce((n, t) => (hay.includes(t.toLowerCase()) ? n + 1 : n), 0);
      const clusterMatch = clusterId != null && row.clusterId === clusterId ? 1 : 0;
      return { row, score: overlap * 2 + clusterMatch };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (a.row.usageCount ?? 0) - (b.row.usageCount ?? 0))
    .slice(0, limit);

  if (scored.length) {
    for (const { row } of scored) {
      await db
        .update(experienceSnippets)
        .set({ usageCount: sql`${experienceSnippets.usageCount} + 1` })
        .where(eq(experienceSnippets.id, row.id));
    }
  }

  return scored.map((x) => toApi(x.row));
}
