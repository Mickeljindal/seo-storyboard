-- Safe patch for DBs created before full schema (or partial 001 runs)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cluster_id smallint;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cluster_name text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS anchor text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS idea_index integer;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS performance_data jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_draft text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS engine_source text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS entities text[] DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS faq jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ai_overview jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS schema_jsonld jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS internal_link_targets text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_articles_cluster ON articles(cluster_id);
CREATE INDEX IF NOT EXISTS idx_articles_anchor ON articles(anchor);

-- Content Quality Engine (v2): rendered HTML + scorecard
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_html text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS quality_score smallint;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS quality_report jsonb;

-- Topical authority + demand gate + lifecycle + self-learning (v3)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS silo_role text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS hub_article_id uuid;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS demand_score smallint;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS demand_validated text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Freshness / decay management (v10)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS next_review_at timestamptz;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_articles_next_review ON articles(next_review_at);

CREATE TABLE IF NOT EXISTS topic_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid,
  keyword text,
  cluster_id smallint,
  geo text,
  intent text,
  demand_score smallint,
  quality_score smallint,
  event text NOT NULL,
  reward numeric(6,3),
  features jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_topic_signals_cluster ON topic_signals(cluster_id);
CREATE INDEX IF NOT EXISTS idx_topic_signals_event ON topic_signals(event);

-- Own analytics: real Google Search Console performance per URL (v4)
CREATE TABLE IF NOT EXISTS search_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid,
  page text NOT NULL,
  top_query text,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  ctr numeric(6,4),
  position numeric(6,2),
  date_start text,
  date_end text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_perf_page_window
  ON search_performance(page, date_start, date_end);
CREATE INDEX IF NOT EXISTS idx_search_perf_article ON search_performance(article_id);

-- Tool pages: interactive free tools published as Elementor WordPress Pages (v5)
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url_slug text,
  target_keyword text,
  secondary_keywords text[] DEFAULT '{}',
  category text DEFAULT 'Developer Tools',
  geo_target text DEFAULT 'global',
  status text NOT NULL DEFAULT 'idea',
  origin text DEFAULT 'discovered',
  wp_post_id integer,
  published_url text,
  meta_title text,
  meta_description text,
  tool_html text,
  seo_content jsonb,
  schema_jsonld jsonb,
  elementor_data jsonb,
  idea_data jsonb,
  volume integer,
  difficulty smallint,
  demand_score smallint,
  quality_score smallint,
  quality_report jsonb,
  aioseo_score_before smallint,
  aioseo_score_after smallint,
  audit_report jsonb,
  notes text,
  engine_source text,
  published_at timestamptz,
  optimized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_wp_post ON tools(wp_post_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tools_slug ON tools(url_slug) WHERE url_slug IS NOT NULL;

-- Signup gate columns (added after initial tools table)
ALTER TABLE tools ADD COLUMN IF NOT EXISTS gate_enabled text;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS gate_mode text;

-- Tool outcome loop (v7): real performance + conversions
ALTER TABLE tools ADD COLUMN IF NOT EXISTS gsc_clicks integer;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS gsc_impressions integer;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS gsc_position numeric(6,2);
ALTER TABLE tools ADD COLUMN IF NOT EXISTS gate_clicks integer;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS perf_synced_at timestamptz;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS elementor_snapshot jsonb;

-- Self-learning knowledge graph (v6)
CREATE TABLE IF NOT EXISTS kg_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  node_key text NOT NULL,
  label text NOT NULL,
  description text,
  data jsonb,
  weight numeric(8,3) DEFAULT 1,
  reward numeric(8,3) DEFAULT 0,
  mentions integer DEFAULT 0,
  cluster_id smallint,
  geo text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_nodes_type_key ON kg_nodes(type, node_key);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_weight ON kg_nodes(weight);

CREATE TABLE IF NOT EXISTS kg_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  target_id uuid NOT NULL,
  relation text NOT NULL,
  weight numeric(8,3) DEFAULT 1,
  mentions integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_edges_triple ON kg_edges(source_id, target_id, relation);

-- Reels studio (v6)
CREATE TABLE IF NOT EXISTS reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  topic text,
  format text NOT NULL DEFAULT 'explainer',
  status text NOT NULL DEFAULT 'idea',
  hook text,
  hook_variations text[] DEFAULT '{}',
  script jsonb,
  voiceover text,
  caption text,
  hashtags text[] DEFAULT '{}',
  cta text,
  duration_seconds integer DEFAULT 45,
  platform_prompts jsonb,
  cluster_id smallint,
  demand_score smallint,
  idea_data jsonb,
  notes text,
  engine_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reels_status ON reels(status);
CREATE INDEX IF NOT EXISTS idx_reels_format ON reels(format);

-- Durable job queue (v8)
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  payload jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  result jsonb,
  error text,
  label text,
  run_after timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_run_after ON jobs(run_after);

-- Multi-engine AI citation tracking (v9) — is Kloudbean cited in AI answers?
CREATE TABLE IF NOT EXISTS citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  engine text NOT NULL,                 -- perplexity | gemini | openai
  geo text DEFAULT 'global',
  cluster_id smallint,
  article_id uuid,
  mentioned boolean DEFAULT false,      -- Kloudbean named in the answer text
  cited boolean DEFAULT false,          -- a Kloudbean URL appears in sources
  position smallint,                    -- rank among cited sources (1 = first)
  cited_url text,
  competitors text[] DEFAULT '{}',
  answer_excerpt text,
  sources jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_citations_engine ON citations(engine);
CREATE INDEX IF NOT EXISTS idx_citations_cluster ON citations(cluster_id);
CREATE INDEX IF NOT EXISTS idx_citations_created ON citations(created_at);

-- Entity Distribution tracker (v11) — off-site mentions/listings as tasks
CREATE TABLE IF NOT EXISTS entity_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  asset_type text DEFAULT 'listing',     -- listing | profile | review | mention | wiki
  name text NOT NULL,
  url text,
  status text NOT NULL DEFAULT 'todo',   -- todo | in_progress | live | verified
  priority smallint DEFAULT 2,           -- 1 high, 2 med, 3 low
  name_consistent boolean,               -- null = unchecked
  notes text,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entity_assets_status ON entity_assets(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_assets_platform_name
  ON entity_assets(platform, name);

-- Conversion attribution (v12) — tie traffic -> console signups/revenue
CREATE TABLE IF NOT EXISTS conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL DEFAULT 'signup',  -- signup | paid | lead | view
  source_url text,
  source_slug text,
  surface text DEFAULT 'unknown',        -- tool | article | unknown
  article_id uuid,
  tool_id uuid,
  cluster_id smallint,
  ref text,
  plan text,
  value numeric(10,2),
  currency text DEFAULT 'USD',
  external_id text,                      -- dedupe key from console
  meta jsonb,
  occurred_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversions_event ON conversions(event);
CREATE INDEX IF NOT EXISTS idx_conversions_slug ON conversions(source_slug);
CREATE INDEX IF NOT EXISTS idx_conversions_cluster ON conversions(cluster_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversions_external
  ON conversions(external_id) WHERE external_id IS NOT NULL;

-- Dashboard-managed integration settings (v13) — e.g. Google Search Console
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Before/after optimization report per tool page (v14)
ALTER TABLE tools ADD COLUMN IF NOT EXISTS optimize_report jsonb;

-- ============================================================================
-- KLOUDGRAPH — competitor SEO intelligence warehouse (Semrush import seed)
-- All fact tables carry snapshot_date so history accumulates over time.
-- ============================================================================

-- Competitor registry (the domains we track, tiered)
CREATE TABLE IF NOT EXISTS kg_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  name text,
  tier smallint DEFAULT 1,
  category text,
  tracked boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Organic rankings (from the Positions export) — every keyword a domain ranks for
CREATE TABLE IF NOT EXISTS kg_organic_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain text NOT NULL,
  keyword text NOT NULL,
  position integer,
  previous_position integer,
  volume integer,
  difficulty smallint,
  cpc numeric(10,2),
  url text,
  traffic integer,
  traffic_pct numeric(8,4),
  traffic_cost numeric(14,2),
  intents text,
  serp_features text,
  results bigint,
  snapshot_date date,
  raw jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kg_rankings_domain ON kg_organic_rankings(competitor_domain);
CREATE INDEX IF NOT EXISTS idx_kg_rankings_keyword ON kg_organic_rankings(keyword);

-- Keyword gap (competitor vs kloudbean) — the opportunity engine
CREATE TABLE IF NOT EXISTS kg_keyword_gap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain text NOT NULL,
  keyword text NOT NULL,
  intents text,
  volume integer,
  difficulty smallint,
  cpc numeric(10,2),
  competition_density numeric(6,4),
  competitor_position integer,
  our_position integer,
  competitor_url text,
  our_url text,
  results bigint,
  snapshot_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kg_gap_domain ON kg_keyword_gap(competitor_domain);
CREATE INDEX IF NOT EXISTS idx_kg_gap_keyword ON kg_keyword_gap(keyword);

-- Organic competitors (from the Competitors export) — feeds long-tail discovery
CREATE TABLE IF NOT EXISTS kg_organic_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  for_domain text NOT NULL,
  competitor_domain text NOT NULL,
  relevance numeric(6,4),
  common_keywords bigint,
  organic_keywords bigint,
  organic_traffic numeric,
  organic_cost numeric(16,2),
  adwords_keywords bigint,
  snapshot_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kg_orgcomp_for ON kg_organic_competitors(for_domain);
-- Widen count columns for giant domains (aggregate keyword counts exceed int32).
ALTER TABLE kg_organic_competitors ALTER COLUMN common_keywords TYPE bigint;
ALTER TABLE kg_organic_competitors ALTER COLUMN organic_keywords TYPE bigint;
ALTER TABLE kg_organic_competitors ALTER COLUMN organic_traffic TYPE numeric;
ALTER TABLE kg_organic_competitors ALTER COLUMN organic_cost TYPE numeric(16,2);
ALTER TABLE kg_organic_competitors ALTER COLUMN adwords_keywords TYPE bigint;

-- Subdomains (from the Subdomains export)
CREATE TABLE IF NOT EXISTS kg_subdomains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain text NOT NULL,
  subdomain_url text NOT NULL,
  traffic integer,
  traffic_pct numeric(8,4),
  keywords integer,
  snapshot_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kg_subdomains_domain ON kg_subdomains(competitor_domain);

-- Backlinks (full link list)
CREATE TABLE IF NOT EXISTS kg_backlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain text NOT NULL,
  page_ascore smallint,
  source_title text,
  source_url text,
  target_url text,
  anchor text,
  external_links integer,
  internal_links integer,
  nofollow boolean,
  sponsored boolean,
  ugc boolean,
  is_text boolean,
  is_frame boolean,
  is_form boolean,
  is_image boolean,
  sitewide boolean,
  first_seen date,
  last_seen date,
  new_link boolean,
  lost_link boolean,
  snapshot_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kg_backlinks_domain ON kg_backlinks(competitor_domain);

-- Backlink anchors (anchor-text profile)
CREATE TABLE IF NOT EXISTS kg_backlink_anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain text NOT NULL,
  anchor text,
  domains integer,
  backlinks bigint,
  first_seen date,
  last_seen date,
  snapshot_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kg_anchors_domain ON kg_backlink_anchors(competitor_domain);

-- Backlink pages (most-linked pages)
CREATE TABLE IF NOT EXISTS kg_backlink_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain text NOT NULL,
  source_url text,
  source_title text,
  response_code integer,
  backlinks bigint,
  domains integer,
  external_links integer,
  internal_links integer,
  last_seen date,
  snapshot_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kg_blpages_domain ON kg_backlink_pages(competitor_domain);

-- Referring domains (ready for the export you'll add next)
CREATE TABLE IF NOT EXISTS kg_referring_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain text NOT NULL,
  referring_domain text,
  domain_ascore smallint,
  backlinks bigint,
  first_seen date,
  last_seen date,
  snapshot_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kg_refdomains_domain ON kg_referring_domains(competitor_domain);

-- Import log (so re-running an import never duplicates rows)
CREATE TABLE IF NOT EXISTS kg_import_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_domain text,
  file_name text NOT NULL,
  report_type text,
  rows_imported integer DEFAULT 0,
  file_hash text,
  imported_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kg_importlog_file ON kg_import_log(file_name);

-- ============================================================================
-- EXPERIENCE ENGINE (v15) — real operational lessons (E-E-A-T) that get woven
-- into articles instead of generic AI explanation. Curated once, reused often.
-- ============================================================================
CREATE TABLE IF NOT EXISTS experience_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  -- lesson | mistake | migration | incident | benchmark
  kind text NOT NULL DEFAULT 'lesson',
  body text NOT NULL,
  -- topics/entities this snippet is relevant to (matched against article title/keyword)
  tags text[] DEFAULT '{}',
  cluster_id smallint,
  -- how many times it's been used in an article (helps rotate variety)
  usage_count integer DEFAULT 0,
  source text DEFAULT 'manual', -- manual | support_ticket | postmortem
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_experience_tags ON experience_snippets USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_experience_cluster ON experience_snippets(cluster_id);
CREATE INDEX IF NOT EXISTS idx_experience_active ON experience_snippets(active);

-- ============================================================================
-- DISTRIBUTION ENGINE (v16) — auto-drafted social/newsletter posts per article
-- ============================================================================
CREATE TABLE IF NOT EXISTS distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  -- linkedin | x_thread | newsletter
  channel text NOT NULL,
  content jsonb NOT NULL,       -- shape depends on channel (see distribution-engine.ts)
  status text NOT NULL DEFAULT 'draft', -- draft | approved | posted
  posted_url text,
  posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_distributions_article ON distributions(article_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_distributions_article_channel
  ON distributions(article_id, channel);

-- ============================================================================
-- PRE-PUBLISH REVIEW QUEUE (v17) — nothing goes to WordPress without a visible
-- holding period in the dashboard first. Autopilot queues finished articles
-- here instead of publishing immediately; a human (or an auto-approve timer)
-- releases them.
-- ============================================================================
ALTER TABLE articles ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'none';
-- none | queued | approved | rejected | published
ALTER TABLE articles ADD COLUMN IF NOT EXISTS queued_at timestamptz;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS rejected_reason text;
CREATE INDEX IF NOT EXISTS idx_articles_approval_status ON articles(approval_status);
CREATE INDEX IF NOT EXISTS idx_articles_scheduled_publish ON articles(scheduled_publish_at);

-- ============================================================================
-- SITE-WIDE AUTO INTERNAL LINKING (v18) — the engine previously could only
-- link content IT authored (the `articles` table). This mirrors the FULL
-- live WordPress site (any origin — manually written pages included) so link
-- opportunities can be found and applied across everything that exists.
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_post_id integer NOT NULL,
  post_type text NOT NULL DEFAULT 'post', -- post | page
  title text NOT NULL,
  slug text,
  published_url text,
  status text DEFAULT 'publish',
  excerpt text,
  content_text text,          -- plain-text extract (stripped tags), truncated
  word_count integer DEFAULT 0,
  cluster_id smallint,         -- best-guess topical cluster (relevance-scored)
  outbound_link_count integer DEFAULT 0,
  inbound_link_count integer DEFAULT 0,
  modified_at timestamptz,
  last_scanned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_pages_wp_post ON site_pages(wp_post_id);
CREATE INDEX IF NOT EXISTS idx_site_pages_cluster ON site_pages(cluster_id);
CREATE INDEX IF NOT EXISTS idx_site_pages_status ON site_pages(status);

CREATE TABLE IF NOT EXISTS link_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id uuid NOT NULL REFERENCES site_pages(id) ON DELETE CASCADE,
  target_page_id uuid NOT NULL REFERENCES site_pages(id) ON DELETE CASCADE,
  anchor_text text NOT NULL,
  score numeric(6,3) NOT NULL DEFAULT 0,
  reason text,                 -- human-readable "why this link makes sense"
  status text NOT NULL DEFAULT 'pending', -- pending | applied | rejected | skipped
  applied_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_status ON link_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_source ON link_suggestions(source_page_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_link_suggestions_pair
  ON link_suggestions(source_page_id, target_page_id);
