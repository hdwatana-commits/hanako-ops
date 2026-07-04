-- Hanako Ops: private coordinate photo storage
-- Supabase Dashboard > SQL Editor で一度だけ実行してください。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hanako-private-photos',
  'hanako-private-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
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
