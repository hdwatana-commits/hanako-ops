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
  manual_requested boolean not null default false,
  attempts integer not null default 0,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, local_date),
  constraint draft_reference_owned check (reference_path like user_id::text || '/%')
);

alter table public.hanako_auto_drafts add column if not exists manual_requested boolean not null default false;

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

create or replace function public.hanako_dispatch_daily_worker()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  worker_url text;
  cron_secret text;
  anon_key text;
begin
  select decrypted_secret into worker_url from vault.decrypted_secrets where name = 'hanako_daily_url' limit 1;
  select decrypted_secret into cron_secret from vault.decrypted_secrets where name = 'hanako_daily_cron_secret' limit 1;
  select decrypted_secret into anon_key from vault.decrypted_secrets where name = 'hanako_daily_anon_key' limit 1;
  if coalesce(worker_url, '') = '' or coalesce(cron_secret, '') = '' or coalesce(anon_key, '') = '' then return false; end if;
  perform net.http_post(
    url := worker_url,
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key, 'apikey', anon_key, 'x-cron-secret', cron_secret),
    body := '{"action":"run"}'::jsonb,
    timeout_milliseconds := 180000
  );
  return true;
end;
$$;
revoke all on function public.hanako_dispatch_daily_worker() from public, anon, authenticated;
grant execute on function public.hanako_dispatch_daily_worker() to service_role;

create or replace function public.hanako_start_daily_drafts(owner_id uuid, platforms text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  settings public.hanako_auto_settings%rowtype;
  draft public.hanako_auto_drafts%rowtype;
  platform_name text;
  created_id uuid;
  target_count integer;
  result jsonb := '[]'::jsonb;
  needs_worker boolean := false;
  dispatched boolean := false;
begin
  if (select auth.role()) is distinct from 'service_role' then raise exception 'service role required'; end if;
  if owner_id is null then raise exception 'owner is required'; end if;
  if platforms is null or cardinality(platforms) not between 1 and 2
    or exists (select 1 from unnest(platforms) p where p is null or p not in ('Instagram', 'Threads'))
    or cardinality(platforms) <> (select count(distinct p) from unnest(platforms) p) then
    raise exception 'select Instagram and/or Threads';
  end if;
  select * into settings from public.hanako_auto_settings where user_id = owner_id for share;
  if not found or not settings.photo_consent then raise exception 'photo consent and saved settings are required'; end if;
  if coalesce(settings.reference_path, '') = ''
    or left(settings.reference_path, length(owner_id::text) + 1) <> owner_id::text || '/'
    or position('/drafts/' in settings.reference_path) > 0 then
    raise exception 'a saved personal reference photo is required';
  end if;
  foreach platform_name in array platforms loop
    target_count := case when settings.look ->> (case when platform_name = 'Instagram' then 'instagramImageCount' else 'threadsImageCount' end) = '4' then 4 else 3 end;
    created_id := null;
    insert into public.hanako_auto_drafts(user_id, platform, local_date, reference_path, look, manual_requested)
    values (owner_id, platform_name, (now() at time zone 'Asia/Tokyo')::date, settings.reference_path,
      (coalesce(settings.look, '{}'::jsonb) - 'chosen' - 'story') || jsonb_build_object('imageCount', target_count, 'manualRequested', true), true)
    on conflict (user_id, platform, local_date) do nothing returning id into created_id;
    select * into strict draft from public.hanako_auto_drafts
      where user_id = owner_id and platform = platform_name and local_date = (now() at time zone 'Asia/Tokyo')::date;
    -- Repeated clicks preserve the caption, images, status and original count.
    if draft.status in ('pending', 'generating', 'failed') then
      -- This column is independent of the look JSON written by an in-flight worker.
      update public.hanako_auto_drafts set manual_requested = true
        where id = draft.id and status in ('pending', 'generating', 'failed');
    end if;
    if draft.status in ('pending', 'generating') then
      needs_worker := true;
    end if;
    result := result || jsonb_build_array(jsonb_build_object('id', draft.id,
      'platform', draft.platform, 'status', draft.status, 'created', created_id is not null,
      'imageCount', case when draft.look ->> 'imageCount' = '4' then 4 else 3 end));
  end loop;
  if needs_worker then dispatched := public.hanako_dispatch_daily_worker(); end if;
  return jsonb_build_object('status', 'queued', 'workerDispatched', dispatched, 'drafts', result);
end;
$$;
revoke all on function public.hanako_start_daily_drafts(uuid, text[]) from public, anon, authenticated;
grant execute on function public.hanako_start_daily_drafts(uuid, text[]) to service_role;

create or replace function public.hanako_claim_daily_image(owner_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  today_jst date := (now() at time zone 'Asia/Tokyo')::date;
  time_jst time := (now() at time zone 'Asia/Tokyo')::time;
  candidate public.hanako_auto_drafts%rowtype;
begin
  if (select auth.role()) is distinct from 'service_role' then raise exception 'service role required'; end if;
  insert into public.hanako_auto_drafts(user_id, platform, local_date, reference_path, look)
  select s.user_id, 'Instagram', today_jst, s.reference_path,
    (s.look - 'chosen' - 'story') || jsonb_build_object('imageCount', case when s.look ->> 'instagramImageCount' = '4' then 4 else 3 end, 'manualRequested', false)
  from public.hanako_auto_settings s
  where s.user_id = owner_id and s.instagram_enabled and s.photo_consent and s.instagram_time <= time_jst and s.reference_path <> ''
  on conflict (user_id, platform, local_date) do nothing;
  insert into public.hanako_auto_drafts(user_id, platform, local_date, reference_path, look)
  select s.user_id, 'Threads', today_jst, s.reference_path,
    (s.look - 'chosen' - 'story') || jsonb_build_object('imageCount', case when s.look ->> 'threadsImageCount' = '4' then 4 else 3 end, 'manualRequested', false)
  from public.hanako_auto_settings s
  where s.user_id = owner_id and s.threads_enabled and s.photo_consent and s.threads_time <= time_jst and s.reference_path <> ''
  on conflict (user_id, platform, local_date) do nothing;

  select * into candidate from public.hanako_auto_drafts d
  where d.status in ('pending', 'generating') and d.user_id = owner_id
    and (d.lease_until is null or d.lease_until < now())
    and cardinality(d.image_paths) < case when d.look ->> 'imageCount' = '4' then 4 else 3 end
    and exists (select 1 from public.hanako_auto_settings s
      where s.user_id = d.user_id and s.photo_consent
        and (d.manual_requested
          or (d.platform = 'Instagram' and s.instagram_enabled)
          or (d.platform = 'Threads' and s.threads_enabled)))
  order by d.created_at, d.id for update skip locked limit 1;
  if not found then return null; end if;
  update public.hanako_auto_drafts set status = 'generating', lease_until = now() + interval '4 minutes',
    attempts = attempts + 1, updated_at = now() where id = candidate.id;
  return to_jsonb(candidate);
end;
$$;
revoke all on function public.hanako_claim_daily_image(uuid) from public, anon, authenticated;
grant execute on function public.hanako_claim_daily_image(uuid) to service_role;

create or replace function public.hanako_begin_publish(draft_id uuid, owner_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare candidate public.hanako_auto_drafts%rowtype;
begin
  if (select auth.role()) is distinct from 'service_role' then raise exception 'service role required'; end if;
  select * into candidate from public.hanako_auto_drafts where id = draft_id and user_id = owner_id for update;
  if not found then raise exception 'draft not found'; end if;
  if candidate.status <> 'ready'
    or cardinality(candidate.image_paths) <> (case when candidate.look ->> 'imageCount' = '4' then 4 else 3 end)
    or trim(candidate.caption) = '' then raise exception 'draft is not ready'; end if;
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
--   select public.hanako_dispatch_daily_worker() where exists (
--     select 1 from public.hanako_auto_settings s
--     where s.photo_consent and s.reference_path <> '' and (s.instagram_enabled or s.threads_enabled or exists (
--       select 1 from public.hanako_auto_drafts d where d.user_id = s.user_id and d.manual_requested
--         and d.status in ('pending', 'generating')
--         and cardinality(d.image_paths) < case when d.look ->> 'imageCount' = '4' then 4 else 3 end))
--   );
-- $$);
