# Tasks

## 1. Configuration and isolated provider setup

- [x] 1.1 Add the Supabase SDK/SSR dependencies and request-scoped server-client boundary; validate the required settings and production origin without exposing secrets or selecting a local fallback. Update `.env.example` and setup sections in `README.md`/`docs/development.md`. Verify focused configuration tests cover missing/malformed settings, key separation, no `VITE_` secrets and explicitly configured loopback development.
- [x] 1.2 Prepare an owner-controlled new empty Supabase project or isolated local stack, with credentials entered privately and a safe fictional verification namespace. Deliver repeatable setup instructions and adapt the ignored local fixture harness so real-provider failures cannot silently skip tests. Verify the target is empty, do not reset existing projects, and report missing owner/project/hosting access as a blocker rather than creating a different backend.

## 2. PostgreSQL schema, authorization and atomic operations

- [x] 2.1 Add versioned native PostgreSQL migrations for the current domain tables, Auth bootstrap, unique self profile, defaults, indexes and RLS/grants; generate typed database definitions. Update the schema sections of `docs/architecture.md`. Verify real Auth registration initializes profile/self/preferences atomically, fresh accounts have no imported data, and direct anonymous/two-account Data API tests reject cross-owner reads/writes, owner reassignment and unauthorized table-wide operations.
- [x] 2.2 Port transactional profile synchronization, restricted family deletion, schedule/source guards, dose uniqueness and immutable coordinates. Extend isolated PostgreSQL tests for name-update rollback, same-profile source checks, concurrent dose conflicts, retained logs after schedule edits and concurrent family deletion/insertion without care-data loss. Verify constraints work for direct authenticated writes, not just Express validators.
- [x] 2.3 Port care organization and follow-up constraints/RPCs, including unique upsert, source/return/date rules, invalidating edits and unlink/cascade behavior. Update the persistence semantics in `docs/flows.md`. Verify the existing focused clinical cases against PostgreSQL plus conflicting concurrent origin edits/upserts and source reassignment.
- [x] 2.4 Add typed owner-scoped aggregate reads and narrowly privileged worker functions, revoking default PUBLIC execution and fixing definer search paths where needed. Verify vault/export include more than 1,000 logs with stable shapes/order and no other account's data; ordinary users cannot invoke worker functions or forge delivery state. Document function/role boundaries in `docs/architecture.md`.

## 3. Supabase authentication with the existing browser API

- [x] 3.1 Replace custom password/session persistence in auth routes/context with request-scoped Supabase Auth and supported HttpOnly cookie refresh. Keep request protection, no-store responses, same-origin API and invalid-session/outage distinction; clear the retired cookie without importing it. Adapt local auth/backend tests to verify login, reload, refresh, concurrent request isolation, logout, revoked/expired sessions, provider outage feedback and absence of browser token storage. Update session flows documentation.
- [x] 3.2 Add the typed confirmation-required registration branch, minimal register-form/provider feedback and allowlisted PKCE callback. Document project Site URL/redirect settings and re-registration guidance. Verify immediate signup where configured, pending confirmation, successful exchange, duplicate signup handling, missing verifier, expired callback and rejected external redirects; preserve the frontend stale-session-refresh race guard.
- [x] 3.3 Adapt current-password verification and password change to Supabase, preserving the active session while revoking others and disposing of temporary verification credentials. Update account-operation documentation. Verify incorrect-password rejection, successful new credentials, other-session API rejection and explicit partial-failure feedback without logging passwords/tokens.

## 4. Existing application API on managed persistence

- [ ] 4.1 Convert vault/export, owner health profile, family CRUD and family health operations to asynchronous user-scoped Supabase calls/RPCs. Keep shared Zod shapes and numeric/boolean/date/null mappings. Verify focused API cases for complete export, empty states, profile filtering, name synchronization, restricted self/non-empty deletion, provider errors and the existing opt-in sample-data workflow; update API/data-flow documentation.
- [ ] 4.2 Convert medication, dose, track, visit and follow-up routes without changing page navigation, manual lifecycle behavior or source semantics. Reuse shared validation and return actionable conflicts. Verify targeted backend/forms/discovery cases, record/visit/source scopes and preserved completed `compact-visits-and-follow-ups` behavior against the new API.
- [x] 4.3 Convert preference storage and the authorized reminder worker to atomic PostgreSQL claim/reclaim/completion functions and server-side recipient lookup. Preserve timezone, consent, generic content, provider idempotency and optional configuration. Verify overlapping claims, lease/retry boundaries, stale completion rejection, provider failures and unauthorized worker access using a fake email sender; update `docs/operations.md` without enabling live email or a scheduler.

## 5. Private Supabase document storage

- [ ] 5.1 Configure the private bucket's size/MIME limits and read policies with no ordinary-user direct write path; implement the server-only native Supabase document adapter after validated ownership checks. Update storage setup/architecture guidance. Verify anonymous/other-owner reads and direct unvalidated writes fail, valid application uploads work, collisions do not overwrite bytes, and keys/metadata cannot target another owner.
- [ ] 5.2 Integrate uploads, same-origin file streaming, metadata/favourites, deletion and optional OCR with the managed store while preserving compensation, partial-error and explicit-retry paths. Extend local document/backend/preview tests for exact 10 MiB acceptance, oversized/disguised rejection, missing bytes, failed metadata cleanup, deletion retry and byte-identical download. Verify preview/source links and local OCR still consume authorized blobs; update document-operation flows/runbook.

## 6. Runtime and deployment cutover preparation

- [ ] 6.1 Replace SQLite startup/health/shutdown dependencies with bounded managed-schema readiness; preserve development ports, invocation identity, proxy readiness, watch restarts and owned-process cleanup. Retire active custom-auth/local/S3 persistence paths once replacements are used. Verify targeted startup/build-artifact tests and real configured startup, including unavailable schema, absent settings and missing frontend builds, without stopping the existing shared demo automatically. Update `docs/development.md`.
- [ ] 6.2 Remove Litestream/B2 runtime configuration, unused AWS dependencies and replica supervision from Docker/Render settings; retain same-origin HTTPS, trusted proxy, health and checks-pass gates. Update `README.md`, `docs/operations.md`, architecture/decisions/system-overview navigation and fresh-start/rollback instructions. Verify the image builds without cloud credentials, fails startup without required runtime settings, runs with configured services, and excludes secrets, local data and executable testing material. Do not call image compilation hosted acceptance.

## 7. Integration and hosted acceptance

- [ ] 7.1 Run the smallest combined affected local-only auth/backend/document/startup/form/discovery/preview/reminder suites, including actual PostgreSQL/RLS cases, then `npm run verify`, strict OpenSpec validation and `git diff --check`. Resolve introduced regressions and report unrelated pre-existing failures explicitly. Verify generated contracts, the full published-source boundary and absence of obsolete active B2/SQLite settings; record which results used real services versus fakes.
- [ ] 7.2 Perform focused browser checks for signup/confirmation/login, selected-profile vault/history, upload/preview and managed-data outage feedback at desktop/mobile widths. Keep existing layouts stable rather than implementing the later visual revamp. Verify no token/secret is exposed in browser storage, URLs or frontend assets and no page-level layout regression is introduced; do not substitute a broad end-to-end walkthrough for the targeted persistence checks.
- [ ] 7.3 Coordinate the prepared Supabase schema/secrets/auth URLs with the Render release so a push cannot auto-deploy incompatible old settings. Deploy only the verified revision and check real signup/login, two-account isolation, upload/download bytes, medication/dose and follow-up persistence after a service restart. Record URL/revision and sanitized results; leave this task open if hosted access is unavailable. Leave legacy stored data untouched, stop only an identified obsolete owned writer, and keep reminders disabled unless separately authorized.

## Workflow follow-up

- Commit/publication follows verified implementation and prepared deployment
  settings. The earlier request to remove attribution from the already-published
  last commit needs explicit confirmation before a history-rewriting push; do
  not fold that operation into backend setup.
- Reconcile the completed predecessor's deltas before synchronizing successor
  specs. Review and archive changes only when requested and after acceptance.
- The header, dashboard/card spacing, medication entry UX, history/profile/settings
  revamp and moving track management are the next separate UI change after the
  live foundation is verified. SMS remains a separate decision and implementation.
- No migration of old accounts/data, deletion of old storage, billing change,
  live email send or automatic destructive cleanup is part of this checklist.
