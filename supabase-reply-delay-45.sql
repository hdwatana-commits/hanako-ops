begin;
create or replace function public.hanako_reply_assign_due()
returns trigger language plpgsql set search_path='' as $$
begin
 if not new.is_owner and new.reply_due_at is null then
  new.reply_due_at:=new.commented_at+make_interval(secs=>300+floor(random()*2401)::integer);
 end if;
 return new;
end $$;
update public.hanako_reply_comments set reply_due_at=commented_at+make_interval(secs=>300+floor(random()*2401)::integer)
where not is_owner and status in ('pending','failed') and container_id is null and reply_id is null;
commit;
