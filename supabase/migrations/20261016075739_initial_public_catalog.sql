-- ARPG foundation schema.
-- Public tables contain only intentionally publishable metadata.
-- Submission contents, answer keys, credentials and reward custody do not belong here.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.public_stages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_stage_publication_state check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

create table if not exists public.public_artifacts (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid references public.public_stages(id) on delete restrict,
  slug text not null unique,
  title text not null,
  description text not null,
  artifact_type text not null check (artifact_type in ('document', 'image', 'audio', 'data', 'link', 'note')),
  public_url text,
  sha256_hex text check (sha256_hex is null or sha256_hex ~ '^[0-9a-f]{64}$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  constraint artifact_publication_state check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

create index if not exists public_stages_public_order_idx
  on public.public_stages (sort_order, published_at desc) where status = 'published';

create index if not exists public_artifacts_public_order_idx
  on public.public_artifacts (published_at desc) where status = 'published';

alter table public.public_stages enable row level security;
alter table public.public_artifacts enable row level security;

revoke all on table public.public_stages from anon, authenticated;
revoke all on table public.public_artifacts from anon, authenticated;
grant select on table public.public_stages to anon, authenticated;
grant select on table public.public_artifacts to anon, authenticated;

drop policy if exists "Published stages are readable" on public.public_stages;
create policy "Published stages are readable"
  on public.public_stages for select to anon, authenticated
  using (status = 'published' and published_at <= now());

drop policy if exists "Published artifacts are readable" on public.public_artifacts;
create policy "Published artifacts are readable"
  on public.public_artifacts for select to anon, authenticated
  using (
    status = 'published'
    and published_at <= now()
    and (
      stage_id is null
      or exists (
        select 1 from public.public_stages s
        where s.id = public_artifacts.stage_id
          and s.status = 'published'
          and s.published_at <= now()
      )
    )
  );

-- Private operational records are intentionally not exposed through the Data API.
create schema if not exists arpg_private;
revoke all on schema arpg_private from public, anon, authenticated;

create table if not exists arpg_private.submissions (
  id uuid primary key default gen_random_uuid(),
  stage_slug text not null,
  submitter_hash text not null,
  proof_digest text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'needs_review')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_note text,
  constraint submission_hash_format check (submitter_hash ~ '^[0-9a-f]{64}$'),
  constraint proof_digest_format check (proof_digest ~ '^[0-9a-f]{64}$')
);

create index if not exists submissions_review_queue_idx
  on arpg_private.submissions (submitted_at) where status in ('pending', 'needs_review');

create table if not exists arpg_private.audit_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  actor_hash text,
  target_ref text,
  outcome text not null check (outcome in ('success', 'failure', 'blocked', 'info')),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

revoke all on all tables in schema arpg_private from public, anon, authenticated;
revoke all on all sequences in schema arpg_private from public, anon, authenticated;
revoke all on all functions in schema arpg_private from public, anon, authenticated;

comment on schema arpg_private is
  'Private operational data. Never store answer keys or long-lived secrets here without a separate threat review.';
comment on table public.public_stages is
  'Public metadata only. Draft rows must not contain hidden puzzle solutions.';
comment on table public.public_artifacts is
  'Public metadata only. Any linked artifact is public by definition once published.';