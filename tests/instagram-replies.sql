begin;
do $$
declare owner_uuid uuid; claimed jsonb;
begin
 select user_id into strict owner_uuid from public.hanako_reply_settings;
 insert into public.hanako_ig_reply_queue(user_id,media_id,author_id,username,comment_id,commented_at,status)
 values(owner_uuid,'_ig_test_media','_ig_test_author','guest','_ig_test_first',now(),'pending');
 insert into public.hanako_ig_reply_queue(user_id,media_id,author_id,username,comment_id,commented_at,status)
 values(owner_uuid,'_ig_test_media','_ig_test_author','renamed_guest','_ig_test_second',now(),'pending') on conflict(user_id,media_id,author_id) do nothing;
 if (select count(*) from public.hanako_ig_reply_queue where user_id=owner_uuid and media_id='_ig_test_media')<>1 then raise exception 'Duplicate person on same post';end if;
 claimed:=public.hanako_ig_claim_pair(owner_uuid,'_ig_test_media','_ig_test_author');
 if claimed->>'comment_id'<>'_ig_test_first' then raise exception 'Did not claim first comment';end if;
 if public.hanako_ig_claim_pair(owner_uuid,'_ig_test_media','_ig_test_author') is not null then raise exception 'Concurrent duplicate claim';end if;
 update public.hanako_ig_reply_queue set status='published' where user_id=owner_uuid and media_id='_ig_test_media';
 if public.hanako_ig_claim_pair(owner_uuid,'_ig_test_media','_ig_test_author') is not null then raise exception 'Published response reclaimed';end if;
end $$;
rollback;
