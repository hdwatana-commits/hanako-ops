-- Reuse the existing Hanako daily cron credentials without displaying them.
-- No existing schedule or secret is changed.
select cron.schedule('hanako-threads-replies','* * * * *', $$
  select net.http_post(
    url := replace((select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_url'),'/hanako-daily','/threads-replies'),
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_anon_key'),
      'apikey',(select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_anon_key'),
      'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_cron_secret')),
    body := '{"action":"run"}'::jsonb
  ) where exists(select 1 from public.hanako_reply_settings where enabled);
$$);

-- Initialise the owner's settings in OFF / draft mode and check the endpoint.
select net.http_post(
  url := replace((select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_url'),'/hanako-daily','/threads-replies'),
  headers := jsonb_build_object('Content-Type','application/json',
    'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_anon_key'),
    'apikey',(select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_anon_key'),
    'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_cron_secret')),
  body := '{"action":"run"}'::jsonb
) as reply_bootstrap_request;
