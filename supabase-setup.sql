create table if not exists public.hanako_app_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.hanako_app_data enable row level security;

grant select, insert, update on public.hanako_app_data to authenticated;

drop policy if exists "Users can read their own Hanako data" on public.hanako_app_data;
drop policy if exists "Users can create their own Hanako data" on public.hanako_app_data;
drop policy if exists "Users can update their own Hanako data" on public.hanako_app_data;

create policy "Users can read their own Hanako data"
on public.hanako_app_data for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own Hanako data"
on public.hanako_app_data for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own Hanako data"
on public.hanako_app_data for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
