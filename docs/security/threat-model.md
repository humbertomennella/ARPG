# ARPG threat model

## Assets

- Publicly released artifacts and their integrity metadata.
- Private encrypted submissions and abuse signals.
- Administrative credentials and deployment secrets.
- Unpublished puzzle design and solution material.
- Reward funding and custody evidence.
- Availability and long-term integrity of the public experience.

## Trust boundaries

1. Browser to public web host.
2. Browser to Supabase Data API.
3. Public Data API to PostgreSQL RLS.
4. Trusted Edge Function to service-role-only insertion function.
5. Repository automation to deployment credentials.
6. Project administrators to secret custody.
7. Public challenge infrastructure to external services.

## Adversaries and controls

- **Casual visitor:** only sees published catalog records.
- **Experienced investigator:** may inspect all public source and artifacts; do not rely on obscurity.
- **Collaborating group:** define shared credit and simultaneous-solution policy before prize launch.
- **Automated agent:** enforce rate limits and avoid exposing oracle-like errors.
- **Repository reader:** assume every committed byte is public forever, including Git history.
- **Compromised participant:** never grant participant identities administrative privileges by default.
- **Compromised admin:** limit roles, rotate credentials, keep backups and document incident response.
- **External provider failure:** retain source artifacts and integrity hashes; document restoration procedures.
- **Lost key:** do not create final secret material until recovery and succession have been tested.
- **Owner avoiding spoilers:** separate public updates from solution material; this is an operational goal, not a cryptographic guarantee.

## Security invariants

- No service-role key, private signing key, seed phrase or answer key in browser code or public Git.
- No public INSERT/UPDATE/DELETE policy on catalog or submission tables.
- The database submission function is executable only by `service_role`; anonymous and authenticated roles must not be able to invoke it.
- Submissions must be encrypted in a trusted backend before storage; raw answers must not enter logs.
- The Edge Function must derive submitter hashes from a trusted server-observed identifier using a server-held HMAC key. Do not trust arbitrary client-provided identity headers without validating the platform's proxy behavior.
- No submission endpoint until secret provisioning, rate limiting, validation and abuse handling are tested.
- Public catalog rows are intentionally public; publication status is not a secret-storage mechanism.
- Logs contain no raw answers, keys, personal data or full submitted proofs.
- A published prize claim requires independent evidence of funding and custody.

## Residual risks

Administrators of hosting, database or repository services may have privileged access. Client-side code can always be inspected. A difficult puzzle cannot guarantee resistance to every future AI or to collusion. RLS alone does not provide rate limiting or validate complex submissions. The database counter is an additional safeguard, not a replacement for edge-level throttling or abuse monitoring.
