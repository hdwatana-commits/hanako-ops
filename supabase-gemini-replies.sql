-- Persist free quota backoff; existing comments and settings remain intact.
alter table public.hanako_reply_settings add column if not exists ai_retry_at timestamptz;
