alter table public.hanako_reply_settings
  add column if not exists gemini_fallback_until timestamptz;
