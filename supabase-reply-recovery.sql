begin;
alter table public.hanako_reply_settings add column if not exists live_scan jsonb not null default '{}';
alter table public.hanako_reply_comments add column if not exists generation_attempts integer not null default 0;
alter table public.hanako_reply_comments add column if not exists next_attempt_at timestamptz;
-- Retry previously failed generations, but never publishing/uncertain containers.
update public.hanako_reply_comments set generation_attempts=1,next_attempt_at=now()+interval '5 minutes'
where status='failed' and generation_attempts=0 and container_id is null and reply_id is null;
create or replace function public.hanako_reply_claim(owner_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare candidate public.hanako_reply_comments%rowtype; settings public.hanako_reply_settings%rowtype;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  select * into settings from public.hanako_reply_settings where user_id=owner_id;
  select * into candidate from public.hanako_reply_comments
    where user_id=owner_id and not is_owner and container_id is null and reply_id is null
    and (status='pending' or (status='failed' and generation_attempts<3 and next_attempt_at<=now()))
    and commented_at<=now()-make_interval(mins=>settings.delay_minutes)
    order by commented_at for update skip locked limit 1;
  if not found then return null; end if;
  update public.hanako_reply_comments set status='generating',generation_attempts=generation_attempts+1,next_attempt_at=null,error=''
    where user_id=owner_id and comment_id=candidate.comment_id returning * into candidate;
  return to_jsonb(candidate);
end $$;
revoke all on function public.hanako_reply_claim(uuid) from public,anon,authenticated;
grant execute on function public.hanako_reply_claim(uuid) to service_role;
do $$
declare job record;
begin
  for job in select jobid,command from cron.job where jobname='hanako-threads-replies' loop
    if position('timeout_milliseconds' in job.command)=0 then
      perform cron.alter_job(job_id:=job.jobid,command:=replace(job.command,'body :=','timeout_milliseconds := 60000, body :='));
    end if;
  end loop;
end $$;
notify pgrst,'reload schema';
commit;
