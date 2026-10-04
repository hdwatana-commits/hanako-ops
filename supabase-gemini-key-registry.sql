-- Only the owner-authenticated Edge Function may register/read Gemini keys.
-- Existing Function Secrets remain the fallback when a slot has no Vault key.
begin;
create or replace function public.hanako_gemini_key_status(owner_id uuid)
returns table(profile text, configured boolean)
language sql security definer set search_path = ''
as $$
  select p.id, exists(select 1 from vault.secrets v
    where v.name = 'hanako_gemini_' || owner_id::text || '_' || p.id)
  from (values ('default'),('secondary'),('third')) p(id);
$$;

create or replace function public.hanako_gemini_key_read(owner_id uuid, profile text)
returns text language plpgsql security definer set search_path = ''
as $$
declare result text;
begin
  if profile not in ('default','secondary','third') then raise exception 'Invalid profile'; end if;
  select v.decrypted_secret into result from vault.decrypted_secrets v
    where v.name = 'hanako_gemini_' || owner_id::text || '_' || profile;
  return result;
end;
$$;

create or replace function public.hanako_gemini_key_save(owner_id uuid, profile text, key_value text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare secret_name text; secret_id uuid;
begin
  if owner_id is null or profile is null or profile not in ('default','secondary','third')
    or key_value is null or key_value !~ '^AIza[A-Za-z0-9_-]{35}$'
    then raise exception 'Invalid key registration'; end if;
  secret_name := 'hanako_gemini_' || owner_id::text || '_' || profile;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(secret_name,0));
  select v.id into secret_id from vault.secrets v where v.name = secret_name;
  if secret_id is null then
    perform vault.create_secret(key_value,secret_name,'HanakoOPS Gemini connection');
  else
    perform vault.update_secret(secret_id,key_value);
  end if;
  return true;
end;
$$;

revoke all on function public.hanako_gemini_key_status(uuid) from public, anon, authenticated;
revoke all on function public.hanako_gemini_key_read(uuid,text) from public, anon, authenticated;
revoke all on function public.hanako_gemini_key_save(uuid,text,text) from public, anon, authenticated;
grant execute on function public.hanako_gemini_key_status(uuid) to service_role;
grant execute on function public.hanako_gemini_key_read(uuid,text) to service_role;
grant execute on function public.hanako_gemini_key_save(uuid,text,text) to service_role;
notify pgrst, 'reload schema';
commit;
