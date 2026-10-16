-- Store submissions only as authenticated-encrypted payloads. The browser never gets write access.
alter table arpg_private.submissions
  add column if not exists proof_ciphertext text,
  add column if not exists proof_iv text;

create table if not exists arpg_private.submission_rate_limits (
  submitter_hash text not null check (submitter_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  primary key (submitter_hash, window_started_at)
);

alter table arpg_private.submission_rate_limits enable row level security;
revoke all on table arpg_private.submission_rate_limits from public, anon, authenticated;
revoke all on all sequences in schema arpg_private from public, anon, authenticated;

create or replace function public.record_arpg_submission(
  p_stage_slug text,
  p_submitter_hash text,
  p_proof_digest text,
  p_proof_ciphertext text,
  p_proof_iv text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, arpg_private
as $function$
declare
  v_window timestamptz;
  v_attempts integer;
begin
  if p_stage_slug is null or p_stage_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_stage_slug) > 80 then
    return false;
  end if;
  if p_submitter_hash is null or p_submitter_hash !~ '^[0-9a-f]{64}$'
     or p_proof_digest is null or p_proof_digest !~ '^[0-9a-f]{64}$' then
    return false;
  end if;
  if p_proof_ciphertext is null or length(p_proof_ciphertext) < 16 or length(p_proof_ciphertext) > 12000
     or p_proof_iv is null or p_proof_iv !~ '^[A-Za-z0-9+/]{16}$' then
    return false;
  end if;
  if not exists (
    select 1 from public.public_stages s
    where s.slug = p_stage_slug and s.status = 'published' and s.published_at <= now()
  ) then
    return false;
  end if;

  v_window := date_trunc('hour', now());
  insert into arpg_private.submission_rate_limits(submitter_hash, window_started_at, attempts)
  values (p_submitter_hash, v_window, 1)
  on conflict (submitter_hash, window_started_at)
  do update set attempts = arpg_private.submission_rate_limits.attempts + 1
  returning attempts into v_attempts;

  if v_attempts > 5 then
    insert into arpg_private.audit_events(event_type, actor_hash, target_ref, outcome, metadata)
    values ('submission_rate_limited', p_submitter_hash, p_stage_slug, 'blocked', '{"window":"hour"}'::jsonb);
    return false;
  end if;

  insert into arpg_private.submissions(
    stage_slug, submitter_hash, proof_digest, proof_ciphertext, proof_iv, status
  ) values (
    p_stage_slug, p_submitter_hash, p_proof_digest, p_proof_ciphertext, p_proof_iv, 'pending'
  );

  insert into arpg_private.audit_events(event_type, actor_hash, target_ref, outcome, metadata)
  values ('submission_received', p_submitter_hash, p_stage_slug, 'success', '{"review":"manual"}'::jsonb);

  return true;
end;
$function$;

revoke all on function public.record_arpg_submission(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_arpg_submission(text, text, text, text, text) to service_role;

comment on function public.record_arpg_submission(text, text, text, text, text) is
  'Service-role-only insertion boundary. Accepts encrypted proof payloads for manual review; never validates or reveals an answer.';
