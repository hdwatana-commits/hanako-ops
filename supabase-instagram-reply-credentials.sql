alter table public.hanako_ig_reply_settings
 add column if not exists account_id text,
 add column if not exists api_host text not null default 'graph.facebook.com' check(api_host in ('graph.facebook.com','graph.instagram.com')),
 add column if not exists graph_version text not null default 'v23.0' check(graph_version~'^v[0-9]+[.][0-9]+$');
create or replace function public.hanako_ig_token_read(owner_id uuid)
returns text language plpgsql security definer set search_path='' as $$
declare token text;
begin
 if auth.jwt()->>'role' is distinct from 'service_role' then raise exception 'service role required';end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='hanako_ig_reply_'||owner_id::text;
 return token;
end $$;
create or replace function public.hanako_ig_token_save(owner_id uuid,token_value text)
returns boolean language plpgsql security definer set search_path='' as $$
declare secret_name text; secret_id uuid;
begin
 if auth.jwt()->>'role' is distinct from 'service_role' then raise exception 'service role required';end if;
 if owner_id is null or token_value is null or token_value!~'^[A-Za-z0-9._-]{20,4096}$' then raise exception 'invalid token';end if;
 secret_name:='hanako_ig_reply_'||owner_id::text;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(secret_name,0));
 select id into secret_id from vault.secrets where name=secret_name;
 if secret_id is null then perform vault.create_secret(token_value,secret_name,'HanakoOPS Instagram comment replies');else perform vault.update_secret(secret_id,token_value);end if;
 return true;
end $$;
revoke all on function public.hanako_ig_token_read(uuid),public.hanako_ig_token_save(uuid,text) from public,anon,authenticated;
grant execute on function public.hanako_ig_token_read(uuid),public.hanako_ig_token_save(uuid,text) to service_role;
