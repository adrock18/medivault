# Proposal

## Why

The current Render demo depends on SQLite restoration and continuous Litestream
replication to Backblaze; storage transaction caps have prevented reliable
operation. The owner has approved a fresh start without importing existing data,
making this the right point to replace that persistence chain with Supabase.

## What Changes

- **BREAKING:** New accounts use Supabase Auth. Existing SQLite accounts,
  passwords, sessions, records and uploaded documents are not imported; users
  register again. This does not authorize deleting old local or remote data.
- Replace runtime SQLite with versioned PostgreSQL migrations in Supabase,
  owner-scoped RLS, relational constraints and atomic database operations.
  Preserve the completed compact-visits/follow-up implementation as the baseline.
- Replace local/B2 document storage with a private Supabase bucket, retaining
  validated uploads, owner-authorized same-origin file delivery and explicit
  partial-operation errors.
- Keep React and the same-origin Express API. Supabase supplies authentication
  and persistence; Render still hosts the web application. Preserve HttpOnly
  sessions rather than placing tokens or health datasets in browser storage.
- Handle both immediate-session registration and a project requiring email
  confirmation truthfully, including the confirmation callback.
- Remove active Litestream/B2/local-database configuration and dependencies;
  document Supabase setup, a fresh-project cutover, verification and rollback
  boundaries. Missing cloud configuration must not start an empty local vault.
- Preserve existing profile, record, medication, dose, history, follow-up, export,
  opt-in sample-data, OCR and optional email-reminder behavior. Fresh accounts
  start empty except for their self profile and default notification settings.

## Capabilities

### New Capabilities

- `managed-data-persistence`: Supabase PostgreSQL schema, RLS/grants, atomic
  relational invariants, complete reads and isolated scheduler persistence.

### Modified Capabilities

- `account-health-management`: Supabase-backed account/session lifecycle,
  confirmation-aware signup, fresh-start data boundaries, password changes and
  required cloud configuration.
- `medical-record-vault`: Private Supabase object persistence and server-only
  validated document mutations without changing preview/source workflows.
- `live-demo-deployment`: Managed remote persistence instead of SQLite replica
  restoration, lean container configuration and verified hosted cutover.
- `development-runtime`: Required Supabase configuration while preserving
  explicit ports, ownership-aware readiness, watch reloads and safe shutdown.

## Impact

- Backend: all seven route modules, authentication/context, application startup,
  configuration, database/document-store implementations and error mapping.
- Frontend: auth provider/API/contracts and minimal registration/callback
  feedback; existing page layouts and clinical workflows remain stable.
- SQL and dependencies: add Supabase migrations and typed clients
  (`@supabase/supabase-js`, `@supabase/ssr`); remove the active S3 SDK/Litestream
  persistence path after replacements pass verification.
- Deployment/docs: Dockerfile, entrypoint, Render blueprint, environment example,
  setup/development/architecture/flows/operations guidance and affected local-only
  verification fixtures. No testing material or secrets enter the release tree.
- External prerequisites: an owner-controlled new Supabase project and access to
  Render secret/deployment settings; actual hosted success cannot be inferred
  from a local build.

The later header/card/profile/history redesign, SMS, new appointment features,
pagination and Git-history rewrite are outside this backend change. Commit
publication and any rewrite of already-published history remain separate
controlled operations after implementation verification.
