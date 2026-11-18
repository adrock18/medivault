# Technical Architecture and Module Map

## Context and stack

MediVault is a same-origin modular monolith: one React application and one Express
process, with Supabase Auth, PostgreSQL and private Storage. The primary workflows organize
existing prescriptions, explicitly record outcomes, and manage medical documents.
The former measurement tracker is retired: JSON export retains its archived
measurement shape, but there is no active tracker UI or metrics API.

The server validates Supabase sessions, then uses a request-scoped user client
for ordinary PostgreSQL reads and writes. The server-only secret client handles
validated object mutations and schema readiness. Medication email routes are
disabled; legacy preference/delivery structures and worker SQL remain inert.

Reviewed report results live in the append-only `record_result_reviews` table.
The `save_reviewed_results` invoker RPC validates source ownership and saves a
review and eligible latest profile measurements atomically. Measurement dates
determine latest values; a newer review supersedes the same source's snapshot.
The owner-isolated `get_reviewed_results` RPC supplies vault and export history.

| Layer            | Technology and reason                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Browser          | React, TypeScript, React Router and lazy pages: typed interactive workflows without loading OCR on sign-in.                   |
| Presentation     | Tailwind, shadcn/Base UI, Geist and Lucide: shared tokens, accessible primitives and consistent controls.                     |
| Forms/contracts  | React Hook Form and shared Zod schemas: client guidance plus authoritative server validation and validated responses.         |
| Application      | Express on Node 24 LTS (minimum 22.18): serves API and production frontend together.                                          |
| Database         | Supabase PostgreSQL with owner-scoped RLS, composite foreign keys and versioned migrations.                                   |
| Files            | Private Supabase Storage; bytes are delivered only through authenticated API requests.                                        |
| Document reading | PDF.js and Tesseract run locally by default; optional OCR.Space processing is server-keyed and consent-gated per scan.        |
| Dose reminders   | Current-time status while the website is open; no medication email endpoint or settings UI.                                   |
| Verification     | Formatting, lint, TypeScript, build/resource checks, production audit and Docker compilation; see [workflow](development.md). |

```mermaid
flowchart LR
  Person["Owner"] --> Browser["React workspace"]
  Browser -->|"Same-origin cookie API"| Express["Express"]
  Browser -->|"Local processing"| Workers["PDF.js / OCR workers"]
  Browser -->|"Per-scan consent"| Express
  Express -->|"Optional OCR forwarding"| OCR["OCR.Space"]
  Express --> Auth["Supabase Auth"]
  Express --> DB[("Supabase PostgreSQL + RLS")]
  Express --> Documents["Private Supabase Storage"]
  Other["Other account"] -->|"Ownership checked on every request"| Express
```

OCR workers are browser processes. API ownership checks and PostgreSQL RLS
independently restrict ordinary data access; secret clients are server-only.

## Browser ownership and page boundaries

```mermaid
flowchart TB
  Bootstrap["main: initialize theme and mount React"] --> Root["App: router and render-error boundary"]
  Root --> Auth["AuthProvider: server-validated public session"]
  Auth --> Public["Public login / signup / confirmation guidance"]
  Auth --> Protected["ProtectedRoute: signed-in UI gate"]
  Protected --> Data["DataProvider keyed by account ID"]
  Data --> Snapshot["Fresh account vault + explicit loading/stale/error state"]
  Snapshot --> Selected["Selected managed-profile view"]
  Selected --> Shell["Layout: sidebar, header and nested page"]
  Shell --> Forms["Feature forms + shared schemas"]
  Forms --> Mutation["useMutation: lock, feedback, refresh"]
  Mutation --> API["Typed same-origin API client"]
```

The route gate is a user-experience boundary, not the authorization mechanism.
Express verifies the session for private requests, and ordinary database calls
also run under owner RLS. Switching account remounts the data provider; switching
managed profile filters its account snapshot without creating another session.
Request generations invalidate late responses on replacement or unmount.
The header command palette and its keyboard shortcut are removed. Navigation
stays in the sidebar/mobile menu; workflow buttons stay on their relevant pages.
Medical Records retains local metadata search.

## Runtime and deployment

```mermaid
flowchart TB
  subgraph Development
    Launcher["scripts/dev.ts: preflight and supervise"]
    Launcher --> Vite["Vite: loopback 5187"]
    Launcher --> API["Express: loopback 3001 by default"]
    Vite -->|"/api proxy"| API
  end
  subgraph Hosted["Single Render container"]
    TLS["Host HTTPS proxy"] --> App["Express API + immutable dist"]
    Startup["Validate settings and build"] --> Ready["Managed schema readiness"]
    Ready -->|"Only after success"| App
    App --> DB[("Supabase PostgreSQL")]
  end
  App --> Files["Private Supabase Storage"]
```

Host filesystem replacement does not erase managed data. API readiness probes
the managed schema, not Auth, document availability or backup recoverability.
Files and database changes cannot commit atomically.
See [flow failure branches](flows.md#documents).

## Managed PostgreSQL schema

```mermaid
erDiagram
  auth_users ||--|| profiles : bootstraps
  profiles ||--o| health_profiles : details
  profiles ||--o{ family_members : manages
  family_members ||--o{ medical_records : organizes
  family_members ||--o{ medications : organizes
  family_members ||--o{ care_tracks : groups
  family_members ||--o{ care_visits : organizes
  family_members ||--o| family_health_profiles : details
  profiles ||--o{ record_result_reviews : owns
  family_members ||--o{ record_result_reviews : observations
  medical_records o|--o{ record_result_reviews : source
  care_tracks o|--o{ care_visits : groups
  care_visits o|--o{ medical_records : contains
  care_visits ||--o| visit_follow_ups : originates
  profiles ||--o{ medication_logs : owns
  medications ||--o{ medication_logs : outcomes
  medical_records o|--o{ medications : source
  profiles ||--o{ health_metrics : archived
  profiles ||--|| notification_preferences : configures
  medications ||--o{ reminder_deliveries : delivery
  auth_users {
    UUID id PK
  }
  profiles {
    UUID id PK,FK
    TEXT full_name
  }
  health_profiles {
    UUID id PK
    UUID user_id FK,UK
    JSONB medical_background
  }
  family_health_profiles {
    UUID family_member_id PK,FK
    UUID user_id FK
    TEXT blood_group
    FLOAT height_cm
    FLOAT weight_kg
    JSONB medical_background
  }
  family_members {
    UUID id PK
    UUID user_id FK
    TEXT relationship
  }
  medical_records {
    UUID id PK
    UUID user_id FK
    UUID family_member_id FK
    UUID visit_id FK
    TEXT document_kind
    TEXT hospital_name
    TEXT doctor_name
    TEXT file_path UK
    DATE record_date
    BOOLEAN is_favourite
  }
  medications {
    UUID id PK
    UUID user_id FK
    TIME_ARRAY times
    DATE start_date
    DATE end_date
    UUID source_record_id FK
    UUID family_member_id FK
  }
  record_result_reviews {
    UUID id PK
    UUID user_id FK
    UUID family_member_id FK
    UUID source_record_id FK
    UUID source_record_key
    TEXT source_title
    DATE measured_on
    JSONB results
    TIMESTAMPTZ created_at
  }
  care_tracks {
    UUID id PK
    UUID user_id FK
    UUID family_member_id FK
    TEXT kind
  }
  care_visits {
    UUID id PK
    UUID user_id FK
    UUID family_member_id FK
    UUID care_track_id FK
    DATE visit_date
    TEXT setting
    TEXT hospital_name
    TEXT doctor_name
  }
  visit_follow_ups {
    UUID id PK
    UUID user_id FK
    UUID family_member_id FK
    UUID visit_id FK,UK
    DATE due_date
    TEXT instruction
    UUID source_record_id FK
    TEXT status
    UUID completed_visit_id FK
  }
  medication_logs {
    UUID id PK
    UUID user_id FK
    UUID medication_id FK
    DATE scheduled_date
    TIME scheduled_time
    TEXT status
  }
  health_metrics {
    UUID id PK
    UUID user_id FK
    TIMESTAMPTZ measured_at
    UUID family_member_id FK
  }
  notification_preferences {
    UUID user_id PK,FK
    BOOLEAN email_reminders_enabled
    TEXT timezone
  }
  reminder_deliveries {
    UUID id PK
    UUID medication_id FK
    DATE scheduled_date
    TIME scheduled_time
    TEXT status
  }
```

The authoritative schema and guards are in
[Supabase migrations](../supabase/migrations), including the account aggregate
and reminder-worker functions.
Supabase Auth owns credentials and sessions; application tables contain no
password or session material. Applying these migrations creates no legacy users
or healthcare data. Fresh Auth accounts receive one `profiles` row, one `self`
family member (`id = user_id`) and default-off notification preferences from a
transactional Auth trigger.

Exposed healthcare tables have RLS enabled and explicit least-privilege grants.
Anonymous requests have no public-schema/table access; authenticated requests
are owner-filtered, with resulting-row owner checks for writes. `profiles` is
read-only to its owner, while `health_metrics` is select-only because its UI and
mutation API are retired. `reminder_deliveries` has no ordinary-user grants and
an explicit deny policy. The Auth bootstrap function is in the unexposed
`private` schema, has a fixed search path and does not inherit default PUBLIC
execution. The server secret key is not used for ordinary owner CRUD.

`get_account_vault_data` and `get_account_export_data` are SECURITY INVOKER
functions. They derive the owner from `auth.uid()`, rely on the same table grants
and RLS as direct reads, and return deterministically ordered JSON aggregates in
one row so large collections are not truncated by the Data API row limit. Their
typed result contracts preserve nulls, numeric/boolean values, date-only fields
and `HH:mm` schedule times.

`get_due_reminder_candidates`, `claim_reminder_delivery` and
`complete_reminder_delivery` are SECURITY DEFINER worker functions with an empty
search path. Their EXECUTE grants are revoked from PUBLIC, `anon` and
`authenticated`, and granted only to `service_role`; the underlying
`reminder_deliveries` table remains unavailable to ordinary users. Candidate
results contain owner IDs and dose coordinates, not recipient addresses. Claims
recheck consent, schedule and unlogged-dose conditions, use the unique dose
coordinate for atomic duplicate prevention, and permit retry only after the
55-second lease expires. Completion compares the claim timestamp so a stale
worker cannot overwrite a newer attempt. The service key and Auth recipient
lookup remain server-only; no scheduler or live email delivery is enabled by
these schema changes.

UUID composite foreign keys bind records, medications, logs, tracks, visits and
follow-ups to the same account and family profile. A medication retains a native
PostgreSQL time array and date-only treatment dates; outcomes have a unique
`(medication_id, scheduled_date, scheduled_time)` coordinate. The database
preserves visit/document/source relationships and optional follow-up links.
Transactional dose, profile-name and follow-up guards are enforced by the
versioned migrations. Hosted acceptance remains separate from local build and
real-provider API verification.

Both health-profile tables contain nullable `medical_background` JSONB. Each row
has an allergy/condition type, name and optional doctor-provided instructions.
The application and database validate limits; a private trigger derives the
retained allergy/condition text summaries. `NULL` means legacy text has not been
converted; `[]` explicitly clears structured entries. Existing commas/newlines
are not guessed into separate conditions. Stale unstructured overwrites after a
structured save are rejected, without changing owner RLS.

Reviewed-result source deletion clears `source_record_id` but retains
`source_record_key`, source title and review history. The key is preserved
provenance, not a second live foreign key. Latest eligible profile measurements
are synchronized by the reviewed-results transaction, not by OCR.

The retired `health_metrics` relation remains owner-scoped for account export
compatibility but starts empty. Family profiles organize data; they are not
separate identities or grants. Care tracks and visits remain optional
organizational context, and deleting them must not cascade through clinical data.

Each actual visit owns at most one optional `visit_follow_ups` row. Follow-ups
store a manually selected due date, original instruction, optional source
document from that visit, pending/completed/cancelled status and optional actual
return visit. All links share the owner and family profile. Return visits must
be different and on/after the origin; due dates cannot precede the origin.
Origin deletion cascades the follow-up. Source or return deletion clears only
that link, preserving wording, date and asserted status. Record reassignment
clears its source link in the same SQL statement; invalidating visit edits are
rejected. Migration creates no follow-ups for old visits.

Medical records is the compact actual-visit/document workspace. The separate
protected `/medical-history` page reuses the care graph and the same selected
profile's vault data; Health profile remains personal health details. Shared
navigation includes history above Profile, while the mobile dock selects
its four existing destinations explicitly. No graph runtime or duplicate
history table is introduced. Full-vault fetching remains unpaginated.
Deleting an otherwise empty non-owner profile removes its demographic and
family health-profile details. The account owner's personal details remain in
`health_profiles`; other family members' health details are stored one-to-one
in `family_health_profiles`.
Care tracks and visits are optional organizational context, not inferred
clinical relationships. Track/visit and visit/document associations must stay
within the same account and family profile. Deleting a visit unassigns its
documents; deleting a track leaves its visits standalone.
The UI labels marked documents **Important!**. Their existing `is_favourite`
values remain PostgreSQL booleans and strict booleans in
API responses. They live on the owned record, not in a separate achievement or
bookmark table.

## Responsibility map

| Module                                                                                                                                                                                                   | Responsibility / invariant                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [api](../src/lib/api.ts), [shared contracts](../shared/contracts.ts), [shared schemas](../shared/schemas.ts), [shared types](../shared/database.types.ts), [document validation](../shared/documents.ts) | Same-origin client, response/request validation, domain types and shared file validation; never browser database access. |
| [shared health helpers](../shared/health.ts), [utilities](../src/lib/utils.ts), [theme](../src/lib/theme.ts), [navigation](../src/lib/navigation.ts)                                                     | Cross-feature date helpers, formatting, appearance preference and shared destinations.                                   |
| [auth feature](../src/features/auth), [dashboard feature](../src/features/dashboard), [profile feature](../src/features/profile), [settings feature](../src/features/settings)                           | Feature pages and feature-specific presentation; dashboard also owns visualization/summary helpers.                      |
| [medications feature](../src/features/medications), [records feature](../src/features/records)                                                                                                           | Feature pages, components and domain helpers grouped by workflow; local OCR/PDF processing remains in records.           |
| [demo data](../src/features/demo/sampleData.ts)                                                                                                                                                          | Explicit fictional seeding, separate from private runtime database/document storage.                                     |
| [Layout](../src/components/Layout.tsx), [ThemeSelect](../src/components/ThemeSelect.tsx)                                                                                                                 | Responsive navigation, profile/account controls and shared appearance; no header command search.                         |
| [common](../src/components/common.tsx), [UI primitives](../src/components/ui), [CSS](../src/index.css)                                                                                                   | Loading/empty/form/dialog conventions, accessible controls, design tokens and bounded visual effects.                    |
| [App](../src/App.tsx), [main](../src/main.tsx)                                                                                                                                                           | Provider/router boundaries, lazy feature routes, signed-in/out access; legacy tracker redirect.                          |
| [AuthProvider](../src/contexts/AuthProvider.tsx), [AuthContext](../src/contexts/AuthContext.ts)                                                                                                          | Session lifecycle, request generations, sign-in/up/out, expiry and focus refresh.                                        |
| [DataProvider](../src/contexts/DataProvider.tsx), [DataContext](../src/contexts/DataContext.ts)                                                                                                          | Owned dataset and clock; minute/focus refresh, stale data and late-response invalidation.                                |
| [useMutation](../src/hooks/useMutation.ts), [useQueryParams](../src/hooks/useQueryParams.ts)                                                                                                             | Pending/error/save refresh pattern; explicit URL query updates.                                                          |
| [app](../server/app.ts)                                                                                                                                                                                  | Express setup, security/request middleware, authentication boundary, static frontend and centralized error handling.     |
| [auth routes](../server/routes/auth.ts), [route context](../server/routes/context.ts)                                                                                                                    | Public auth and password routes; shared validation, session, ownership and CRUD helpers.                                 |
| [vault routes](../server/routes/vault.ts), [care routes](../server/routes/care.ts)                                                                                                                       | Owned vault/export/profile endpoints, reviewed results, care tracks/visits and follow-ups.                               |
| [record routes](../server/routes/records.ts), [medication routes](../server/routes/medications.ts)                                                                                                       | Owner-scoped private document operations, opt-in OCR forwarding, medication CRUD and explicit dose logs.                 |
| [notification routes](../server/routes/notifications.ts)                                                                                                                                                 | Retired, unmounted implementation; no active preference or email scheduler endpoint.                                     |
| [Supabase clients](../server/supabase.ts), [generated database types](../server/supabase.types.ts), [managed migrations](../supabase/migrations)                                                         | Typed request/admin client boundaries, PostgreSQL RLS and transactional guards.                                          |
| [config](../server/config.ts), [index](../server/index.ts), [frontend-build](../server/frontend-build.ts)                                                                                                | Validated startup, shutdown and production-artifact refusal before opening storage.                                      |
| [document-store](../server/document-store.ts)                                                                                                                                                            | Private native Supabase put/get/delete interface; injectable failure seam.                                               |
| [dev](../scripts/dev.ts), [dev-runtime](../scripts/dev-runtime.ts)                                                                                                                                       | Check ports, own children, prove direct/proxied readiness, bounded failure/cleanup.                                      |
| [check-build](../scripts/check-build.ts), [ocr-assets](../scripts/ocr-assets.ts)                                                                                                                         | Complete emitted resources/entry budget and locally packaged worker assets.                                              |
| [Release guide](development.md), [CI](../.github/workflows/verify.yml)                                                                                                                                   | Published source/build, image-compilation and audit gates; functional suites remain local-only.                          |

For code navigation, read a page, then its domain helper/client, then the matching
handler and migration. Avoid spreading validation or private file access into
unrelated UI components.
