import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  dataForSeoAuthHeader,
  dfsPost,
  hasDataForSeoCredentials,
  inferIntentFromSerp,
  locCode,
  opportunityScore,
  parseIntent,
} from "./dataforseo-client";
import { generateMetaFromResearch } from "./meta-generator";
import type { KeywordResearch, RelatedKeyword, SearchIntent } from "./seo-types";

const CACHE_DAYS = 7;
const geoSchema = z.enum(["sa", "in", "ae", "global"]).default("sa");

async function fetchVolumeAndSerp(keyword: string, geo: string) {
  const location_code = locCode(geo);
  const [vol, serp] = await Promise.all([
    dfsPost("/v3/keywords_data/google_ads/search_volume/live", [
      { keywords: [keyword], location_code, language_code: "en" },
    ]),
    dfsPost("/v3/serp/google/organic/live/advanced", [
      { keyword, location_code, language_code: "en", depth: 10 },
    ]),
  ]);
  const v = vol?.tasks?.[0]?.result?.[0] ?? {};
  const sItems = serp?.tasks?.[0]?.result?.[0]?.items ?? [];
  const paa = sItems
    .filter((i: { type?: string }) => i?.type === "people_also_ask")
    .flatMap((i: { items?: { title?: string }[] }) => (i.items ?? []).map((q) => q.title))
    .filter(Boolean) as string[];
  const organic = sItems.filter((i: { type?: string }) => i?.type === "organic");
  const top = organic.slice(0, 10).map((i: { url?: string }) => i.url).filter(Boolean) as string[];
  const titles = organic.slice(0, 10).map((i: { title?: string }) => i.title).filter(Boolean) as string[];
  const features = Array.from(new Set(sItems.map((i: { type?: string }) => i?.type))).filter(Boolean) as string[];
  return {
    monthly_volume: v?.search_volume ?? null,
    cpc: v?.cpc ?? null,
    difficulty: v?.competition_index ?? null,
    serp_features: features,
    paa_questions: paa.slice(0, 8),
    top_10_urls: top,
    serp_titles: titles,
    trend_data: { monthly: v?.monthly_searches ?? [] },
  };
}

async function fetchIntent(keyword: string, geo: string): Promise<{ intent: SearchIntent; probability: number } | null> {
  try {
    const res = await dfsPost("/v3/dataforseo_labs/google/search_intent/live", [
      { keywords: [keyword], location_code: locCode(geo), language_code: "en" },
    ]);
    const item = res?.tasks?.[0]?.result?.[0]?.items?.[0];
    return parseIntent(item);
  } catch {
    return null;
  }
}

async function fetchDifficulty(keyword: string, geo: string): Promise<number | null> {
  try {
    const res = await dfsPost("/v3/dataforseo_labs/google/bulk_keyword_difficulty/live", [
      { keywords: [keyword], location_code: locCode(geo), language_code: "en" },
    ]);
    return res?.tasks?.[0]?.result?.[0]?.items?.[0]?.keyword_difficulty ?? null;
  } catch {
    return null;
  }
}

async function fetchRelated(keyword: string, geo: string, limit = 15): Promise<RelatedKeyword[]> {
  try {
    const res = await dfsPost("/v3/dataforseo_labs/google/related_keywords/live", [
      { keyword, location_code: locCode(geo), language_code: "en", limit, include_seed_keyword: true },
    ]);
    const items = res?.tasks?.[0]?.result?.[0]?.items ?? [];
    return items.slice(0, limit).map((it: Record<string, unknown>) => ({
      keyword: String(it.keyword_data?.keyword ?? it.keyword ?? ""),
      volume: (it.keyword_data as { keyword_info?: { search_volume?: number } })?.keyword_info?.search_volume ?? null,
      difficulty: (it.keyword_data as { keyword_properties?: { keyword_difficulty?: number } })?.keyword_properties
        ?.keyword_difficulty ?? null,
      intent: parseIntent(it.search_intent ?? it.keyword_data)?.intent ?? null,
    })).filter((r: RelatedKeyword) => r.keyword);
  } catch {
    return [];
  }
}

function mockResearch(keyword: string, geo: string, articleTitle?: string): KeywordResearch {
  const volume = Math.floor(Math.random() * 4000) + 200;
  const difficulty = Math.floor(Math.random() * 70) + 15;
  const intent: SearchIntent = keyword.match(/price|vs|alternative|best|cost/i)
    ? "commercial"
    : keyword.match(/buy|plan|trial/i)
      ? "transactional"
      : "informational";
  const paa = [
    `What is ${keyword}?`,
    `How does ${keyword} work?`,
    `Best ${keyword} for Saudi Arabia?`,
    `${keyword} pricing comparison`,
  ];
  const meta = generateMetaFromResearch({ keyword, articleTitle, intent, volume, paa });
  return {
    keyword,
    geo_target: geo,
    monthly_volume: volume,
    cpc: +(Math.random() * 8 + 0.5).toFixed(2),
    difficulty,
    search_intent: intent,
    intent_probability: 0.72,
    serp_features: ["people_also_ask", "organic"],
    paa_questions: paa,
    top_10_urls: [],
    serp_titles: [],
    related_keywords: [],
    trend_data: { mock: true },
    opportunity_score: opportunityScore(volume, difficulty, intent),
    ...meta,
    last_refreshed_at: new Date().toISOString(),
  };
}

async function buildResearchFromSerper(keyword: string, geo: string, articleTitle?: string): Promise<KeywordResearch> {
  const { serperSearch, estimateCompetitorStrength, inferIntentFromKeyword } = await import("./serper-client");
  const serp = await serperSearch(keyword, geo);
  const intent = inferIntentFromKeyword(keyword);
  const paa = serp.peopleAlsoAsk.map((p) => p.question).slice(0, 8);
  const related: RelatedKeyword[] = serp.relatedSearches.slice(0, 15).map((k) => ({
    keyword: k,
    volume: null,
    difficulty: null,
    intent: null,
  }));
  const top = serp.organic.slice(0, 10).map((o) => o.link);
  const titles = serp.organic.slice(0, 10).map((o) => o.title);
  // SERP-signal difficulty (0–100) — Serper has no keyword-difficulty metric.
  const difficulty = Math.round(estimateCompetitorStrength(serp.organic) * 100);
  // SERP-signal opportunity from demand depth + winnability.
  const { serperOpportunityScore } = await import("./serper-client");
  const opportunity_score = serperOpportunityScore({
    paaCount: paa.length,
    relatedCount: related.length,
    organicCount: serp.organic.length,
    intent,
    competitorStrength: difficulty / 100,
  });
  const meta = generateMetaFromResearch({
    keyword,
    articleTitle,
    intent,
    volume: null,
    paa,
    serpTitles: titles,
  });
  return {
    keyword,
    geo_target: geo,
    monthly_volume: null, // Serper provides no volume; demand is validated via SERP signals
    cpc: null,
    difficulty,
    search_intent: intent,
    intent_probability: null,
    serp_features: paa.length ? ["people_also_ask", "organic"] : ["organic"],
    paa_questions: paa,
    top_10_urls: top,
    serp_titles: titles,
    related_keywords: related,
    trend_data: { source: "serper" },
    opportunity_score,
    ...meta,
    last_refreshed_at: new Date().toISOString(),
  };
}

async function buildFullResearch(keyword: string, geo: string, articleTitle?: string): Promise<KeywordResearch> {
  const { hasSerperCredentials } = await import("./serper-client");
  // Prefer Serper (cheap). Fall back to DataForSEO only if Serper is unavailable.
  if (hasSerperCredentials()) {
    try {
      return await buildResearchFromSerper(keyword, geo, articleTitle);
    } catch {
      /* fall through to DataForSEO / mock */
    }
  }
  if (!hasDataForSeoCredentials()) return mockResearch(keyword, geo, articleTitle);

  const base = await fetchVolumeAndSerp(keyword, geo);
  const [intentRes, labsDifficulty, related] = await Promise.all([
    fetchIntent(keyword, geo),
    fetchDifficulty(keyword, geo),
    fetchRelated(keyword, geo),
  ]);

  const intent =
    intentRes?.intent ?? inferIntentFromSerp(base.serp_features, base.serp_titles);
  const difficulty = labsDifficulty ?? base.difficulty;
  const meta = generateMetaFromResearch({
    keyword,
    articleTitle,
    intent,
    volume: base.monthly_volume,
    paa: base.paa_questions,
    serpTitles: base.serp_titles,
  });

  return {
    keyword,
    geo_target: geo,
    monthly_volume: base.monthly_volume,
    cpc: base.cpc,
    difficulty,
    search_intent: intent,
    intent_probability: intentRes?.probability ?? null,
    serp_features: base.serp_features,
    paa_questions: base.paa_questions,
    top_10_urls: base.top_10_urls,
    serp_titles: base.serp_titles,
    related_keywords: related,
    trend_data: base.trend_data,
    opportunity_score: opportunityScore(base.monthly_volume, difficulty, intent),
    ...meta,
    last_refreshed_at: new Date().toISOString(),
  };
}

function toKeywordsRow(r: KeywordResearch) {
  return {
    keyword: r.keyword,
    geo_target: r.geo_target,
    monthly_volume: r.monthly_volume,
    cpc: r.cpc,
    difficulty: r.difficulty,
    serp_features: r.serp_features,
    paa_questions: r.paa_questions,
    top_10_urls: r.top_10_urls,
    trend_data: {
      ...r.trend_data,
      search_intent: r.search_intent,
      intent_probability: r.intent_probability,
      related_keywords: r.related_keywords,
      opportunity_score: r.opportunity_score,
      serp_titles: r.serp_titles,
      meta_title: r.meta_title,
      meta_description: r.meta_description,
      topic_recommendations: r.topic_recommendations,
      content_angle: r.content_angle,
    },
    last_refreshed_at: r.last_refreshed_at,
  };
}

export const testDataForSeoConnection = createServerFn({ method: "GET" }).handler(async () => {
  const login = !!process.env.DATAFORSEO_LOGIN?.trim();
  const password = !!process.env.DATAFORSEO_PASSWORD?.trim();
  if (!login || !password) {
    const missing = [
      !login && "DATAFORSEO_LOGIN",
      !password && "DATAFORSEO_PASSWORD",
    ].filter(Boolean);
    return {
      ok: false,
      configured: false,
      missing,
      message: `Add to .env: ${missing.join(", ")}. Get credentials at https://app.dataforseo.com/api-access`,
    };
  }
  try {
    await dfsPost("/v3/keywords_data/google_ads/search_volume/live", [
      { keywords: ["kloudbean managed hosting"], location_code: locCode("sa"), language_code: "en" },
    ]);
    return {
      ok: true,
      configured: true,
      missing: [],
      message: "DataForSEO connected — live keyword & SERP API is working.",
    };
  } catch (e: unknown) {
    return {
      ok: false,
      configured: true,
      missing: [],
      message: String((e as Error)?.message ?? e),
    };
  }
});

export const researchKeyword = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ keyword: z.string().min(1).max(200), geo: geoSchema, articleTitle: z.string().optional() }).parse,
  )
  .handler(async ({ data }) => {
    const keywordsRepo = await import("@/server/db/repos/keywords");
    const cached = await keywordsRepo.getKeyword(data.keyword, data.geo);

    if (cached?.last_refreshed_at) {
      const age = Date.now() - new Date(cached.last_refreshed_at as string).getTime();
      if (age < CACHE_DAYS * 86400 * 1000) {
        const td = (cached.trend_data ?? {}) as Record<string, unknown>;
        return {
          cached: true,
          mock: !hasDataForSeoCredentials(),
          data: {
            keyword: cached.keyword,
            geo_target: cached.geo_target,
            monthly_volume: cached.monthly_volume,
            cpc: cached.cpc,
            difficulty: cached.difficulty,
            search_intent: (td.search_intent as SearchIntent) ?? null,
            intent_probability: (td.intent_probability as number) ?? null,
            serp_features: cached.serp_features ?? [],
            paa_questions: cached.paa_questions ?? [],
            top_10_urls: cached.top_10_urls ?? [],
            serp_titles: (td.serp_titles as string[]) ?? [],
            related_keywords: (td.related_keywords as RelatedKeyword[]) ?? [],
            trend_data: td,
            opportunity_score: (td.opportunity_score as number) ?? 0,
            meta_title: (td.meta_title as string) ?? "",
            meta_description: (td.meta_description as string) ?? "",
            topic_recommendations: (td.topic_recommendations as string[]) ?? [],
            content_angle: (td.content_angle as string) ?? "",
            last_refreshed_at: cached.last_refreshed_at,
          } satisfies KeywordResearch,
        };
      }
    }

    const full = await buildFullResearch(data.keyword, data.geo, data.articleTitle);
    await keywordsRepo.upsertKeyword(toKeywordsRow(full));
    return { cached: false, mock: !hasDataForSeoCredentials(), data: full };
  });

export const getKeywordIdeas = createServerFn({ method: "POST" })
  .inputValidator(z.object({ seed: z.string().min(1).max(200), geo: geoSchema, limit: z.number().max(100).default(30) }).parse)
  .handler(async ({ data }) => {
    if (!hasDataForSeoCredentials()) {
      const seed = data.seed.toLowerCase();
      return {
        mock: true,
        ideas: Array.from({ length: 12 }, (_, i) => ({
          keyword: `kloudbean ${seed} ${["pricing", "managed hosting", "saudi arabia", "enterprise", "deploy", "alternative"][i % 6]}`,
          volume: Math.floor(Math.random() * 3000) + 100,
          difficulty: Math.floor(Math.random() * 60) + 20,
          intent: "informational" as SearchIntent,
        })),
      };
    }
    const res = await dfsPost("/v3/dataforseo_labs/google/keyword_ideas/live", [
      {
        keywords: [data.seed],
        location_code: locCode(data.geo),
        language_code: "en",
        limit: data.limit,
        include_serp_info: true,
      },
    ]);
    const items = res?.tasks?.[0]?.result?.[0]?.items ?? [];
    const ideas = items.map((it: Record<string, unknown>) => {
      const kd = it.keyword_data as Record<string, unknown> | undefined;
      const ki = kd?.keyword_info as { search_volume?: number } | undefined;
      const kp = kd?.keyword_properties as { keyword_difficulty?: number } | undefined;
      return {
        keyword: String(kd?.keyword ?? it.keyword ?? ""),
        volume: ki?.search_volume ?? null,
        difficulty: kp?.keyword_difficulty ?? null,
        intent: parseIntent(it.search_intent)?.intent ?? null,
      };
    }).filter((x: { keyword: string }) => x.keyword);
    return { mock: false, ideas };
  });

export const getCompetitorKeywords = createServerFn({ method: "POST" })
  .inputValidator(z.object({ domain: z.string().min(3).max(200), geo: geoSchema, limit: z.number().max(100).default(50) }).parse)
  .handler(async ({ data }) => {
    const domain = data.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!hasDataForSeoCredentials()) {
      return {
        mock: true,
        domain,
        keywords: [
          { keyword: "managed cloud hosting", position: 4, volume: 2400, url: `https://${domain}/hosting` },
          { keyword: "nca compliant hosting", position: 7, volume: 880, url: `https://${domain}/enterprise` },
        ],
      };
    }
    const res = await dfsPost("/v3/dataforseo_labs/google/ranked_keywords/live", [
      {
        target: domain,
        location_code: locCode(data.geo),
        language_code: "en",
        limit: data.limit,
        order_by: ["keyword_data.keyword_info.search_volume,desc"],
      },
    ]);
    const items = res?.tasks?.[0]?.result?.[0]?.items ?? [];
    const keywords = items.map((it: Record<string, unknown>) => {
      const kd = it.keyword_data as Record<string, unknown> | undefined;
      const ki = kd?.keyword_info as { search_volume?: number } | undefined;
      const ri = it.ranked_serp_element as { serp_item?: { rank_absolute?: number; url?: string } } | undefined;
      return {
        keyword: String(kd?.keyword ?? ""),
        position: ri?.serp_item?.rank_absolute ?? null,
        volume: ki?.search_volume ?? null,
        url: ri?.serp_item?.url ?? null,
      };
    }).filter((x: { keyword: string }) => x.keyword);
    return { mock: false, domain, keywords };
  });

export const bulkResearch = createServerFn({ method: "POST" })
  .inputValidator(z.object({ keywords: z.array(z.string().min(1)).max(50), geo: geoSchema }).parse)
  .handler(async ({ data }) => {
    const out: KeywordResearch[] = [];
    for (const k of data.keywords) {
      try {
        const r = await researchKeyword({ data: { keyword: k, geo: data.geo } });
        out.push(r.data as KeywordResearch);
      } catch (e: unknown) {
        out.push({
          ...mockResearch(k, data.geo),
          topic_recommendations: [`Error: ${String((e as Error)?.message ?? e)}`],
        });
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    return { results: out };
  });

export async function applyResearchToArticleInternal(articleId: string, geoOverride?: string) {
  const articlesRepo = await import("@/server/db/repos/articles");
  const keywordsRepo = await import("@/server/db/repos/keywords");
  const article = await articlesRepo.getArticleById(articleId);
  if (!article) throw new Error("Article not found");
  if (!article.target_keyword) throw new Error("Article has no target keyword");

  const geo = geoOverride ?? article.geo_target ?? "sa";
  const full = await buildFullResearch(article.target_keyword, geo, article.title);
  await keywordsRepo.upsertKeyword(toKeywordsRow(full));

  await articlesRepo.updateArticle(articleId, {
    keyword_data: full,
    serp_data: {
      features: full.serp_features,
      top_urls: full.top_10_urls,
      titles: full.serp_titles,
      related: full.related_keywords,
    },
    meta_title: full.meta_title,
    meta_description: full.meta_description,
    secondary_keywords: full.related_keywords.slice(0, 5).map((x) => x.keyword),
    status: article.status === "idea" ? "keyword_researched" : article.status,
  });

  const { hasSerperCredentials } = await import("./serper-client");
  const isMock = !hasSerperCredentials() && !hasDataForSeoCredentials();
  return { articleId, research: full, mock: isMock };
}

export const applyResearchToArticle = createServerFn({ method: "POST" })
  .inputValidator(z.object({ articleId: z.string().uuid(), geo: geoSchema.optional() }).parse)
  .handler(async ({ data }) => applyResearchToArticleInternal(data.articleId, data.geo));
