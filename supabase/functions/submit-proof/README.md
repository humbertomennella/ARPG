# ARPG submission Edge Function

This function is intentionally fail-closed and requires an authenticated Supabase user. It is not a public anonymous answer checker.

## Server-side key storage

The two independent cryptographic keys are generated with PostgreSQL's cryptographically secure `gen_random_bytes(32)` and stored encrypted using Supabase Vault. The Edge Function retrieves them through `public.get_arpg_submission_secrets()`, a `SECURITY DEFINER` function whose execution is revoked from `PUBLIC`, `anon`, and `authenticated`, and granted only to `service_role`.

- `arpg_submission_encryption_key`: base64-encoded 32 random bytes for AES-256-GCM.
- `arpg_submission_hmac_key`: base64-encoded 32 random bytes for HMAC-SHA-256 pseudonymous user identifiers.

No manual dashboard entry or local key generation is required. Never expose these values in GitHub, frontend variables, issue comments, or chat logs. Keep the database function's grants restricted to `service_role`.

The platform-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are used at runtime. The function is deployed with JWT verification enabled and independently calls Auth to validate the user token.

## Behavior

- Accepts only POST JSON with `stageSlug` and `proof`.
- Requires a valid authenticated Supabase user.
- Retrieves the encryption and HMAC keys from Vault through a server-only database function.
- Encrypts the proof with AES-256-GCM before it reaches the submissions table.
- Uses a server-held HMAC key to pseudonymize the authenticated user ID.
- Stores a digest of the ciphertext, not the plaintext answer.
- Returns generic rejection errors for unknown/unpublished stages and rate limits.
- Does not compare the proof against any answer key. All accepted submissions are pending manual review.
- If Vault keys cannot be retrieved or validated, returns 503 without storing anything.

## Current limitations

Supabase Auth sign-up/login UI, abuse monitoring, CAPTCHA/attestation and an admin review UI are not implemented. The database counter is a secondary limit, not a substitute for edge/platform abuse controls. Do not launch prize-bearing stages until these are reviewed.
