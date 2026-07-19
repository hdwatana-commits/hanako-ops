-- Fashion Hanako OPS Phase 2 migration
-- Run this after supabase-ops-phase1.sql.

create table if not exists public.collection_rule_versions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  collection_rule_id text not null,
  version integer not null default 1,
  snapshot jsonb not null default '{}'::jsonb,
  change_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_memberships (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  collection_id text not null,
  product_id text not null,
  status text not null default 'pending_auto',
  confidence numeric,
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, collection_id, product_id)
);

create table if not exists public.collection_balance_snapshots (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  collection_id text not null,
  status text not null,
  item_count integer not null default 0,
  composition jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.post_similarities (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  new_post_plan_id text not null,
  existing_post_id text not null,
  similarity_score numeric not null default 0,
  matched_features jsonb not null default '[]'::jsonb,
  different_features jsonb not null default '[]'::jsonb,
  recommendation text,
  change_suggestions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, new_post_plan_id, existing_post_id)
);

create table if not exists public.decision_inbox_items (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  entity_type text not null,
  entity_id text not null,
  reason text not null,
  recommended_action text,
  recommendation_confidence numeric,
  priority numeric not null default 0,
  status text not null default 'open',
  due_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  resolution text,
  created_at timestamptz not null default now()
);

create table if not exists public.csv_imports (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  file_name text,
  encoding text,
  row_count integer not null default 0,
  inserted_count integer not null default 0,
  duplicate_count integer not null default 0,
  auto_linked_count integer not null default 0,
  needs_review_count integer not null default 0,
  error_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.csv_column_mappings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  header_fingerprint text not null,
  mapping jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, header_fingerprint)
);

create table if not exists public.csv_import_rows (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  csv_import_id text references public.csv_imports(id) on delete cascade,
  row_index integer not null,
  raw_row jsonb not null default '{}'::jsonb,
  normalized_row jsonb not null default '{}'::jsonb,
  status text not null default 'parsed',
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_attributions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  sales_result_id text not null,
  product_id text,
  post_id text,
  confidence numeric not null default 0,
  method text,
  status text not null default 'needs_review',
  attribution_window_days integer not null default 30,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (user_id, sales_result_id)
);

create table if not exists public.performance_aggregates (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  dimension text not null,
  dimension_value text not null,
  sample_size integer not null default 0,
  post_count integer not null default 0,
  clicks integer not null default 0,
  sales_count integer not null default 0,
  sales_amount numeric not null default 0,
  reward_amount numeric not null default 0,
  conversion_rate numeric not null default 0,
  baseline_conversion_rate numeric not null default 0,
  period_start date,
  period_end date,
  created_at timestamptz not null default now(),
  unique (user_id, dimension, dimension_value, period_start, period_end)
);

create table if not exists public.score_adjustments (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  dimension text not null,
  dimension_value text not null,
  sample_size integer not null default 0,
  conversion_rate numeric not null default 0,
  baseline_conversion_rate numeric not null default 0,
  adjustment_value numeric not null default 0,
  confidence text not null default 'low',
  reason text,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_insights (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  facts jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  manual_decision_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.rule_conflicts (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  collection_rule_id text not null,
  entity_id text,
  conflict_type text not null,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.automation_decisions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  inbox_item_id text,
  entity_type text,
  entity_id text,
  action text not null,
  reason text,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.job_runs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  job_name text not null,
  reason text,
  status text not null default 'running',
  target_count integer not null default 0,
  success_count integer not null default 0,
  error_count integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.error_logs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  source text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_decision_inbox_user_status on public.decision_inbox_items(user_id, status, priority desc);
create index if not exists idx_sales_attributions_user_status on public.sales_attributions(user_id, status, confidence desc);
create index if not exists idx_performance_aggregates_user_dimension on public.performance_aggregates(user_id, dimension, dimension_value);
create index if not exists idx_collection_memberships_user_collection on public.collection_memberships(user_id, collection_id, status);

alter table public.collection_rule_versions enable row level security;
alter table public.collection_memberships enable row level security;
alter table public.collection_balance_snapshots enable row level security;
alter table public.post_similarities enable row level security;
alter table public.decision_inbox_items enable row level security;
alter table public.csv_imports enable row level security;
alter table public.csv_column_mappings enable row level security;
alter table public.csv_import_rows enable row level security;
alter table public.sales_attributions enable row level security;
alter table public.performance_aggregates enable row level security;
alter table public.score_adjustments enable row level security;
alter table public.weekly_insights enable row level security;
alter table public.rule_conflicts enable row level security;
alter table public.automation_decisions enable row level security;
alter table public.job_runs enable row level security;
alter table public.error_logs enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'collection_rule_versions',
    'collection_memberships',
    'collection_balance_snapshots',
    'post_similarities',
    'decision_inbox_items',
    'csv_imports',
    'csv_column_mappings',
    'csv_import_rows',
    'sales_attributions',
    'performance_aggregates',
    'score_adjustments',
    'weekly_insights',
    'rule_conflicts',
    'automation_decisions',
    'job_runs',
    'error_logs'
  ]
  loop
    execute format('drop policy if exists "%1$s owner access" on public.%I', table_name, table_name);
    execute format('create policy "%1$s owner access" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name, table_name);
  end loop;
end $$;
