-- Service-only aggregate: preserve all existing GIF history and avoid a time/window cutoff.
create index if not exists hanako_reply_gif_user_history_idx
 on public.hanako_reply_comments(user_id,lower(username),reply_published_at desc)
 where is_owner=false and status='published' and reply_gif is not null;

create or replace function public.hanako_reply_gif_usage(owner_id uuid,fan_username text)
returns jsonb language sql stable security invoker set search_path=public as $$
 with usage as (
  select c.reply_gif->>'gif_id' as gif_id,count(*) as uses,max(c.reply_published_at) as last_used_at
  from public.hanako_reply_comments c
  where c.user_id=owner_id and lower(c.username)=lower(fan_username)
    and c.is_owner=false and c.status='published' and c.reply_gif is not null
    and c.reply_gif->>'gif_id' ~ '^[a-zA-Z0-9]{1,100}$'
  group by c.reply_gif->>'gif_id'
 ), packed as (
  select coalesce(jsonb_agg(jsonb_build_object('gif_id',gif_id,'uses',uses,'last_used_at',last_used_at)
    order by last_used_at desc nulls last,gif_id),'[]'::jsonb) as entries from usage
 )
 select jsonb_build_object('usage',entries,'last_gif_id',entries->0->>'gif_id') from packed;
$$;
revoke all on function public.hanako_reply_gif_usage(uuid,text) from public,anon,authenticated;
grant execute on function public.hanako_reply_gif_usage(uuid,text) to service_role;
notify pgrst,'reload schema';
