begin;
alter table public.hanako_reply_settings add column if not exists ng_users text[] not null default '{}';
alter table public.hanako_reply_settings add column if not exists ng_words text[] not null default '{}';
alter table public.hanako_reply_comments add column if not exists reply_due_at timestamptz;
create or replace function public.hanako_reply_assign_due()
returns trigger language plpgsql set search_path='' as $$
begin
  if not new.is_owner and new.reply_due_at is null then
    new.reply_due_at:=new.commented_at+make_interval(secs=>300+floor(random()*2401)::integer);
  end if;
  return new;
end $$;
drop trigger if exists hanako_reply_due on public.hanako_reply_comments;
create trigger hanako_reply_due before insert on public.hanako_reply_comments for each row execute function public.hanako_reply_assign_due();
update public.hanako_reply_comments set reply_due_at=commented_at+make_interval(secs=>300+floor(random()*2401)::integer)
where not is_owner and reply_due_at is null and status in ('pending','failed','draft','generating');
create or replace function public.hanako_reply_apply_exclusions(owner_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare s public.hanako_reply_settings%rowtype; affected integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  select * into s from public.hanako_reply_settings where user_id=owner_id;
  update public.hanako_reply_comments c set status='skipped',next_attempt_at=null,
    error=case when exists(select 1 from unnest(s.ng_users) u where lower(ltrim(btrim(normalize(u,NFKC)),'@'))=lower(ltrim(btrim(normalize(c.username,NFKC)),'@')))
      then 'NG対象者のため自動返信しません' else 'NGワードを含むため自動返信しません' end
  where c.user_id=owner_id and not c.is_owner and c.container_id is null and c.reply_id is null and c.status in ('pending','failed','draft')
  and (exists(select 1 from unnest(s.ng_users) u where lower(ltrim(btrim(normalize(u,NFKC)),'@'))=lower(ltrim(btrim(normalize(c.username,NFKC)),'@')))
    or exists(select 1 from unnest(s.ng_words) w where btrim(w)<>'' and position(lower(btrim(normalize(w,NFKC))) in lower(normalize(c.comment_text,NFKC)))>0));
  get diagnostics affected=row_count;
  return affected;
end $$;
revoke all on function public.hanako_reply_apply_exclusions(uuid) from public,anon,authenticated;
grant execute on function public.hanako_reply_apply_exclusions(uuid) to service_role;
create or replace function public.hanako_reply_claim(owner_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare candidate public.hanako_reply_comments%rowtype;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  perform public.hanako_reply_apply_exclusions(owner_id);
  select * into candidate from public.hanako_reply_comments
    where user_id=owner_id and not is_owner and container_id is null and reply_id is null
    and (status='pending' or (status='failed' and generation_attempts<3 and next_attempt_at<=now()))
    and reply_due_at<=now()
    order by reply_due_at,commented_at for update skip locked limit 1;
  if not found then return null; end if;
  update public.hanako_reply_comments set status='generating',generation_attempts=generation_attempts+1,next_attempt_at=null,error=''
    where user_id=owner_id and comment_id=candidate.comment_id returning * into candidate;
  return to_jsonb(candidate);
end $$;
notify pgrst,'reload schema';
commit;
