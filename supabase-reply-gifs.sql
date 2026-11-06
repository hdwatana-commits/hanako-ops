-- Additive only: existing replies, settings, ownership and RLS are preserved.
alter table public.hanako_reply_settings add column if not exists gif_reply jsonb not null default '{"enabled":false,"rate":20,"emoji_enabled":true,"items":[]}'::jsonb;
alter table public.hanako_reply_comments add column if not exists reply_gif jsonb;
comment on column public.hanako_reply_settings.gif_reply is 'Owner-configured Threads GIPHY reply catalog and selection settings.';
comment on column public.hanako_reply_comments.reply_gif is 'Selected GIF identity; retained with the draft and published reply for repetition avoidance.';
