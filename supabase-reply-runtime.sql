-- Private owner reply state. Existing ownership, RLS and grants are preserved.
alter table public.hanako_reply_comments add column if not exists reply_runtime jsonb not null default '{}'::jsonb;
comment on column public.hanako_reply_comments.reply_runtime is 'Processing checkpoint and media selection/retry reason for reliable owner replies.';
create or replace function public.hanako_reply_health(owner_id uuid,post_ids text[])
returns jsonb language sql stable security invoker set search_path=public as $$
 with scoped as (
  select * from public.hanako_reply_comments c where c.user_id=owner_id and not c.is_owner and c.post_id=any(post_ids)
 ), attention as (
  select * from scoped where (status='failed' and next_attempt_at is null) or status='uncertain'
   or (status in ('generating','draft') and coalesce((reply_runtime->>'started_at')::timestamptz,created_at)<now()-interval '5 minutes')
 ), overdue as (
  select * from scoped where status='pending' and reply_due_at<=now()
 ) select jsonb_build_object(
  'overdue',(select count(*) from overdue),
  'preparing',(select count(*) from scoped where status='publishing'),
  'attention',(select count(*) from attention),
  'oldest_due',(select min(reply_due_at) from overdue),
  'attention_replies',coalesce((select jsonb_agg(t) from(select * from attention order by commented_at limit 50)t),'[]'::jsonb),
  'overdue_replies',coalesce((select jsonb_agg(t) from(select * from overdue order by reply_due_at limit 50)t),'[]'::jsonb)
 );
$$;
revoke all on function public.hanako_reply_health(uuid,text[]) from public,anon,authenticated;
grant execute on function public.hanako_reply_health(uuid,text[]) to service_role;
-- Allow the bounded batch to finish its in-flight request before pg_net disconnects.
do $$
declare job record;
begin
 for job in select jobid,command from cron.job where jobname='hanako-threads-replies' loop
  if job.command ~ 'timeout_milliseconds\s*:=\s*[0-9]+' then
   perform cron.alter_job(job_id:=job.jobid,command:=regexp_replace(job.command,'timeout_milliseconds\s*:=\s*[0-9]+','timeout_milliseconds := 120000'));
  end if;
 end loop;
end $$;
notify pgrst,'reload schema';
