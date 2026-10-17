# ARPG architecture overview

## Current baseline

The repository is being developed on the `foundation/initial-platform` branch. The interface is a Vite + React single-page application with hash-based navigation. Authentication UI is implemented against Supabase Auth when browser-safe project configuration is present; without it, the page reports a configuration-pending state instead of pretending to be connected.

## Verified service boundary

- **Public web client:** renders only material intentionally published for investigators.
- **Public catalog:** `public.public_stages` and `public.public_artifacts` expose published metadata only, enforced by RLS.
- **Private operations:** submissions, rate-limit counters and audit records live in the non-exposed `arpg_private` schema with RLS enabled and no public policies.
- **Submission insertion boundary:** `public.record_arpg_submission(...)` is a narrowly scoped, service-role-only database function. It accepts encrypted proof payloads for manual review, enforces a database-side limit of five accepted submissions per hashed submitter per UTC hour, and does not validate or disclose answers.
- **Submission Edge Function:** `submit-proof` is deployed with JWT verification enabled. It validates the authenticated user, retrieves encryption/HMAC keys through a service-role-only database function, encrypts proof with AES-256-GCM, pseudonymizes the user ID with HMAC, and submits ciphertext for manual review. The keys are generated with PostgreSQL's cryptographically secure random generator and stored encrypted in Supabase Vault. Runtime access still requires end-to-end tests.
- **Secret custody:** solution material, encryption/HMAC keys, reward credentials and recovery material stay outside the public repository and browser-delivered assets. The Vault retrieval function is executable only by `service_role`.

## Current limitations

- The authentication UI is implemented in source, but needs the project's publishable key in the local/build environment and verification of email-confirmation settings and the redirect allow-list.
- The submission endpoint and Vault-backed key retrieval are deployed. Positive/negative end-to-end submission tests remain outstanding; do not treat deployment alone as proof of full runtime correctness.
- No stage-specific submission form, private review interface, abuse-monitoring dashboard or CAPTCHA/attestation flow is complete.
- No automatic answer validation or answer oracle exists.
- No domain, external social account, cryptocurrency transfer or prize promise is activated.
- No analytics, advertising SDK, cookies or third-party tracking are added.

## Release stages

1. Foundation UI and repository controls.
2. Dedicated Supabase project, migrations and access-boundary verification.
3. Auth interface and authenticated identity flow.
4. Vault-backed Edge Function keys, positive/negative end-to-end tests and rate-limit tests.
5. Private review workflow and operational recovery test.
6. Public artifact pipeline and independent security review.
7. Reward custody and rules review.
8. Staged public launch.

Each stage must be verified before the next is represented as complete.
