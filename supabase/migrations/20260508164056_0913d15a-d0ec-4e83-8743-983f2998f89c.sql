
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_keyword text,
  secondary_keywords text[] default '{}',
  pillar smallint not null check (pillar between 1 and 5),
  status text not null default 'idea' check (status in ('idea','keyword_researched','brief_generated','writing','review','published','promoted')),
  scheduled_week smallint check (scheduled_week between 1 and 12),
  assignee_id uuid,
  word_count_target integer default 2500,
  meta_title text,
  meta_description text,
  url_slug text,
  published_url text,
  brief jsonb,
  keyword_data jsonb,
  serp_data jsonb,
  performance_data jsonb,
  geo_target text default 'sa',
  language text default 'en',
  priority text default 'medium' check (priority in ('high','medium','low')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  geo_target text default 'sa',
  monthly_volume integer,
  cpc numeric(10,2),
  difficulty smallint,
  serp_features text[] default '{}',
  paa_questions text[] default '{}',
  top_10_urls text[] default '{}',
  trend_data jsonb,
  last_refreshed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(keyword, geo_target)
);

create table public.content_briefs (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  brief_data jsonb not null,
  version integer not null default 1,
  generated_by text default 'gpt-4o',
  created_at timestamptz not null default now()
);

create index on public.articles (pillar);
create index on public.articles (status);
create index on public.articles (scheduled_week);
create index on public.content_briefs (article_id);

alter table public.articles enable row level security;
alter table public.keywords enable row level security;
alter table public.content_briefs enable row level security;

-- Internal tool: open access (no auth in this MVP)
create policy "open_all" on public.articles for all using (true) with check (true);
create policy "open_all" on public.keywords for all using (true) with check (true);
create policy "open_all" on public.content_briefs for all using (true) with check (true);

create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger articles_updated_at before update on public.articles
for each row execute function public.set_updated_at();
