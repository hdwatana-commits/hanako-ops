create table if not exists public.hanako_fan_profiles (
 user_id uuid not null references auth.users(id) on delete cascade,
 username text not null,
 auto_profile jsonb not null default '{}'::jsonb,
 manual_notes text not null default '' check(length(manual_notes)<=4000),
 use_notes boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(user_id,username)
);
alter table public.hanako_fan_profiles enable row level security;
revoke all on public.hanako_fan_profiles from anon,authenticated;
grant all on public.hanako_fan_profiles to service_role;
create or replace function public.hanako_fan_auto_save(owner_id uuid, fan_username text, profile_data jsonb)
returns void language sql security invoker set search_path=public as $$
 insert into public.hanako_fan_profiles(user_id,username,auto_profile)
 values(owner_id,fan_username,profile_data)
 on conflict(user_id,username) do update set auto_profile=excluded.auto_profile,updated_at=now();
$$;
revoke all on function public.hanako_fan_auto_save(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.hanako_fan_auto_save(uuid,text,jsonb) to service_role;
