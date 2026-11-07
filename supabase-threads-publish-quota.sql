-- Server-managed publishing quota checkpoint; no credentials or ownership changes.
alter table public.hanako_reply_settings add column if not exists threads_publish_state jsonb not null default '{}'::jsonb;
comment on column public.hanako_reply_settings.threads_publish_state is 'Threads publishing usage and rate-limit cooldown. Server managed, independent of AI provider quotas.';
notify pgrst,'reload schema';
