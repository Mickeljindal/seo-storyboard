
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS cluster_id smallint,
  ADD COLUMN IF NOT EXISTS cluster_name text,
  ADD COLUMN IF NOT EXISTS anchor text,
  ADD COLUMN IF NOT EXISTS idea_index integer,
  ADD COLUMN IF NOT EXISTS entities text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS faq jsonb,
  ADD COLUMN IF NOT EXISTS ai_overview jsonb,
  ADD COLUMN IF NOT EXISTS schema_jsonld jsonb,
  ADD COLUMN IF NOT EXISTS internal_link_targets text[] DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_articles_cluster ON public.articles(cluster_id);
CREATE INDEX IF NOT EXISTS idx_articles_anchor ON public.articles(anchor);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);

CREATE TABLE IF NOT EXISTS public.raffle_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_count integer NOT NULL,
  filters jsonb,
  picked_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.raffle_draws ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS open_all ON public.raffle_draws;
CREATE POLICY open_all ON public.raffle_draws FOR ALL USING (true) WITH CHECK (true);
