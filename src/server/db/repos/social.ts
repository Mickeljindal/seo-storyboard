import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { getDb, schema } from "../client";

const { socialChannels, socialPosts } = schema;

/* ------------------------------ channels -------------------------------- */

export type ChannelInput = {
  platform: string;
  label: string;
  mode?: string;
  webhookUrl?: string | null;
  apiToken?: string | null;
  meta?: unknown;
  persona?: string | null;
  enabled?: boolean;
};

export async function listChannels() {
  const db = await getDb();
  return db.select().from(socialChannels).orderBy(asc(socialChannels.createdAt));
}

export async function getChannelsByIds(ids: string[]) {
  if (!ids.length) return [];
  const db = await getDb();
  return db.select().from(socialChannels).where(inArray(socialChannels.id, ids));
}

export async function createChannel(input: ChannelInput) {
  const db = await getDb();
  const [row] = await db
    .insert(socialChannels)
    .values({
      platform: input.platform,
      label: input.label,
      mode: input.mode ?? "webhook",
      webhookUrl: input.webhookUrl ?? null,
      apiToken: input.apiToken ?? null,
      meta: input.meta ?? null,
      persona: input.persona ?? null,
      enabled: input.enabled ?? true,
    })
    .returning();
  return row;
}

export async function updateChannel(id: string, patch: Partial<ChannelInput>) {
  const db = await getDb();
  const set: Record<string, unknown> = {};
  if (patch.platform !== undefined) set.platform = patch.platform;
  if (patch.label !== undefined) set.label = patch.label;
  if (patch.mode !== undefined) set.mode = patch.mode;
  if (patch.webhookUrl !== undefined) set.webhookUrl = patch.webhookUrl;
  if (patch.apiToken !== undefined) set.apiToken = patch.apiToken;
  if (patch.meta !== undefined) set.meta = patch.meta;
  if (patch.persona !== undefined) set.persona = patch.persona;
  if (patch.enabled !== undefined) set.enabled = patch.enabled;
  if (!Object.keys(set).length) return;
  await db.update(socialChannels).set(set).where(eq(socialChannels.id, id));
}

export async function markChannelResult(id: string, ok: boolean, error?: string) {
  const db = await getDb();
  await db
    .update(socialChannels)
    .set(ok ? { lastOkAt: new Date(), lastError: null } : { lastError: error ?? "failed" })
    .where(eq(socialChannels.id, id));
}

export async function deleteChannel(id: string) {
  const db = await getDb();
  await db.delete(socialChannels).where(eq(socialChannels.id, id));
}

/* ------------------------------- posts ---------------------------------- */

export type PostInput = {
  body: string;
  link?: string | null;
  imageUrl?: string | null;
  channelIds: string[];
  scheduledAt?: Date | null;
  status?: string;
  source?: string;
};

export async function createPost(input: PostInput) {
  const db = await getDb();
  const [row] = await db
    .insert(socialPosts)
    .values({
      body: input.body,
      link: input.link ?? null,
      imageUrl: input.imageUrl ?? null,
      channelIds: input.channelIds,
      scheduledAt: input.scheduledAt ?? null,
      status: input.status ?? "draft",
      source: input.source ?? "manual",
    })
    .returning();
  return row;
}

export async function getPost(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
  return row ?? null;
}

export async function listPosts(limit = 100) {
  const db = await getDb();
  return db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt)).limit(limit);
}

/** Scheduled posts whose time has arrived. */
export async function listDuePosts(now = new Date(), limit = 20) {
  const db = await getDb();
  return db
    .select()
    .from(socialPosts)
    .where(and(eq(socialPosts.status, "scheduled"), lte(socialPosts.scheduledAt, now)))
    .orderBy(asc(socialPosts.scheduledAt))
    .limit(limit);
}

export async function updatePostStatus(
  id: string,
  status: string,
  results?: unknown,
  posted?: boolean,
) {
  const db = await getDb();
  const set: Record<string, unknown> = { status };
  if (results !== undefined) set.results = results;
  if (posted) set.postedAt = new Date();
  await db.update(socialPosts).set(set).where(eq(socialPosts.id, id));
}

export async function deletePost(id: string) {
  const db = await getDb();
  await db.delete(socialPosts).where(eq(socialPosts.id, id));
}

export async function postCounts() {
  const db = await getDb();
  const rows = await db
    .select({ status: socialPosts.status, c: sql<number>`count(*)` })
    .from(socialPosts)
    .groupBy(socialPosts.status);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = Number(r.c);
  return out;
}
