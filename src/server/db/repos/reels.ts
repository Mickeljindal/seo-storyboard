import { and, count, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiReel, type ApiReel } from "../map";

const { reels } = schema;

const COL_MAP: Record<string, keyof typeof reels.$inferInsert> = {
  title: "title",
  topic: "topic",
  format: "format",
  status: "status",
  hook: "hook",
  hook_variations: "hookVariations",
  script: "script",
  voiceover: "voiceover",
  caption: "caption",
  hashtags: "hashtags",
  cta: "cta",
  duration_seconds: "durationSeconds",
  platform_prompts: "platformPrompts",
  cluster_id: "clusterId",
  demand_score: "demandScore",
  idea_data: "ideaData",
  notes: "notes",
  engine_source: "engineSource",
};

function toInsert(data: Record<string, unknown>): typeof reels.$inferInsert {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    const col = COL_MAP[k];
    if (col) row[col] = v;
  }
  if (!row.title) row.title = (data.title as string) ?? "Untitled reel";
  return row as typeof reels.$inferInsert;
}

export async function countReels(): Promise<number> {
  const db = await getDb();
  const [r] = await db.select({ c: count() }).from(reels);
  return Number(r?.c ?? 0);
}

export async function listReels(opts?: {
  status?: string;
  format?: string;
  limit?: number;
}): Promise<ApiReel[]> {
  const db = await getDb();
  let q = db.select().from(reels).$dynamic();
  const conds = [];
  if (opts?.status) conds.push(eq(reels.status, opts.status));
  if (opts?.format) conds.push(eq(reels.format, opts.format));
  if (conds.length) q = q.where(and(...conds));
  q = q.orderBy(desc(reels.updatedAt));
  if (opts?.limit) q = q.limit(opts.limit);
  return (await q).map(toApiReel);
}

export async function getReelById(id: string): Promise<ApiReel | null> {
  const db = await getDb();
  const [row] = await db.select().from(reels).where(eq(reels.id, id)).limit(1);
  return row ? toApiReel(row) : null;
}

export async function insertReel(data: Record<string, unknown>): Promise<ApiReel> {
  const db = await getDb();
  const [row] = await db.insert(reels).values(toInsert(data)).returning();
  return toApiReel(row);
}

export async function insertReels(rows: Record<string, unknown>[]): Promise<ApiReel[]> {
  if (!rows.length) return [];
  const db = await getDb();
  const inserted = await db.insert(reels).values(rows.map(toInsert)).returning();
  return inserted.map(toApiReel);
}

export async function updateReel(
  id: string,
  patch: Record<string, unknown>,
): Promise<ApiReel | null> {
  const db = await getDb();
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    const col = COL_MAP[k];
    if (col) set[col] = v;
  }
  if (Object.keys(set).length === 0) return null;
  set.updatedAt = new Date();
  const [row] = await db.update(reels).set(set).where(eq(reels.id, id)).returning();
  return row ? toApiReel(row) : null;
}

/** Existing reel titles to dedupe idea discovery against. */
export async function listReelTitles(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.select({ title: reels.title }).from(reels);
  return new Set(rows.map((r) => r.title.trim().toLowerCase()));
}
