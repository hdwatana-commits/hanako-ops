create or replace function public.hanako_reply_claim_comment(owner_id uuid,target_comment_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare candidate public.hanako_reply_comments%rowtype;
begin
 if auth.jwt()->>'role' is distinct from 'service_role' then raise exception 'service role required'; end if;
 perform public.hanako_reply_apply_exclusions(owner_id);
 select * into candidate from public.hanako_reply_comments
 where user_id=owner_id and comment_id=target_comment_id and not is_owner and container_id is null and reply_id is null
 and (status='pending' or (status='failed' and generation_attempts<3 and next_attempt_at<=now()))
 and reply_due_at<=now() for update skip locked limit 1;
 if not found then return null; end if;
 update public.hanako_reply_comments set status='generating',generation_attempts=generation_attempts+1,next_attempt_at=null,error=''
 where user_id=owner_id and comment_id=candidate.comment_id returning * into candidate;
 return to_jsonb(candidate);
end $$;
revoke all on function public.hanako_reply_claim_comment(uuid,text) from public,anon,authenticated;
grant execute on function public.hanako_reply_claim_comment(uuid,text) to service_role;
notify pgrst,'reload schema';
