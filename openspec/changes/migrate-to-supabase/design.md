# Design

## Context

See [proposal.md](proposal.md) for motivation and scope. This design is required
because authentication, persistence, file operations and deployment all change.

Observed implementation:

- `server/database.ts` opens synchronous `node:sqlite` and applies versions 1-8.
  Every route module uses SQLite helpers or statements, including transactions
  for profile synchronization, deletion, follow-ups and reminder claims.
- `server/routes/context.ts` authenticates a custom hashed session cookie.
  React uses `/api/auth/*`; tokens and health datasets are not stored in browser
  storage. Auth registration currently always returns a session.
- Shared Zod/domain contracts already cover families, family health details,
  medications/logs, documents, care visits/tracks and manual follow-ups.
- Documents use a `DocumentStore` boundary. The server validates signatures and
  streams authorized bytes; it compensates failed metadata insertion.
- Render runs one container with ephemeral disk. The entrypoint restores and
  supervises SQLite with Litestream against the same B2 bucket as documents.
- Completed `compact-visits-and-follow-ups` work is still uncommitted and its
  deltas are not synchronized. Preserve that implementation; do not overwrite
  it from older main-spec descriptions or archive either change implicitly.
- Verification lives under ignored `.local-verification`; published source and
  CI intentionally exclude executable testing material. Existing backend tests
  assume SQLite fixtures and need replacement, not a compatibility backend.
- Main specs still promise immediate registration, replica-restored sessions,
  credential-free local persistence and legacy measurement mutations. Those
  promises conflict with this fresh-start target or current retired-metric code;
  the deltas explicitly reconcile them.

## Goals / Non-Goals

**Goals**

- One supported runtime backend: Supabase Auth, PostgreSQL and private Storage.
- Keep page routes, API payloads and clinical behavior stable except where
  confirmation-aware auth and required configuration necessarily differ.
- Enforce account ownership in PostgreSQL and keep transaction-level clinical
  invariants valid even for direct authenticated Data API requests.
- Make cutover, unavailable configuration and external verification explicit.

**Non-Goals**

- Import, reset or delete old data; migrate passwords or preserve old sessions.
- Introduce OAuth, SMS, recovery-email features, new clinical automation,
  a tracker UI, cross-profile sharing, pagination or the requested visual revamp.
- Move Express into Edge Functions, change hosting providers, auto-enable
  paid services, auto-send reminders, rewrite Git history or archive changes.

## Decisions

### D1. Retain the same-origin Express boundary

React continues calling `/api` with existing request protection and credentials.
Express uses `@supabase/supabase-js` and `@supabase/ssr`. A request-scoped server
client receives the cookie adapter; ordinary data calls carry the verified
user's access token so PostgreSQL evaluates RLS as that user. Never reuse a
mutable authenticated client across requests.

Use the server-only secret client only for validated Storage writes, narrow
worker operations and necessary Auth administration, not normal account CRUD.
This keeps RLS meaningful instead of globally bypassing it with a service key.
Retain strict request schemas and map provider errors to useful, sanitized HTTP
responses, including conflicts and unavailable dependencies.

Alternative: direct browser Supabase CRUD would expand the frontend rewrite,
change session-storage guarantees and bypass existing upload validation.
Alternative: direct privileged PostgreSQL queries would require a separate
connection/role-management layer and make RLS easier to bypass accidentally.

### D2. Supabase owns credentials and sessions; cookies stay HttpOnly

Adapt `/api/auth/session`, register, login, logout and password endpoints to
Supabase Auth. Use supported cookie chunking/refresh handling; set HttpOnly,
SameSite=Lax, host-only cookies under `/api`, Secure in production, and no-store
responses. No browser Supabase client, browser token storage or custom users,
password-hash or session tables remain. Clear the legacy session cookie at the
transition rather than treating it as Supabase credentials.

Validate authenticated requests through Auth `getUser()` after supported token
refresh, not an unverified decoded token or server `getSession()` alone.
Differentiate invalid/expired credentials from provider outages: outages are
retryable failures, not signed-out success responses that erase valid cookies.
Use bounded network operations and verify concurrent refreshes and request
isolation. Keep the existing frontend protection against stale session-refresh
results overwriting a login.

Registration returns a typed result for either an authenticated session or
`confirmation_required`; update the provider/form only for this branch. Respect
the project's email-confirmation setting, recommending confirmation for the
public service. Do not silently disable verification or claim delivery.
Configure an allowlisted `/api/auth/callback` using PKCE, with explicit expired,
invalid and missing-verifier feedback and no open redirect. Support immediate
signup when the owner deliberately configures it for the fictional demo.
Confirmation on a different browser must give sign-in/retry guidance rather
than fabricate a session. No tokens belong in logs or app-generated redirects.

Password change verifies the current password with an isolated Auth client,
updates the active account and revokes other Supabase sessions, retaining the
current session. Dispose of temporary verification credentials. Surface partial
failure explicitly; test revoked sessions at the API boundary, not just cookie
deletion. Logout ends the current session without unexpectedly logging out every
device. Name display comes from `profiles`, not mutable Auth metadata.

### D3. Native PostgreSQL schema and RLS replace SQLite adaptations

Create versioned SQL under `supabase/migrations`, without executing a database
reset against an existing project. Keep current domain/API identifiers and
contracts, using UUID, date, timestamptz, boolean and numeric types, and a native
time-list representation mapped to the existing `string[]` contract. Generate
typed Supabase database definitions and keep shared Zod response validation.

Tables: `profiles`, `health_profiles`, `family_members`,
`family_health_profiles`, `medical_records`, `medications`, `medication_logs`,
`health_metrics`, `notification_preferences`, `care_tracks`, `care_visits` and
`visit_follow_ups`; internal `reminder_deliveries` is not owner-writable.
Auth identities live in `auth.users`. The retired metric table starts empty and
remains in account export; do not introduce a tracker or metric-mutation API.

A narrowly scoped Auth-insert trigger atomically creates the account profile,
one self member (`id = user_id`) and default-off notification preferences.
Validate name metadata as display input only, never authorization. Failure
rolls back bootstrap rather than leaving a successful but unusable account.
Use a unique self-profile constraint and prohibit self deletion/reassignment.

Enable RLS on exposed tables. Revoke broad defaults, especially anon writes and
TRUNCATE; grant only required operations. SELECT/DELETE use `auth.uid()`, while
INSERT/UPDATE also check the resulting owner. For profiles use `id`; for child
tables use `user_id`. Keep owner identifiers immutable. Composite foreign keys
and triggers enforce same-owner and same-family references; RLS alone does not.

Ordinary RPC functions are security-invoker. Where a narrow definer function is
necessary (Auth bootstrap or internal worker), fix the search path, fully qualify
objects, revoke default PUBLIC execution and grant only intended roles.

### D4. Port invariants, not just table columns

Retain these guards at the database boundary:

- Valid medication forms, lengths, date ranges, unique HH:mm times, frequency
  counts and same-profile source links. Existing dose logs survive schedule
  edits. New logs must match a scheduled dose; unique medication/date/time and
  immutable schedule coordinates prevent duplicate or rewritten history.
- Owner health-name synchronization with profile/self rows is one transaction.
  Family health rows cannot target self. Empty non-self deletion is atomic and
  rejects related records, medications, metrics, tracks or visits even under
  concurrent insertion; supporting foreign keys must not cascade their care data.
- Track deletion unassigns visits without deleting them. Visit deletion
  unassigns documents and deletes its originating follow-up. Medication-source
  and optional follow-up source/return deletion clear only those links.
- Follow-up upsert is unique per origin and derives owner/profile from the
  origin. Due date cannot precede origin; source is attached to that same visit;
  completed return is different, same-profile and not before origin. Reopening
  or cancelling clears return association. Invalidating visit edits fail, and
  moving a source document clears its follow-up link in the same transaction.

Use database functions for multi-row operations and locks/constraints for
concurrent mutations; do not simulate transactions with sequential independent
HTTP calls. Exercise direct authenticated writes and conflicting concurrent
operations as well as friendly API validation.

Vault/export reads must be complete and deterministically ordered, including
datasets beyond the default Data API row cap. Prefer a security-invoker
JSON aggregate RPC per existing aggregate response, preserving one database
snapshot and avoiding silent 1,000-row truncation. This is not a new paginated UI.
Preserve actual nulls, numeric/boolean values, date-only strings and HH:mm
precision at the contract boundary.

### D5. Private Storage behind the existing validated file API

Use native Supabase Storage, not its S3 compatibility endpoint. A private bucket
limits size to 10 MiB and accepted MIME types. Retain server checks for extension,
MIME and magic bytes. Keys are opaque, owner-prefixed and immutable; metadata
cannot reference a different owner's object or an arbitrary bucket.

The server secret client performs upload/delete only after authenticated owner
checks and validation. Ordinary users have no direct Storage write policy that
would bypass magic-byte validation. Owner-only object reads can use RLS; deny
anonymous access. Never expose the secret client or public/presigned file URLs.
The browser continues using `/api/records/:id/file`, blob previews, downloads and
local OCR. Do not write directly to Supabase's storage metadata tables.

Preserve upload compensation, non-overwriting object creation, explicit missing
file errors, deletion retry after metadata failure and incident-only diagnostic
logging. PostgreSQL and Storage remain non-atomic; no automatic orphan cleanup
or destructive reconciliation is introduced.

### D6. Preserve optional email processing without broadening notifications

Keep `/api/internal/reminders`, scheduler-secret authorization, consent, timezone
handling, five-minute lookback, generic messages and provider idempotency keys.
Use service-role-only worker RPCs for due candidates, transactional claim/reclaim
and compare-and-set completion. No authenticated user can invoke them, forge
delivery state or obtain recipient lists. Resolve email through server-side Auth
administration rather than copying all Auth users into a public table.

Concurrency must retain at-most-one active claim per dose and the existing retry
lease semantics. Do not hold database locks during email network requests. Resend
failure remains an explicit failed count/state. Do not enable a real scheduler
or send live email merely to validate the backend migration.

### D7. Required configuration and a lean deployment

Required server configuration: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `SUPABASE_DOCUMENT_BUCKET`. Require a valid HTTPS
`APP_ORIGIN` and secure cookies in production; permit explicitly configured
loopback development. Set signup Site URL/redirect allowlists to the actual host.
Never use `VITE_` for server secrets, accept service keys as user credentials,
log values, or retain local persistence as a fallback.

Maintain a harmless schema/readiness RPC with minimal execution grants and no
health data. Startup checks required settings/build and bounds its schema-access
probe; missing/incompatible schema or unavailable data services must not announce
complete readiness. `/api/health` retains its healthy response and reports remote
database failure truthfully without probing Storage on every host health poll.
Explain that Auth, document availability and backups need separate checks.

Remove active Litestream image stage/config/entrypoint supervision and unused
AWS SDK. Render remains same-origin HTTPS with its existing port, trusted-proxy,
health-check and checks-pass deployment gates. Do not run migrations at every
web startup or grant schema-administration privileges to the application.
Local development needs a deliberately configured Supabase project or isolated
local Supabase stack; missing `.env` alone is not fatal if process settings exist.
Preserve safe listener ownership, watch restarts and shutdown.

## Risks / Trade-offs

- Provider dependency and free-tier pauses/quotas -> show retryable outages,
  document current limits and verify the actual project before presentation.
- Auth email sender restrictions -> configure confirmation settings and sender
  deliberately; test delivery with an owner-controlled mailbox. Pending email is
  not proof of delivery and must not trap users behind fake signup success.
- Privileged Storage/worker key -> server-only use, narrow code boundaries,
  owner checks, denied ordinary-user writes and key rotation guidance.
- Direct Data API access bypasses Express validation -> database constraints/RPC
  grants preserve relational and workflow guards; test them with user tokens.
- PostgreSQL/Storage partial failures -> keep current compensation and truthful
  retry paths; database backups do not include document objects.
- Existing local suites use SQLite -> adapt isolated fixtures and execute actual
  PostgreSQL/RLS tests; mocks alone cannot establish policy or transaction safety.
- JWT/session revocation and concurrent refresh -> supported server cookies plus
  live Auth validation; verify refresh/logout/password outcomes with two sessions.
- Rollback after new writes -> old SQLite/B2 cannot read new Supabase data.
  Prefer a compatible forward fix or previous Supabase-capable revision; switching
  back is a separate recovery decision, not a lossless automatic fallback.

## Migration Plan

1. Finish code/migrations locally without touching the old demo's stored bytes.
   Preserve existing dirty work; reconcile predecessor deltas before any later
   spec synchronization. Do not archive them as part of this proposal.
2. Owner creates/selects a **new empty** Supabase project and enters credentials
   privately in local/hosting secret settings. If any target already contains
   data, stop for separate authorization instead of running reset/drop commands.
3. Apply versioned SQL and private-bucket setup once; generate types and verify
   bootstrap, grants/RLS, relational guards and ordinary/worker role separation.
4. Run isolated API/auth/storage checks with two fictional accounts. Verify one
   confirmation-enabled flow with an owner-controlled mailbox and immediate
   signup in an isolated configuration where enabled. Do not toggle a shared
   project's auth setting for a test.
5. Build the lean container and update Render settings only when ready for the
   coordinated cutover. Prevent a push from auto-deploying incompatible code
   against old settings. Old accounts must receive clear re-registration guidance;
   never silently create an account when an old login fails.
6. Deploy a verified revision, then check actual signup/login, owner-only
   record upload/download, medication/log and follow-up persistence after a
   service restart. Compare downloaded fictional bytes; preserve sanitized
   evidence and distinguish real-provider results from mocks.
7. Leave email delivery disabled unless separately configured/authorized. Keep
   old local/B2 data untouched and do not leave the old writer replicating after
   cutover. Stop only the specifically identified old owned service, not unrelated
   processes. Record the deployment URL/revision and known plan limitations.

## Open Questions

- The owner-controlled project's reference/region and final Render URL are
  deployment inputs, not architecture choices. Credentials must be configured
  privately; missing access blocks hosted verification, not justification for
  a local-success claim.
- Which owner-controlled mailbox will receive the confirmation rehearsal is an
  operational input. No email address or credential belongs in these artifacts.

## References

- [Supabase server-side Auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Session validation and cookies](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [RLS and grants](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Storage S3 limitations](https://supabase.com/docs/guides/storage/s3/compatibility)
- [Current plan limits](https://supabase.com/pricing)
