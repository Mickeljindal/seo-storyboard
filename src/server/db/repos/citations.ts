import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "../client";
import { toApiCitation, type ApiCitation } from "../map";

const { citations } = schema;

export type NewCitation = {
  query: string;
  engine: string;
  geo?: string;
  clusterId?: number | null;
  articleId?: string | null;
  mentioned?: boolean;
  cited?: boolean;
  position?: number | null;
  citedUrl?: string | null;
  competitors?: string[];
  answerExcerpt?: string | null;
  sources?: unknown;
};

export async function insertCitations(rows: NewCitation[]): Promise<number> {
  if (!rows.length) return 0;
  const db = await getDb();
  const inserted = await db
    .insert(citations)
    .values(
      rows.map((r) => ({
        query: r.query,
        engine: r.engine,
        geo: r.geo ?? "global",
        clusterId: r.clusterId ?? null,
        articleId: r.articleId ?? null,
        mentioned: r.mentioned ?? false,
        cited: r.cited ?? false,
        position: r.position ?? null,
        citedUrl: r.citedUrl ?? null,
        competitors: r.competitors ?? [],
        answerExcerpt: r.answerExcerpt ?? null,
        sources: r.sources ?? null,
      })),
    )
    .returning({ id: citations.id });
  return inserted.length;
}

export async function listCitations(limit = 100): Promise<ApiCitation[]> {
  const db = await getDb();
  const rows = await db.select().from(citations).orderBy(desc(citations.createdAt)).limit(limit);
  return rows.map(toApiCitation);
}

export type CitationSummary = {
  total: number;
  cited: number;
  mentioned: number;
  citationRate: number; // cited / total
  byEngine: { engine: string; total: number; cited: number; mentioned: number }[];
  topCompetitors: { domain: string; count: number }[];
};

/** Aggregate citation stats over the last `days` (default 30). */
export async function citationSummary(days = 30): Promise<CitationSummary> {
  const db = await getDb();
  const since = new Date(Date.now() - days * 86400_000);
  const rows = await db.select().from(citations).where(gte(citations.createdAt, since));

  const byEngineMap = new Map<string, { total: number; cited: number; mentioned: number }>();
  const compMap = new Map<string, number>();
  let cited = 0;
  let mentioned = 0;
  for (const r of rows) {
    if (r.cited) cited++;
    if (r.mentioned) mentioned++;
    const e = byEngineMap.get(r.engine) ?? { total: 0, cited: 0, mentioned: 0 };
    e.total++;
    if (r.cited) e.cited++;
    if (r.mentioned) e.mentioned++;
    byEngineMap.set(r.engine, e);
    for (const c of r.competitors ?? []) {
      if (!c) continue;
      compMap.set(c, (compMap.get(c) ?? 0) + 1);
    }
  }
  const total = rows.length;
  return {
    total,
    cited,
    mentioned,
    citationRate: total ? cited / total : 0,
    byEngine: [...byEngineMap.entries()].map(([engine, v]) => ({ engine, ...v })),
    topCompetitors: [...compMap.entries()]
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

/** Distinct queries already tracked recently — to avoid re-asking too often. */
export async function recentlyTrackedQueries(days = 7): Promise<Set<string>> {
  const db = await getDb();
  const since = new Date(Date.now() - days * 86400_000);
  try {
    const rows = await db
      .selectDistinct({ query: citations.query })
      .from(citations)
      .where(gte(citations.createdAt, since));
    return new Set(rows.map((r) => r.query.trim().toLowerCase()));
  } catch {
    return new Set();
  }
}

/** Count citation rows for an engine (health/debug). */
export async function countByEngine(engine: string): Promise<number> {
  const db = await getDb();
  try {
    const [r] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(citations)
      .where(and(eq(citations.engine, engine)));
    return Number(r?.c ?? 0);
  } catch {
    return 0;
  }
}
