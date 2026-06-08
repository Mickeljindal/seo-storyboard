import {
  pgTable,
  uuid,
  text,
  smallint,
  integer,
  numeric,
  timestamp,
  jsonb,
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
  articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
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

export type ArticleRow = typeof articles.$inferSelect;
export type ArticleInsert = typeof articles.$inferInsert;
