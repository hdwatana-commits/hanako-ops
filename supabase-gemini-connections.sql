alter table public.hanako_reply_settings
  add column if not exists ai_connection text not null default 'default'
  check (ai_connection in ('default','secondary','third'));
