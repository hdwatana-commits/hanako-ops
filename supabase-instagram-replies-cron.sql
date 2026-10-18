select cron.schedule('hanako-instagram-replies','*/2 * * * *',$job$
 select net.http_post(
 url:='https://gjytyibgfeoephyykyin.supabase.co/functions/v1/threads-replies',
 headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_anon_key'),'apikey',(select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_anon_key'),'x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='hanako_daily_cron_secret')),
 body:='{"action":"ig_run"}'::jsonb,timeout_milliseconds:=60000);
$job$);
