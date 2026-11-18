# MediVault

MediVault is a personal health workspace for organizing medical documents and
medication schedules in one private account. It is a full-stack portfolio/MVP
project built around clear data ownership, explicit medication check-ins, and
reviewable links between a prescription record and the medication entered from
it.

> **Live demo:** [medivault-dlq9.onrender.com](https://medivault-dlq9.onrender.com)
>
> The demo is for fictional data only. Do not enter real health information.
> Its free hosted instance may take time to wake up.

## What it does

- **Medication workspace:** create and edit medications, view a daily schedule,
  record taken/skipped outcomes, browse history, and see an adherence summary.
- **Medical records vault:** upload, search, categorize, preview, download, and
  delete private PDF/JPG/PNG documents, grouped by family profile, optional care
  track, and dated visit.
- **Family profiles:** organize each managed person's medical records and
  medication schedule under the account owner's login.
- **Visit-centered timeline:** group related visits under owner-created care
  tracks; standalone visits and unassigned documents remain easy to find.
- **Prescription-to-medication link:** keep the source record and reviewed
  prescription wording attached to a medication.
- **Review-first prescription OCR:** local browser OCR is the default. An
  optional, server-configured OCR.Space path requires consent for each scan;
  results remain editable and must be checked before saving.
- **Optional email reminders:** an opted-in account can receive generic dose
  reminders when Resend credentials and an external scheduler are configured.
  Delivery is best-effort, not a clinical or emergency alert.
- **Health profile and dashboard:** manage profile details and see a
  database-backed overview of records, medications, and today's schedule.
- **Settings:** change appearance, update a password, export account data, and
  create an optional private activity summary.

Family profiles are owner-managed and do not have separate logins or delegated
access. Email reminders and remote OCR are optional integrations and are not
available unless an operator configures them. The public demo is for fictional
data only; never send real or sensitive medical documents to the optional OCR
provider. MediVault does not connect to a clinic/EHR or provide AI-generated
medical advice. A scheduled dose is not proof that a dose was taken or missed;
users record outcomes explicitly.

The former health-measurement tracker is not an active product/API feature.
The archived-measurement export shape is retained, but this fresh Supabase
release does not import old accounts, documents or measurements.

## Technology

| Area                | Technology                                                                  |
| ------------------- | --------------------------------------------------------------------------- |
| Frontend            | React, TypeScript, Vite, React Router                                       |
| UI                  | Tailwind CSS, Base UI/shadcn-style primitives, Lucide                       |
| Forms and contracts | React Hook Form, Zod                                                        |
| Backend             | Node.js, Express 5, same-origin JSON/multipart API                          |
| Authentication      | Supabase Auth with server-managed HttpOnly cookies                          |
| Database            | Supabase PostgreSQL, versioned migrations and owner-scoped RLS              |
| Documents           | Private Supabase Storage behind validated, authenticated API routes         |
| OCR/PDF             | Local Tesseract.js/PDF.js; optional consent-gated OCR.Space processing      |
| Email reminders     | Optional Resend API integration with an external scheduler                  |
| Hosting example     | Stateless Render container; managed database and documents survive restarts |

React and Express remain on one origin. Supabase supplies authentication,
PostgreSQL and private Storage; no local database, B2 or Litestream is required.

## How the application fits together

```mermaid
flowchart LR
  Person --> React["React features and shared UI"]
  React --> Client["src/lib/api.ts"]
  Client -->|"same-origin /api + HttpOnly cookie"| Express["Express middleware"]
  Express --> Routes["server/routes/*"]
  Express --> Auth["Supabase Auth"]
  Routes --> DB[("Supabase PostgreSQL + RLS")]
  Routes --> Files["Private Supabase Storage"]
  React -->|"local PDF/OCR workers"| OCR["PDF.js / Tesseract"]
  React -->|"explicit per-scan consent"| Express
  Express -->|"optional remote OCR"| OCRSpace["OCR.Space"]
  Scheduler["External cron"] -->|"optional bearer-protected call"| Express
  Express -->|"generic reminder email"| Resend["Resend"]
```

The frontend validates forms for usability, while the API validates requests
again and checks ownership before reading or changing private data. Production
serves the built frontend and API from the same Express application. See the
[architecture and module map](docs/architecture.md),
[end-to-end system guide](docs/system-overview.md), and
[request-flow guide](docs/flows.md).

## Run locally

Requirements: Node.js **22.18 or newer**, npm and a configured Supabase project.

```powershell
npm ci
# Copy .env.example to .env and supply your Supabase server settings.
npm run dev
```

Open <http://127.0.0.1:5187>, create a fictional account, and use the app. The
development launcher starts Vite and Express together and checks API readiness.
Apply the versioned [Supabase migrations](supabase/migrations) once before
starting. Runtime startup verifies schema readiness; it never runs migrations
or creates an empty local fallback. Use fictional data for development.

Optional settings are documented in [.env.example](.env.example). Never put
server credentials in a `VITE_` variable or commit a populated `.env` file.
The Supabase server configuration uses `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and
`SUPABASE_DOCUMENT_BUCKET`; keep all four server-side. Production also requires
an HTTPS `APP_ORIGIN` and `COOKIE_SECURE=true`. Local Supabase-backed development
can explicitly set `APP_ORIGIN=http://127.0.0.1:5187`. Existing accounts and data are not imported: register again after cutover.
Configure the Site URL and exact `/api/auth/callback` redirect in Supabase Auth.
Remote OCR is disabled by default and should not receive real medical
documents. Email reminders require all three `RESEND_API_KEY`, `EMAIL_FROM`,
and `REMINDER_CRON_SECRET` values plus an external scheduler calling
`POST /api/internal/reminders` regularly. See the [request flow guide](docs/flows.md)
for consent, message content, authorization, and delivery limitations.

## Repository map

```text
src/
  components/       shared layout and accessible UI primitives
  contexts/         authentication and loaded-vault state
  features/         auth, dashboard, medications, records, profile, settings
  hooks/            shared mutation and query-state helpers
  lib/              API client, theme, navigation and shared UI utilities
shared/             types, Zod schemas and client/server contracts
server/
  routes/           auth, vault, care, records, medications and reminders
supabase/
  migrations/       versioned PostgreSQL schema, RLS, RPCs and private bucket
docs/               architecture, flows, decisions, operations and development
```

Feature-specific pages, components, and domain helpers live together under
`src/features/<feature>/`. Server route modules are composed by
[`server/app.ts`](server/app.ts); reusable request/session/ownership behavior
lives in [`server/routes/context.ts`](server/routes/context.ts). Historical
health-measurement rows from the retired tracker remain in the database and
account export; there is no active tracker UI or metrics API.

## Build and verification

```powershell
npm run typecheck
npm run verify
```

`npm run verify` checks formatting, lint, production build, and emitted runtime
assets. Automated test suites are intentionally local-only and are not included
in the published repository; see the [development guide](docs/development.md)
for the exact verification boundary.

## Security and project limits

- Supabase Auth owns passwords; the browser receives HttpOnly session cookies.
- Ordinary data requests use the signed-in user's authorization and PostgreSQL RLS.
- Medical documents are stored outside the public frontend and streamed only
  after an authenticated ownership check.
- The server-only secret key is used for controlled storage and worker operations,
  never shipped to the frontend. Use fictional data in the public demo.
- MediVault is an educational portfolio project, not a medical device, care
  provider, or HIPAA-compliance claim. It does not diagnose, prescribe, or
  recommend treatment.

## Documentation

- [Architecture and module map](docs/architecture.md)
- [System integration and production runtime](docs/system-overview.md)
- [Data contracts and API request flows](docs/flows.md)
- [Product landscape and staged roadmap](docs/product-roadmap.md)
- [Engineering decisions](docs/decisions.md)
- [Development and release](docs/development.md)
- [Operations and recovery](docs/operations.md)

For private, beginner-oriented learning notes, see the locally ignored
[`personal-learning/`](personal-learning/) folder. Its contents are not
published to GitHub.
