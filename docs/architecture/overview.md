# ARPG architecture overview

## Current baseline

The repository is being developed on the `foundation/initial-platform` branch. The interface is a Vite + React single-page application with hash-based navigation. Authentication UI is implemented against Supabase Auth when browser-safe project configuration is present; without it, the page reports a configuration-pending state instead of pretending to be connected.

## Verified service boundary

- **Public web client:** renders only material intentionally published for investigators.
- **Public catalog:** `public.public_stages` and `public.public_artifacts` expose published metadata only, enforced by RLS.
- **Private operations:** submissions, rate-limit counters and audit records live in the non-exposed `arpg_private` schema with RLS enabled and no public policies.
- **Submission insertion boundary:** `public.record_arpg_submission(...)` is a narrowly scoped, service-role-only database function. It accepts encrypted proof payloads for manual review, enforces a database-side limit of five accepted submissions per hashed submitter per UTC hour, and does not validate or disclose answers.
- **Submission Edge Function:** `submit-proof` is deployed with JWT verification enabled. It validates the authenticated user, encrypts proof with AES-256-GCM, pseudonymizes the user ID with server-held HMAC, and submits ciphertext for manual review. Runtime use remains blocked until custom secrets are provisioned and end-to-end tests pass.
- **Secret custody:** solution material, encryption/HMAC keys, reward credentials and recovery material must stay outside the public repository and browser-delivered assets.

## Current limitations

- The authentication UI is implemented in source, but needs the project's publishable key in the local/build environment and verification of email-confirmation settings and the redirect allow-list.
- The submission endpoint is deployed but intentionally fails closed until `ARPG_SUBMISSION_ENCRYPTION_KEY` and `ARPG_SUBMISSION_HMAC_KEY` are configured in Supabase Edge Function secrets.
- No stage-specific submission form, private review interface, abuse-monitoring dashboard or CAPTCHA/attestation flow is complete.
- No automatic answer validation or answer oracle exists.
- No domain, external social account, cryptocurrency transfer or prize promise is activated.
- No analytics, advertising SDK, cookies or third-party tracking are added.

## Release stages

1. Foundation UI and repository controls.
2. Dedicated Supabase project, migrations and access-boundary verification.
3. Auth interface and authenticated identity flow.
4. Edge Function secret provisioning, positive/negative end-to-end tests and rate-limit tests.
5. Private review workflow and operational recovery test.
6. Public artifact pipeline and independent security review.
7. Reward custody and rules review.
8. Staged public launch.

Each stage must be verified before the next is represented as complete.
