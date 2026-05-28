import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CLUSTERS } from "@/lib/pillars";
import { opportunityScore } from "@/lib/dataforseo-client";
import type { ArticleOpportunity, ClusterAuthorityReport, KeywordResearch, SearchIntent } from "@/lib/seo-types";

function kdScore(article: { keyword_data?: unknown; priority?: string | null }): number {
  const kd = article.keyword_data as KeywordResearch | null | undefined;
  if (kd?.opportunity_score) return kd.opportunity_score;
  const vol = kd?.monthly_volume ?? null;
  const diff = kd?.difficulty ?? null;
  const intent = kd?.search_intent ?? null;
  let base = opportunityScore(vol, diff, intent);
  if (article.priority === "high") base = Math.min(100, base + 12);
  if (article.priority === "low") base = Math.max(0, base - 8);
  return base;
}

function recommendedAction(status: string, score: number, hasKeyword: boolean): string {
  if (!hasKeyword) return "Assign a target keyword from cluster hub";
  if (status === "idea") return score > 60 ? "Research keyword + generate brief" : "Research keyword first";
  if (status === "keyword_researched") return "Generate AI brief with SERP data";
  if (status === "brief_generated") return "Start writing draft";
  if (status === "writing") return "Move to review";
  if (status === "review") return "Publish to WordPress";
  if (status === "published") return "Promote + build internal links";
  return "Maintain + refresh SERP data";
}

export const getArticleOpportunities = createServerFn({ method: "GET" })
  .inputValidator(z.object({ geo: z.enum(["sa", "in", "ae", "global"]).default("sa"), limit: z.number().default(50) }).parse)
  .handler(async ({ data }) => {
    const articlesRepo = await import("@/server/db/repos/articles");
    const articles = await articlesRepo.listArticles({ geo: data.geo, limit: 500 });
    const scored: ArticleOpportunity[] = articles.map((a) => {
      const kd = a.keyword_data as KeywordResearch | null | undefined;
      const score = kdScore(a);
      return {
        id: a.id,
        title: a.title,
        target_keyword: a.target_keyword,
        cluster_id: a.cluster_id,
        status: a.status,
        priority: a.priority,
        opportunity_score: score,
        volume: kd?.monthly_volume ?? null,
        difficulty: kd?.difficulty ?? null,
        intent: (kd?.search_intent as SearchIntent) ?? null,
        recommended_action: recommendedAction(a.status, score, !!a.target_keyword),
        meta_title: a.meta_title ?? kd?.meta_title ?? null,
        meta_description: a.meta_description ?? kd?.meta_description ?? null,
      };
    });
    scored.sort((a, b) => b.opportunity_score - a.opportunity_score);
    return { opportunities: scored.slice(0, data.limit), total: articles.length };
  });

export const getClusterAuthority = createServerFn({ method: "GET" }).handler(async () => {
  const articlesRepo = await import("@/server/db/repos/articles");
  const articles = await articlesRepo.listArticles({ limit: 5000 });
  const reports: ClusterAuthorityReport[] = CLUSTERS.map((cluster) => {
    const inCluster = articles.filter(
      (a) => a.cluster_id === cluster.id || (!a.cluster_id && a.pillar === cluster.id),
    );
    const by_status: Record<string, number> = {};
    let totalVol = 0;
    let scoreSum = 0;
    let scored = 0;
    for (const a of inCluster) {
      by_status[a.status] = (by_status[a.status] ?? 0) + 1;
      const kd = a.keyword_data as KeywordResearch | null | undefined;
      if (kd?.monthly_volume) totalVol += kd.monthly_volume;
      if (kd || a.target_keyword) {
        scoreSum += kdScore(a);
        scored++;
      }
    }
    const researched = inCluster.filter((a) => a.status !== "idea" || a.keyword_data).length;
    const briefed = inCluster.filter((a) =>
      ["brief_generated", "writing", "review", "published", "promoted"].includes(a.status),
    ).length;
    const published = inCluster.filter((a) => ["published", "promoted"].includes(a.status)).length;
    const ideas = inCluster.filter((a) => a.status === "idea").length;
    const gaps: string[] = [];
    if (inCluster.length < 8) gaps.push(`Need ${8 - inCluster.length}+ more articles to establish cluster depth`);
    if (ideas > inCluster.length * 0.6) gaps.push(`${ideas} ideas still unresearched — run keyword research batch`);
    if (briefed < 3) gaps.push("Few briefs — generate outlines before writing");
    if (published === 0) gaps.push("No published hub page — publish pillar content first");
    const priority_actions: string[] = [];
    if (published < 2) priority_actions.push("Publish 1–2 pillar/hub articles with strong internal linking");
    if (researched < inCluster.length * 0.5) priority_actions.push("Bulk-research keywords for this cluster");
    priority_actions.push("Link every article to 4–6 siblings + 2 cross-cluster bridges");
    const topKw = inCluster
      .filter((a) => a.target_keyword)
      .sort((a, b) => kdScore(b) - kdScore(a))[0]?.target_keyword ?? null;
    return {
      cluster_id: cluster.id,
      cluster_name: cluster.name,
      total_articles: inCluster.length,
      by_status,
      researched,
      briefed,
      published,
      avg_opportunity: scored ? Math.round(scoreSum / scored) : 0,
      total_addressable_volume: totalVol,
      gaps,
      priority_actions,
      hub_keyword: topKw,
      supporting_topics: inCluster.filter((a) => a.status === "idea").slice(0, 5).map((a) => a.title),
    };
  });
  return { clusters: reports };
});

export const bulkResearchArticles = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      onlyMissing: z.boolean().default(true),
      clusterId: z.number().optional(),
      limit: z.number().max(30).default(10),
    }).parse,
  )
  .handler(async ({ data }) => {
    const articlesRepo = await import("@/server/db/repos/articles");
    const { applyResearchToArticleInternal } = await import("@/lib/dataforseo.functions");
    const rows = await articlesRepo.listArticles({
      clusterId: data.clusterId,
      limit: data.limit,
    });
    const filtered = data.onlyMissing
      ? rows.filter((r) => r.status === "idea" || !r.keyword_data)
      : rows;
    const results: { id: string; ok: boolean; error?: string }[] = [];
    for (const row of filtered) {
      if (!row.target_keyword) {
        results.push({ id: row.id, ok: false, error: "no keyword" });
        continue;
      }
      try {
        await applyResearchToArticleInternal(row.id);
        results.push({ id: row.id, ok: true });
      } catch (e: unknown) {
        results.push({ id: row.id, ok: false, error: String((e as Error)?.message ?? e) });
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    return {
      total: filtered.length,
      success: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  });
