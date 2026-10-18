create table if not exists public.hanako_ig_reply_settings(
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 mode text not null default 'auto' check(mode in ('auto','draft')),
 post_limit integer not null default 4 check(post_limit between 1 and 4),
 started_at timestamptz not null default now(),
 activated_at timestamptz,
 scan_offset integer not null default 0,
 lease_until timestamptz,
 last_run timestamptz,
 last_error text not null default ''
);
create table if not exists public.hanako_ig_reply_queue(
 user_id uuid not null references auth.users(id) on delete cascade,
 media_id text not null,
 author_id text not null,
 username text not null,
 comment_id text not null,
 comment_text text not null default '',
 caption text not null default '',
 media_type text not null default '',
 commented_at timestamptz not null,
 reply_due_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','generating','draft','publishing','published','failed','uncertain','skipped')),
 attempts integer not null default 0,
 reply_text text,
 reply_id text,
 error text not null default '',
 updated_at timestamptz not null default now(),
 primary key(user_id,media_id,author_id),unique(user_id,comment_id)
);
alter table public.hanako_ig_reply_settings enable row level security;
alter table public.hanako_ig_reply_queue enable row level security;
revoke all on public.hanako_ig_reply_settings,public.hanako_ig_reply_queue from anon,authenticated;
grant all on public.hanako_ig_reply_settings,public.hanako_ig_reply_queue to service_role;
create or replace function public.hanako_ig_reply_lock(owner_id uuid)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
 update public.hanako_ig_reply_settings set lease_until=now()+interval '5 minutes' where user_id=owner_id and (lease_until is null or lease_until<now());return found;
end $$;
revoke all on function public.hanako_ig_reply_lock(uuid) from public,anon,authenticated;
grant execute on function public.hanako_ig_reply_lock(uuid) to service_role;
create or replace function public.hanako_ig_claim_pair(owner_id uuid,target_media text,target_author text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare row public.hanako_ig_reply_queue;
begin
 update public.hanako_ig_reply_queue set status='generating',attempts=attempts+1,error='',updated_at=now()
 where user_id=owner_id and media_id=target_media and author_id=target_author and status in ('pending','failed') and attempts<3 returning * into row;
 if not found then return null;end if;return to_jsonb(row);
end $$;
revoke all on function public.hanako_ig_claim_pair(uuid,text,text) from public,anon,authenticated;
grant execute on function public.hanako_ig_claim_pair(uuid,text,text) to service_role;
create or replace function public.hanako_ig_reply_due()
returns trigger language plpgsql set search_path='' as $$
declare speed text;
begin
 select delay_mode into speed from public.hanako_reply_settings where user_id=new.user_id;
 new.reply_due_at:=new.commented_at+make_interval(secs=>case when speed='instant' then 180 when speed='relaxed' then 3600+floor(random()*3601)::int else 300+floor(random()*2401)::int end);
 return new;
end $$;
create trigger hanako_ig_reply_due_before before insert on public.hanako_ig_reply_queue for each row execute function public.hanako_ig_reply_due();
