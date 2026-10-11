create or replace function public.hanako_reply_analytics(owner_id uuid)
returns jsonb language sql stable security invoker set search_path=public as $$
with bounds as (
 select (date_trunc('day',now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo') as today
), periods as (
 select n, today-(n+1)*interval '7 days' as start_at,today-n*interval '7 days' as end_at from bounds cross join generate_series(0,1)n
), first_seen as (
 select lower(username) as username,min(commented_at) as first_at from hanako_reply_comments where user_id=owner_id and not is_owner group by 1
), stats as (
 select p.*,
 (select count(*) from hanako_reply_comments c where c.user_id=owner_id and not c.is_owner and c.commented_at>=p.start_at and c.commented_at<p.end_at) as comments,
 (select count(distinct lower(c.username)) from hanako_reply_comments c where c.user_id=owner_id and not c.is_owner and c.commented_at>=p.start_at and c.commented_at<p.end_at) as people,
 (select count(*) from hanako_reply_comments c where c.user_id=owner_id and c.status='published' and c.reply_automatic is true and c.reply_published_at>=p.start_at and c.reply_published_at<p.end_at) as auto_replies,
 (select count(*) from hanako_reply_comments c where c.user_id=owner_id and c.status='published' and c.reply_automatic is null and c.reply_published_at>=p.start_at and c.reply_published_at<p.end_at) as unclassified_replies,
 (select percentile_cont(0.5) within group(order by extract(epoch from (c.reply_published_at-c.commented_at))/60) from hanako_reply_comments c where c.user_id=owner_id and c.status='published' and c.reply_automatic is true and c.reply_published_at>=p.start_at and c.reply_published_at<p.end_at and c.reply_published_at>=c.commented_at) as median_minutes,
 (select count(*) from hanako_reply_comments c where c.user_id=owner_id and c.status='published' and c.reply_automatic is true and c.reply_published_at>=p.start_at and c.reply_published_at<p.end_at and c.reply_published_at<=now()-interval '48 hours') as conversation_eligible,
 (select count(*) from hanako_reply_comments c where c.user_id=owner_id and c.status='published' and c.reply_automatic is true and c.reply_published_at>=p.start_at and c.reply_published_at<p.end_at and c.reply_published_at<=now()-interval '48 hours' and exists(select 1 from hanako_reply_comments r where r.user_id=owner_id and not r.is_owner and lower(r.username)=lower(c.username) and r.parent_id=c.reply_id and r.commented_at>c.reply_published_at and r.commented_at<=c.reply_published_at+interval '48 hours')) as conversation_returned,
 (select count(*) from hanako_reply_comments c where c.user_id=owner_id and c.status='published' and c.reply_automatic is true and c.reply_published_at>=p.start_at and c.reply_published_at<p.end_at and c.reply_published_at>now()-interval '48 hours') as conversation_waiting,
 -- Shift revisit cohorts back seven days so every person has a full observation window.
 (select count(*) from first_seen f where f.first_at>=p.start_at-interval '7 days' and f.first_at<p.end_at-interval '7 days') as revisit_eligible,
 (select count(*) from first_seen f where f.first_at>=p.start_at-interval '7 days' and f.first_at<p.end_at-interval '7 days' and exists(select 1 from hanako_reply_comments r where r.user_id=owner_id and not r.is_owner and lower(r.username)=f.username and r.commented_at>f.first_at and r.commented_at<=f.first_at+interval '7 days' and (r.commented_at at time zone 'Asia/Tokyo')::date>(f.first_at at time zone 'Asia/Tokyo')::date)) as revisit_returned
 from periods p
), daily as (
 select d::date as day,
 (select count(*) from hanako_reply_comments c where c.user_id=owner_id and not c.is_owner and (c.commented_at at time zone 'Asia/Tokyo')::date=d::date) as comments,
 (select count(*) from hanako_reply_comments c where c.user_id=owner_id and c.status='published' and c.reply_automatic is true and (c.reply_published_at at time zone 'Asia/Tokyo')::date=d::date) as auto_replies
 from bounds,generate_series((today at time zone 'Asia/Tokyo')-interval '13 days',today at time zone 'Asia/Tokyo',interval '1 day') d
)
select jsonb_build_object('generated_at',now(),'timezone','Asia/Tokyo',
 'periods',(select jsonb_agg(to_jsonb(s) order by n) from stats s),
 'daily',(select jsonb_agg(to_jsonb(d) order by day) from daily d),
 'coverage',jsonb_build_object('oldest_comment',(select min(commented_at) from hanako_reply_comments where user_id=owner_id and not is_owner),'latest_comment',(select max(commented_at) from hanako_reply_comments where user_id=owner_id and not is_owner)),
 'queue',jsonb_build_object('pending',(select count(*) from hanako_reply_comments where user_id=owner_id and status='pending'),'failed',(select count(*) from hanako_reply_comments where user_id=owner_id and status='failed'),'uncertain',(select count(*) from hanako_reply_comments where user_id=owner_id and status='uncertain')));
$$;
revoke all on function public.hanako_reply_analytics(uuid) from public,anon,authenticated;
grant execute on function public.hanako_reply_analytics(uuid) to service_role;
