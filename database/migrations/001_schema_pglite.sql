-- PGlite-compatible schema (no extensions, no triggers)
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  target_keyword text,
  secondary_keywords text[] DEFAULT '{}',
  pillar smallint NOT NULL CHECK (pillar BETWEEN 1 AND 5),
  status text NOT NULL DEFAULT 'idea' CHECK (status IN (
    'idea','keyword_researched','brief_generated','writing','review','published','promoted'
  )),
  scheduled_week smallint CHECK (scheduled_week BETWEEN 1 AND 12),
  assignee_id uuid,
  word_count_target integer DEFAULT 2500,
  meta_title text,
  meta_description text,
  url_slug text,
  published_url text,
  brief jsonb,
  keyword_data jsonb,
  serp_data jsonb,
  performance_data jsonb,
  geo_target text DEFAULT 'sa',
  language text DEFAULT 'en',
  priority text DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  notes text,
  cluster_id smallint,
  cluster_name text,
  anchor text,
  idea_index integer,
  entities text[] DEFAULT '{}',
  faq jsonb,
  ai_overview jsonb,
  schema_jsonld jsonb,
  internal_link_targets text[] DEFAULT '{}',
  content_draft text,
  content_html text,
  quality_score smallint,
  quality_report jsonb,
  silo_role text,
  hub_article_id uuid,
  demand_score smallint,
  demand_validated text,
  published_at timestamptz,
  engine_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  geo_target text DEFAULT 'sa',
  monthly_volume integer,
  cpc numeric(10,2),
  difficulty smallint,
  serp_features text[] DEFAULT '{}',
  paa_questions text[] DEFAULT '{}',
  top_10_urls text[] DEFAULT '{}',
  trend_data jsonb,
  last_refreshed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(keyword, geo_target)
);

CREATE TABLE IF NOT EXISTS content_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  brief_data jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  generated_by text DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raffle_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_count integer NOT NULL,
  filters jsonb,
  picked_ids uuid[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS engine_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  geo text NOT NULL DEFAULT 'sa',
  config jsonb NOT NULL DEFAULT '{}',
  stats jsonb NOT NULL DEFAULT '{}',
  log jsonb NOT NULL DEFAULT '[]',
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_articles_pillar ON articles(pillar);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_scheduled_week ON articles(scheduled_week);
CREATE INDEX IF NOT EXISTS idx_articles_cluster ON articles(cluster_id);
CREATE INDEX IF NOT EXISTS idx_articles_geo ON articles(geo_target);
CREATE INDEX IF NOT EXISTS idx_content_briefs_article ON content_briefs(article_id);
CREATE INDEX IF NOT EXISTS idx_engine_runs_started ON engine_runs(started_at DESC);

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
