create or replace function public.hanako_fan_auto_save(owner_id uuid, fan_username text, profile_data jsonb)
returns void language sql security invoker set search_path=public as $$
 insert into public.hanako_fan_profiles as saved(user_id,username,auto_profile)
 values(owner_id,fan_username,profile_data)
 on conflict(user_id,username) do update set
   auto_profile=excluded.auto_profile || coalesce((
     select jsonb_object_agg(field.key,field.value)
     from jsonb_each(saved.auto_profile) as field
     where field.key in ('nickname','nickname_stop')
       and (
         not (excluded.auto_profile ? field.key)
         or nullif(field.value->>'at','')::timestamptz >
            nullif(excluded.auto_profile->field.key->>'at','')::timestamptz
       )
   ),'{}'::jsonb),
   updated_at=now();
$$;
revoke all on function public.hanako_fan_auto_save(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.hanako_fan_auto_save(uuid,text,jsonb) to service_role;
