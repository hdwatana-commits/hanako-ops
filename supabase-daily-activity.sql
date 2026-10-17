-- Public holiday source: https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html
create table if not exists public.hanako_jp_holidays(day date primary key,name text not null);
alter table public.hanako_jp_holidays enable row level security;
revoke all on public.hanako_jp_holidays from anon,authenticated;
grant all on public.hanako_jp_holidays to service_role;
insert into public.hanako_jp_holidays(day,name) values
('2026-01-01','元日'),('2026-01-12','成人の日'),('2026-02-11','建国記念の日'),('2026-02-23','天皇誕生日'),('2026-03-20','春分の日'),('2026-04-29','昭和の日'),('2026-05-03','憲法記念日'),('2026-05-04','みどりの日'),('2026-05-05','こどもの日'),('2026-05-06','振替休日'),('2026-07-20','海の日'),('2026-08-11','山の日'),('2026-09-21','敬老の日'),('2026-09-22','国民の休日'),('2026-09-23','秋分の日'),('2026-10-12','スポーツの日'),('2026-11-03','文化の日'),('2026-11-23','勤労感謝の日'),
('2027-01-01','元日'),('2027-01-11','成人の日'),('2027-02-11','建国記念の日'),('2027-02-23','天皇誕生日'),('2027-03-21','春分の日'),('2027-03-22','振替休日'),('2027-04-29','昭和の日'),('2027-05-03','憲法記念日'),('2027-05-04','みどりの日'),('2027-05-05','こどもの日'),('2027-07-19','海の日'),('2027-08-11','山の日'),('2027-09-20','敬老の日'),('2027-09-23','秋分の日'),('2027-10-11','スポーツの日'),('2027-11-03','文化の日'),('2027-11-23','勤労感謝の日') on conflict(day) do update set name=excluded.name;
create table if not exists public.hanako_daily_activity(
 user_id uuid not null references auth.users(id) on delete cascade,
 day_jst date not null,
 day_kind text not null,
 activity_code text not null,
 answer_ja text not null,
 holiday_name text,
 created_at timestamptz not null default now(),
 primary key(user_id,day_jst)
);
alter table public.hanako_daily_activity enable row level security;
revoke all on public.hanako_daily_activity from anon,authenticated;
grant all on public.hanako_daily_activity to service_role;
create or replace function public.hanako_daily_activity_get(owner_id uuid,activity_day date default (now() at time zone 'Asia/Tokyo')::date)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare plan public.hanako_daily_activity; holiday text; off_day boolean; code text; answer text; kind text;
begin
 select * into plan from public.hanako_daily_activity where user_id=owner_id and day_jst=activity_day;
 if found then return to_jsonb(plan)-'user_id';end if;
 select name into holiday from public.hanako_jp_holidays where day=activity_day;
 off_day:=extract(isodow from activity_day)>=6 or holiday is not null;
 if off_day then
  kind:='holiday';code:=case when mod(activity_day-date '2026-01-01',2)=0 then 'shopping' else 'friends' end;
  answer:=case when code='shopping' then '今日はお買い物を楽しむ日だよ☺️' else '今日は友達と遊ぶ日だよ☺️' end;
 elsif extract(year from activity_day) in (2026,2027) then
  kind:='weekday';code:='work';answer:='今日はITのお仕事の日だよ☺️ 八百屋のお手伝いやピアノも大切にしてるの。';
 else
  kind:='calendar_unconfirmed';code:='unconfirmed';answer:='今日は自分の時間も大切にしながら過ごしてるよ☺️';
 end if;
 insert into public.hanako_daily_activity(user_id,day_jst,day_kind,activity_code,answer_ja,holiday_name)
 values(owner_id,activity_day,kind,code,answer,holiday) on conflict do nothing;
 select * into strict plan from public.hanako_daily_activity where user_id=owner_id and day_jst=activity_day;
 return to_jsonb(plan)-'user_id';
end $$;
revoke all on function public.hanako_daily_activity_get(uuid,date) from public,anon,authenticated;
grant execute on function public.hanako_daily_activity_get(uuid,date) to service_role;
