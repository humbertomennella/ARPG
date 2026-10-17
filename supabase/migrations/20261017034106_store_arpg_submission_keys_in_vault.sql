do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'arpg_submission_encryption_key'
  ) then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'base64'),
      'arpg_submission_encryption_key',
      'ARPG AES-256-GCM submission encryption key'
    );
  end if;

  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'arpg_submission_hmac_key'
  ) then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'base64'),
      'arpg_submission_hmac_key',
      'ARPG HMAC key for submitter pseudonymization'
    );
  end if;
end
$$;

create or replace function public.get_arpg_submission_secrets()
returns table (encryption_key text, hmac_key text)
language sql
security definer
set search_path = pg_catalog, public, vault
as $$
  select
    max(decrypted_secret) filter (where name = 'arpg_submission_encryption_key'),
    max(decrypted_secret) filter (where name = 'arpg_submission_hmac_key')
  from vault.decrypted_secrets
  where name in ('arpg_submission_encryption_key', 'arpg_submission_hmac_key');
$$;

revoke all on function public.get_arpg_submission_secrets() from public, anon, authenticated;
grant execute on function public.get_arpg_submission_secrets() to service_role;
