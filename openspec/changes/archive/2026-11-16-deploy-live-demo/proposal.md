# Proposal

## Why

MediVault runs and verifies locally but has no public instance, so it cannot be shown as a working website. The selected host, Render's free web-service tier, discards its local filesystem on every deploy, restart, and idle spin-down, so the current "SQLite and documents on a persistent disk" model would silently lose accounts and documents. A live demo therefore needs durable off-host storage, proxy-aware request handling, reproducible container packaging, and an honest demo notice.

## What Changes

- Package the combined Express + website application as a Docker image pinned to the supported Node runtime, running the backend TypeScript directly with production dependencies only.
- Add a Render Blueprint (`render.yaml`) for a free Docker web service with `/api/health` health checks, auto-deploy from `main` only after CI checks pass, and secrets declared without values.
- Trust a configured number of reverse-proxy hops so the login rate limiter and secure-request detection use the real client and scheme behind Render's proxy.
- Keep the SQLite database durable on an ephemeral host by restoring it from an S3-compatible replica (Backblaze B2) at startup and continuously replicating it with Litestream while running.
- Store uploaded documents in a pluggable document store: the existing private local directory for development/tests, or a private S3-compatible bucket (Backblaze B2) for the live demo. Viewing, downloading, and deletion keep owner checks and remain same-origin; no public or presigned bucket URL is exposed.
- Fail production startup fast when the selected durable storage is incompletely configured.
- Show a visible "fictional demo data only — not medical advice" notice on the public site.
- Document operator prerequisites (Render account, Backblaze B2 bucket and bucket-scoped application key, environment variables), cold-start behavior, the expected `onrender.com` address, and backup/restore verification. Documentation states the site is live only after a real deployment is verified.
- Add a Linux CI job that builds the container image and smoke-tests `/api/health` with local storage and no credentials.

## Capabilities

### New Capabilities

- `live-demo-deployment`: Container packaging, hosted runtime configuration, proxy awareness, durable database replication and restore, durable private document storage, public demo notice, and operator documentation for running MediVault as a public demonstration.

### Modified Capabilities

- `account-health-management`: "Persistent owner-specific healthcare data" must also hold on an ephemeral host using durable replication and object storage; "Usable full-stack startup and production serving" must validate durable-storage configuration before serving.
- `repository-verification`: "Shared CI verification" adds a credential-free container build and health smoke test on Linux.

## Impact

- **Code:** `server/config.ts`, `server/app.ts` (document read/write/delete, trust proxy), `server/index.ts`, new `server/document-store.ts`; demo notice in `src/components/Layout.tsx` and `src/pages/AuthPage.tsx`.
- **New files:** `Dockerfile`, `.dockerignore`, `docker/entrypoint.sh`, `litestream.yml`, `render.yaml`.
- **Dependencies:** `@aws-sdk/client-s3` (runtime); the Litestream binary is installed in the image, not via npm.
- **Configuration:** new `TRUST_PROXY`, `DOCUMENT_STORAGE`, `S3_*`, and `LITESTREAM_*` variables in `.env.example` and the README.
- **CI:** `.github/workflows/verify.yml` gains a container job.
- **External accounts (owner-provided):** Render (connected to `adrock18/medivault`) and Backblaze B2 with a private bucket in EU Central. No secrets are committed.
- **Out of scope:** LLM-based OCR, custom domain purchase, email/password reset, account deletion, encryption at rest, paid hosting, and horizontal scaling.
