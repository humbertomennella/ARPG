# ARPG submission Edge Function

This function is intentionally fail-closed and requires an authenticated Supabase user. It is not a public anonymous answer checker.

## Required server-side secrets

Configure these in Supabase Dashboard → Edge Functions → Secrets. Never add values to GitHub, frontend variables, issue comments, or chat logs.

- `ARPG_SUBMISSION_ENCRYPTION_KEY`: base64-encoded 32 random bytes for AES-256-GCM.
- `ARPG_SUBMISSION_HMAC_KEY`: base64-encoded random key of at least 32 bytes for HMAC-SHA-256 pseudonymous user identifiers.

Generate independent values locally, for example with Python:
```sh
python -c "import secrets,base64; print('ARPG_SUBMISSION_ENCRYPTION_KEY='+base64.b64encode(secrets.token_bytes(32)).decode()); print('ARPG_SUBMISSION_HMAC_KEY='+base64.b64encode(secrets.token_bytes(32)).decode())"
```
Copy the two values directly into the Supabase secret manager. Do not commit the output or paste it into chat. Store a recovery copy in a password manager with appropriate access controls.

The platform-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are used at runtime. The function is deployed with JWT verification enabled and independently calls Auth to validate the user token.

## Behavior

- Accepts only POST JSON with `stageSlug` and `proof`.
- Requires a valid authenticated Supabase user.
- Encrypts the proof with AES-256-GCM before it reaches the database.
- Uses a server-held HMAC key to pseudonymize the authenticated user ID.
- Stores a digest of the ciphertext, not the plaintext answer.
- Returns generic rejection errors for unknown/unpublished stages and rate limits.
- Does not compare the proof against any answer key. All accepted submissions are pending manual review.
- If either custom secret is missing or malformed, returns 503 without storing anything.

## Current limitations

Supabase Auth sign-up/login UI, abuse monitoring, CAPTCHA/attestation and an admin review UI are not implemented. The database counter is a secondary limit, not a substitute for edge/platform abuse controls. Do not launch prize-bearing stages until these are reviewed.
