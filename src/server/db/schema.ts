import {
  pgTable,
  uuid,
  text,
  smallint,
  integer,
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
