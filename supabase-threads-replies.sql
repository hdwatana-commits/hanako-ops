-- Apply in the existing HanakoOPS Supabase project.
create table if not exists public.hanako_reply_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  mode text not null default 'draft' check (mode in ('draft','auto')),
  start_time time not null default '09:00', end_time time not null default '23:00',
  weekdays integer[] not null default '{0,1,2,3,4,5,6}' check (weekdays <@ array[0,1,2,3,4,5,6]),
  delay_minutes integer not null default 5 check (delay_minutes between 0 and 1440),
  tones text[] not null default '{cute}' check (cardinality(tones) between 1 and 5 and tones <@ array['calm','friendly','energetic','cute','flirty']),
  adapt_tone boolean not null default true,
  custom_prompt text not null default '' check (length(custom_prompt) <= 8000),
  max_chars integer not null default 180 check (max_chars between 20 and 500),
  use_history boolean not null default true,
  started_at timestamptz not null default now(),
  scan_after text, scan_posts jsonb not null default '[]', scan_comment_after text,
  lease_until timestamptz, last_run timestamptz, last_error text not null default '', ai_retry_at timestamptz
);
create table if not exists public.hanako_reply_comments (
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_id text not null, post_id text not null, parent_id text,
  username text not null, comment_text text not null default '', post_text text not null default '',
  commented_at timestamptz not null, is_owner boolean not null default false,
  status text not null check (status in ('history','pending','generating','draft','publishing','published','failed','uncertain')),
  reply_text text not null default '', reply_id text, container_id text,
  error text not null default '', created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);
create index if not exists hanako_reply_queue on public.hanako_reply_comments(user_id,status,commented_at);
create index if not exists hanako_reply_people on public.hanako_reply_comments(user_id,username,commented_at desc);
alter table public.hanako_reply_settings enable row level security;
alter table public.hanako_reply_comments enable row level security;
drop policy if exists reply_settings_read on public.hanako_reply_settings;
create policy reply_settings_read on public.hanako_reply_settings for select to authenticated using (auth.uid()=user_id);
drop policy if exists reply_comments_read on public.hanako_reply_comments;
create policy reply_comments_read on public.hanako_reply_comments for select to authenticated using (auth.uid()=user_id);
revoke all on public.hanako_reply_settings, public.hanako_reply_comments from anon, authenticated;
grant select on public.hanako_reply_settings, public.hanako_reply_comments to authenticated;
grant all on public.hanako_reply_settings, public.hanako_reply_comments to service_role;

create or replace function public.hanako_reply_lock(owner_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  update hanako_reply_settings set lease_until=now()+interval '5 minutes'
    where user_id=owner_id and (lease_until is null or lease_until<now());
  return found;
end $$;
create or replace function public.hanako_reply_claim(owner_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare candidate hanako_reply_comments%rowtype; settings hanako_reply_settings%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  select * into settings from hanako_reply_settings where user_id=owner_id;
  select * into candidate from hanako_reply_comments
    where user_id=owner_id and status='pending' and commented_at<=now()-make_interval(mins=>settings.delay_minutes)
    order by commented_at for update skip locked limit 1;
  if not found then return null; end if;
  update hanako_reply_comments set status='generating' where user_id=owner_id and comment_id=candidate.comment_id;
  return to_jsonb(candidate);
end $$;
create or replace function public.hanako_reply_fans(owner_id uuid)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(r) order by r.position), '[]'::jsonb) from (
    select username, comments, active_days, replies, last_seen,
      comments + active_days*3 as score,
      dense_rank() over(order by comments+active_days*3 desc) as position,
      case when comments+active_days*3>=100 then 'プラチナ' when comments+active_days*3>=40 then 'ゴールド'
        when comments+active_days*3>=15 then 'シルバー' else 'ブロンズ' end as fan_rank
    from (select username, count(*) as comments,
      count(distinct (commented_at at time zone 'Asia/Tokyo')::date) as active_days,
      count(*) filter(where status='published') as replies, max(commented_at) as last_seen
      from hanako_reply_comments where user_id=owner_id and not is_owner
      and auth.role()='service_role' group by username) t
  ) r
$$;
revoke all on function public.hanako_reply_lock(uuid), public.hanako_reply_claim(uuid), public.hanako_reply_fans(uuid) from public, anon, authenticated;
grant execute on function public.hanako_reply_lock(uuid), public.hanako_reply_claim(uuid), public.hanako_reply_fans(uuid) to service_role;

-- Configure Vault secrets before running this optional cron example.
-- Keep JWT verification ON for the Edge Function; use the project's legacy anon JWT for cron.
-- select vault.create_secret('https://YOUR_PROJECT.supabase.co/functions/v1/threads-replies','hanako_reply_url');
-- select vault.create_secret('YOUR_LONG_RANDOM_SECRET','hanako_reply_cron_secret');
-- select vault.create_secret('YOUR_LEGACY_ANON_JWT','hanako_reply_anon_key');
-- select cron.schedule('hanako-threads-replies','* * * * *', $$
-- select net.http_post(
--   url := (select decrypted_secret from vault.decrypted_secrets where name='hanako_reply_url'),
--   headers := jsonb_build_object('Content-Type','application/json',
--     'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hanako_reply_anon_key'),
--     'apikey',(select decrypted_secret from vault.decrypted_secrets where name='hanako_reply_anon_key'),
--     'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='hanako_reply_cron_secret')),
--   body := '{"action":"run"}'::jsonb
-- ) where exists(select 1 from public.hanako_reply_settings where enabled);
-- $$);
