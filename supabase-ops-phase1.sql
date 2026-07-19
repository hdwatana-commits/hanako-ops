create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'manual',
  shop_code text,
  item_code text,
  product_url text,
  normalized_url text,
  canonical_product_id text not null,
  product_family_id text,
  brand text,
  normalized_product_name text,
  model_number text,
  jan_code text,
  color text,
  size text,
  main_image_url text,
  image_hash text,
  category text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, canonical_product_id)
);

create table if not exists public.product_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  sale_potential_score numeric,
  operation_priority_score numeric,
  score_breakdown jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  rule jsonb not null default '{}'::jsonb,
  automation_mode text not null default 'confirm',
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  brand text,
  category text,
  color text,
  season text,
  taste text,
  scene text,
  background_location text,
  pose text,
  hairstyle text,
  coordinate_colors text[],
  copy_text text,
  image_layout text,
  collection_ids uuid[],
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.duplicate_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  matched_product_id uuid references public.products(id) on delete cascade,
  match_type text not null,
  confidence numeric not null,
  reason jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  selection_date date not null,
  source_count int not null default 0,
  candidate_count int not null default 0,
  visible_count int not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, selection_date)
);

create table if not exists public.user_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  decision text not null,
  before_value jsonb,
  after_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  clicks int,
  orders int,
  sales_amount numeric,
  reward_amount numeric,
  first_click_at timestamptz,
  purchased_at timestamptz,
  imported_from text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  job_name text not null,
  idempotency_key text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  log jsonb not null default '{}'::jsonb,
  unique (user_id, job_name, idempotency_key)
);

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  scope text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.product_scores enable row level security;
alter table public.collections enable row level security;
alter table public.posts enable row level security;
alter table public.duplicate_matches enable row level security;
alter table public.daily_selections enable row level security;
alter table public.user_decisions enable row level security;
alter table public.sales_results enable row level security;
alter table public.job_runs enable row level security;
alter table public.error_logs enable row level security;

drop policy if exists "Users manage own products" on public.products;
create policy "Users manage own products" on public.products for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own product scores" on public.product_scores;
create policy "Users manage own product scores" on public.product_scores for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own collections" on public.collections;
create policy "Users manage own collections" on public.collections for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own posts" on public.posts;
create policy "Users manage own posts" on public.posts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own duplicate matches" on public.duplicate_matches;
create policy "Users manage own duplicate matches" on public.duplicate_matches for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own daily selections" on public.daily_selections;
create policy "Users manage own daily selections" on public.daily_selections for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own decisions" on public.user_decisions;
create policy "Users manage own decisions" on public.user_decisions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own sales results" on public.sales_results;
create policy "Users manage own sales results" on public.sales_results for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own job runs" on public.job_runs;
create policy "Users manage own job runs" on public.job_runs for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own error logs" on public.error_logs;
create policy "Users manage own error logs" on public.error_logs for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
