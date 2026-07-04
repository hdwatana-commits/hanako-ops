create table if not exists public.hanako_app_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.hanako_app_data enable row level security;

grant select, insert, update on public.hanako_app_data to authenticated;

drop policy if exists "Users can read their own Hanako data" on public.hanako_app_data;
drop policy if exists "Users can create their own Hanako data" on public.hanako_app_data;
drop policy if exists "Users can update their own Hanako data" on public.hanako_app_data;

create policy "Users can read their own Hanako data"
on public.hanako_app_data for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own Hanako data"
on public.hanako_app_data for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own Hanako data"
on public.hanako_app_data for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hanako-private-photos',
  'hanako-private-photos',
  false,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif', 'application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own Hanako photos" on storage.objects;
drop policy if exists "Users can read their own Hanako photos" on storage.objects;
drop policy if exists "Users can delete their own Hanako photos" on storage.objects;

create policy "Users can upload their own Hanako photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'hanako-private-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can read their own Hanako photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'hanako-private-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their own Hanako photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'hanako-private-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
