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
