import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { experienceSnippets, knowledgeGaps } = schema;

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
  // Knowledge Object fields (institutional memory)
  confidence: string; // verified | curated | inferred
  grounded: boolean; // tied to a real source?
  source_ref: string | null;
  status: string; // active | needs-review | stale | retired
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
    confidence: row.confidence ?? "curated",
    grounded: row.grounded ?? true,
    source_ref: row.sourceRef ?? null,
    status: row.status ?? "active",
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
  confidence?: string;
  grounded?: boolean;
  sourceRef?: string | null;
  status?: string;
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
      confidence: row.confidence,
      grounded: row.grounded,
      sourceRef: row.sourceRef ?? null,
      status: row.status,
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
    confidence?: string;
    grounded?: boolean;
    sourceRef?: string | null;
    status?: string;
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
        confidence: r.confidence,
        grounded: r.grounded,
        sourceRef: r.sourceRef ?? null,
        status: r.status,
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

/**
 * Log a knowledge gap: a needed Knowledge Object type is missing for a topic.
 * Dedups by (topic, neededType): bumps `hits` if an open gap already exists.
 * This is how the system stays honest — missing knowledge is recorded for the
 * backlog, never fabricated. Best-effort; never throws into the caller.
 */
export async function logKnowledgeGap(input: {
  topic: string;
  neededType: string;
  note?: string;
  clusterId?: number | null;
  geo?: string | null;
}): Promise<void> {
  try {
    const db = await getDb();
    const topic = input.topic.trim().slice(0, 300);
    if (!topic) return;
    const [existing] = await db
      .select({ id: knowledgeGaps.id })
      .from(knowledgeGaps)
      .where(
        and(
          eq(knowledgeGaps.topic, topic),
          eq(knowledgeGaps.neededType, input.neededType),
          eq(knowledgeGaps.status, "open"),
        ),
      )
      .limit(1);
    if (existing) {
      await db
        .update(knowledgeGaps)
        .set({ hits: sql`${knowledgeGaps.hits} + 1`, updatedAt: new Date() })
        .where(eq(knowledgeGaps.id, existing.id));
      return;
    }
    await db.insert(knowledgeGaps).values({
      topic,
      neededType: input.neededType,
      note: input.note ?? null,
      clusterId: input.clusterId ?? null,
      geo: input.geo ?? null,
    });
  } catch {
    /* gap logging is best-effort — never block content generation */
  }
}

export type KnowledgeGap = {
  id: string;
  topic: string;
  needed_type: string;
  note: string | null;
  cluster_id: number | null;
  geo: string | null;
  status: string;
  hits: number;
  created_at: string;
};

/** List knowledge gaps (default: most-requested first) for the backlog view. */
export async function listKnowledgeGaps(opts?: {
  status?: string;
  limit?: number;
}): Promise<KnowledgeGap[]> {
  const db = await getDb();
  let q = db.select().from(knowledgeGaps).$dynamic();
  if (opts?.status) q = q.where(eq(knowledgeGaps.status, opts.status));
  q = q.orderBy(desc(knowledgeGaps.hits), desc(knowledgeGaps.createdAt));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  return rows.map((r) => ({
    id: r.id,
    topic: r.topic,
    needed_type: r.neededType,
    note: r.note ?? null,
    cluster_id: r.clusterId ?? null,
    geo: r.geo ?? null,
    status: r.status,
    hits: r.hits ?? 0,
    created_at: r.createdAt?.toISOString?.() ?? "",
  }));
}

export async function countKnowledgeGaps(): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(knowledgeGaps);
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}
