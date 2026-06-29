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
