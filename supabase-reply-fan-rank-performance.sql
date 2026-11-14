CREATE OR REPLACE FUNCTION public.hanako_reply_fans(owner_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      count(*) filter(where status='published' or owned.parent_id is not null) as replies, max(commented_at) as last_seen
      from hanako_reply_comments c
      left join (select distinct parent_id from hanako_reply_comments where user_id=owner_id and is_owner and parent_id is not null) owned on owned.parent_id=c.comment_id
      where c.user_id=owner_id and not c.is_owner
      and auth.role()='service_role' group by username) t
  ) r
$function$;
