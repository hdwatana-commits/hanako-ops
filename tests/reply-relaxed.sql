begin;
do $$
declare owner_uuid uuid; original_due timestamptz;
begin
 select user_id into strict owner_uuid from public.hanako_reply_settings;
 update public.hanako_reply_settings set delay_mode='normal' where user_id=owner_uuid;
 insert into public.hanako_reply_comments(user_id,comment_id,post_id,username,comment_text,commented_at,is_owner,status)
 select owner_uuid,'_relaxed_test_'||n,'_relaxed_test_post','_relaxed_test_user','test',now(),false,'pending' from generate_series(1,100)n;
 update public.hanako_reply_settings set delay_mode='relaxed' where user_id=owner_uuid;
 if exists(select 1 from public.hanako_reply_comments where user_id=owner_uuid and comment_id like '_relaxed_test_%' and (reply_due_at-commented_at<interval '1 hour' or reply_due_at-commented_at>interval '2 hours')) then raise exception 'Rescheduled delay out of range';end if;
 select reply_due_at into original_due from public.hanako_reply_comments where user_id=owner_uuid and comment_id='_relaxed_test_1';
 update public.hanako_reply_settings set delay_mode='relaxed' where user_id=owner_uuid;
 if original_due is distinct from (select reply_due_at from public.hanako_reply_comments where user_id=owner_uuid and comment_id='_relaxed_test_1') then raise exception 'Unchanged mode must not rerandomize';end if;
 insert into public.hanako_reply_comments(user_id,comment_id,post_id,username,comment_text,commented_at,is_owner,status)
 values(owner_uuid,'_relaxed_test_new','_relaxed_test_post','_relaxed_test_user','test',now(),false,'pending');
 if not exists(select 1 from public.hanako_reply_comments where user_id=owner_uuid and comment_id='_relaxed_test_new' and reply_due_at-commented_at between interval '1 hour' and interval '2 hours') then raise exception 'New comment delay out of range';end if;
 update public.hanako_reply_settings set delay_mode='instant' where user_id=owner_uuid;
 if exists(select 1 from public.hanako_reply_comments where user_id=owner_uuid and comment_id like '_relaxed_test_%' and reply_due_at-commented_at<>interval '3 minutes') then raise exception 'Instant mode regression';end if;
end $$;
rollback;
