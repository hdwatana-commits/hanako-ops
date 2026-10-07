-- Apply in the existing HanakoOPS Supabase project.
create table if not exists public.hanako_reply_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  ai_connection text not null default 'default' check (ai_connection in ('default','secondary','third')),
  mode text not null default 'draft' check (mode in ('draft','auto')),
  start_time time not null default '09:00', end_time time not null default '23:00',
  weekdays integer[] not null default '{0,1,2,3,4,5,6}' check (weekdays <@ array[0,1,2,3,4,5,6]),
  delay_minutes integer not null default 5 check (delay_minutes between 0 and 1440),
  tones text[] not null default '{cute}' check (cardinality(tones) between 1 and 5 and tones <@ array['calm','friendly','energetic','cute','flirty']),
  adapt_tone boolean not null default true,
  custom_prompt text not null default '' check (length(custom_prompt) <= 8000),
  max_chars integer not null default 180 check (max_chars between 20 and 500),
  use_history boolean not null default true,
  ng_users text[] not null default '{}', ng_words text[] not null default '{}',
  started_at timestamptz not null default now(),
  scan_after text, scan_posts jsonb not null default '[]', scan_comment_after text,
  live_scan jsonb not null default '{}',
  lease_until timestamptz, last_run timestamptz, last_error text not null default '', ai_retry_at timestamptz
);
create table if not exists public.hanako_reply_comments (
  user_id uuid not null references auth.users(id) on delete cascade,
  comment_id text not null, post_id text not null, parent_id text,
  username text not null, comment_text text not null default '', post_text text not null default '',
  commented_at timestamptz not null, is_owner boolean not null default false,
  status text not null check (status in ('history','pending','generating','draft','publishing','published','failed','uncertain','skipped')),
  reply_text text not null default '', reply_id text, container_id text,
  generation_attempts integer not null default 0, next_attempt_at timestamptz,
  reply_due_at timestamptz,
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
returns jsonb language plpgsql security definer set search_path = '' as $$
declare candidate public.hanako_reply_comments%rowtype; settings public.hanako_reply_settings%rowtype;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  select * into settings from public.hanako_reply_settings where user_id=owner_id;
  select * into candidate from public.hanako_reply_comments
    where user_id=owner_id and not is_owner and container_id is null and reply_id is null
    and (status='pending' or (status='failed' and generation_attempts<3 and next_attempt_at<=now()))
    and commented_at<=now()-make_interval(mins=>settings.delay_minutes)
    order by commented_at for update skip locked limit 1;
  if not found then return null; end if;
  update public.hanako_reply_comments set status='generating',generation_attempts=generation_attempts+1,next_attempt_at=null,error=''
    where user_id=owner_id and comment_id=candidate.comment_id returning * into candidate;
  return to_jsonb(candidate);
end $$;
create or replace function public.hanako_reply_fans(owner_id uuid)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(r) order by r.position), '[]'::jsonb) from (
    select username, comments, active_days, replies, last_seen,
      comments + active_days*3 as score,
      dense_rank() over(order by comments+active_days*3 desc) as position,
      case when comments>=40 and active_days>=10 and replies>=25 then '恋人みたいな距離'
        when comments>=20 and active_days>=5 and replies>=12 then '甘えたくなる存在'
        when comments>=8 and active_days>=3 and replies>=5 then '気になる存在'
        when comments>=3 and active_days>=2 and replies>=2 then '顔なじみ' else 'はじめまして' end as fan_rank
    from (select username, count(*) as comments,
      count(distinct (commented_at at time zone 'Asia/Tokyo')::date) as active_days,
      count(*) filter(where status='published' or exists(select 1 from hanako_reply_comments r where r.user_id=hanako_reply_comments.user_id and r.is_owner and r.parent_id=hanako_reply_comments.comment_id)) as replies, max(commented_at) as last_seen
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


begin;
alter table public.hanako_reply_settings add column if not exists ng_users text[] not null default '{}';
alter table public.hanako_reply_settings add column if not exists ng_words text[] not null default '{}';
alter table public.hanako_reply_comments add column if not exists reply_due_at timestamptz;
create or replace function public.hanako_reply_assign_due()
returns trigger language plpgsql set search_path='' as $$
begin
  if not new.is_owner and new.reply_due_at is null then
    new.reply_due_at:=new.commented_at+make_interval(secs=>300+floor(random()*2401)::integer);
  end if;
  return new;
end $$;
drop trigger if exists hanako_reply_due on public.hanako_reply_comments;
create trigger hanako_reply_due before insert on public.hanako_reply_comments for each row execute function public.hanako_reply_assign_due();
update public.hanako_reply_comments set reply_due_at=commented_at+make_interval(secs=>300+floor(random()*2401)::integer)
where not is_owner and reply_due_at is null and status in ('pending','failed','draft','generating');
create or replace function public.hanako_reply_apply_exclusions(owner_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare s public.hanako_reply_settings%rowtype; affected integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  select * into s from public.hanako_reply_settings where user_id=owner_id;
  update public.hanako_reply_comments c set status='skipped',next_attempt_at=null,
    error=case when exists(select 1 from unnest(s.ng_users) u where lower(ltrim(btrim(normalize(u,NFKC)),'@'))=lower(ltrim(btrim(normalize(c.username,NFKC)),'@')))
      then 'NG対象者のため自動返信しません' else 'NGワードを含むため自動返信しません' end
  where c.user_id=owner_id and not c.is_owner and c.container_id is null and c.reply_id is null and c.status in ('pending','failed','draft')
  and (exists(select 1 from unnest(s.ng_users) u where lower(ltrim(btrim(normalize(u,NFKC)),'@'))=lower(ltrim(btrim(normalize(c.username,NFKC)),'@')))
    or exists(select 1 from unnest(s.ng_words) w where btrim(w)<>'' and position(lower(btrim(normalize(w,NFKC))) in lower(normalize(c.comment_text,NFKC)))>0));
  get diagnostics affected=row_count;
  return affected;
end $$;
revoke all on function public.hanako_reply_apply_exclusions(uuid) from public,anon,authenticated;
grant execute on function public.hanako_reply_apply_exclusions(uuid) to service_role;
create or replace function public.hanako_reply_claim(owner_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare candidate public.hanako_reply_comments%rowtype;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  perform public.hanako_reply_apply_exclusions(owner_id);
  select * into candidate from public.hanako_reply_comments
    where user_id=owner_id and not is_owner and container_id is null and reply_id is null
    and (status='pending' or (status='failed' and generation_attempts<3 and next_attempt_at<=now()))
    and reply_due_at<=now()
    order by reply_due_at,commented_at for update skip locked limit 1;
  if not found then return null; end if;
  update public.hanako_reply_comments set status='generating',generation_attempts=generation_attempts+1,next_attempt_at=null,error=''
    where user_id=owner_id and comment_id=candidate.comment_id returning * into candidate;
  return to_jsonb(candidate);
end $$;
notify pgrst,'reload schema';
commit;
