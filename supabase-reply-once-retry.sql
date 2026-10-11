alter table public.hanako_reply_comments add column if not exists reply_retry_once boolean not null default false;

alter table public.hanako_reply_comments add column if not exists reply_retry_text text;
