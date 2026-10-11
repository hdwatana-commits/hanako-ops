-- Transactional integration test; synthetic records are never committed.
begin;
do $$
declare owner_uuid uuid; day_start timestamptz; before_stats jsonb; after_stats jsonb;
begin
 select user_id into strict owner_uuid from public.hanako_reply_settings;
 day_start:=date_trunc('day',now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo';
 before_stats:=public.hanako_reply_analytics(owner_uuid)->'periods'->0;
 insert into public.hanako_reply_comments(user_id,comment_id,post_id,username,comment_text,commented_at,is_owner,status,reply_id,reply_automatic,reply_published_at) values
 (owner_uuid,'_analytics_test_c1','_analytics_test_post','_analytics_test_a','test',day_start-interval '4 days',false,'published','_analytics_test_reply',true,day_start-interval '3 days'),
 (owner_uuid,'_analytics_test_c2','_analytics_test_post','_analytics_test_b','test',day_start-interval '1 day',false,'published','_analytics_test_waiting',true,day_start-interval '1 day');
 insert into public.hanako_reply_comments(user_id,comment_id,post_id,parent_id,username,comment_text,commented_at,is_owner,status) values
 (owner_uuid,'_analytics_test_r1','_analytics_test_post','_analytics_test_reply','_analytics_test_a','test',day_start-interval '3 days'+interval '1 hour',false,'history'),
 (owner_uuid,'_analytics_test_r2','_analytics_test_post','_analytics_test_reply','_analytics_test_other','test',day_start-interval '3 days'+interval '2 hours',false,'history'),
 (owner_uuid,'_analytics_test_r3','_analytics_test_post','_analytics_test_else','_analytics_test_a','test',day_start-interval '3 days'+interval '3 hours',false,'history'),
 (owner_uuid,'_analytics_test_ret1','_analytics_test_post',null,'_analytics_test_ret_a','test',day_start-interval '10 days',false,'history'),
 (owner_uuid,'_analytics_test_ret2','_analytics_test_post',null,'_analytics_test_ret_a','test',day_start-interval '9 days',false,'history'),
 (owner_uuid,'_analytics_test_ret3','_analytics_test_post',null,'_analytics_test_ret_b','test',day_start-interval '11 days',false,'history'),
 (owner_uuid,'_analytics_test_ret4','_analytics_test_post',null,'_analytics_test_ret_b','test',day_start-interval '11 days'+interval '1 hour',false,'history');
 after_stats:=public.hanako_reply_analytics(owner_uuid)->'periods'->0;
 if (after_stats->>'conversation_eligible')::int-(before_stats->>'conversation_eligible')::int<>1 or (after_stats->>'conversation_returned')::int-(before_stats->>'conversation_returned')::int<>1 or (after_stats->>'conversation_waiting')::int-(before_stats->>'conversation_waiting')::int<>1 then raise exception 'Conversation attribution or maturity failed'; end if;
 if (after_stats->>'revisit_eligible')::int-(before_stats->>'revisit_eligible')::int<>2 or (after_stats->>'revisit_returned')::int-(before_stats->>'revisit_returned')::int<>1 then raise exception 'Revisit cohort or distinct-day rule failed'; end if;
end $$;
rollback;
