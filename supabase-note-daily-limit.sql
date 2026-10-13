create table if not exists public.hanako_note_daily_usage(
 user_id uuid not null references auth.users(id) on delete cascade,
 username text not null,
 day_jst date not null,
 comment_id text not null,
 reserved_at timestamptz not null default now(),
 primary key(user_id,username,day_jst)
);
alter table public.hanako_note_daily_usage enable row level security;
revoke all on public.hanako_note_daily_usage from anon,authenticated;
grant all on public.hanako_note_daily_usage to service_role;
create or replace function public.hanako_note_available(owner_id uuid,fan_username text)
returns boolean language sql stable security invoker set search_path=public as $$
 select not exists(select 1 from hanako_note_daily_usage where user_id=owner_id and username=lower(fan_username) and day_jst=(now() at time zone 'Asia/Tokyo')::date)
 and not exists(select 1 from hanako_reply_comments c where c.user_id=owner_id and lower(c.username)=lower(fan_username) and not c.is_owner and c.status='published' and (c.reply_published_at at time zone 'Asia/Tokyo')::date=(now() at time zone 'Asia/Tokyo')::date and c.reply_text~*'(note[.]com|\mnote\M|ノート|記事.{0,24}(買|購入))')
 and not exists(select 1 from hanako_reply_comments r join hanako_reply_comments c on c.user_id=r.user_id and c.comment_id=r.parent_id where r.user_id=owner_id and r.is_owner and not c.is_owner and lower(c.username)=lower(fan_username) and (r.commented_at at time zone 'Asia/Tokyo')::date=(now() at time zone 'Asia/Tokyo')::date and r.comment_text~*'(note[.]com|\mnote\M|ノート|記事.{0,24}(買|購入))');
$$;
create or replace function public.hanako_note_claim(owner_id uuid,fan_username text,target_comment_id text)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
 if not public.hanako_note_available(owner_id,fan_username) then return false;end if;
 insert into public.hanako_note_daily_usage(user_id,username,day_jst,comment_id)
 values(owner_id,lower(fan_username),(now() at time zone 'Asia/Tokyo')::date,target_comment_id)
 on conflict do nothing;
 return found;
end $$;
revoke all on function public.hanako_note_available(uuid,text),public.hanako_note_claim(uuid,text,text) from public,anon,authenticated;
grant execute on function public.hanako_note_available(uuid,text),public.hanako_note_claim(uuid,text,text) to service_role;
