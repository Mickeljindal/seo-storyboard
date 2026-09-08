import {
  pgTable,
  uuid,
  text,
  smallint,
  integer,
  bigint,
  numeric,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  targetKeyword: text("target_keyword"),
  secondaryKeywords: text("secondary_keywords").array().default([]),
  pillar: smallint("pillar").notNull(),
  status: text("status").notNull().default("idea"),
  scheduledWeek: smallint("scheduled_week"),
  assigneeId: uuid("assignee_id"),
  wordCountTarget: integer("word_count_target").default(2500),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  urlSlug: text("url_slug"),
  publishedUrl: text("published_url"),
  brief: jsonb("brief"),
  keywordData: jsonb("keyword_data"),
  serpData: jsonb("serp_data"),
  performanceData: jsonb("performance_data"),
  geoTarget: text("geo_target").default("sa"),
  language: text("language").default("en"),
  priority: text("priority").default("medium"),
  notes: text("notes"),
  clusterId: smallint("cluster_id"),
  clusterName: text("cluster_name"),
  anchor: text("anchor"),
  ideaIndex: integer("idea_index"),
  entities: text("entities").array().default([]),
  faq: jsonb("faq"),
  aiOverview: jsonb("ai_overview"),
  schemaJsonld: jsonb("schema_jsonld"),
  internalLinkTargets: text("internal_link_targets").array().default([]),
  contentDraft: text("content_draft"),
  contentHtml: text("content_html"),
  qualityScore: smallint("quality_score"),
  qualityReport: jsonb("quality_report"),
  // Semantic silo / topical map
  siloRole: text("silo_role"), // "pillar" | "hub" | "supporting"
  hubArticleId: uuid("hub_article_id"), // the hub/pillar this supporting article rolls up to
  // Search-demand gate (no zero-demand ideas)
  demandScore: smallint("demand_score"),
  demandValidated: text("demand_validated"), // "yes" | "no" | null (unchecked)
  // Lifecycle
  publishedAt: timestamp("published_at", { withTimezone: true }),
  // Freshness / decay management
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  reviewCount: integer("review_count").default(0),
  engineSource: text("engine_source"),
  // Pre-publish review queue — Autopilot queues here instead of publishing
  // directly; a human (or an auto-approve timer) releases it to WordPress.
  approvalStatus: text("approval_status").default("none"), // none | queued | approved | rejected | published
  queuedAt: timestamp("queued_at", { withTimezone: true }),
  scheduledPublishAt: timestamp("scheduled_publish_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const keywords = pgTable("keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyword: text("keyword").notNull(),
  geoTarget: text("geo_target").default("sa"),
  monthlyVolume: integer("monthly_volume"),
  cpc: numeric("cpc", { precision: 10, scale: 2 }),
  difficulty: smallint("difficulty"),
  serpFeatures: text("serp_features").array().default([]),
  paaQuestions: text("paa_questions").array().default([]),
  top10Urls: text("top_10_urls").array().default([]),
  trendData: jsonb("trend_data"),
  lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contentBriefs = pgTable("content_briefs", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  briefData: jsonb("brief_data").notNull(),
  version: integer("version").notNull().default(1),
  generatedBy: text("generated_by").default("ai"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const raffleDraws = pgTable("raffle_draws", {
  id: uuid("id").primaryKey().defaultRandom(),
  drawCount: integer("draw_count").notNull(),
  filters: jsonb("filters"),
  pickedIds: uuid("picked_ids").array().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const engineRuns = pgTable("engine_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: text("status").notNull().default("running"),
  geo: text("geo").notNull().default("sa"),
  config: jsonb("config").notNull().default({}),
  stats: jsonb("stats").notNull().default({}),
  log: jsonb("log").notNull().default([]),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

/**
 * Self-learning signal store. Every generated/selected/published article emits
 * a signal row capturing its features (cluster, intent, keyword shape, demand,
 * quality score, outcome). The discovery ranker reads aggregates from here to
 * favour patterns that historically produced high-quality, published articles.
 */
export const topicSignals = pgTable("topic_signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id"),
  keyword: text("keyword"),
  clusterId: smallint("cluster_id"),
  geo: text("geo"),
  intent: text("intent"),
  demandScore: smallint("demand_score"),
  qualityScore: smallint("quality_score"),
  /** "generated" | "selected" | "published" | "rejected" */
  event: text("event").notNull(),
  /** numeric reward used by the learning ranker (higher = better outcome) */
  reward: numeric("reward", { precision: 6, scale: 3 }),
  features: jsonb("features"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Real search performance — our own analytics, pulled directly from Google
 * Search Console (free API). One row per page per sync window. This is the
 * "single source of truth" for what actually ranks and gets clicked, and it
 * feeds the self-learning ranker with real outcomes (not just internal scores).
 */
export const searchPerformance = pgTable("search_performance", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id"), // matched to articles.published_url when known
  page: text("page").notNull(), // full URL from GSC
  topQuery: text("top_query"), // best query for this page (optional)
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  ctr: numeric("ctr", { precision: 6, scale: 4 }),
  position: numeric("position", { precision: 6, scale: 2 }),
  dateStart: text("date_start"), // ISO date (window start)
  dateEnd: text("date_end"), // ISO date (window end)
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * TOOL PAGES — interactive free tools (calculators, generators, converters)
 * published as WordPress Pages built with Elementor (HTML widget). Separate from
 * `articles` because tools are interactive HTML, live on Pages (not posts), and
 * follow a different lifecycle (idea → generated → published → optimized).
 *
 * SAFETY: for EXISTING pages we adopt `wpPostId` + `urlSlug` and treat the slug
 * as READ-ONLY (some pages already rank). The optimizer only adds SEO around the
 * existing tool — it never rewrites the tool widget or changes the slug.
 */
export const tools = pgTable("tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // e.g. "A/B Test Calculator"
  // The WordPress page slug. For existing pages this is adopted from WP and
  // NEVER changed. For new pages the engine proposes it once at creation.
  urlSlug: text("url_slug"),
  targetKeyword: text("target_keyword"),
  secondaryKeywords: text("secondary_keywords").array().default([]),
  category: text("category").default("Developer Tools"),
  geoTarget: text("geo_target").default("global"),
  // idea | generated | review | published | optimized | error
  status: text("status").notNull().default("idea"),
  // discovered | manual | existing (adopted from WP)
  origin: text("origin").default("discovered"),
  // WordPress linkage
  wpPostId: integer("wp_post_id"),
  publishedUrl: text("published_url"),
  // SEO meta
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  // Live word count of the page's content (from WordPress, synced), so the
  // dashboard can show what's actually inside the page without opening it.
  wordCount: integer("word_count"),
  // Generated assets
  toolHtml: text("tool_html"), // the interactive tool (Elementor HTML widget body)
  seoContent: jsonb("seo_content"), // { h1, intro, how_to[], faq[], related[] }
  schemaJsonld: jsonb("schema_jsonld"), // SoftwareApplication + FAQPage + Breadcrumb
  elementorData: jsonb("elementor_data"), // last-built/known _elementor_data snapshot
  // Demand / idea signals
  ideaData: jsonb("idea_data"),
  volume: integer("volume"),
  difficulty: smallint("difficulty"),
  demandScore: smallint("demand_score"),
  // Scoring
  qualityScore: smallint("quality_score"),
  qualityReport: jsonb("quality_report"),
  aioseoScoreBefore: smallint("aioseo_score_before"),
  aioseoScoreAfter: smallint("aioseo_score_after"),
  // Real outcomes (self-improvement loop)
  gscClicks: integer("gsc_clicks"),
  gscImpressions: integer("gsc_impressions"),
  gscPosition: numeric("gsc_position", { precision: 6, scale: 2 }),
  gateClicks: integer("gate_clicks"),
  perfSyncedAt: timestamp("perf_synced_at", { withTimezone: true }),
  // Audit snapshot (what the optimizer found before touching the page)
  auditReport: jsonb("audit_report"),
  optimizeReport: jsonb("optimize_report"),
  // Pre-optimize snapshot of _elementor_data, for one-click rollback
  elementorSnapshot: jsonb("elementor_snapshot"),
  // Signup gate (lead-gen): require a console.kloudbean.com account to use the tool
  gateEnabled: text("gate_enabled"), // "yes" | "no" | null
  gateMode: text("gate_mode"), // "soft" | "hard" | null
  notes: text("notes"),
  engineSource: text("engine_source"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  optimizedAt: timestamp("optimized_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ArticleRow = typeof articles.$inferSelect;

/**
 * SELF-LEARNING KNOWLEDGE GRAPH — the system's evolving understanding of what
 * Kloudbean is and what topics surround it.
 *
 * Nodes are entities (product, feature, provider, competitor, persona, cluster,
 * region, app, topic, keyword). Edges are typed relations (offers, supports,
 * competes_with, serves, belongs_to, relates_to, targets). Both carry a `weight`
 * that grows from mentions + real ranking/quality rewards, so the graph learns
 * which entities and connections actually drive results.
 */
export const kgNodes = pgTable("kg_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  // product | feature | provider | competitor | persona | cluster | region | app | topic | keyword | concept
  type: text("type").notNull(),
  // stable dedupe key (lowercased), unique per type via app logic
  nodeKey: text("node_key").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  data: jsonb("data"),
  // importance — grows from mentions + learning reward
  weight: numeric("weight", { precision: 8, scale: 3 }).default("1"),
  reward: numeric("reward", { precision: 8, scale: 3 }).default("0"),
  mentions: integer("mentions").default(0),
  clusterId: smallint("cluster_id"),
  geo: text("geo"),
  source: text("source"), // seed | article | tool | keyword | learned
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const kgEdges = pgTable("kg_edges", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull(),
  targetId: uuid("target_id").notNull(),
  relation: text("relation").notNull(),
  weight: numeric("weight", { precision: 8, scale: 3 }).default("1"),
  mentions: integer("mentions").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * REELS — short-video ideas + scripts generated from the same knowledge, with
 * ready-to-paste prompts for text-to-video tools (Sora, Veo, Google AI Studio).
 */
export const reels = pgTable("reels", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  topic: text("topic"),
  // explainer | educational | how_it_works | viral | comparison | listicle
  format: text("format").notNull().default("explainer"),
  status: text("status").notNull().default("idea"), // idea | scripted | ready | published
  hook: text("hook"),
  hookVariations: text("hook_variations").array().default([]),
  script: jsonb("script"), // [{ seconds, narration, on_screen, visual_prompt }]
  voiceover: text("voiceover"),
  caption: text("caption"),
  hashtags: text("hashtags").array().default([]),
  cta: text("cta"),
  durationSeconds: integer("duration_seconds").default(45),
  platformPrompts: jsonb("platform_prompts"), // { sora, veo, ai_studio }
  clusterId: smallint("cluster_id"),
  demandScore: smallint("demand_score"),
  ideaData: jsonb("idea_data"),
  notes: text("notes"),
  engineSource: text("engine_source"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ArticleInsert = typeof articles.$inferInsert;
export type SearchPerformanceRow = typeof searchPerformance.$inferSelect;
export type ToolRow = typeof tools.$inferSelect;
export type ToolInsert = typeof tools.$inferInsert;
export type KgNodeRow = typeof kgNodes.$inferSelect;
export type KgEdgeRow = typeof kgEdges.$inferSelect;
export type ReelRow = typeof reels.$inferSelect;

/**
 * DURABLE JOB QUEUE — long-running/bulk work (build, optimize, publish many)
 * runs server-side and survives a closed browser tab. The autopilot drains the
 * queue each cycle; failures retry with backoff up to max_attempts.
 */
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // generate_tool | optimize_tool | publish_tool
  payload: jsonb("payload"),
  status: text("status").notNull().default("pending"), // pending | running | done | error
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  result: jsonb("result"),
  error: text("error"),
  label: text("label"),
  // Batch tracking (progress bar + per-item log in the dashboard): jobs
  // enqueued together via the same bulk action share a batchId, so the UI can
  // show "X of Y complete" and a scrollable log of exactly what happened to
  // each item, instead of only an aggregate pending/running/done/error count.
  batchId: uuid("batch_id"),
  batchLabel: text("batch_label"), // human-readable name for the whole batch
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  runAfter: timestamp("run_after", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type JobRow = typeof jobs.$inferSelect;

export const citations = pgTable("citations", {
  id: uuid("id").primaryKey().defaultRandom(),
  query: text("query").notNull(),
  engine: text("engine").notNull(), // perplexity | gemini | openai
  geo: text("geo").default("global"),
  clusterId: smallint("cluster_id"),
  articleId: uuid("article_id"), // matched owned article/tool, if cited
  mentioned: boolean("mentioned").default(false), // Kloudbean named in answer text
  cited: boolean("cited").default(false), // Kloudbean URL in sources
  position: smallint("position"), // rank among cited sources (1 = first)
  citedUrl: text("cited_url"),
  competitors: text("competitors").array().default([]),
  answerExcerpt: text("answer_excerpt"),
  sources: jsonb("sources"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CitationRow = typeof citations.$inferSelect;

export const entityAssets = pgTable("entity_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull(), // e.g. "G2", "LinkedIn", "Crunchbase"
  assetType: text("asset_type").default("listing"), // listing | profile | review | mention | wiki
  name: text("name").notNull(),
  url: text("url"),
  status: text("status").notNull().default("todo"), // todo | in_progress | live | verified
  priority: smallint("priority").default(2), // 1 = high, 2 = med, 3 = low
  nameConsistent: boolean("name_consistent"), // null = unchecked
  notes: text("notes"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type EntityAssetRow = typeof entityAssets.$inferSelect;

export const conversions = pgTable("conversions", {
  id: uuid("id").primaryKey().defaultRandom(),
  event: text("event").notNull().default("signup"), // signup | paid | lead | view
  sourceUrl: text("source_url"),
  sourceSlug: text("source_slug"),
  surface: text("surface").default("unknown"), // tool | article | unknown
  articleId: uuid("article_id"),
  toolId: uuid("tool_id"),
  clusterId: smallint("cluster_id"),
  ref: text("ref"),
  plan: text("plan"),
  value: numeric("value", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  externalId: text("external_id"), // dedupe key from console (signup/order id)
  meta: jsonb("meta"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ConversionRow = typeof conversions.$inferSelect;

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AppSettingRow = typeof appSettings.$inferSelect;

// ============================================================================
// KLOUDGRAPH — competitor SEO intelligence warehouse (Semrush import seed)
// Standalone-ready module living inside the engine for now. Every fact table
// carries snapshotDate so history accumulates over time.
// ============================================================================

/** Competitor registry — the domains we track, tiered by relevance. */
export const kgCompetitors = pgTable("kg_competitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  domain: text("domain").notNull().unique(),
  name: text("name"),
  tier: smallint("tier").default(1),
  category: text("category"),
  tracked: boolean("tracked").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Organic rankings (Positions export) — every keyword a domain ranks for. */
export const kgOrganicRankings = pgTable("kg_organic_rankings", {
  id: uuid("id").primaryKey().defaultRandom(),
  competitorDomain: text("competitor_domain").notNull(),
  keyword: text("keyword").notNull(),
  position: integer("position"),
  previousPosition: integer("previous_position"),
  volume: integer("volume"),
  difficulty: smallint("difficulty"),
  cpc: numeric("cpc", { precision: 10, scale: 2 }),
  url: text("url"),
  traffic: integer("traffic"),
  trafficPct: numeric("traffic_pct", { precision: 8, scale: 4 }),
  trafficCost: numeric("traffic_cost", { precision: 14, scale: 2 }),
  intents: text("intents"),
  serpFeatures: text("serp_features"),
  results: numeric("results"),
  snapshotDate: text("snapshot_date"),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Keyword gap (competitor vs kloudbean) — the opportunity engine. */
export const kgKeywordGap = pgTable("kg_keyword_gap", {
  id: uuid("id").primaryKey().defaultRandom(),
  competitorDomain: text("competitor_domain").notNull(),
  keyword: text("keyword").notNull(),
  intents: text("intents"),
  volume: integer("volume"),
  difficulty: smallint("difficulty"),
  cpc: numeric("cpc", { precision: 10, scale: 2 }),
  competitionDensity: numeric("competition_density", { precision: 6, scale: 4 }),
  competitorPosition: integer("competitor_position"),
  ourPosition: integer("our_position"),
  competitorUrl: text("competitor_url"),
  ourUrl: text("our_url"),
  results: numeric("results"),
  snapshotDate: text("snapshot_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Organic competitors (Competitors export) — feeds long-tail discovery. */
export const kgOrganicCompetitors = pgTable("kg_organic_competitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  forDomain: text("for_domain").notNull(),
  competitorDomain: text("competitor_domain").notNull(),
  relevance: numeric("relevance", { precision: 6, scale: 4 }),
  commonKeywords: bigint("common_keywords", { mode: "number" }),
  organicKeywords: bigint("organic_keywords", { mode: "number" }),
  organicTraffic: numeric("organic_traffic"),
  organicCost: numeric("organic_cost", { precision: 16, scale: 2 }),
  adwordsKeywords: bigint("adwords_keywords", { mode: "number" }),
  snapshotDate: text("snapshot_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Subdomains (Subdomains export). */
export const kgSubdomains = pgTable("kg_subdomains", {
  id: uuid("id").primaryKey().defaultRandom(),
  competitorDomain: text("competitor_domain").notNull(),
  subdomainUrl: text("subdomain_url").notNull(),
  traffic: integer("traffic"),
  trafficPct: numeric("traffic_pct", { precision: 8, scale: 4 }),
  keywords: integer("keywords"),
  snapshotDate: text("snapshot_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Backlinks (full link list). */
export const kgBacklinks = pgTable("kg_backlinks", {
  id: uuid("id").primaryKey().defaultRandom(),
  competitorDomain: text("competitor_domain").notNull(),
  pageAscore: smallint("page_ascore"),
  sourceTitle: text("source_title"),
  sourceUrl: text("source_url"),
  targetUrl: text("target_url"),
  anchor: text("anchor"),
  externalLinks: integer("external_links"),
  internalLinks: integer("internal_links"),
  nofollow: boolean("nofollow"),
  sponsored: boolean("sponsored"),
  ugc: boolean("ugc"),
  isText: boolean("is_text"),
  isFrame: boolean("is_frame"),
  isForm: boolean("is_form"),
  isImage: boolean("is_image"),
  sitewide: boolean("sitewide"),
  firstSeen: text("first_seen"),
  lastSeen: text("last_seen"),
  newLink: boolean("new_link"),
  lostLink: boolean("lost_link"),
  snapshotDate: text("snapshot_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Backlink anchors (anchor-text profile). */
export const kgBacklinkAnchors = pgTable("kg_backlink_anchors", {
  id: uuid("id").primaryKey().defaultRandom(),
  competitorDomain: text("competitor_domain").notNull(),
  anchor: text("anchor"),
  domains: integer("domains"),
  backlinks: numeric("backlinks"),
  firstSeen: text("first_seen"),
  lastSeen: text("last_seen"),
  snapshotDate: text("snapshot_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Backlink pages (most-linked pages). */
export const kgBacklinkPages = pgTable("kg_backlink_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  competitorDomain: text("competitor_domain").notNull(),
  sourceUrl: text("source_url"),
  sourceTitle: text("source_title"),
  responseCode: integer("response_code"),
  backlinks: numeric("backlinks"),
  domains: integer("domains"),
  externalLinks: integer("external_links"),
  internalLinks: integer("internal_links"),
  lastSeen: text("last_seen"),
  snapshotDate: text("snapshot_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Referring domains. */
export const kgReferringDomains = pgTable("kg_referring_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  competitorDomain: text("competitor_domain").notNull(),
  referringDomain: text("referring_domain"),
  domainAscore: smallint("domain_ascore"),
  backlinks: numeric("backlinks"),
  firstSeen: text("first_seen"),
  lastSeen: text("last_seen"),
  snapshotDate: text("snapshot_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Import log — so re-running an import never duplicates rows. */
export const kgImportLog = pgTable("kg_import_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  competitorDomain: text("competitor_domain"),
  fileName: text("file_name").notNull(),
  reportType: text("report_type"),
  rowsImported: integer("rows_imported").default(0),
  fileHash: text("file_hash"),
  importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
});

export type KgCompetitorRow = typeof kgCompetitors.$inferSelect;
export type KgOrganicRankingRow = typeof kgOrganicRankings.$inferSelect;
export type KgKeywordGapRow = typeof kgKeywordGap.$inferSelect;
export type KgOrganicCompetitorRow = typeof kgOrganicCompetitors.$inferSelect;
export type KgImportLogRow = typeof kgImportLog.$inferSelect;

// ============================================================================
// PROCESS RUNS — live progress bar + scrollable log for any long-running bulk
// operation (Semrush import, WordPress sync, idea discovery, bulk optimize
// batches, etc). Any such operation calls the process-tracker.ts helper to
// create a row here and update it as it goes; the dashboard polls it to show
// a progress bar ("42 of 417") and a timestamped log of what happened to each
// item, instead of only a spinner + a single toast at the very end.
// ============================================================================
export const processRuns = pgTable("process_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(), // semrush_import | sync_tools | idea_discovery | bulk_optimize | bulk_generate | fix_html | kg_rebuild | autopilot_cycle
  label: text("label").notNull(), // human-readable title shown in the UI
  status: text("status").notNull().default("running"), // running | done | error | cancelled
  total: integer("total").default(0),
  completed: integer("completed").default(0),
  failed: integer("failed").default(0),
  // Capped array of {at, level, message} — level: info | success | warn | error.
  logs: jsonb("logs").default([]),
  // The parameters this run was started with (e.g. {root} for a Semrush
  // import, {category,maxPages,perPage} for a WP sync). Lets the Activity
  // Center retry a failed/stuck run with the exact same input instead of
  // asking the user to re-enter it.
  input: jsonb("input"),
  result: jsonb("result"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ProcessRunRow = typeof processRuns.$inferSelect;

// ============================================================================
// EXPERIENCE ENGINE — real operational lessons woven into content for E-E-A-T
// ============================================================================
export const experienceSnippets = pgTable("experience_snippets", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("lesson"), // lesson | mistake | migration | incident | benchmark
  body: text("body").notNull(),
  tags: text("tags").array().default([]),
  clusterId: smallint("cluster_id"),
  usageCount: integer("usage_count").default(0),
  source: text("source").default("manual"), // manual | support_ticket | postmortem | docs | git | founder | ...
  active: boolean("active").default(true),
  // --- Knowledge Object fields (institutional memory; this table IS the KO store) ---
  confidence: text("confidence").default("curated"), // verified | curated | inferred
  grounded: boolean("grounded").default(true), // tied to a real source? gates "we see this" framing
  sourceRef: text("source_ref"), // traceability: doc URL, ticket id, commit hash, "founder note"...
  status: text("status").default("active"), // active | needs-review | stale | retired
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ExperienceSnippetRow = typeof experienceSnippets.$inferSelect;
export type ExperienceSnippetInsert = typeof experienceSnippets.$inferInsert;

// ============================================================================
// KNOWLEDGE GAP QUEUE — when a needed Knowledge Object type is missing for a
// topic, log it here instead of fabricating. Feeds the KO/experience backlog.
// ============================================================================
export const knowledgeGaps = pgTable("knowledge_gaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  topic: text("topic").notNull(),
  neededType: text("needed_type").notNull(), // the KO type/kind that was missing
  note: text("note"),
  clusterId: smallint("cluster_id"),
  geo: text("geo"),
  status: text("status").notNull().default("open"), // open | filled | wontfix
  hits: integer("hits").default(1), // how many times this gap was requested
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type KnowledgeGapRow = typeof knowledgeGaps.$inferSelect;
export type KnowledgeGapInsert = typeof knowledgeGaps.$inferInsert;

// ============================================================================
// DISTRIBUTION ENGINE — auto-drafted social/newsletter posts per article
// ============================================================================
export const distributions = pgTable("distributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").notNull(),
  channel: text("channel").notNull(), // linkedin | x_thread | newsletter
  content: jsonb("content").notNull(),
  status: text("status").notNull().default("draft"), // draft | approved | posted
  postedUrl: text("posted_url"),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type DistributionRow = typeof distributions.$inferSelect;
export type DistributionInsert = typeof distributions.$inferInsert;

// ============================================================================
// SITE-WIDE AUTO INTERNAL LINKING — mirrors the FULL live WordPress site (any
// origin, not just content this engine authored) so link opportunities can be
// found and applied across everything that exists on kloudbean.com.
// ============================================================================

/** One row per WordPress post/page, synced from the plugin's /site-content endpoint. */
export const sitePages = pgTable("site_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  wpPostId: integer("wp_post_id").notNull(),
  postType: text("post_type").notNull().default("post"), // post | page
  title: text("title").notNull(),
  slug: text("slug"),
  publishedUrl: text("published_url"),
  status: text("status").default("publish"),
  excerpt: text("excerpt"),
  contentText: text("content_text"), // plain-text extract (stripped tags), truncated
  wordCount: integer("word_count").default(0),
  clusterId: smallint("cluster_id"), // best-guess topical cluster (relevance-scored)
  outboundLinkCount: integer("outbound_link_count").default(0),
  inboundLinkCount: integer("inbound_link_count").default(0),
  modifiedAt: timestamp("modified_at", { withTimezone: true }),
  lastScannedAt: timestamp("last_scanned_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** A proposed (or applied) link from one site page to another. */
export const linkSuggestions = pgTable("link_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourcePageId: uuid("source_page_id").notNull(),
  targetPageId: uuid("target_page_id").notNull(),
  anchorText: text("anchor_text").notNull(),
  score: numeric("score", { precision: 6, scale: 3 }).default("0"),
  reason: text("reason"), // human-readable "why this link makes sense"
  status: text("status").notNull().default("pending"), // pending | applied | rejected | skipped
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SitePageRow = typeof sitePages.$inferSelect;
export type SitePageInsert = typeof sitePages.$inferInsert;
export type LinkSuggestionRow = typeof linkSuggestions.$inferSelect;
export type LinkSuggestionInsert = typeof linkSuggestions.$inferInsert;

// ============================================================================
// PENDING INTERNAL LINKS — the deferred-link ledger.
//
// Our articles link to each other, but they go live at different times. A link
// whose target is not published yet is a 404 for readers and a wasted crawl.
//
// So at publish time the publisher keeps links whose target is already live and
// strips the ones whose target is not, leaving the anchor words as plain text
// and recording a row here. When the target article is later published, the
// healer finds every pending row pointing at it and turns those words into real
// links in the already-published source posts.
//
// Keyed by SLUG rather than by post id on purpose: a row can be recorded before
// either side has a WordPress post, and slugs are the stable identity across the
// engine, the files on disk, and the live site. Distinct from linkSuggestions,
// which holds *discovered* opportunities scored from a site scan; these are
// links the writer actually authored and we owe the reader.
// ============================================================================
export const pendingInternalLinks = pgTable("pending_internal_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Article the link lives in (already published, or about to be). */
  fromSlug: text("from_slug").notNull(),
  /** Article the link should point at, once it is live. */
  targetSlug: text("target_slug").notNull(),
  /** Exact words to turn into the link. Left in the body as plain text. */
  anchorText: text("anchor_text").notNull(),
  /** pending | applied | skipped | stale */
  status: text("status").notNull().default("pending"),
  /** How many times we tried and failed, so a bad row cannot loop forever. */
  attempts: integer("attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  /** Why it was skipped or what failed, kept for diagnosis. */
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PendingInternalLinkRow = typeof pendingInternalLinks.$inferSelect;
export type PendingInternalLinkInsert = typeof pendingInternalLinks.$inferInsert;

// ============================================================================
// GO-TO-MARKET LAYER — what happens AFTER an article is written.
//
// Publishing was the end of the pipeline; it should be the middle. These tables
// carry distribution, community listening, and outreach.
//
// The one rule encoded across all three: nothing sends or posts by itself. Rows
// hold drafts plus state, humans approve, and every send path is capped and
// logged. That is a deliberate product decision, not a missing feature.
// ============================================================================

/**
 * An article-driven email send. Kept separate from `distributions` because a
 * broadcast has real delivery state (how many went out, provider ids, failures)
 * whereas a distribution row is copy waiting for a human to post it.
 */
export const emailBroadcasts = pgTable("email_broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id"),
  subject: text("subject").notNull(),
  preview: text("preview"),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body").notNull(),
  audience: text("audience").notNull().default("newsletter"), // newsletter | agencies | ksa | custom
  status: text("status").notNull().default("draft"), // draft | approved | sending | sent | failed
  provider: text("provider"), // resend | smtp | manual
  providerMessageId: text("provider_message_id"),
  recipientsTotal: integer("recipients_total").default(0),
  recipientsSent: integer("recipients_sent").default(0),
  recipientsFailed: integer("recipients_failed").default(0),
  /** Sends are dry runs unless explicitly turned off, so a mistake costs nothing. */
  dryRun: boolean("dry_run").default(true),
  error: text("error"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type EmailBroadcastRow = typeof emailBroadcasts.$inferSelect;
export type EmailBroadcastInsert = typeof emailBroadcasts.$inferInsert;

/**
 * A public Reddit thread our existing knowledge genuinely answers.
 *
 * Discovery only. The crawler reads public JSON, scores how well we can help,
 * and records the community's own self-promotion rules alongside the draft, so
 * the human posting it knows whether a link is even allowed there. Being useful
 * in a thread is the goal; dropping links is how accounts get banned.
 */
export const redditOpportunities = pgTable("reddit_opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Reddit's own t3_ id. The dedupe key, so a re-crawl updates instead of piling up. */
  postId: text("post_id").notNull(),
  subreddit: text("subreddit").notNull(),
  title: text("title").notNull(),
  permalink: text("permalink").notNull(),
  author: text("author"),
  flair: text("flair"),
  postBody: text("post_body"),
  score: integer("score").default(0),
  numComments: integer("num_comments").default(0),
  createdUtc: timestamp("created_utc", { withTimezone: true }),
  /** 0..100: how well our published library actually answers this thread. */
  relevance: numeric("relevance", { precision: 6, scale: 3 }).default("0"),
  intent: text("intent"), // question | recommendation | complaint | showcase | other
  matchedTerms: text("matched_terms").array().default([]),
  /** Articles that already answer it, so the reply can link something real. */
  matchedArticleSlugs: text("matched_article_slugs").array().default([]),
  selfPromoAllowed: text("self_promo_allowed").default("unknown"), // yes | limited | no | unknown
  subredditRules: jsonb("subreddit_rules"),
  status: text("status").notNull().default("new"), // new | drafted | approved | posted | skipped
  draftReply: text("draft_reply"),
  /** True only when the draft was built from RAG/KB facts rather than generic prose. */
  draftGrounded: boolean("draft_grounded").default(false),
  postedUrl: text("posted_url"),
  skipReason: text("skip_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type RedditOpportunityRow = typeof redditOpportunities.$inferSelect;
export type RedditOpportunityInsert = typeof redditOpportunities.$inferInsert;

/**
 * An agency, studio, or builder we can genuinely help.
 *
 * `source` and `consentBasis` exist so there is always an answer to "why is it
 * lawful and reasonable to email this person". `personalNote` is the one true,
 * specific line about their actual work: it is what separates outreach from spam,
 * and it is filled by a human or from supplied research, never invented.
 */
export const outreachProspects = pgTable("outreach_prospects", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  name: text("name"),
  company: text("company"),
  role: text("role"),
  website: text("website"),
  country: text("country"),
  segment: text("segment").default("agency"), // agency | freelancer | saas | enterprise | wordpress
  /** Public signals about their stack, used to pick which asset to lead with. */
  stackSignals: text("stack_signals").array().default([]),
  painHypothesis: text("pain_hypothesis"),
  personalNote: text("personal_note"),
  source: text("source"),
  consentBasis: text("consent_basis").default("legitimate-interest"), // opt-in | legitimate-interest | customer
  status: text("status").notNull().default("new"), // new | queued | contacted | replied | won | lost | suppressed
  score: numeric("score", { precision: 6, scale: 3 }).default("0"),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  replyAt: timestamp("reply_at", { withTimezone: true }),
  notes: text("notes"),
  /**
   * v25 sequencing. Why the sequence stopped, so a follow-up can never fire at
   * somebody who has already answered: replied | bounced | unsubscribed |
   * complained | completed | manual. That is the automation's most likely
   * failure and also its most embarrassing one.
   */
  sequenceStoppedReason: text("sequence_stopped_reason"),
  nextTouchAt: timestamp("next_touch_at", { withTimezone: true }),
  touchesSent: integer("touches_sent").default(0),
  /**
   * v27 thread affinity. Which sending address owns this conversation.
   *
   * It lives on the person rather than only on the message because a follow-up
   * arriving from a different address than the first email is indistinguishable
   * from spam: it breaks threading in their mail client and reads as two strangers
   * writing about the same thing. Bound on first send and reused for the whole
   * conversation. If that inbox is later paused or out of budget the follow-up
   * WAITS rather than quietly going out from somewhere else.
   */
  inboxId: uuid("inbox_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type OutreachProspectRow = typeof outreachProspects.$inferSelect;
export type OutreachProspectInsert = typeof outreachProspects.$inferInsert;

/**
 * Every drafted and sent outreach message. The unique index on
 * (prospect_id, step) is the guard that makes "one honest ask, one follow-up,
 * then stop" structural rather than a good intention.
 */
export const outreachMessages = pgTable("outreach_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  prospectId: uuid("prospect_id").notNull(),
  step: integer("step").notNull().default(1), // 1 = first touch, 2 = single follow-up
  subject: text("subject").notNull(),
  bodyText: text("body_text").notNull(),
  bodyHtml: text("body_html"),
  /** The asset we lead with. Outreach that leads with an ask gets deleted. */
  assetUrl: text("asset_url"),
  status: text("status").notNull().default("draft"), // draft | approved | sent | failed | skipped
  dryRun: boolean("dry_run").default(true),
  provider: text("provider"),
  providerMessageId: text("provider_message_id"),
  error: text("error"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  /**
   * v25 sequencing. `sendAfter` is the earliest moment this message may go, which
   * is what makes a timed follow-up possible at all. Kept on this table rather
   * than a new one so the (prospect_id, step) unique index continues to guard
   * against double-sends.
   */
  sendAfter: timestamp("send_after", { withTimezone: true }),
  campaign: text("campaign").default("agency"), // agency | link_building
  linkProspectId: uuid("link_prospect_id"),
  /**
   * v26. Set when a person edits the wording. The automation checks this before
   * re-drafting, so a human's edit is never silently overwritten by a later run.
   */
  editedByHuman: boolean("edited_by_human").default(false),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  /**
   * v27. Which address actually sent this. The prospect's inboxId says what SHOULD
   * be used; this records what WAS used. They can only disagree after a manual
   * reassignment, and when that happens the history has to show it.
   */
  inboxId: uuid("inbox_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type OutreachMessageRow = typeof outreachMessages.$inferSelect;
export type OutreachMessageInsert = typeof outreachMessages.$inferInsert;

/**
 * Unsubscribes, bounces, complaints, and manual do-not-contact, checked before
 * every single send. Domain rows let one complaint cover a whole company, which
 * is the polite reading of a complaint.
 */
export const outreachSuppressions = pgTable("outreach_suppressions", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"),
  domain: text("domain"),
  reason: text("reason").notNull().default("unsubscribe"), // unsubscribe | bounce | complaint | manual
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type OutreachSuppressionRow = typeof outreachSuppressions.$inferSelect;
export type OutreachSuppressionInsert = typeof outreachSuppressions.$inferInsert;

// ============================================================================
// TREND RADAR + COMMUNITY VENUES — the two discovery crawlers.
//
// Timeliness is the only structural advantage a small publisher has over an
// established one: nobody can out-authority a big site on an evergreen term, but
// anyone can be the clearest explanation of something that broke this morning.
// `trendItems` is that radar. `communityVenues` answers the neighbouring
// question of WHERE to show up, discovered rather than assumed.
//
// Both are read-only discovery. Neither posts anything anywhere.
// ============================================================================

/**
 * Something getting attention right now, scored for whether we can add anything
 * true to it. `relevance` deliberately outweighs raw popularity: chasing viral
 * topics we have no standing in produces content nobody trusts and dilutes the
 * topical authority the library has been built to earn.
 */
export const trendItems = pgTable("trend_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(), // hackernews | reddit | devto | lobsters | github
  sourceId: text("source_id").notNull(),
  url: text("url"),
  /** Where the conversation is, which is often not the artefact itself. */
  discussionUrl: text("discussion_url"),
  title: text("title").notNull(),
  summary: text("summary"),
  author: text("author"),
  tags: text("tags").array().default([]),
  /** Real engagement numbers as reported by the source. Never estimated. */
  points: integer("points").default(0),
  comments: integer("comments").default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  /** Engagement per hour since publish: how a 4-hour-old story beats a 3-day-old one. */
  velocity: numeric("velocity", { precision: 10, scale: 3 }).default("0"),
  relevance: numeric("relevance", { precision: 6, scale: 3 }).default("0"),
  /** Combined priority. What the shortlist sorts on. */
  heat: numeric("heat", { precision: 6, scale: 3 }).default("0"),
  clusterId: smallint("cluster_id"),
  matchedTerms: text("matched_terms").array().default([]),
  /** Articles we already have on this, so we extend instead of duplicating. */
  coveredBySlugs: text("covered_by_slugs").array().default([]),
  /** The specific thing we could say. Null when we have nothing to add. */
  angle: text("angle"),
  angleKind: text("angle_kind"), // explainer | counterpoint | how-to | teardown | none
  status: text("status").notNull().default("new"), // new | shortlisted | briefed | written | skipped
  skipReason: text("skip_reason"),
  articleId: uuid("article_id"),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type TrendItemRow = typeof trendItems.$inferSelect;
export type TrendItemInsert = typeof trendItems.$inferInsert;

/**
 * A community we could post in, with its own rules attached and a plain
 * recommendation. "participate" is a first-class outcome, not a failure: the
 * communities where self-promotion is banned are often the ones where being
 * genuinely useful pays off most, and the recommendation says so explicitly.
 */
export const communityVenues = pgTable("community_venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull().default("reddit"),
  name: text("name").notNull(),
  url: text("url"),
  title: text("title"),
  description: text("description"),
  subscribers: integer("subscribers").default(0),
  activeUsers: integer("active_users").default(0),
  over18: boolean("over_18").default(false),
  createdUtc: timestamp("created_utc", { withTimezone: true }),
  selfPromoAllowed: text("self_promo_allowed").default("unknown"), // yes | limited | no | unknown
  rules: jsonb("rules"),
  submissionNotes: text("submission_notes"),
  topicalFit: numeric("topical_fit", { precision: 6, scale: 3 }).default("0"),
  matchedTerms: text("matched_terms").array().default([]),
  opportunity: numeric("opportunity", { precision: 6, scale: 3 }).default("0"),
  recommendation: text("recommendation").default("watch"), // post | participate | watch | avoid
  reasoning: text("reasoning"),
  status: text("status").notNull().default("new"), // new | approved | active | rejected
  notes: text("notes"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type CommunityVenueRow = typeof communityVenues.$inferSelect;
export type CommunityVenueInsert = typeof communityVenues.$inferInsert;

/**
 * LINK OUTREACH (v25) — mirrors the v25 block in
 * database/migrations/002_patch_columns.sql.
 *
 * One row per linking DOMAIN, built from the competitor backlink exports. It
 * stays separate from outreachProspects because the identity differs (a domain
 * that publishes about this category, versus a person we might sell to) and so
 * does the ask. The two join at `prospectId`: the moment a contact address is
 * found, the send itself goes through the existing, already-vetted outreach path
 * instead of a parallel one.
 */
export const linkProspects = pgTable("link_prospects", {
  id: uuid("id").primaryKey().defaultRandom(),
  domain: text("domain").notNull(),
  homepageUrl: text("homepage_url"),
  // Straight from SEMrush. Deliberately not treated as "higher is better": the
  // top of this range is google.com and medium.com, which cannot be pitched.
  authority: integer("authority").default(0),
  refdomainBacklinks: bigint("refdomain_backlinks", { mode: "number" }).default(0),
  country: text("country"),
  ipAddress: text("ip_address"),
  linksTo: text("links_to").array().default([]),
  rivalCount: integer("rival_count").default(0),
  linkCount: integer("link_count").default(0),
  bestSourceUrl: text("best_source_url"),
  bestSourceTitle: text("best_source_title"),
  bestAnchor: text("best_anchor"),
  bestTargetUrl: text("best_target_url"),
  firstSeen: text("first_seen"),
  lastSeen: text("last_seen"),
  hasLostLink: boolean("has_lost_link").default(false),
  // editorial | directory | platform | corporate | academic | press_release
  // | search_engine | registry | stats_farm | competitor | parked | unknown
  domainClass: text("domain_class").default("unknown"),
  // listicle | resource_page | editorial_mention | guest_post | broken_link
  // | directory_listing | none
  opportunityType: text("opportunity_type").default("unknown"),
  rejectReason: text("reject_reason"),
  isLive: boolean("is_live"),
  language: text("language"),
  acceptsGuestPosts: boolean("accepts_guest_posts"),
  guidelinesUrl: text("guidelines_url"),
  contactPageUrl: text("contact_page_url"),
  vettedAt: timestamp("vetted_at", { withTimezone: true }),
  contactEmail: text("contact_email"),
  contactName: text("contact_name"),
  contactSource: text("contact_source"),
  contactConfidence: numeric("contact_confidence", { precision: 4, scale: 3 }).default("0"),
  ourTargetSlug: text("our_target_slug"),
  pitchAngle: text("pitch_angle"),
  valueScore: numeric("value_score", { precision: 6, scale: 3 }).default("0"),
  spamScore: numeric("spam_score", { precision: 6, scale: 3 }).default("0"),
  /**
   * v26 outcome tracking. `linkFound` is null until the page has been checked, so
   * "not checked yet" stays distinguishable from "checked and no link", which are
   * very different states to a person working the list.
   */
  linkFound: boolean("link_found"),
  linkFoundAt: timestamp("link_found_at", { withTimezone: true }),
  linkLostAt: timestamp("link_lost_at", { withTimezone: true }),
  linkIsFollowed: boolean("link_is_followed"),
  linkAnchor: text("link_anchor"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  checkCount: integer("check_count").default(0),
  /** A named push, so several efforts can be measured separately. */
  campaignName: text("campaign_name"),
  /**
   * v27. Which recipe found this row, and which run of it. Without this, a
   * per-recipe reply and link rate cannot be measured, and that measurement is the
   * point: the pipeline should be steered by which recipe earns links rather than
   * by which one is most satisfying to run.
   */
  sourceRecipe: text("source_recipe"),
  recipeRunId: uuid("recipe_run_id"),
  /**
   * Evidence that does not fit the backlink-shaped columns: the show and host for a
   * podcast, which product was reviewed and when for a review. One jsonb rather
   * than five nullable columns per recipe, so adding a sixth recipe later needs no
   * migration.
   */
  recipeEvidence: jsonb("recipe_evidence"),
  // new | rejected | needs_contact | ready | queued | contacted | replied
  // | won | lost | suppressed
  status: text("status").notNull().default("new"),
  prospectId: uuid("prospect_id"),
  wonUrl: text("won_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type LinkProspectRow = typeof linkProspects.$inferSelect;
export type LinkProspectInsert = typeof linkProspects.$inferInsert;

/**
 * Inbound mail. There was no inbound path at all before v25, which made
 * automatic follow-ups unsafe by construction: nothing could tell the sequence
 * that somebody had already answered.
 */
export const outreachReplies = pgTable("outreach_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  prospectId: uuid("prospect_id"),
  messageId: uuid("message_id"),
  fromEmail: text("from_email").notNull(),
  subject: text("subject"),
  snippet: text("snippet"),
  providerMessageId: text("provider_message_id"),
  // interested | not_interested | unsubscribe | bounce | auto_reply
  // | complaint | question | unknown
  classification: text("classification").notNull().default("unknown"),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).default("0"),
  isAutomated: boolean("is_automated").default(false),
  handled: boolean("handled").default(false),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type OutreachReplyRow = typeof outreachReplies.$inferSelect;
export type OutreachReplyInsert = typeof outreachReplies.$inferInsert;

/**
 * LINK OUTREACH, PART 2 (v26) — mirrors the v26 block in
 * database/migrations/002_patch_columns.sql.
 *
 * One row per CHECK rather than one per prospect, deliberately. A link that
 * appeared and then vanished is a completely different situation from one that
 * never appeared, and only a history can tell them apart. Rolled-up fields live on
 * linkProspects so the list can be sorted and filtered without a join.
 */
export const linkChecks = pgTable("link_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkProspectId: uuid("link_prospect_id").notNull(),
  checkedUrl: text("checked_url").notNull(),
  httpStatus: integer("http_status"),
  found: boolean("found").notNull().default(false),
  foundUrl: text("found_url"),
  anchorText: text("anchor_text"),
  /** nofollow / sponsored / ugc exactly as published, not as we hoped. */
  relAttributes: text("rel_attributes"),
  isFollowed: boolean("is_followed"),
  linkCount: integer("link_count").default(0),
  notes: text("notes"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
});
export type LinkCheckRow = typeof linkChecks.$inferSelect;
export type LinkCheckInsert = typeof linkChecks.$inferInsert;

/**
 * Audit trail for every action, human or automatic.
 *
 * This is what makes a bulk action reviewable. Approving forty pitches in one
 * click is only defensible if it can be read back afterwards, one row per
 * prospect, with who did it and when.
 */
export const outreachActivity = pgTable("outreach_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkProspectId: uuid("link_prospect_id"),
  prospectId: uuid("prospect_id"),
  messageId: uuid("message_id"),
  // approved | skipped | edited | contact_changed | sent | note | stage_changed
  // | verified | link_found | link_lost | rejected | bulk_approved | reopened
  action: text("action").notNull(),
  actor: text("actor").notNull().default("human"), // human | automation
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type OutreachActivityRow = typeof outreachActivity.$inferSelect;
export type OutreachActivityInsert = typeof outreachActivity.$inferInsert;

/* -------------------------------------------------------------------------- *
 * v27 — prospecting recipes and multi-inbox sending
 * -------------------------------------------------------------------------- */

/**
 * One row per run of a prospecting recipe.
 *
 * Kept rather than thrown away because a run needs to be repeatable without
 * retyping the input, a disappointing run has to be distinguishable from a broken
 * one, and a search-API bill is only auditable if the query count was recorded at
 * the time rather than estimated afterwards.
 */
export const recipeRuns = pgTable("recipe_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  // skyscraper | product_review | guest_post | podcast | resource_page
  recipe: text("recipe").notNull(),
  /** Verbatim, so the run can be repeated exactly. */
  inputText: text("input_text").notNull(),
  inputJson: jsonb("input_json").default({}),
  campaignName: text("campaign_name"),
  status: text("status").notNull().default("queued"), // queued | running | done | failed
  found: integer("found").notNull().default(0),
  /** Always <= found. The gap is duplicates plus rejects, and it is the useful number. */
  stored: integer("stored").notNull().default(0),
  duplicates: integer("duplicates").notNull().default(0),
  rejected: integer("rejected").notNull().default(0),
  /** Search queries issued: the honest measure of what the run cost. */
  queriesUsed: integer("queries_used").notNull().default(0),
  readout: text("readout"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type RecipeRunRow = typeof recipeRuns.$inferSelect;
export type RecipeRunInsert = typeof recipeRuns.$inferInsert;

/**
 * A sending address.
 *
 * NO SECRET IS STORED HERE. `credentialRef` is the NAME of an environment-variable
 * prefix, and the sender resolves the real key or password from the environment at
 * the moment it sends. A password column would turn any routine database dump into
 * a leak of every mailbox credential at once, and the convenience of storing it is
 * not worth that trade.
 *
 * Nor is "sent today" stored here. It is counted from outreach_messages, because a
 * denormalised counter drifts, and a drifted counter is worse than no limit: it
 * still reads as a working one.
 */
export const outreachInboxes = pgTable("outreach_inboxes", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  replyTo: text("reply_to"),
  /** resend | smtp | default. 'default' reuses the global provider settings. */
  provider: text("provider").notNull().default("default"),
  credentialRef: text("credential_ref"),
  /** This address's own ceiling, always under the global cap and never above it. */
  dailyCap: integer("daily_cap").notNull().default(20),
  /** A new address on an old domain still has to earn its volume. */
  warmupStartedAt: timestamp("warmup_started_at", { withTimezone: true }),
  status: text("status").notNull().default("active"), // active | paused
  pausedReason: text("paused_reason"),
  bounces: integer("bounces").notNull().default(0),
  complaints: integer("complaints").notNull().default(0),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type OutreachInboxRow = typeof outreachInboxes.$inferSelect;
export type OutreachInboxInsert = typeof outreachInboxes.$inferInsert;

/**
 * SOCIAL PUBLISHING — connected channels + a scheduled/published post queue.
 *
 * A channel is one destination (LinkedIn, X, Facebook, Instagram, a Mastodon
 * account, or a generic webhook). "webhook" mode posts to an automation URL you
 * control (n8n / Zapier / Make / Buffer) that fans out to the real account, so
 * we can auto-publish without building each platform's OAuth. Native "api" mode
 * is reserved for direct integrations added later.
 */
export const socialChannels = pgTable("social_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull(), // linkedin | x | facebook | instagram | threads | mastodon | webhook
  label: text("label").notNull(),
  mode: text("mode").notNull().default("webhook"), // webhook | api
  webhookUrl: text("webhook_url"),
  apiToken: text("api_token"),
  meta: jsonb("meta"), // e.g. { pageId, accountId, handle }
  persona: text("persona"), // voice for this account, e.g. "CEO — founder POV, first person"
  enabled: boolean("enabled").notNull().default(true),
  lastOkAt: timestamp("last_ok_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const socialPosts = pgTable("social_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  body: text("body").notNull(),
  link: text("link"),
  imageUrl: text("image_url"),
  channelIds: text("channel_ids").array().default([]),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  status: text("status").notNull().default("draft"), // draft | scheduled | publishing | posted | partial | failed | canceled
  results: jsonb("results"), // per-channel: { channelId, platform, ok, dryRun, error, at }
  source: text("source").default("manual"), // manual | command | article
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  postedAt: timestamp("posted_at", { withTimezone: true }),
});

export type SocialChannelRow = typeof socialChannels.$inferSelect;
export type SocialPostRow = typeof socialPosts.$inferSelect;

// ============================================================================
// CRM + PROMPT-TO-EMAIL ("vibe emailing") — v1.8
//
// Three tables that turn "one prompt" into "an email in your customers' inboxes",
// with the same safety posture as the rest of the send layer: nothing goes out
// unless it is explicitly armed, every recipient is checked against suppression
// at send time, and a body without an unsubscribe line is refused upstream.
//
//   contacts        — the customer list, uploaded by an admin from CSV. Each row
//                     carries a lifecycle STATUS (paying / abandoned / registered)
//                     which is what the segments filter on.
//   email_senders   — the "attach an email account" store: a Resend or Brevo key,
//                     or raw SMTP (Gmail app-password, or any host). This is an
//                     internal admin tool, so credentials live here rather than in
//                     env; treat the DB as sensitive.
//   email_campaigns — one prompt-driven broadcast to one segment, with real
//                     delivery state and the prompt that produced it, so a send
//                     can always be read back.
// ============================================================================

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  name: text("name"),
  company: text("company"),
  /** paying | abandoned | registered | lead | unknown — what the segments filter on. */
  status: text("status").notNull().default("unknown"),
  tags: text("tags").array().default([]),
  source: text("source").default("csv"), // csv | manual | api
  /** Any extra CSV columns we did not map, kept verbatim so nothing is lost. */
  meta: jsonb("meta"),
  /** False after an unsubscribe/bounce. Segments only ever send to subscribed rows. */
  subscribed: boolean("subscribed").notNull().default(true),
  lastEmailedAt: timestamp("last_emailed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type ContactRow = typeof contacts.$inferSelect;
export type ContactInsert = typeof contacts.$inferInsert;

export const emailSenders = pgTable("email_senders", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(), // "CEO Gmail", "Brevo marketing", ...
  provider: text("provider").notNull().default("smtp"), // resend | brevo | smtp
  fromName: text("from_name"),
  fromEmail: text("from_email").notNull(),
  replyTo: text("reply_to"),
  /** Resend or Brevo API key. Null for pure SMTP. */
  apiKey: text("api_key"),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port").default(587),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  smtpSecure: boolean("smtp_secure").default(false),
  dailyCap: integer("daily_cap").default(200),
  enabled: boolean("enabled").notNull().default(true),
  lastOkAt: timestamp("last_ok_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type EmailSenderRow = typeof emailSenders.$inferSelect;
export type EmailSenderInsert = typeof emailSenders.$inferInsert;

export const emailCampaigns = pgTable("email_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body").notNull(),
  /** all | paying | abandoned | registered | lead */
  segment: text("segment").notNull().default("all"),
  senderId: uuid("sender_id"),
  status: text("status").notNull().default("draft"), // draft | sending | sent | failed
  /** The one-line brief that produced this email. */
  prompt: text("prompt"),
  source: text("source").default("prompt"), // prompt | manual
  recipientsTotal: integer("recipients_total").default(0),
  recipientsSent: integer("recipients_sent").default(0),
  recipientsFailed: integer("recipients_failed").default(0),
  /** Sends are dry runs unless explicitly armed, so a mistake costs nothing. */
  dryRun: boolean("dry_run").default(true),
  stats: jsonb("stats"),
  error: text("error"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type EmailCampaignRow = typeof emailCampaigns.$inferSelect;
export type EmailCampaignInsert = typeof emailCampaigns.$inferInsert;
