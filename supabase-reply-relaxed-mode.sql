alter table public.hanako_reply_settings drop constraint hanako_reply_settings_delay_mode_check;
alter table public.hanako_reply_settings add constraint hanako_reply_settings_delay_mode_check check(delay_mode in ('normal','instant','relaxed'));
create or replace function public.hanako_reply_assign_due()
returns trigger language plpgsql set search_path='' as $$
declare speed text;
begin
 if not new.is_owner and new.reply_due_at is null then
  select delay_mode into speed from public.hanako_reply_settings where user_id=new.user_id;
  new.reply_due_at:=new.commented_at+make_interval(secs=>case when speed='instant' then 180 when speed='relaxed' then 3600+floor(random()*3601)::integer else 300+floor(random()*2401)::integer end);
 end if;
 return new;
end $$;
create or replace function public.hanako_reply_reschedule_speed()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.delay_mode is distinct from old.delay_mode then
  update public.hanako_reply_comments set reply_due_at=commented_at+make_interval(secs=>case when new.delay_mode='instant' then 180 when new.delay_mode='relaxed' then 3600+floor(random()*3601)::integer else 300+floor(random()*2401)::integer end)
  where user_id=new.user_id and not is_owner and status in ('pending','failed') and container_id is null and reply_id is null;
 end if;
 return new;
end $$;
