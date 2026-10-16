# ARPG architecture overview

## Current baseline

The repository is being developed on the `foundation/initial-platform` branch. The current interface is a Vite + React single-page application with hash-based navigation. The initial version uses local, illustrative content and does not require a database to render.

## Verified service boundary

- **Public web client:** renders only material intentionally published for investigators.
- **Public catalog:** `public.public_stages` and `public.public_artifacts` expose published metadata only, enforced by RLS.
- **Private operations:** submissions, rate-limit counters and audit records live in the non-exposed `arpg_private` schema with RLS enabled and no public policies.
- **Submission insertion boundary:** `public.record_arpg_submission(...)` is a narrowly scoped, service-role-only database function. It accepts encrypted proof payloads for manual review, enforces a database-side limit of five accepted submissions per hashed submitter per UTC hour, and does not validate or disclose answers.
- **Privileged operations:** a trusted Edge Function still needs to be implemented and tested. It must encrypt submissions before calling the insertion function and derive submitter hashes using a server-held HMAC secret.
- **Secret custody:** solution material, encryption/HMAC keys, reward credentials and recovery material must stay outside the public repository and browser-delivered assets.

## Current limitations

- The database insertion boundary exists, but **no Edge Function is deployed and no public submission endpoint is active**.
- Encryption and HMAC secrets have not been provisioned. The insertion function rejects malformed payloads, but it cannot prove that ciphertext was encrypted correctly.
- Manual review is the only intended decision path. No automatic answer validation or answer oracle exists.
- No domain, external social account, cryptocurrency transfer or prize promise is activated.
- No analytics, advertising SDK, cookies or third-party tracking are added.

## Release stages

1. Foundation UI and repository controls.
2. Dedicated Supabase project, migrations and access-boundary verification.
3. Edge Function with secret-backed encryption, trusted client identity, rate-limit handling and anti-enumeration tests.
4. Private review workflow and operational recovery test.
5. Public artifact pipeline and independent security review.
6. Reward custody and rules review.
7. Staged public launch.

Each stage must be verified before the next is represented as complete.
