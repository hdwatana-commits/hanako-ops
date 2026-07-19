-- Fashion Hanako OPS Phase 4 self-learning tables.
-- Run after phase1/phase2/phase3 setup when cloud sync persistence is needed.

create table if not exists public.ai_phase4_runs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  generated_at timestamptz not null default now(),
  reason text,
  dashboard jsonb not null default '{}'::jsonb,
  retrospective jsonb not null default '{}'::jsonb,
  weekly_meeting jsonb not null default '{}'::jsonb,
  monthly_meeting jsonb not null default '{}'::jsonb,
  mcp_ready_interfaces jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_learning_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text,
  post_id text,
  plan_id text,
  posted_at timestamptz,
  brand text,
  category text,
  price_range text,
  background text,
  copy_type text,
  scene text,
  season text,
  collection text,
  image_features jsonb not null default '{}'::jsonb,
  image_prompt text,
  copy_text text,
  ai_predicted_score numeric,
  actual_score numeric,
  clicks numeric,
  sales_count numeric,
  sales_amount numeric,
  reward_amount numeric,
  outcome text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_knowledge_base (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  value text not null,
  sample_size numeric,
  candidate_size numeric,
  sales_count numeric,
  clicks numeric,
  reward_amount numeric,
  conversion_rate numeric,
  avg_prediction numeric,
  avg_actual numeric,
  confidence numeric,
  verdict text,
  evidence_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_patterns (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_type text not null,
  title text not null,
  dimension text,
  value text,
  score numeric,
  reason text,
  evidence_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_improvement_proposals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  proposal_type text not null default 'daily_improvement',
  action text not null,
  expected_impact numeric,
  reason text,
  evidence_ids jsonb not null default '[]'::jsonb,
  status text not null default 'proposal',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_weight_proposals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  dimension text not null,
  value text not null,
  proposed_delta numeric not null default 0,
  reason text,
  sample_size numeric,
  confidence numeric,
  status text not null default 'proposal',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_experiment_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ratio numeric not null default 0.15,
  target_count numeric,
  candidates jsonb not null default '[]'::jsonb,
  rule text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_learning_events_user_posted on public.ai_learning_events(user_id, posted_at desc);
create index if not exists idx_ai_knowledge_base_user_type on public.ai_knowledge_base(user_id, type, confidence desc);
create index if not exists idx_ai_patterns_user_type on public.ai_patterns(user_id, pattern_type, score desc);
create index if not exists idx_ai_weight_proposals_user_status on public.ai_weight_proposals(user_id, status, confidence desc);

alter table public.ai_phase4_runs enable row level security;
alter table public.ai_learning_events enable row level security;
alter table public.ai_knowledge_base enable row level security;
alter table public.ai_patterns enable row level security;
alter table public.ai_improvement_proposals enable row level security;
alter table public.ai_weight_proposals enable row level security;
alter table public.ai_experiment_plans enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'ai_phase4_runs',
    'ai_learning_events',
    'ai_knowledge_base',
    'ai_patterns',
    'ai_improvement_proposals',
    'ai_weight_proposals',
    'ai_experiment_plans'
  ]
  loop
    execute format('drop policy if exists "%1$s owner access" on public.%1$I', table_name);
    execute format('create policy "%1$s owner access" on public.%1$I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name);
  end loop;
end $$;
