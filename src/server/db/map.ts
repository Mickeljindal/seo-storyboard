import type { ArticleRow } from "./schema";

/** API shape (snake_case) — matches former Supabase client responses. */
export function toApiArticle(row: ArticleRow) {
  return {
    id: row.id,
    title: row.title,
    target_keyword: row.targetKeyword,
    secondary_keywords: row.secondaryKeywords ?? [],
    pillar: row.pillar,
    status: row.status,
    scheduled_week: row.scheduledWeek,
    assignee_id: row.assigneeId,
    word_count_target: row.wordCountTarget,
    meta_title: row.metaTitle,
    meta_description: row.metaDescription,
    url_slug: row.urlSlug,
    published_url: row.publishedUrl,
    brief: row.brief,
    keyword_data: row.keywordData,
    serp_data: row.serpData,
    performance_data: row.performanceData,
    geo_target: row.geoTarget,
    language: row.language,
    priority: row.priority,
    notes: row.notes,
    cluster_id: row.clusterId,
    cluster_name: row.clusterName,
    anchor: row.anchor,
    idea_index: row.ideaIndex,
    entities: row.entities ?? [],
    faq: row.faq,
    ai_overview: row.aiOverview,
    schema_jsonld: row.schemaJsonld,
    internal_link_targets: row.internalLinkTargets ?? [],
    content_draft: row.contentDraft,
    engine_source: row.engineSource,
    created_at: row.createdAt?.toISOString(),
    updated_at: row.updatedAt?.toISOString(),
  };
}

export type ApiArticle = ReturnType<typeof toApiArticle>;
