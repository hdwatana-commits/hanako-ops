alter table public.hanako_reply_settings add column if not exists openai_billing_status text not null default 'unknown';
alter table public.hanako_reply_settings add column if not exists openai_billing_checked_at timestamptz;
