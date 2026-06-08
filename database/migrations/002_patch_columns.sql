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
