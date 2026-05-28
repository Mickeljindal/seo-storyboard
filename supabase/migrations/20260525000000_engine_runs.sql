-- Autonomous SEO engine run history + article draft storage
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS content_draft text,
  ADD COLUMN IF NOT EXISTS engine_source text;

CREATE TABLE IF NOT EXISTS public.engine_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  geo text NOT NULL DEFAULT 'sa',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  log jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_engine_runs_started ON public.engine_runs(started_at DESC);

ALTER TABLE public.engine_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS open_all ON public.engine_runs;
CREATE POLICY open_all ON public.engine_runs FOR ALL USING (true) WITH CHECK (true);
