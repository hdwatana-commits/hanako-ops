begin;
alter table public.hanako_reply_settings add column if not exists ai_provider text not null default 'gemini' check(ai_provider in ('gemini','openai'));
alter table public.hanako_reply_settings add column if not exists openai_ready boolean not null default false;
create or replace function public.hanako_openai_key_status(owner_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.jwt()->>'role' is distinct from 'service_role' then raise exception 'service role required'; end if;
 return exists(select 1 from vault.secrets where name='hanako_openai_'||owner_id::text);
end $$;
create or replace function public.hanako_openai_key_read(owner_id uuid)
returns text language plpgsql security definer set search_path='' as $$
declare result text;
begin
 if auth.jwt()->>'role' is distinct from 'service_role' then raise exception 'service role required'; end if;
 select decrypted_secret into result from vault.decrypted_secrets where name='hanako_openai_'||owner_id::text;
 return result;
end $$;
create or replace function public.hanako_openai_key_save(owner_id uuid,key_value text)
returns boolean language plpgsql security definer set search_path='' as $$
declare secret_name text; secret_id uuid;
begin
 if auth.jwt()->>'role' is distinct from 'service_role' then raise exception 'service role required'; end if;
 if owner_id is null or key_value is null or key_value !~ '^sk-[A-Za-z0-9_-]{20,}$' or length(key_value)>512 then raise exception 'invalid OpenAI key'; end if;
 secret_name:='hanako_openai_'||owner_id::text;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(secret_name,0));
 select id into secret_id from vault.secrets where name=secret_name;
 if secret_id is null then perform vault.create_secret(key_value,secret_name,'HanakoOPS OpenAI Luna');
 else perform vault.update_secret(secret_id,key_value); end if;
 return true;
end $$;
revoke all on function public.hanako_openai_key_status(uuid) from public,anon,authenticated;
revoke all on function public.hanako_openai_key_read(uuid) from public,anon,authenticated;
revoke all on function public.hanako_openai_key_save(uuid,text) from public,anon,authenticated;
grant execute on function public.hanako_openai_key_status(uuid) to service_role;
grant execute on function public.hanako_openai_key_read(uuid) to service_role;
grant execute on function public.hanako_openai_key_save(uuid,text) to service_role;
notify pgrst,'reload schema';
commit;
