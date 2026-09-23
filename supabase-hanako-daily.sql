-- Run once in the Supabase SQL editor. The existing private photo bucket is reused.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table if not exists public.hanako_auto_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  instagram_enabled boolean not null default false,
  threads_enabled boolean not null default false,
  instagram_time time not null default '08:00',
  threads_time time not null default '18:00',
  photo_consent boolean not null default false,
  reference_path text not null default '',
  look jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint reference_owned check (reference_path = '' or reference_path like user_id::text || '/%')
);

create table if not exists public.hanako_auto_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('Instagram', 'Threads')),
  local_date date not null,
  status text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'failed', 'publishing', 'published', 'publish_uncertain')),
  reference_path text not null,
  look jsonb not null default '{}'::jsonb,
  caption text not null default '',
  image_paths text[] not null default '{}',
  error text not null default '',
  published_id text not null default '',
  attempts integer not null default 0,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, local_date),
  constraint draft_reference_owned check (reference_path like user_id::text || '/%')
);

create index if not exists hanako_auto_drafts_owner_recent on public.hanako_auto_drafts(user_id, created_at desc);
create index if not exists hanako_auto_drafts_work on public.hanako_auto_drafts(status, lease_until, created_at);
alter table public.hanako_auto_settings enable row level security;
alter table public.hanako_auto_drafts enable row level security;
grant select, insert, update on public.hanako_auto_settings to authenticated;
grant select, update(caption) on public.hanako_auto_drafts to authenticated;

drop policy if exists hanako_auto_settings_owner on public.hanako_auto_settings;
create policy hanako_auto_settings_owner on public.hanako_auto_settings
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists hanako_auto_drafts_owner on public.hanako_auto_drafts;
create policy hanako_auto_drafts_owner on public.hanako_auto_drafts
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists hanako_auto_drafts_caption_owner on public.hanako_auto_drafts;
create policy hanako_auto_drafts_caption_owner on public.hanako_auto_drafts
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- The cron worker leases exactly one image job per run. This keeps each request
-- below Edge Function timeouts and makes overlapping invocations safe.
create or replace function public.hanako_claim_daily_image(owner_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  today_jst date := (now() at time zone 'Asia/Tokyo')::date;
  time_jst time := (now() at time zone 'Asia/Tokyo')::time;
  candidate public.hanako_auto_drafts%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  insert into public.hanako_auto_drafts(user_id, platform, local_date, reference_path, look)
  select s.user_id, 'Instagram', today_jst, s.reference_path, s.look
  from public.hanako_auto_settings s
  where s.user_id = owner_id and s.instagram_enabled and s.photo_consent and s.instagram_time <= time_jst and s.reference_path <> ''
  on conflict (user_id, platform, local_date) do nothing;
  insert into public.hanako_auto_drafts(user_id, platform, local_date, reference_path, look)
  select s.user_id, 'Threads', today_jst, s.reference_path, s.look
  from public.hanako_auto_settings s
  where s.user_id = owner_id and s.threads_enabled and s.photo_consent and s.threads_time <= time_jst and s.reference_path <> ''
  on conflict (user_id, platform, local_date) do nothing;

  select * into candidate from public.hanako_auto_drafts
  where status in ('pending', 'generating')
    and user_id = owner_id
    and (lease_until is null or lease_until < now())
    and cardinality(image_paths) < 3
    and exists (select 1 from public.hanako_auto_settings s
      where s.user_id = hanako_auto_drafts.user_id and s.photo_consent
        and ((hanako_auto_drafts.platform = 'Instagram' and s.instagram_enabled)
          or (hanako_auto_drafts.platform = 'Threads' and s.threads_enabled)))
  order by created_at, id
  for update skip locked limit 1;
  if not found then return null; end if;
  update public.hanako_auto_drafts
  set status = 'generating', lease_until = now() + interval '4 minutes',
      attempts = attempts + 1, updated_at = now()
  where id = candidate.id;
  return to_jsonb(candidate);
end;
$$;
revoke all on function public.hanako_claim_daily_image(uuid) from public, anon, authenticated;
grant execute on function public.hanako_claim_daily_image(uuid) to service_role;

create or replace function public.hanako_begin_publish(draft_id uuid, owner_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare candidate public.hanako_auto_drafts%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  select * into candidate from public.hanako_auto_drafts
    where id = draft_id and user_id = owner_id for update;
  if not found then raise exception 'draft not found'; end if;
  if candidate.status <> 'ready' or cardinality(candidate.image_paths) <> 3 or trim(candidate.caption) = '' then
    raise exception 'draft is not ready';
  end if;
  update public.hanako_auto_drafts set status = 'publishing', updated_at = now() where id = draft_id;
  return to_jsonb(candidate);
end;
$$;
revoke all on function public.hanako_begin_publish(uuid, uuid) from public, anon, authenticated;
grant execute on function public.hanako_begin_publish(uuid, uuid) to service_role;

-- Set Vault secrets first, then uncomment and run the schedule statement.
-- select vault.create_secret('https://YOUR_PROJECT.supabase.co/functions/v1/hanako-daily', 'hanako_daily_url');
-- select vault.create_secret('YOUR_LONG_RANDOM_CRON_SECRET', 'hanako_daily_cron_secret');
-- select vault.create_secret('YOUR_PROJECT_LEGACY_ANON_KEY', 'hanako_daily_anon_key');
-- select cron.schedule('hanako-daily-minute', '* * * * *', $$
--   select net.http_post(
--     url := (select decrypted_secret from vault.decrypted_secrets where name = 'hanako_daily_url'),
--     headers := jsonb_build_object('Content-Type','application/json',
--       'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'hanako_daily_anon_key'),
--       'apikey',(select decrypted_secret from vault.decrypted_secrets where name = 'hanako_daily_anon_key'),
--       'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name = 'hanako_daily_cron_secret')),
--     body := '{"action":"run"}'::jsonb
--   ) where exists (
--     select 1 from public.hanako_auto_settings
--     where photo_consent and reference_path <> '' and (instagram_enabled or threads_enabled)
--   );
-- $$);
