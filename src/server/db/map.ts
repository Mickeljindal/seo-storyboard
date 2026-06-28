import type { ArticleRow, ToolRow, KgNodeRow, KgEdgeRow, ReelRow } from "./schema";

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
    content_html: row.contentHtml,
    quality_score: row.qualityScore,
    quality_report: row.qualityReport,
    silo_role: row.siloRole,
    hub_article_id: row.hubArticleId,
    demand_score: row.demandScore,
    demand_validated: row.demandValidated,
    published_at: row.publishedAt?.toISOString() ?? null,
    engine_source: row.engineSource,
    created_at: row.createdAt?.toISOString(),
    updated_at: row.updatedAt?.toISOString(),
  };
}

export type ApiArticle = ReturnType<typeof toApiArticle>;

/** API shape for tool pages (snake_case). */
export function toApiTool(row: ToolRow) {
  return {
    id: row.id,
    name: row.name,
    url_slug: row.urlSlug,
    target_keyword: row.targetKeyword,
    secondary_keywords: row.secondaryKeywords ?? [],
    category: row.category,
    geo_target: row.geoTarget,
    status: row.status,
    origin: row.origin,
    wp_post_id: row.wpPostId,
    published_url: row.publishedUrl,
    meta_title: row.metaTitle,
    meta_description: row.metaDescription,
    tool_html: row.toolHtml,
    seo_content: row.seoContent,
    schema_jsonld: row.schemaJsonld,
    elementor_data: row.elementorData,
    idea_data: row.ideaData,
    volume: row.volume,
    difficulty: row.difficulty,
    demand_score: row.demandScore,
    quality_score: row.qualityScore,
    quality_report: row.qualityReport,
    aioseo_score_before: row.aioseoScoreBefore,
    aioseo_score_after: row.aioseoScoreAfter,
    gsc_clicks: row.gscClicks,
    gsc_impressions: row.gscImpressions,
    gsc_position: row.gscPosition != null ? Number(row.gscPosition) : null,
    gate_clicks: row.gateClicks,
    perf_synced_at: row.perfSyncedAt?.toISOString() ?? null,
    audit_report: row.auditReport,
    gate_enabled: row.gateEnabled,
    gate_mode: row.gateMode,
    notes: row.notes,
    engine_source: row.engineSource,
    published_at: row.publishedAt?.toISOString() ?? null,
    optimized_at: row.optimizedAt?.toISOString() ?? null,
    created_at: row.createdAt?.toISOString(),
    updated_at: row.updatedAt?.toISOString(),
  };
}

export type ApiTool = ReturnType<typeof toApiTool>;

export function toApiKgNode(row: KgNodeRow) {
  return {
    id: row.id,
    type: row.type,
    node_key: row.nodeKey,
    label: row.label,
    description: row.description,
    data: row.data,
    weight: row.weight != null ? Number(row.weight) : 1,
    reward: row.reward != null ? Number(row.reward) : 0,
    mentions: row.mentions ?? 0,
    cluster_id: row.clusterId,
    geo: row.geo,
    source: row.source,
    created_at: row.createdAt?.toISOString(),
    updated_at: row.updatedAt?.toISOString(),
  };
}
export type ApiKgNode = ReturnType<typeof toApiKgNode>;

export function toApiKgEdge(row: KgEdgeRow) {
  return {
    id: row.id,
    source_id: row.sourceId,
    target_id: row.targetId,
    relation: row.relation,
    weight: row.weight != null ? Number(row.weight) : 1,
    mentions: row.mentions ?? 0,
  };
}
export type ApiKgEdge = ReturnType<typeof toApiKgEdge>;

export function toApiReel(row: ReelRow) {
  return {
    id: row.id,
    title: row.title,
    topic: row.topic,
    format: row.format,
    status: row.status,
    hook: row.hook,
    hook_variations: row.hookVariations ?? [],
    script: row.script,
    voiceover: row.voiceover,
    caption: row.caption,
    hashtags: row.hashtags ?? [],
    cta: row.cta,
    duration_seconds: row.durationSeconds,
    platform_prompts: row.platformPrompts,
    cluster_id: row.clusterId,
    demand_score: row.demandScore,
    idea_data: row.ideaData,
    notes: row.notes,
    engine_source: row.engineSource,
    created_at: row.createdAt?.toISOString(),
    updated_at: row.updatedAt?.toISOString(),
  };
}
export type ApiReel = ReturnType<typeof toApiReel>;
