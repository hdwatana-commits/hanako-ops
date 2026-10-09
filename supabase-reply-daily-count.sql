begin;
alter table public.hanako_reply_comments add column if not exists reply_published_at timestamptz;
alter table public.hanako_reply_comments add column if not exists reply_automatic boolean;
update public.hanako_reply_comments c set reply_published_at=r.commented_at
from public.hanako_reply_comments r
where c.user_id=r.user_id and c.reply_id=r.comment_id and r.is_owner and c.status='published' and c.reply_published_at is null;
create index if not exists hanako_reply_daily_posts on public.hanako_reply_comments(user_id,reply_published_at) include(reply_automatic) where status='published' and not is_owner;
create index if not exists hanako_reply_published_id on public.hanako_reply_comments(user_id,reply_id) where status='published';
create or replace function public.hanako_reply_sync_owner_timestamp()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.is_owner then
  update public.hanako_reply_comments set reply_published_at=new.commented_at
  where user_id=new.user_id and reply_id=new.comment_id and status='published';
 end if;
 return new;
end $$;
create trigger hanako_reply_owner_timestamp after insert on public.hanako_reply_comments for each row execute function public.hanako_reply_sync_owner_timestamp();
create or replace function public.hanako_reply_daily_counts(owner_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare day_start timestamptz; day_end timestamptz; result jsonb;
begin
 if auth.jwt()->>'role' is distinct from 'service_role' then raise exception 'service role required'; end if;
 day_start:=((now() at time zone 'Asia/Tokyo')::date)::timestamp at time zone 'Asia/Tokyo';
 day_end:=(((now() at time zone 'Asia/Tokyo')::date+1)::timestamp at time zone 'Asia/Tokyo');
 select jsonb_build_object('date',(now() at time zone 'Asia/Tokyo')::date,'automatic',count(*) filter(where reply_automatic=true),'legacy',count(*) filter(where reply_automatic is null)) into result
 from public.hanako_reply_comments where user_id=owner_id and not is_owner and status='published' and reply_published_at>=day_start and reply_published_at<day_end;
 return result;
end $$;
revoke all on function public.hanako_reply_daily_counts(uuid) from public,anon,authenticated;
grant execute on function public.hanako_reply_daily_counts(uuid) to service_role;
notify pgrst,'reload schema';
commit;
