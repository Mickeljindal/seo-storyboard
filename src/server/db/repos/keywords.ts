import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "../client";

const { keywords } = schema;

export type KeywordRow = {
  id: string;
  keyword: string;
  geo_target: string;
  monthly_volume: number | null;
  cpc: string | null;
  difficulty: number | null;
  serp_features: string[];
  paa_questions: string[];
  top_10_urls: string[];
  trend_data: unknown;
  last_refreshed_at: string | null;
  created_at: string;
};

function toApi(row: typeof keywords.$inferSelect): KeywordRow {
  return {
    id: row.id,
    keyword: row.keyword,
    geo_target: row.geoTarget ?? "sa",
    monthly_volume: row.monthlyVolume,
    cpc: row.cpc != null ? String(row.cpc) : null,
    difficulty: row.difficulty,
    serp_features: row.serpFeatures ?? [],
    paa_questions: row.paaQuestions ?? [],
    top_10_urls: row.top10Urls ?? [],
    trend_data: row.trendData,
    last_refreshed_at: row.lastRefreshedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
  };
}

export async function getKeyword(keyword: string, geo: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(keywords)
    .where(and(eq(keywords.keyword, keyword), eq(keywords.geoTarget, geo)))
    .limit(1);
  return row ? toApi(row) : null;
}

export async function upsertKeyword(data: {
  keyword: string;
  geo_target: string;
  monthly_volume: number | null;
  cpc: number | null;
  difficulty: number | null;
  serp_features: string[];
  paa_questions: string[];
  top_10_urls: string[];
  trend_data: Record<string, unknown>;
  last_refreshed_at: string;
}) {
  const db = await getDb();
  const existing = await getKeyword(data.keyword, data.geo_target);
  const values = {
    keyword: data.keyword,
    geoTarget: data.geo_target,
    monthlyVolume: data.monthly_volume,
    cpc: data.cpc != null ? String(data.cpc) : null,
    difficulty: data.difficulty,
    serpFeatures: data.serp_features,
    paaQuestions: data.paa_questions,
    top10Urls: data.top_10_urls,
    trendData: data.trend_data,
    lastRefreshedAt: new Date(data.last_refreshed_at),
  };
  if (existing) {
    await db
      .update(keywords)
      .set(values)
      .where(and(eq(keywords.keyword, data.keyword), eq(keywords.geoTarget, data.geo_target)));
  } else {
    await db.insert(keywords).values(values);
  }
}

export async function listKeywords(geo: string, limit = 50) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(keywords)
    .where(eq(keywords.geoTarget, geo))
    .orderBy(desc(keywords.createdAt))
    .limit(limit);
  return rows.map(toApi);
}
