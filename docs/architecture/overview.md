# ARPG architecture overview

## Current baseline

The repository is being developed on the `foundation/initial-platform` branch. The current interface is a Vite + React single-page application with hash-based navigation. The initial version uses local, illustrative content and does not require a database to render.

## Planned boundary

- **Public web client:** renders only material intentionally published for investigators.
- **Public catalog:** PostgreSQL tables expose published stage and artifact metadata only.
- **Private operations:** submissions and audit records live in the non-exposed `arpg_private` schema.
- **Privileged operations:** future Edge Functions or another trusted backend will validate submissions and write private records.
- **Secret custody:** solution material, signing keys, reward credentials and recovery material must be managed outside the public repository and outside browser-delivered assets.

## Explicit non-goals for the foundation

- No final answer, answer key, encryption key or reward wallet is generated.
- No live Supabase project is connected by this commit.
- No public submission endpoint is enabled.
- No domain, external social account, cryptocurrency transfer or prize promise is activated.
- No analytics, advertising SDK, cookies or third-party tracking are added.

## Release stages

1. Foundation UI and repository controls.
2. Dedicated Supabase project and migration verification.
3. Private submission service with rate limits and anti-enumeration tests.
4. Public artifact pipeline and independent security review.
5. Reward custody and rules review.
6. Staged public launch.

Each stage must be verified before the next is represented as complete.