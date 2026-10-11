alter table public.hanako_fan_profiles
 add column if not exists manual_nickname text not null default '' check(length(manual_nickname)<=20),
 add column if not exists nickname_enabled boolean not null default true;
