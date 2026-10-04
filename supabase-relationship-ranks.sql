begin;
create index if not exists hanako_reply_owner_parent on public.hanako_reply_comments(user_id,parent_id) where is_owner;
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
notify pgrst,'reload schema';
commit;
