-- Existing settings remain at the previous two-post scope.
alter table public.hanako_reply_settings
  add column if not exists post_limit integer not null default 2
  check (post_limit between 1 and 4);
