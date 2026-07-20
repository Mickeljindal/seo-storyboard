import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiSitePage, type ApiSitePage } from "../map";

const { sitePages } = schema;

export type SitePagePatch = {
  wp_post_id: number;
  post_type?: string;
  title: string;
  slug?: string | null;
  published_url?: string | null;
  status?: string | null;
  excerpt?: string | null;
  content_text?: string | null;
  word_count?: number | null;
  cluster_id?: number | null;
  modified_at?: Date | null;
};

const COL_MAP: Record<string, string> = {
  wp_post_id: "wpPostId",
  post_type: "postType",
  title: "title",
  slug: "slug",
  published_url: "publishedUrl",
  status: "status",
  excerpt: "excerpt",
  content_text: "contentText",
  word_count: "wordCount",
  cluster_id: "clusterId",
  outbound_link_count: "outboundLinkCount",
  inbound_link_count: "inboundLinkCount",
  modified_at: "modifiedAt",
  last_scanned_at: "lastScannedAt",
};

function toRow(data: SitePagePatch): typeof sitePages.$inferInsert {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    const col = COL_MAP[k];
    if (col) row[col] = v;
  }
  return row as typeof sitePages.$inferInsert;
}

export async function getSitePageByWpPostId(wpPostId: number): Promise<ApiSitePage | null> {
  const db = await getDb();
  const [row] = await db.select().from(sitePages).where(eq(sitePages.wpPostId, wpPostId)).limit(1);
  return row ? toApiSitePage(row) : null;
}

export async function getSitePageById(id: string): Promise<ApiSitePage | null> {
  const db = await getDb();
  const [row] = await db.select().from(sitePages).where(eq(sitePages.id, id)).limit(1);
  return row ? toApiSitePage(row) : null;
}

/** Insert or update (matched on wp_post_id). Stamps last_scanned_at = now. */
export async function upsertSitePage(data: SitePagePatch): Promise<ApiSitePage> {
  const db = await getDb();
  const existing = await getSitePageByWpPostId(data.wp_post_id);
  const patch = { ...toRow(data), lastScannedAt: new Date(), updatedAt: new Date() };
  if (existing) {
    const [row] = await db
      .update(sitePages)
      .set(patch)
      .where(eq(sitePages.wpPostId, data.wp_post_id))
      .returning();
    return toApiSitePage(row);
  }
  const [row] = await db
    .insert(sitePages)
    .values({ ...patch, lastScannedAt: new Date() } as typeof sitePages.$inferInsert)
    .returning();
  return toApiSitePage(row);
}

export async function listSitePages(opts?: {
  postType?: string;
  clusterId?: number | null;
  limit?: number;
}): Promise<ApiSitePage[]> {
  const db = await getDb();
  let q = db.select().from(sitePages).$dynamic();
  const conds = [];
  if (opts?.postType) conds.push(eq(sitePages.postType, opts.postType));
  if (opts?.clusterId != null) conds.push(eq(sitePages.clusterId, opts.clusterId));
  if (conds.length) q = q.where(and(...conds));
  q = q.orderBy(desc(sitePages.updatedAt));
  if (opts?.limit) q = q.limit(opts.limit);
  return (await q).map(toApiSitePage);
}

export async function countSitePages(): Promise<number> {
  const db = await getDb();
  const [r] = await db.select({ c: sql<number>`count(*)::int` }).from(sitePages);
  return Number(r?.c ?? 0);
}

/** Bump the inbound/outbound link counters after applying a link. */
export async function incrementLinkCounts(
  sourcePageId: string,
  targetPageId: string,
): Promise<void> {
  const db = await getDb();
  await db
    .update(sitePages)
    .set({ outboundLinkCount: sql`${sitePages.outboundLinkCount} + 1` })
    .where(eq(sitePages.id, sourcePageId));
  await db
    .update(sitePages)
    .set({ inboundLinkCount: sql`${sitePages.inboundLinkCount} + 1` })
    .where(eq(sitePages.id, targetPageId));
}

/** Pages last scanned before a cutoff, or never scanned — candidates for a fresh sync pass. */
export async function listStaleSitePages(limit = 50): Promise<ApiSitePage[]> {
  const db = await getDb();
  const rows = await db.select().from(sitePages).orderBy(sitePages.lastScannedAt).limit(limit);
  return rows.map(toApiSitePage);
}

export async function deleteSitePageByWpPostId(wpPostId: number): Promise<void> {
  const db = await getDb();
  await db.delete(sitePages).where(eq(sitePages.wpPostId, wpPostId));
}
