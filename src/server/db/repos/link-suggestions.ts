import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiLinkSuggestion, type ApiLinkSuggestion } from "../map";

const { linkSuggestions, sitePages } = schema;

export type LinkSuggestionInput = {
  source_page_id: string;
  target_page_id: string;
  anchor_text: string;
  score: number;
  reason?: string | null;
};

/** Insert a batch, skipping pairs that already have a suggestion (dedupe on source+target). */
export async function insertLinkSuggestions(
  rows: LinkSuggestionInput[],
): Promise<{ inserted: number; skipped: number }> {
  if (!rows.length) return { inserted: 0, skipped: 0 };
  const db = await getDb();
  let inserted = 0;
  let skipped = 0;
  for (const r of rows) {
    try {
      await db.insert(linkSuggestions).values({
        sourcePageId: r.source_page_id,
        targetPageId: r.target_page_id,
        anchorText: r.anchor_text,
        score: String(r.score),
        reason: r.reason ?? null,
      });
      inserted++;
    } catch {
      // unique (source, target) constraint — already suggested, skip.
      skipped++;
    }
  }
  return { inserted, skipped };
}

export type SuggestionWithPages = ApiLinkSuggestion & {
  source_title: string;
  source_url: string | null;
  target_title: string;
  target_url: string | null;
};

/** List suggestions with their source/target page titles+URLs merged in, for the dashboard. */
export async function listLinkSuggestions(opts?: {
  status?: string;
  limit?: number;
}): Promise<SuggestionWithPages[]> {
  const db = await getDb();
  let q = db.select().from(linkSuggestions).$dynamic();
  if (opts?.status) q = q.where(eq(linkSuggestions.status, opts.status));
  q = q.orderBy(desc(linkSuggestions.score));
  if (opts?.limit) q = q.limit(opts.limit);
  const rows = await q;
  if (!rows.length) return [];

  const pageIds = [...new Set(rows.flatMap((r) => [r.sourcePageId, r.targetPageId]))];
  const pages = await db.select().from(sitePages);
  const byId = new Map(pages.filter((p) => pageIds.includes(p.id)).map((p) => [p.id, p]));

  return rows.map((r) => {
    const src = byId.get(r.sourcePageId);
    const tgt = byId.get(r.targetPageId);
    return {
      ...toApiLinkSuggestion(r),
      source_title: src?.title ?? "(unknown page)",
      source_url: src?.publishedUrl ?? null,
      target_title: tgt?.title ?? "(unknown page)",
      target_url: tgt?.publishedUrl ?? null,
    };
  });
}

export async function getLinkSuggestionById(id: string): Promise<ApiLinkSuggestion | null> {
  const db = await getDb();
  const [row] = await db.select().from(linkSuggestions).where(eq(linkSuggestions.id, id)).limit(1);
  return row ? toApiLinkSuggestion(row) : null;
}

export async function updateLinkSuggestionStatus(
  id: string,
  status: "pending" | "applied" | "rejected" | "skipped",
  error?: string | null,
): Promise<void> {
  const db = await getDb();
  await db
    .update(linkSuggestions)
    .set({
      status,
      appliedAt: status === "applied" ? new Date() : undefined,
      error: error ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(linkSuggestions.id, id));
}

export async function countLinkSuggestionsByStatus(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db
    .select({ status: linkSuggestions.status, c: sql<number>`count(*)::int` })
    .from(linkSuggestions)
    .groupBy(linkSuggestions.status);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = Number(r.c);
  return out;
}

/** Pending suggestions ready to apply, highest score first. */
export async function listPendingSuggestions(limit = 20): Promise<SuggestionWithPages[]> {
  return listLinkSuggestions({ status: "pending", limit });
}

/** Clear all pending suggestions (used before a fresh scan, so stale proposals don't linger). */
export async function clearPendingSuggestions(): Promise<number> {
  const db = await getDb();
  const rows = await db
    .delete(linkSuggestions)
    .where(eq(linkSuggestions.status, "pending"))
    .returning({ id: linkSuggestions.id });
  return rows.length;
}

export async function countAppliedInWindow(sincHours: number): Promise<number> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - sincHours * 3600_000);
  const [r] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(linkSuggestions)
    .where(
      and(eq(linkSuggestions.status, "applied"), sql`${linkSuggestions.appliedAt} >= ${cutoff}`),
    );
  return Number(r?.c ?? 0);
}
