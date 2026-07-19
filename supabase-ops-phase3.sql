-- Fashion Hanako OPS Phase 3 migration
-- AI楽天ROOM運営エージェント用テーブルです。

create table if not exists public.ai_agent_runs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  status text not null default 'success',
  generated_at timestamptz not null default now(),
  tasks jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_product_evaluations (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id text not null,
  ai_total_score numeric not null default 0,
  rank text,
  scores jsonb not null default '{}'::jsonb,
  reasons jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  vision_prompt text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_post_plans (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id text not null,
  product_name text,
  ai_rank text,
  ai_total_score numeric not null default 0,
  status text not null default 'needs_approval',
  theme jsonb not null default '{}'::jsonb,
  coordinate jsonb not null default '{}'::jsonb,
  image_job jsonb not null default '{}'::jsonb,
  copy_bundle jsonb not null default '{}'::jsonb,
  collection_candidates jsonb not null default '[]'::jsonb,
  repost_decision jsonb not null default '{}'::jsonb,
  reasons jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_image_jobs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  plan_id text,
  product_id text,
  product_name text,
  status text not null default 'waiting',
  provider text,
  prompt text,
  result_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_copy_bundles (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  plan_id text,
  product_id text,
  product_name text,
  room text,
  instagram text,
  threads jsonb not null default '[]'::jsonb,
  x text,
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_collection_suggestions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  score numeric not null default 0,
  products jsonb not null default '[]'::jsonb,
  reason text,
  status text not null default 'suggested',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_repost_suggestions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id text not null,
  product_name text,
  status text not null,
  should_repost boolean not null default false,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_sales_insights (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade,
  top_brands jsonb not null default '[]'::jsonb,
  top_categories jsonb not null default '[]'::jsonb,
  top_price_ranges jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  score_adjustments jsonb not null default '[]'::jsonb,
  evidence_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_improvement_reports (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  facts jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_schedule_plans (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  theme text,
  product_id text,
  product_name text,
  platform text,
  reason text,
  status text not null default 'suggested',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_assistant_messages (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_learning_profiles (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  adopted_count integer not null default 0,
  excluded_count integer not null default 0,
  sales_count integer not null default 0,
  reward_amount numeric not null default 0,
  profile jsonb not null default '{}'::jsonb,
  learned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_post_plans_user_status on public.ai_post_plans(user_id, status, ai_total_score desc);
create index if not exists idx_ai_image_jobs_user_status on public.ai_image_jobs(user_id, status, created_at desc);
create index if not exists idx_ai_schedule_plans_user_date on public.ai_schedule_plans(user_id, date, status);

alter table public.ai_agent_runs enable row level security;
alter table public.ai_product_evaluations enable row level security;
alter table public.ai_post_plans enable row level security;
alter table public.ai_image_jobs enable row level security;
alter table public.ai_copy_bundles enable row level security;
alter table public.ai_collection_suggestions enable row level security;
alter table public.ai_repost_suggestions enable row level security;
alter table public.ai_sales_insights enable row level security;
alter table public.ai_improvement_reports enable row level security;
alter table public.ai_schedule_plans enable row level security;
alter table public.ai_assistant_messages enable row level security;
alter table public.ai_learning_profiles enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'ai_agent_runs',
    'ai_product_evaluations',
    'ai_post_plans',
    'ai_image_jobs',
    'ai_copy_bundles',
    'ai_collection_suggestions',
    'ai_repost_suggestions',
    'ai_sales_insights',
    'ai_improvement_reports',
    'ai_schedule_plans',
    'ai_assistant_messages',
    'ai_learning_profiles'
  ]
  loop
    execute format('drop policy if exists "%1$s owner access" on public.%I', table_name, table_name);
    execute format('create policy "%1$s owner access" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name, table_name);
  end loop;
end $$;
