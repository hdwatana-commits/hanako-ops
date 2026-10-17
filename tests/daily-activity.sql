begin;
do $$
declare owner_uuid uuid; first_plan jsonb; second_plan jsonb;
begin
 select user_id into strict owner_uuid from public.hanako_reply_settings;
 first_plan:=public.hanako_daily_activity_get(owner_uuid,'2026-10-17');
 second_plan:=public.hanako_daily_activity_get(owner_uuid,'2026-10-17');
 if first_plan<>second_plan then raise exception 'Daily setting changed';end if;
 if first_plan->>'day_kind'<>'holiday' then raise exception 'Saturday classification failed';end if;
 if public.hanako_daily_activity_get(owner_uuid,'2026-10-18')->>'day_kind'<>'holiday' then raise exception 'Sunday classification failed';end if;
 if public.hanako_daily_activity_get(owner_uuid,'2026-10-19')->>'activity_code'<>'work' then raise exception 'Weekday classification failed';end if;
 if public.hanako_daily_activity_get(owner_uuid,'2026-10-12')->>'holiday_name'<>'スポーツの日' then raise exception 'Public holiday classification failed';end if;
 if public.hanako_daily_activity_get(owner_uuid,'2026-05-06')->>'day_kind'<>'holiday' then raise exception 'Substitute holiday classification failed';end if;
 if public.hanako_daily_activity_get(owner_uuid,'2026-09-22')->>'day_kind'<>'holiday' then raise exception 'Citizens holiday classification failed';end if;
end $$;
rollback;
