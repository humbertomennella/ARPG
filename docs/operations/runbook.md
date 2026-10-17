# Operations runbook

## Local development

Requirements: Node.js LTS and npm.

1. Install pinned dependencies with `npm ci` after a lockfile has been generated and committed.
2. Run `npm run dev`.
3. Run `npm run build` before proposing a release.
4. Review the generated `dist/` directory for secrets and unintended files.

## Supabase

A dedicated ARPG project has not been identified in the currently connected Supabase organization. The schema migration is a reviewed starting point, not evidence of a deployed database.

Before applying it:
1. Create or select a dedicated project with explicit owner approval.
2. Confirm the billing plan and region.
3. Inspect the target schema for collisions.
4. Apply the migration in a non-production environment first.
5. Test anonymous and authenticated access, including denied writes.
6. Run Supabase security and performance advisors.
7. Record the project reference in private deployment configuration, never in a secret file committed to Git.

## Incident response

- Disable the affected deployment or endpoint if unauthorized writes or secret exposure are suspected.
- Rotate affected credentials at their source.
- Preserve relevant logs without copying raw secrets or personal data.
- Assess Git history and external caches; deleting a file is not sufficient to revoke a leaked secret.
- Restore from a tested backup and verify integrity hashes.
- Publish a concise incident notice if participants are affected.

## Backups and continuity

Before public launch, document retention, recovery point, recovery time, responsible custodians and a tested restore procedure. Never claim a backup is valid until restoration has been tested.