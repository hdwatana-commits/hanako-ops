begin;
do $$
declare owner_uuid uuid;
begin
 select user_id into strict owner_uuid from public.hanako_reply_settings;
 if not public.hanako_note_available(owner_uuid,'_note_test_a') then raise exception 'Initial allowance failed';end if;
 if not public.hanako_note_claim(owner_uuid,'_note_test_a','_note_test_c1') then raise exception 'First reservation failed';end if;
 if public.hanako_note_claim(owner_uuid,'_NOTE_TEST_A','_note_test_c2') or public.hanako_note_available(owner_uuid,'_note_test_a') then raise exception 'Daily duplicate allowed';end if;
 if not public.hanako_note_claim(owner_uuid,'_note_test_b','_note_test_c3') then raise exception 'Separate person blocked';end if;
 insert into public.hanako_reply_comments(user_id,comment_id,post_id,username,comment_text,commented_at,is_owner,status) values
 (owner_uuid,'_note_test_parent','_note_test_post','_note_test_manual','test',now(),false,'pending');
 insert into public.hanako_reply_comments(user_id,comment_id,post_id,parent_id,username,comment_text,commented_at,is_owner,status) values
 (owner_uuid,'_note_test_reply','_note_test_post','_note_test_parent','owner','https://note.com/hanako47258',now(),true,'history');
 if public.hanako_note_available(owner_uuid,'_note_test_manual') then raise exception 'Collected manual promotion ignored';end if;
end $$;
rollback;
