# MediVault

A modern, responsive personal healthcare workspace with **React + TypeScript + Vite**, Tailwind CSS, shadcn/ui, **Express**, and **persistent SQLite**. No cloud database account or external authentication/storage service is required.

## Run the complete application

Use **Node.js 24 LTS** (minimum 22.18) and npm. SQLite uses Node's built-in `node:sqlite`, so no separate database installation or native npm build is needed.

```powershell
Set-Location C:\Project
npm ci
npm run dev
```

On Windows, stop any running MediVault development server with `Ctrl+C` before running `npm ci`. Vite can lock native dependency files while running, causing an `EPERM` error during reinstall.

Open **http://127.0.0.1:5187**. This single command starts:

- Express API: `http://127.0.0.1:3001`
- Vite frontend: `http://127.0.0.1:5187`

Run only one development instance. `EADDRINUSE` on port 3001 or "Port 5187 is already in use" means another process is already using that port. If it is an existing MediVault server, use it or stop it with `Ctrl+C` in its terminal before running `npm run dev` again. Do not stop unrelated processes or delete application data. The `.env not found. Continuing without it.` message is informational; the default configuration works without that file.

The combined command checks **both** listening addresses before starting either service or opening application storage. Occupied addresses are reported with their service and port; startup exits nonzero without adopting the old instance, killing its owner, or switching ports.

Wait for **`MediVault ready.`**: the launcher checks both direct API health and `/api/health` through Vite before announcing full-stack readiness. An individual Vite/Express listening message does not mean both services are ready. Initial readiness has a **30-second timeout**; a failed API child cannot leave the combined command waiting forever in watch mode. Startup failures stop only this invocation's service trees and exit nonzero. A small remaining-process cleanup grace period follows cancellation.

Stop the combined command with **`Ctrl+C` in its owning terminal**, wait for it to finish, then run `npm run dev` again. Shutdown releases its ports without deleting accounts, measurements, or documents. API source changes still restart the watched API after successful startup; temporary reload failures continue to use the website's retryable error state. For a readiness timeout, inspect the API/frontend diagnostics, allow dependency optimization to finish, and retry after the old invocation has stopped.

The frontend proxies `/api` to Express, keeping cookies and document requests on the same origin. Register an account to start using the application. Registration signs you in immediately; there is no email confirmation or SMTP dependency.

The SQLite database and private documents are created automatically on first startup:

- `data/medivault.sqlite` (plus SQLite WAL/SHM files while running)
- `data/documents/<user UUID>/<random UUID>.<extension>`

Data survives server restarts. These paths are excluded from version control. **Do not delete the data directory to restart the server.**

### Optional configuration

Defaults work without an environment file. To customize them:

```powershell
Copy-Item .env.example .env
```

| Variable        | Default       | Purpose                                                                           |
| --------------- | ------------- | --------------------------------------------------------------------------------- |
| `PORT`          | `3001`        | Express port; combined startup passes the same resolved value to Vite's proxy     |
| `HOST`          | `127.0.0.1`   | Server bind address; use `0.0.0.0` only when remote access is intended            |
| `DATA_DIR`      | `data`        | SQLite and private-file directory; use a persistent, OS-protected location        |
| `NODE_ENV`      | `development` | Set `production` to have Express serve the built frontend                         |
| `COOKIE_SECURE` | `false`       | Set `true` for production HTTPS; production startup enforces this                 |
| `APP_ORIGIN`    | unset         | Exact trusted website origin, useful when a reverse proxy changes the Host header |

Restart both processes after changing configuration. Keep the API same-origin with the website; direct cross-origin CORS access is intentionally not enabled. No private secrets belong in `VITE_` variables.

An inherited terminal environment value takes precedence over `.env`. The combined command validates the API port before launch and keeps the frontend on strict port 5187; it never silently selects a fallback port.

For separate terminals:

```powershell
npm run dev:server
# In a second terminal:
npm run dev:client
```

Use `npm run preview -- --host 127.0.0.1 --port 4187 --strictPort` to preview the built frontend while the API is running.

## Features

- **Authentication:** registration, login, logout, persistent private sessions, protected routes, and password changes that require the current password.
- **Health profile:** name, birth date, optional gender, blood group, height/weight, allergies, conditions, and emergency contact.
- **Medical vault:** PDF/JPG/PNG upload (maximum **10 MB**, exactly 10,485,760 bytes), metadata editing, combined search/category filters, newest/oldest **record-date** sorting, authorized viewing/download, and confirmed deletion. Small files use readable bytes/KiB/MiB instead of rounding to zero.
- **Medications:** prescribed dosage/frequency/times, dates, instructions, combined name search and active/upcoming/completed filters, today's schedule, taken/skipped logs, undo, and recorded adherence. Clear filters restores the default active list.
- **Website-only check-ins:** next scheduled dose, due/past-time labels, and separate **To log**/**Logged** views. No email, push, or background notifications.
- **Health tracker:** blood pressure, glucose (mg/dL), weight (kg), heart rate (bpm), timestamped CRUD, date filters, latest cards, and Recharts history.
- **Dashboard:** real database-derived counts, daily check-ins, top-level upload/add-medication/record-measurement actions, recent uploads, upcoming schedule, and measurement trends. Optional first-use guidance disappears as profile, record, and measurement setup is completed; medication use is never mandatory.
- **Settings:** current-password-verified password update, sensitive-data JSON export, and opt-in fictional sample data.
- Responsive navigation, accessible dialogs/labels, validation on client **and server**, loading/empty/error states, success notifications, and mutation locking.

Optional OCR/AI summaries are not included. The application does not diagnose, prescribe, alter dosage, or recommend treatment.

### Experience conventions

The website uses one light theme: Geist typography, white cards, neutral workspace surfaces, restrained teal accents, and shared spacing/elevation. There is no theme switcher. Text colors are chosen for at least 4.5:1 normal-text contrast and 3:1 large-text contrast; status meaning is also written in text.

Interactive targets are at least 44 by 44 CSS pixels with visible keyboard focus. Mobile navigation keeps the primary modules reachable, with profile/settings in the menu. Dialogs trap focus and return it to their trigger; pending dialogs announce a busy state, lock duplicate submission, and cannot be dismissed accidentally. Forms preserve input after failed requests, while failed refreshes label previously loaded data as stale.

Wide dose/measurement tables scroll inside labeled, keyboard-focusable containers instead of widening the page. Layout checks cover widths of 320, 375, 768, 1280, and 1440 CSS pixels.

## Authentication and privacy

- Passwords are stored as **scrypt hashes with random salts**, never plaintext.
- Login creates a random opaque session token. Only its **SHA-256 hash** is stored in SQLite.
- The browser receives an **HttpOnly, SameSite=Lax** cookie scoped to `/api`; no auth tokens or health data are written to localStorage.
- Sessions have a fixed seven-day lifetime and survive backend restarts. Logout deletes the current token; password changes revoke other sessions.
- Login/registration/password requests are rate limited. State-changing requests require the frontend's custom request header, and supplied Origin headers must match the request host or configured `APP_ORIGIN`.
- Ownership is enforced server-side: every query/mutation selects by the authenticated user ID. Request bodies cannot assign another owner. SQLite does not provide PostgreSQL-style RLS; users cannot access the database directly through the website.
- UUIDs, foreign keys, unique constraints, sanity checks, and triggers protect relational integrity and dose uniqueness.
- Medical files live **outside the public website directory**. Every `/api/records/:id/file` request checks the session and document owner; there are no public file URLs or bearer-link access.
- Upload validation checks extension, MIME type, file signature, and exact size. This is not malware scanning or a full PDF parser.
- API responses are not cached. Downloaded files, open viewer tabs, and exports remain sensitive local copies; signing out cannot erase a file already downloaded.

SQLite and documents are **not application-encrypted at rest**. Protect the data directory using OS permissions/full-disk encryption and restrict access to the server account. On Windows, configure appropriate filesystem ACLs; POSIX mode flags alone do not enforce Windows ACLs.

## Database and API

`GET /api/health` continues to return `{ "status": "ok" }` after a database probe. Combined development adds an ephemeral `X-MediVault-Dev-Startup` response header so the launcher can distinguish its own API from a competing listener. This is correlation metadata, **not authentication**, is not saved, and is neither user-configured nor required by standalone/production health clients. Private endpoints still require a valid session.

[server/migrations/001_initial.sql](server/migrations/001_initial.sql) is applied automatically to a new database and tracked through SQLite's `user_version`. It creates `users`, `sessions`, `profiles`, `health_profiles`, `medical_records`, `medications`, `medication_logs`, and `health_metrics`.

| Endpoint                      | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `GET /api/health`             | API/database readiness                                                   |
| `GET /api/auth/session`       | Current user or `null`                                                   |
| `POST /api/auth/register`     | Validated registration and session creation                              |
| `POST /api/auth/login`        | Password login                                                           |
| `POST /api/auth/logout`       | Invalidate session                                                       |
| `POST /api/auth/password`     | Verify current password, update, revoke other sessions                   |
| `GET /api/vault`              | All authenticated user's dashboard/module data                           |
| `PUT /api/health-profile`     | Create/update the user's health profile                                  |
| `POST /api/records`           | Multipart upload: `file`, `title`, `category`, `provider`, `record_date` |
| `PATCH /api/records/:id`      | Update document metadata                                                 |
| `GET /api/records/:id/file`   | Private viewer content; `?download=1` for attachment                     |
| `DELETE /api/records/:id`     | Delete the owned file and metadata                                       |
| `POST /api/medications`       | Add medication                                                           |
| `PATCH /api/medications/:id`  | Update medication                                                        |
| `DELETE /api/medications/:id` | Delete medication and cascading dose logs                                |
| `POST /api/dose-logs`         | Log taken/skipped outcome                                                |
| `PATCH /api/dose-logs/:id`    | Change a recorded outcome                                                |
| `DELETE /api/dose-logs/:id`   | Undo a log                                                               |
| `POST /api/metrics`           | Add measurement                                                          |
| `PATCH /api/metrics/:id`      | Edit measurement                                                         |
| `DELETE /api/metrics/:id`     | Delete measurement                                                       |

All mutations require `X-MediVault-Request: 1`. JSON bodies use the validated form shapes in [src/lib/schemas.ts](src/lib/schemas.ts); medication times are comma-separated HH:MM strings and metric values are numeric strings, converted on the server. PATCH operations accept the complete relevant form payload. API errors return `{ "error": "Helpful message" }` with an appropriate status. API success responses are runtime-validated by the client.

## Behavioral details

- Medication start/end dates are inclusive; missing end dates keep a medication active after its start date.
- Dose times use the local wall clock. Unique `(medication_id, scheduled_date, scheduled_time)` constraints prevent duplicates, including concurrent requests.
- Unlogged doses are never automatically marked taken, skipped, or missed.
- **Due now** is the scheduled minute; **Past scheduled time** indicates a scheduled time that has passed, not an instruction to take a late/extra dose.
- Check-ins update every minute and on window focus while the website is open.
- Recorded adherence means **taken ÷ logged doses in the last 30 days**, explicitly excluding unlogged doses.
- Schedule edits retain original historical log dates/times. Deleting a medication also deletes its dose history.
- Measurement times are normalized to UTC ISO timestamps and displayed/filtered in local time. Numeric input limits are sanity checks, not clinical reference ranges.
- Data refreshes after mutations, on window focus, and every minute. A failed refresh visibly labels the last successful data as stale.
- Database queries return the complete owned dataset, not a silently capped response page; server aggregation/pagination can be added if accounts become unusually large.
- Uploads write the file first, then SQLite metadata. Metadata failures attempt cleanup and surface cleanup failures. File deletion and SQLite metadata deletion are not a cross-filesystem atomic transaction; errors explain when a retry is needed.
- Sample seeding is explicit opt-in. Successful partial sample entries remain visible if a later request fails; remove them using normal CRUD controls.
- Vault sorting uses the medical record date, with deterministic upload-time/ID tie-breakers; dashboard recent records remain ordered by upload recency. Clearing vault filters restores newest-record-date order.

## Try sample data

Register a **test account**, then choose **Settings → Add sample data**. This writes clearly labeled fictional readings, a sample medication/dose history, and a valid fictional wellness PDF to the actual SQLite database. It does not overwrite your profile. It is not a prescription, diagnosis, or recommendation.

## Test and build

```powershell
npm test
npm run test:integration
npm run build
npm run lint
npm run format:check
npm audit
```

The integration suite runs the **real Express handlers**, SQLite migration, cookie sessions, and filesystem uploads using Supertest. Each test gets its own temporary database/directory, cleaned up afterwards; no test credentials or external service is needed.

Coverage includes registration/login/logout, password hashing/cookies, persistence across database reopen, health-profile updates, medication/metric/document CRUD, exact dose uniqueness, two-user read/mutation/file isolation, current-password verification/session revocation, CSRF-style request protection, upload signatures and size limits, validated frontend forms, database-derived dashboard statistics, and website reminder boundaries.

### Verify the entry bundle

After `npm run build`, run this PowerShell check against Vite's emitted manifest. It fails for a missing entry or any entry larger than **500,000 minified bytes**, before compression. Shared vendor and lazy route chunks are separate; passing this bound alone is not a claim about total load speed.

```powershell
@'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
const manifest = JSON.parse(readFileSync(join('dist', '.vite', 'manifest.json'), 'utf8'))
const entries = Object.values(manifest).filter(entry => entry.isEntry)
if (!entries.length) throw new Error('No build entry found.')
for (const entry of entries) {
  const size = statSync(join('dist', entry.file)).size
  if (size > 500000) throw new Error(`${entry.file}: ${size} bytes exceeds 500000.`)
  console.log(`${entry.file}: ${size} bytes (passed)`)
}
'@ | node --input-type=module
```

### Verify local API connectivity

Keep `npm run dev` running in a separate terminal, then check both the direct API and frontend proxy:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/health
Invoke-RestMethod http://127.0.0.1:5187/api/health
Invoke-WebRequest http://127.0.0.1:5187/api/auth/session
```

Both health calls return `status: ok`. The session endpoint returns HTTP 200 with `null` when signed out; `/api/vault` correctly returns HTTP 401 without a session. If neither server responds, restart the combined command and retry in the website rather than reinstalling dependencies while Vite is running.

## Deploy

Build with `npm run build`, then run `npm start` with:

- `NODE_ENV=production`
- `COOKIE_SECURE=true`
- `HOST=0.0.0.0` if required by the host
- `PORT` set by the hosting environment
- `DATA_DIR` pointing to a **persistent disk**
- `APP_ORIGIN` set to the actual HTTPS website origin if needed behind your proxy

Express serves both the API and `dist` in production, including SPA deep links. Put it behind HTTPS on a persistent Node host (for example a VM or a service with a persistent disk). Back up SQLite **and** the documents directory consistently; use SQLite's backup facilities or stop the application for a coordinated backup.

**Do not deploy the SQLite backend to an ephemeral/serverless filesystem, including Vercel Functions.** A Vercel frontend would require a separately hosted persistent Express backend plus a same-origin `/api` reverse proxy. The simplest deployment is the combined Express app on one persistent host.

The source tree must accompany the build because Node runs the backend TypeScript directly. Node may print an experimental warning for its built-in SQLite API; this is not a connection or migration failure.

## Organization

- `server/`: Express API, authentication/session helpers, SQLite access/migration.
- `src/lib/api.ts`: typed, runtime-validated HTTP client.
- `src/lib/contracts.ts`: shared response/row contracts.
- `src/lib/schemas.ts`: validation shared by forms and backend.
- `src/contexts/`: session lifecycle and user-scoped data loading.
- `src/components/`, `src/pages/`: existing responsive healthcare UI.
- `tests/`: real backend integration plus focused form/domain tests.

This is a personal record-keeping MVP, **not a healthcare-compliance certification or medical advice**. Review legal requirements, retention, backups, access controls, and hosting before storing real patient information.
