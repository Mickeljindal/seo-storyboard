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

-- Tools: live word count synced from WordPress (v19) — lets the dashboard
-- show what's actually in each page's content without opening it.
ALTER TABLE tools ADD COLUMN IF NOT EXISTS word_count integer;

-- Batch tracking on jobs (v20) — group jobs enqueued together so the
-- dashboard can show "X of Y complete" for a bulk action, not just an
-- aggregate pending/running/done/error count across everything.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS batch_id uuid;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS batch_label text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS finished_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_jobs_batch ON jobs(batch_id);

-- Process runs (v20) — live progress bar + scrollable log for any
-- long-running bulk operation (Semrush import, WP sync, idea discovery,
-- KG rebuild, etc).
CREATE TABLE IF NOT EXISTS process_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'running', -- running | done | error | cancelled
  total integer DEFAULT 0,
  completed integer DEFAULT 0,
  failed integer DEFAULT 0,
  logs jsonb DEFAULT '[]',
  result jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_process_runs_status ON process_runs(status);
CREATE INDEX IF NOT EXISTS idx_process_runs_kind ON process_runs(kind);
CREATE INDEX IF NOT EXISTS idx_process_runs_started ON process_runs(started_at);


-- Activity Center (v21) — retry support for process_runs: remember the exact
-- input a run was started with (e.g. {root} for a Semrush import, {category,
-- maxPages,perPage} for a WP sync) so a failed/stuck run can be re-launched
-- with one click instead of asking the user to re-enter parameters.
ALTER TABLE process_runs ADD COLUMN IF NOT EXISTS input jsonb;

-- ============================================================================
-- KNOWLEDGE LAYER (v22) — enhance experience_snippets into typed, grounded
-- Knowledge Objects (KloudBean institutional memory; the content engine is
-- one consumer). Additive + idempotent. Plus a gap queue so missing knowledge
-- is logged, never fabricated.
-- ============================================================================
ALTER TABLE experience_snippets ADD COLUMN IF NOT EXISTS confidence text DEFAULT 'curated'; -- verified | curated | inferred
ALTER TABLE experience_snippets ADD COLUMN IF NOT EXISTS grounded boolean DEFAULT true;
ALTER TABLE experience_snippets ADD COLUMN IF NOT EXISTS source_ref text;
ALTER TABLE experience_snippets ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE experience_snippets ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE TABLE IF NOT EXISTS knowledge_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  needed_type text NOT NULL,
  note text,
  cluster_id smallint,
  geo text,
  status text NOT NULL DEFAULT 'open',      -- open | filled | wontfix
  hits integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_status ON knowledge_gaps(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_type ON knowledge_gaps(needed_type);
-- ============================================================================
-- GO-TO-MARKET LAYER (v23) — distribution, community listening, and outreach.
--
-- The engine could write and publish, but everything after publish was manual.
-- These tables carry the three jobs that follow a publish:
--   1. push the piece to every channel it belongs on (distributions, extended
--      with more channels + an email broadcast record that tracks real sends)
--   2. find public conversations our knowledge genuinely answers
--      (reddit_opportunities) — discovery only, a human always posts
--   3. run honest, asset-first outreach to agencies (outreach_*), with a
--      suppression list and per-day caps enforced in code
--
-- Deliberate design constraint: nothing here posts or emails on its own. Rows
-- are drafts plus state, and every send path is opt-in, capped, and logged.
-- Additive + idempotent, same as the rest of this file.
-- ============================================================================

-- --- Email broadcasts -------------------------------------------------------
-- One row per article-driven email send. Separate from `distributions` because a
-- broadcast has real delivery state (recipients, provider ids, failures) while a
-- distribution row is just copy waiting to be posted.
CREATE TABLE IF NOT EXISTS email_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid,
  subject text NOT NULL,
  preview text,
  html_body text NOT NULL,
  text_body text NOT NULL,
  audience text NOT NULL DEFAULT 'newsletter',   -- newsletter | agencies | ksa | custom
  status text NOT NULL DEFAULT 'draft',          -- draft | approved | sending | sent | failed
  provider text,                                 -- resend | smtp | manual
  provider_message_id text,
  recipients_total integer DEFAULT 0,
  recipients_sent integer DEFAULT 0,
  recipients_failed integer DEFAULT 0,
  dry_run boolean DEFAULT true,
  error text,
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_status ON email_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_email_broadcasts_article ON email_broadcasts(article_id);

-- --- Reddit opportunities ---------------------------------------------------
-- A public thread where our existing knowledge answers the actual question.
-- `subreddit_rules` and `self_promo_allowed` are stored per row because the
-- rules differ per community and are the difference between being useful and
-- being banned. `status` starts at 'new' and only a human moves it to 'posted'.
CREATE TABLE IF NOT EXISTS reddit_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id text NOT NULL,                         -- reddit t3_ id, dedupe key
  subreddit text NOT NULL,
  title text NOT NULL,
  permalink text NOT NULL,
  author text,
  flair text,
  post_body text,
  score integer DEFAULT 0,                       -- reddit upvotes
  num_comments integer DEFAULT 0,
  created_utc timestamptz,
  -- our scoring
  relevance numeric(6,3) DEFAULT 0,              -- 0..100 how well we can answer
  intent text,                                   -- question | recommendation | complaint | showcase | other
  matched_terms text[] DEFAULT '{}',
  matched_article_slugs text[] DEFAULT '{}',     -- articles that already answer it
  -- community rules, captured so a draft can respect them
  self_promo_allowed text DEFAULT 'unknown',     -- yes | limited | no | unknown
  subreddit_rules jsonb,
  -- the human-in-the-loop workflow
  status text NOT NULL DEFAULT 'new',            -- new | drafted | approved | posted | skipped
  draft_reply text,
  draft_grounded boolean DEFAULT false,          -- was the draft built from RAG/KB facts?
  posted_url text,
  skip_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reddit_opps_post ON reddit_opportunities(post_id);
CREATE INDEX IF NOT EXISTS idx_reddit_opps_status ON reddit_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_reddit_opps_relevance ON reddit_opportunities(relevance);
CREATE INDEX IF NOT EXISTS idx_reddit_opps_subreddit ON reddit_opportunities(subreddit);

-- --- Outreach prospects -----------------------------------------------------
-- Agencies and studios we can genuinely help. `consent_basis` and `source` are
-- required by convention (not null-checked in SQL so imports stay flexible) so
-- there is always an answer to "why is it lawful to email this person".
CREATE TABLE IF NOT EXISTS outreach_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  company text,
  role text,
  website text,
  country text,
  segment text DEFAULT 'agency',                 -- agency | freelancer | saas | enterprise | wordpress
  -- why we think they care, in their own public terms
  stack_signals text[] DEFAULT '{}',             -- e.g. {lovable, nextjs, wordpress}
  pain_hypothesis text,
  personal_note text,                            -- the one true, specific line
  -- lawful-basis bookkeeping
  source text,                                   -- where the address came from
  consent_basis text DEFAULT 'legitimate-interest', -- opt-in | legitimate-interest | customer
  -- pipeline
  status text NOT NULL DEFAULT 'new',            -- new | queued | contacted | replied | won | lost | suppressed
  score numeric(6,3) DEFAULT 0,
  last_contacted_at timestamptz,
  reply_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_prospects_email ON outreach_prospects(lower(email));
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_status ON outreach_prospects(status);
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_segment ON outreach_prospects(segment);

-- --- Outreach messages ------------------------------------------------------
-- Every drafted and sent message, so the sender can enforce "one honest ask",
-- respect a reply, and never contact the same person twice by accident.
CREATE TABLE IF NOT EXISTS outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL,
  step integer NOT NULL DEFAULT 1,               -- 1 = first touch, 2 = single follow-up
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text,
  asset_url text,                                -- the article/asset we lead with
  status text NOT NULL DEFAULT 'draft',          -- draft | approved | sent | failed | skipped
  dry_run boolean DEFAULT true,
  provider text,
  provider_message_id text,
  error text,
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_prospect ON outreach_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_status ON outreach_messages(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_messages_step ON outreach_messages(prospect_id, step);

-- --- Suppressions -----------------------------------------------------------
-- Unsubscribes, bounces, and manual do-not-contact. Checked before every send.
-- Domain-level rows let one complaint cover a whole company.
CREATE TABLE IF NOT EXISTS outreach_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  domain text,
  reason text NOT NULL DEFAULT 'unsubscribe',    -- unsubscribe | bounce | complaint | manual
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_suppressions_email ON outreach_suppressions(lower(email));
CREATE INDEX IF NOT EXISTS idx_outreach_suppressions_domain ON outreach_suppressions(lower(domain));

-- ============================================================================
-- TREND RADAR + COMMUNITY VENUES (v24)
--
-- Two discovery crawlers feeding the content and distribution pipelines:
--
--   trend_items      what is getting attention RIGHT NOW across the places our
--                    audience reads, scored for whether WE can add something
--                    true to it. Timeliness is the only advantage a small
--                    publisher has over an established one, so the point is to
--                    notice within hours, not weeks.
--
--   community_venues WHERE we should be posting. Discovered rather than assumed,
--                    with each community's own self-promotion rules and a plain
--                    recommendation: post, participate only, watch, or avoid.
--
-- Both are read-only discovery. Neither posts anything.
-- Additive + idempotent, same as the rest of this file.
-- ============================================================================

CREATE TABLE IF NOT EXISTS trend_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- identity + dedupe: the same story shows up on HN, Reddit and Lobsters
  source text NOT NULL,                          -- hackernews | reddit | devto | lobsters | github
  source_id text NOT NULL,                       -- id within that source
  url text,                                      -- the thing itself
  discussion_url text,                            -- where the conversation is
  title text NOT NULL,
  summary text,
  author text,
  tags text[] DEFAULT '{}',
  -- real engagement, never estimated
  points integer DEFAULT 0,
  comments integer DEFAULT 0,
  published_at timestamptz,
  -- our scoring
  velocity numeric(10,3) DEFAULT 0,              -- engagement per hour since publish
  relevance numeric(6,3) DEFAULT 0,              -- 0..100 fit with our clusters
  heat numeric(6,3) DEFAULT 0,                   -- combined priority score
  cluster_id smallint,                            -- which of our 10 clusters it belongs to
  matched_terms text[] DEFAULT '{}',
  -- do we already cover this, and what would we actually add?
  covered_by_slugs text[] DEFAULT '{}',
  angle text,                                     -- the specific take we could take
  angle_kind text,                                -- explainer | counterpoint | how-to | teardown | none
  -- workflow
  status text NOT NULL DEFAULT 'new',             -- new | shortlisted | briefed | written | skipped
  skip_reason text,
  article_id uuid,                                -- set once it becomes a real article
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trend_items_source ON trend_items(source, source_id);
CREATE INDEX IF NOT EXISTS idx_trend_items_heat ON trend_items(heat);
CREATE INDEX IF NOT EXISTS idx_trend_items_status ON trend_items(status);
CREATE INDEX IF NOT EXISTS idx_trend_items_cluster ON trend_items(cluster_id);
CREATE INDEX IF NOT EXISTS idx_trend_items_seen ON trend_items(last_seen_at);

CREATE TABLE IF NOT EXISTS community_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL DEFAULT 'reddit',       -- reddit | hackernews | devto | discord | slack | forum
  name text NOT NULL,                            -- e.g. "node" for r/node
  url text,
  title text,
  description text,
  -- audience, straight from the platform
  subscribers integer DEFAULT 0,
  active_users integer DEFAULT 0,
  over_18 boolean DEFAULT false,
  created_utc timestamptz,
  -- the rules that decide what we may post
  self_promo_allowed text DEFAULT 'unknown',     -- yes | limited | no | unknown
  rules jsonb,
  submission_notes text,                         -- e.g. required flair, no link posts
  -- our assessment
  topical_fit numeric(6,3) DEFAULT 0,            -- 0..100 how well it matches what we know
  matched_terms text[] DEFAULT '{}',
  opportunity numeric(6,3) DEFAULT 0,            -- combined priority
  recommendation text DEFAULT 'watch',           -- post | participate | watch | avoid
  reasoning text,
  -- workflow
  status text NOT NULL DEFAULT 'new',            -- new | approved | active | rejected
  notes text,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_venues_key ON community_venues(platform, lower(name));
CREATE INDEX IF NOT EXISTS idx_community_venues_opportunity ON community_venues(opportunity);
CREATE INDEX IF NOT EXISTS idx_community_venues_reco ON community_venues(recommendation);

-- ============================================================================
-- LINK OUTREACH (v25)
--
-- Turns the competitor backlink exports in kloudgraph-semrush-export/ into a
-- worked pipeline: which sites already write about this category, what kind of
-- link opportunity each one is, who to contact, what to say, and what happened.
--
-- WHY A SEPARATE TABLE FROM outreach_prospects. A sales prospect is a person at
-- a company we might sell to. A link prospect is a DOMAIN that publishes about
-- our category, and the unit of value is the page that already mentions a rival.
-- Different identity (domain vs email), different scoring, different ask. They
-- meet at the contact: once a link prospect has an address, it becomes a row in
-- outreach_prospects and reuses the entire vetted send path rather than getting
-- a second one.
--
-- WHAT THE DATA ACTUALLY SUPPORTS (measured over 94,009 link rows /
-- 81,083 unique linking domains, all six usable competitor exports):
--   * 5,417 domains carry a listicle or alternatives page. That is the best and
--     most honest ask available: a page listing eight options can carry a ninth.
--   * 977 carry a curated resource page, 23,200 an ordinary editorial post.
--   * 6,398 link from a privacy or legal page ("this site is hosted by ..."),
--     and 2,637 from docs. Both are worth nothing and are rejected outright.
--   * Nofollow, Sponsored and Ugc are all zero in the export, so link quality
--     cannot be judged from those columns and is not stored as if it could.
--
-- Additive and idempotent, same as every block above.
-- ============================================================================

CREATE TABLE IF NOT EXISTS link_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- identity: one row per registrable domain, however many links it has
  domain text NOT NULL,
  homepage_url text,

  -- authority, straight from the SEMrush export. NOT treated as "better when
  -- higher": the ascore 90+ band is google.com, medium.com and telegram.me,
  -- which nobody can pitch. Scoring uses a band, see value_score below.
  authority integer DEFAULT 0,
  refdomain_backlinks bigint DEFAULT 0,          -- their total; huge + low authority = link farm
  country text,
  ip_address text,

  -- what we learned from the exports
  links_to text[] DEFAULT '{}',                  -- which rivals this domain links to
  rival_count integer DEFAULT 0,                 -- length of the above; 2+ means they cover the category
  link_count integer DEFAULT 0,                  -- how many links we saw from this domain
  best_source_url text,                          -- the single most useful page they published
  best_source_title text,
  best_anchor text,
  best_target_url text,                          -- the rival page it points at
  first_seen date,
  last_seen date,
  has_lost_link boolean DEFAULT false,           -- a link that disappeared: possible broken-link angle

  -- classification
  domain_class text DEFAULT 'unknown',
  -- editorial | directory | platform | corporate | academic | press_release
  -- | search_engine | registry | stats_farm | competitor | parked | unknown
  opportunity_type text DEFAULT 'unknown',
  -- listicle | resource_page | editorial_mention | guest_post | broken_link
  -- | directory_listing | none
  reject_reason text,                            -- set when we will never contact them

  -- vetting, filled in by the contact crawler rather than assumed
  is_live boolean,
  language text,
  accepts_guest_posts boolean,
  guidelines_url text,
  contact_page_url text,
  vetted_at timestamptz,

  -- who to talk to
  contact_email text,
  contact_name text,
  contact_source text,                           -- how we found it: mailto | contact-page | guidelines | manual
  contact_confidence numeric(4,3) DEFAULT 0,     -- 0..1, honest about guesswork

  -- what we would pitch
  our_target_slug text,                          -- which of OUR articles fits their page
  pitch_angle text,                              -- the specific, true reason to include us

  -- scoring
  value_score numeric(6,3) DEFAULT 0,            -- 0..100 overall priority
  spam_score numeric(6,3) DEFAULT 0,             -- 0..100, higher is worse

  -- workflow. 'prospect_id' links to the sales-side row once a contact exists,
  -- so the send path, suppression and daily cap are shared rather than copied.
  status text NOT NULL DEFAULT 'new',
  -- new | rejected | needs_contact | ready | queued | contacted | replied
  -- | won | lost | suppressed
  prospect_id uuid,
  won_url text,                                  -- the page that ended up linking to us
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_link_prospects_domain ON link_prospects(lower(domain));
CREATE INDEX IF NOT EXISTS idx_link_prospects_status ON link_prospects(status);
CREATE INDEX IF NOT EXISTS idx_link_prospects_value ON link_prospects(value_score DESC);
CREATE INDEX IF NOT EXISTS idx_link_prospects_type ON link_prospects(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_link_prospects_class ON link_prospects(domain_class);

-- --- Sequencing on existing messages ---------------------------------------
-- A follow-up needs somewhere to record WHEN it may go, and a first touch needs
-- to know it is part of a sequence. Added to outreach_messages rather than a new
-- table so the (prospect_id, step) unique index keeps guarding double-sends.
ALTER TABLE outreach_messages ADD COLUMN IF NOT EXISTS send_after timestamptz;
ALTER TABLE outreach_messages ADD COLUMN IF NOT EXISTS campaign text DEFAULT 'agency';
-- agency | link_building
ALTER TABLE outreach_messages ADD COLUMN IF NOT EXISTS link_prospect_id uuid;
CREATE INDEX IF NOT EXISTS idx_outreach_messages_due
  ON outreach_messages(status, send_after);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_campaign ON outreach_messages(campaign);

-- Why the sequence stopped, so a follow-up can never fire at someone who has
-- already answered. Without this the automation's most likely failure is also
-- its most embarrassing: chasing somebody who said yes yesterday.
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS sequence_stopped_reason text;
-- replied | bounced | unsubscribed | complained | completed | manual
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS next_touch_at timestamptz;
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS touches_sent integer DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_next_touch
  ON outreach_prospects(next_touch_at);

-- --- Inbound mail -----------------------------------------------------------
-- There was no inbound path at all before this, which made automatic follow-ups
-- unsafe by construction. Every reply, bounce and complaint lands here, gets
-- classified, and stops the sequence.
CREATE TABLE IF NOT EXISTS outreach_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid,
  message_id uuid,                               -- the outreach_messages row it answers
  from_email text NOT NULL,
  subject text,
  snippet text,                                  -- first part of the body, for triage
  provider_message_id text,
  -- interested | not_interested | unsubscribe | bounce | auto_reply
  -- | complaint | question | unknown
  classification text NOT NULL DEFAULT 'unknown',
  confidence numeric(4,3) DEFAULT 0,
  is_automated boolean DEFAULT false,            -- out-of-office and similar: not a real reply
  handled boolean DEFAULT false,                 -- did we act on it
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_replies_provider
  ON outreach_replies(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_replies_prospect ON outreach_replies(prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_replies_class ON outreach_replies(classification);
CREATE INDEX IF NOT EXISTS idx_outreach_replies_handled ON outreach_replies(handled);

-- ============================================================================
-- LINK OUTREACH, PART 2 (v26) — closing the loop, and making it workable
--
-- v25 could find opportunities, write pitches and send them. It could not answer
-- the only question that matters: DID WE GET THE LINK. So it measured emails sent
-- rather than links earned, which is the difference between an emailing tool and a
-- link-building system. Everything here exists to fix that, plus to let a person
-- actually work the pipeline instead of only reading it.
--
--   link_checks        did the link appear on their page, is it still there, and
--                      is it followed. Re-checked over time, because a link that
--                      lasts a week is not a link.
--   outreach_activity  an audit trail of every human and automatic action. Without
--                      it, "why was this skipped" and "who changed this address"
--                      are unanswerable, and a bulk action is unreviewable.
--
-- Plus columns for the things a workspace needs: a campaign name to group a push,
-- a record that a human edited a pitch (so the automation does not overwrite it),
-- and a note field.
--
-- Additive and idempotent, same as every block above.
-- ============================================================================

-- --- Did the link actually appear? ------------------------------------------
-- One row per check, not one per prospect, so the HISTORY is visible. A link that
-- appeared and then vanished is a different situation from one that never
-- appeared, and only a history distinguishes them.
CREATE TABLE IF NOT EXISTS link_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_prospect_id uuid NOT NULL,
  -- the page we expected the link to appear on
  checked_url text NOT NULL,
  http_status integer,
  -- what we found
  found boolean NOT NULL DEFAULT false,
  found_url text,                                -- the exact href we matched
  anchor_text text,
  rel_attributes text,                           -- nofollow / sponsored / ugc, as published
  is_followed boolean,                           -- null when not found
  -- context, so a human can judge a partial match
  link_count integer DEFAULT 0,                  -- how many links to us on that page
  notes text,
  checked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_link_checks_prospect ON link_checks(link_prospect_id);
CREATE INDEX IF NOT EXISTS idx_link_checks_found ON link_checks(found);
CREATE INDEX IF NOT EXISTS idx_link_checks_when ON link_checks(checked_at DESC);

-- Rolled onto the prospect so the list can be filtered and sorted without a join.
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS link_found boolean;
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS link_found_at timestamptz;
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS link_lost_at timestamptz;
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS link_is_followed boolean;
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS link_anchor text;
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS check_count integer DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_link_prospects_link_found ON link_prospects(link_found);
CREATE INDEX IF NOT EXISTS idx_link_prospects_last_checked ON link_prospects(last_checked_at);

-- --- Working the pipeline ---------------------------------------------------
-- A named push, so several efforts can run side by side and be measured
-- separately. Deliberately a plain label rather than a campaign entity with its
-- own templates and cadence: for one brand that machinery costs far more than it
-- returns, and a label already supports filtering and per-campaign metrics.
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS campaign_name text;
CREATE INDEX IF NOT EXISTS idx_link_prospects_campaign ON link_prospects(campaign_name);

-- Set when a person edits the drafted pitch. The automation must never silently
-- overwrite human wording, so the drafter checks this before re-drafting.
ALTER TABLE outreach_messages ADD COLUMN IF NOT EXISTS edited_by_human boolean DEFAULT false;
ALTER TABLE outreach_messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- --- Audit trail ------------------------------------------------------------
-- Every action, human or automatic. This is what makes a bulk action reviewable:
-- approving forty pitches in one click is only safe if it can be read back
-- afterwards, one row per prospect, with who did it and when.
CREATE TABLE IF NOT EXISTS outreach_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_prospect_id uuid,
  prospect_id uuid,
  message_id uuid,
  -- approved | skipped | edited | contact_changed | sent | note | stage_changed
  -- | verified | link_found | link_lost | rejected | bulk_approved | reopened
  action text NOT NULL,
  actor text NOT NULL DEFAULT 'human',           -- human | automation
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outreach_activity_link ON outreach_activity(link_prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_activity_prospect ON outreach_activity(prospect_id);
CREATE INDEX IF NOT EXISTS idx_outreach_activity_when ON outreach_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_activity_action ON outreach_activity(action);

-- ============================================================================
-- v27 — PROSPECTING RECIPES AND MULTI-INBOX SENDING
-- ============================================================================
-- v26 could work one source of prospects (a competitor backlink export) through
-- one sending address. Two limits followed from that, and this block removes
-- both.
--
-- 1. ONE SOURCE. Every prospect came from the same CSV mining pass, so the
--    pipeline could only ever find sites that already link to a rival. It could
--    not answer "who links to THIS article", "who reviewed this product last
--    month", "who takes guest posts on this topic", "which shows has this person
--    been on", or "which resource lists cover this keyword". Those are five
--    different questions with five different pitches, and a recipe is how one
--    engine answers all of them without a second pipeline.
--
-- 2. ONE ADDRESS. A single mailbox has a hard practical ceiling, and the ceiling
--    is reputation rather than volume: the same domain sends receipts and
--    password resets, so pushing outreach through it puts transactional mail at
--    risk. Several addresses spread that load. The thing that makes it safe
--    rather than merely faster is per-inbox limits, a per-inbox warmup ramp, and
--    thread affinity, all below.

-- --- Recipe runs ------------------------------------------------------------
-- One row per run of a recipe, with what was typed in, what came out, and what
-- it cost. Stored rather than transient for three reasons: a run can be repeated
-- without retyping the input, a disappointing run can be told apart from a
-- broken one, and a search API bill is only auditable if the query count was
-- written down at the time.
CREATE TABLE IF NOT EXISTS recipe_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- skyscraper | product_review | guest_post | podcast | resource_page
  recipe text NOT NULL,
  -- Exactly what the person typed, kept verbatim so a run can be repeated.
  input_text text NOT NULL,
  -- Parsed inputs and per-recipe options.
  input_json jsonb DEFAULT '{}'::jsonb,
  campaign_name text,
  status text NOT NULL DEFAULT 'queued',        -- queued | running | done | failed
  -- Candidates the recipe identified, before any filtering.
  found integer NOT NULL DEFAULT 0,
  -- Rows actually written to link_prospects. Always <= found, and the gap is the
  -- interesting number: it is duplicates plus rejects.
  stored integer NOT NULL DEFAULT 0,
  duplicates integer NOT NULL DEFAULT 0,
  rejected integer NOT NULL DEFAULT 0,
  -- Search queries issued. The honest measure of what a run cost.
  queries_used integer NOT NULL DEFAULT 0,
  -- Plain-language summary, written for the person who pressed the button.
  readout text,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recipe_runs_recipe ON recipe_runs(recipe);
CREATE INDEX IF NOT EXISTS idx_recipe_runs_status ON recipe_runs(status);
CREATE INDEX IF NOT EXISTS idx_recipe_runs_when ON recipe_runs(created_at DESC);

-- --- Where a prospect came from ---------------------------------------------
-- Which recipe found this row, and which run. Without it, per-recipe reply and
-- link rates cannot be measured, and measuring them is the whole point: the
-- pipeline should be steered by which recipe actually earns links, not by which
-- one is most fun to run.
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS source_recipe text;
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS recipe_run_id uuid;
-- Recipe-specific evidence that does not fit the backlink-shaped columns. The
-- podcast recipe needs the show and the host; the review recipe needs which
-- product was reviewed and when. Kept as one jsonb rather than five nullable
-- columns per recipe, because a recipe added later should not need a migration.
ALTER TABLE link_prospects ADD COLUMN IF NOT EXISTS recipe_evidence jsonb;
CREATE INDEX IF NOT EXISTS idx_link_prospects_recipe ON link_prospects(source_recipe);
CREATE INDEX IF NOT EXISTS idx_link_prospects_recipe_run ON link_prospects(recipe_run_id);

-- --- Sending inboxes --------------------------------------------------------
-- NO SECRETS LIVE IN THIS TABLE, deliberately.
--
-- `credential_ref` holds the NAME of an environment-variable prefix, e.g.
-- 'INBOX_3', and the sender resolves INBOX_3_SMTP_PASSWORD or
-- INBOX_3_RESEND_API_KEY from the environment at the moment it sends. A password
-- column here would mean a routine database dump leaked thirty mailbox
-- credentials at once, and the convenience is not worth that.
--
-- Nothing about how much was sent today is stored here either. That is derived
-- from outreach_messages, because a denormalised counter drifts, and a drifted
-- counter is worse than no cap at all: it reads as a working limit.
CREATE TABLE IF NOT EXISTS outreach_inboxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- What a person calls it in the UI, e.g. "vikram @ kloudbean".
  label text NOT NULL,
  from_email text NOT NULL,
  from_name text,
  reply_to text,
  -- resend | smtp | default. 'default' means use the global provider settings,
  -- which is the common case: twenty addresses on one verified domain.
  provider text NOT NULL DEFAULT 'default',
  -- Env-var prefix for this inbox's credentials. NULL = use the global ones.
  credential_ref text,
  -- Hard ceiling for this address per day, under the global cap. Never above it.
  daily_cap integer NOT NULL DEFAULT 20,
  -- When this address began sending, for its own warmup ramp. A new address on an
  -- old domain still has to earn its volume.
  warmup_started_at timestamptz,
  status text NOT NULL DEFAULT 'active',        -- active | paused
  paused_reason text,
  -- Cumulative health counters. A rising bounce rate is the earliest signal that
  -- an address is in trouble, and it is worth pausing on rather than watching.
  bounces integer NOT NULL DEFAULT 0,
  complaints integer NOT NULL DEFAULT 0,
  last_sent_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- One row per address. Two rows for the same mailbox would double its real cap
-- while both looked correctly limited.
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_inboxes_email
  ON outreach_inboxes(lower(from_email));
CREATE INDEX IF NOT EXISTS idx_outreach_inboxes_status ON outreach_inboxes(status);
-- Rotation is least-recently-used, so this is the index the picker reads.
CREATE INDEX IF NOT EXISTS idx_outreach_inboxes_lru ON outreach_inboxes(last_sent_at ASC);

-- --- Thread affinity --------------------------------------------------------
-- WHY THIS COLUMN IS ON THE PROSPECT AND NOT ONLY ON THE MESSAGE.
--
-- A follow-up that arrives from a different address than the first email is
-- indistinguishable from spam: it breaks threading in the recipient's client,
-- and it means two strangers wrote to them about the same thing. So the address
-- is bound to the PERSON on first send and reused for the whole conversation.
-- If that inbox is later paused or out of budget, the follow-up WAITS. It never
-- silently goes out from somewhere else.
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS inbox_id uuid;
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_inbox ON outreach_prospects(inbox_id);

-- And on the message, which address actually sent it. The prospect column says
-- what should be used; this says what was used. They can only disagree if
-- something was reassigned by hand, and then the history needs to show it.
ALTER TABLE outreach_messages ADD COLUMN IF NOT EXISTS inbox_id uuid;
CREATE INDEX IF NOT EXISTS idx_outreach_messages_inbox ON outreach_messages(inbox_id);
-- Per-inbox sends today are counted from this pair, so the index matters.
CREATE INDEX IF NOT EXISTS idx_outreach_messages_inbox_sent
  ON outreach_messages(inbox_id, sent_at DESC);

-- Social publishing: connected channels + scheduled/published post queue (v5)
CREATE TABLE IF NOT EXISTS social_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  label text NOT NULL,
  mode text NOT NULL DEFAULT 'webhook',
  webhook_url text,
  api_token text,
  meta jsonb,
  enabled boolean NOT NULL DEFAULT true,
  last_ok_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL,
  link text,
  image_url text,
  channel_ids text[] DEFAULT '{}',
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  results jsonb,
  source text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  posted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_sched ON social_posts(scheduled_at);

-- Per-account voice/persona for social channels (v6)
ALTER TABLE social_channels ADD COLUMN IF NOT EXISTS persona text;

-- CRM + prompt-to-email ("vibe emailing") — v1.8 ------------------------------
-- contacts: the customer list, uploaded from CSV. status drives the segments.
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  company text,
  status text NOT NULL DEFAULT 'unknown',
  tags text[] DEFAULT '{}',
  source text DEFAULT 'csv',
  meta jsonb,
  subscribed boolean NOT NULL DEFAULT true,
  last_emailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- One row per address. Import is an upsert on this key.
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_email ON contacts(lower(email));
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_subscribed ON contacts(subscribed);

-- email_senders: attached sending accounts (Resend / Brevo key, or raw SMTP).
-- Internal admin tool: credentials live here, so treat the DB as sensitive.
CREATE TABLE IF NOT EXISTS email_senders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  provider text NOT NULL DEFAULT 'smtp',
  from_name text,
  from_email text NOT NULL,
  reply_to text,
  api_key text,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_user text,
  smtp_pass text,
  smtp_secure boolean DEFAULT false,
  daily_cap integer DEFAULT 200,
  enabled boolean NOT NULL DEFAULT true,
  last_ok_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- email_campaigns: one prompt-driven broadcast to one segment, with delivery state.
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text NOT NULL,
  segment text NOT NULL DEFAULT 'all',
  sender_id uuid,
  status text NOT NULL DEFAULT 'draft',
  prompt text,
  source text DEFAULT 'prompt',
  recipients_total integer DEFAULT 0,
  recipients_sent integer DEFAULT 0,
  recipients_failed integer DEFAULT 0,
  dry_run boolean DEFAULT true,
  stats jsonb,
  error text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
