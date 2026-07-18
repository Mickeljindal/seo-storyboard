import { and, eq } from "drizzle-orm";
import { getDb, schema } from "../client";

const { distributions } = schema;

export type DistributionChannel = "linkedin" | "x_thread" | "newsletter";

export type Distribution = {
  id: string;
  article_id: string;
  channel: DistributionChannel;
  content: Record<string, unknown>;
  status: string;
  posted_url: string | null;
  posted_at: string | null;
  created_at: string;
};

function toApi(row: typeof distributions.$inferSelect): Distribution {
  return {
    id: row.id,
    article_id: row.articleId,
    channel: row.channel as DistributionChannel,
    content: (row.content ?? {}) as Record<string, unknown>,
    status: row.status,
    posted_url: row.postedUrl ?? null,
    posted_at: row.postedAt?.toISOString?.() ?? null,
    created_at: row.createdAt?.toISOString?.() ?? "",
  };
}

export async function listDistributionsForArticle(articleId: string): Promise<Distribution[]> {
  const db = await getDb();
  const rows = await db.select().from(distributions).where(eq(distributions.articleId, articleId));
  return rows.map(toApi);
}

/** Upsert (one row per article+channel — regenerating replaces the draft). */
export async function upsertDistribution(row: {
  articleId: string;
  channel: DistributionChannel;
  content: Record<string, unknown>;
}): Promise<Distribution> {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(distributions)
    .where(and(eq(distributions.articleId, row.articleId), eq(distributions.channel, row.channel)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(distributions)
      .set({ content: row.content, updatedAt: new Date() })
      .where(eq(distributions.id, existing.id))
      .returning();
    return toApi(updated);
  }

  const [inserted] = await db
    .insert(distributions)
    .values({
      articleId: row.articleId,
      channel: row.channel,
      content: row.content,
      status: "draft",
    })
    .returning();
  return toApi(inserted);
}

export async function markDistributionPosted(id: string, postedUrl: string): Promise<void> {
  const db = await getDb();
  await db
    .update(distributions)
    .set({ status: "posted", postedUrl, postedAt: new Date(), updatedAt: new Date() })
    .where(eq(distributions.id, id));
}
