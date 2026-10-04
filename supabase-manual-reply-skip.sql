begin;
alter table public.hanako_reply_comments drop constraint if exists hanako_reply_comments_status_check;
alter table public.hanako_reply_comments add constraint hanako_reply_comments_status_check check(status in ('history','pending','generating','draft','publishing','published','failed','uncertain','skipped'));
update public.hanako_reply_comments c set status='skipped',error='本人が返信済みのためスキップしました',next_attempt_at=null
where c.status in ('pending','failed','draft') and c.container_id is null and c.reply_id is null
and exists(select 1 from public.hanako_reply_comments r where r.user_id=c.user_id and r.is_owner and r.parent_id=c.comment_id);
notify pgrst,'reload schema';
commit;
