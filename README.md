# MediVault

A responsive **medication and medical-records workspace** with React + TypeScript + Vite, Tailwind CSS, shadcn/ui, Express, and persistent SQLite. Prescription scanning runs locally in the browser; no cloud database, OCR account, AI key, or external authentication/storage service is required.

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

Stop the combined command with **`Ctrl+C` in its owning terminal**, wait for it to finish, then run `npm run dev` again. Shutdown releases its ports without deleting accounts, medications, measurements, or documents. API source changes still restart the watched API after successful startup; temporary reload failures continue to use the website's retryable error state. For a readiness timeout, inspect the API/frontend diagnostics, allow dependency optimization to finish, and retry after the old invocation has stopped.

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
- **Medications:** tablet, capsule, cream, ointment, gel, injection, liquid/syrup, drops, inhaler, patch, suppository, other, or unspecified form; separate strength/concentration and prescribed dosage; frequency/times, dates, instructions, linked source record and prescription wording. Includes name/status discovery, today's schedule, taken/skipped logs, undo, and recorded adherence.
- **Prescription scanning:** select a saved medical record or upload a prescription, scan PDF/JPG/PNG locally, correct the recognized text, review suggested medications, and explicitly confirm each one before saving. Record-to-medication links work in both directions.
- **Website-only check-ins:** next scheduled dose, due/past-time labels, and separate **To log**/**Logged** views. No email, push, or background notifications.
- **Dashboard:** real database-derived counts, daily check-ins, prescription-scan/add-medication/upload actions, recent uploads, linked-medication count, and upcoming schedule. Optional setup is based on profile, record, and medication data; medication use is never mandatory.
- **Appearance:** Light, Dark, and System modes, available before and after sign-in and in Settings. System is the initial default and follows operating-system changes; explicit choices persist in this browser.
- **Settings:** appearance preference, current-password-verified password update, sensitive-data JSON export, and opt-in fictional sample data.
- Responsive navigation, accessible dialogs/labels, validation on client **and server**, loading/empty/error states, success notifications, and mutation locking.

The Health Tracker interface and charts have been retired; old `/health-tracker` bookmarks redirect to Medications. Existing measurements are preserved in SQLite and sensitive-data exports. Legacy metric API endpoints remain for compatibility, but new sample seeding does not create measurements.

AI interpretation, email delivery, diagnosis, prescribing, automatic dosage changes, and treatment recommendations are not included.

### Scan a prescription

1. Open **Medications → Scan prescription** (also available from the dashboard or a medical-record card).
2. Select an existing document, or choose **Upload prescription**, enter its metadata, and upload it.
3. Choose **Scan document**. View the original and correct OCR mistakes in **Scanned prescription text**.
4. Choose **Review** beside a suggestion, or **Enter medication from this text** for other formats. Check the form, strength, and exact dosage wording, enter dates and dose times, and confirm review before saving.
5. Use **Open linked medical record** on a medication or the linked-medication count on a record to navigate between them. A record's linked view starts with **all** statuses, so upcoming and completed medications from that prescription are included; narrow it with the status and name controls. Editing or cancelling inside a linked view keeps that scope. Choose **Show all medications**/**Show all records** or **Clear filters** to leave it. The ordinary Medications page still opens on active medications.

Tesseract.js reads clear, **printed English**, with PDF.js rendering image-based PDFs; text-only PDFs use their existing text. Pages containing images are rendered for OCR even if a text header exists. Scanning is limited to **10 pages per PDF** and **25 megapixels per rendered image**, in addition to the 10 MB upload limit. Scans are cancellable and run in a browser worker. The OCR engine, English language data, PDF worker, and image decoders are served by MediVault itself, including in production—not a CDN or external AI endpoint. The first scan loads several megabytes of local engine assets; large scans may take longer on mobile devices.

Suggestions recognize lines beginning with an explicit form such as `Tablet`, `Tab.`, `Cream`, or `Injection`. A nearby explicit `Take`, `Apply`, `Inject`, `Instill`, `Inhale`, or `Use` instruction can prefill the dosage **without paraphrasing**. Strength alone is never treated as a dose. Other formats remain available as text for manual entry. Abbreviations, handwriting, and missing instructions are not clinically interpreted. Unreadable/blank, damaged, protected, or oversized documents report errors instead of fabricating medications.

OCR is **not guaranteed accurate**: always compare with the original prescription. Scan-derived dates and dose times start empty; no medication is saved until a valid form is submitted and review is confirmed. Medication dosage supports up to 120 characters, with additional instructions up to 2,000 and a source excerpt up to 4,000. Longer or unrecognized dosage wording must be reviewed manually, not silently truncated. Only explicitly saved details/excerpts persist; the full OCR draft is not stored in localStorage. Deleting a source document unlinks it but preserves medications, dose logs, and saved wording.

### Experience conventions

The website uses Geist typography, neutral workspace surfaces, restrained teal accents, and shared spacing/elevation. Light mode uses white cards; Dark mode uses deep slate surfaces with readable teal accents. Choose Light, Dark, or System from the Appearance control. Only this preference is saved in localStorage (`medivault-theme`), not health information or authentication tokens. Controls stay synchronized across pages and tabs; a blocked storage write reports that the selection could not be saved. Text colors are chosen for at least 4.5:1 normal-text contrast and 3:1 large-text contrast; status meaning is also written in text.

Interactive targets are at least 44 by 44 CSS pixels with visible keyboard focus. Mobile navigation keeps the primary modules reachable, with profile/settings in the menu. Dialogs trap focus and return it to their trigger; pending dialogs announce a busy state, lock duplicate submission, and cannot be dismissed accidentally. Forms preserve input after failed requests, while failed refreshes label previously loaded data as stale.

Wide dose-history tables scroll inside labeled, keyboard-focusable containers instead of widening the page. Layout checks cover widths of 320, 375, 768, 1280, and 1440 CSS pixels.

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

[server/migrations/001_initial.sql](server/migrations/001_initial.sql) creates the initial tables. [server/migrations/002_prescription_links.sql](server/migrations/002_prescription_links.sql) adds medication form, strength, owned source-record links, and prescription wording without deleting existing rows. Both run automatically as needed and are tracked through SQLite's `user_version`. Source deletion uses `ON DELETE SET NULL`; ownership is checked by the API and SQLite triggers.

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

Register a **test account**, then choose **Settings → Add sample data**. This writes a clearly labeled fictional medication/dose history and a valid fictional prescription PDF to the actual SQLite database. Scan that PDF to try the review workflow. It does not overwrite your profile or existing measurements. It is not a prescription, diagnosis, or recommendation.

Use a separate account to keep demo entries out of personal medical history. Demo entries persist across reloads and restarts and use the same private API and document storage as normal entries. No public demo account or shared password is built into the application.

## Presentation walkthrough

About ten minutes with a fresh fictional account. No personal data, real prescription, or AI/OCR credentials are needed; scanning runs locally in the browser.

1. Run `npm run dev` and open `http://localhost:5187`. **Create an account** with a made-up name and an address such as `presenter@example.test`. Do not reuse a personal account.
2. **Settings → Add sample data**, then confirm. The dashboard now shows database-derived counts and today's schedule.
3. **Medications → Scan prescription**, select **[Sample] Prescription for scanning**, and choose **Scan document**. Show the original next to the editable recognized text.
4. Choose **Review** on a suggestion. Point out that the form (for example cream or tablet), strength, and dosage are copied from the text and that dates and dose times start empty. Enter a start date and a dose time, tick the review confirmation, and save.
5. Reload the page to show the medication persisted. Use **Open linked medical record**, then the record's linked-medication count, to move between the prescription and its medications.
6. On the record, **View** and **Download** the PDF to show authorized private access.
7. In **Today's schedule**, mark a dose **Taken**, then undo it; show **To log**/**Logged** and the dose history.
8. Switch **Appearance** between Light and Dark, then **Log out**. Keep the fictional account separate from personal use; sample entries can be removed with the normal delete actions.

## Test and build

Requires Node.js 22.18 or newer (`engines` in `package.json`); Node 24 LTS is recommended.

```powershell
npm run format:check  # Prettier; generated .agents/skills content is excluded
npm run lint          # oxlint; any warning fails
npm run typecheck     # app, server/scripts, tooling config and tests (strict)
npm test              # runs `npm run build` first (pretest), then every Vitest suite
npm run check:build   # validates the emitted dist (see below)
npm run verify        # all of the above in a fail-fast order
npm run test:integration
npm audit --omit=dev
```

`npm test` builds first because the startup suite exercises the real production output. `npm run test:integration` runs only the backend suite and does not build; to run the startup suite directly with `npx vitest run tests/startup.test.ts`, run `npm run build` first.

The integration suite runs the **real Express handlers**, SQLite migration, cookie sessions, and filesystem uploads using Supertest. Each test gets its own temporary database/directory, cleaned up afterwards; no test credentials or external service is needed.

Coverage includes registration/login/logout, password hashing/cookies, persistence across database reopen, health-profile updates, medication/metric/document CRUD, exact dose uniqueness, two-user read/mutation/file isolation, current-password verification/session revocation, CSRF-style request protection, upload signatures and size limits, validated frontend forms, database-derived dashboard statistics, website reminder boundaries, build-artifact validation, production startup refusal for missing/incomplete builds, and production content types/CSP for application and local scanning resources.

### One command before a presentation or push

```powershell
npm run verify
```

`verify` runs, in order and stopping at the first failure: `format:check`, `lint`, `npm test` (which builds first), then `check:build`. Its exit code is that of the failing stage.

### Continuous integration

`.github/workflows/verify.yml` runs on every push and pull request: `npm ci` and `npm run verify` on Node 24 for both Ubuntu and Windows, a `container` job that builds the Docker image, runs it with local storage, polls `/api/health` and `/medications`, and asserts the image has no `/app/.env`, no stored documents and runs as the non-root `node` user, plus a separate `npm audit --omit=dev` job (it depends on the npm registry and is reported separately rather than blocking verification). The jobs use no secrets, accounts, or deployment credentials. Hosted runs start only after this workflow is pushed to GitHub; until then, only local `npm run verify` results exist.

### Check the built application

```powershell
npm run build
npm run check:build
```

`check:build` reads Vite's emitted `dist/.vite/manifest.json` and fails, listing every problem, if the manifest is missing or invalid, has no entry, references a missing chunk, or if `index.html`, any referenced chunk/style/asset, or any local prescription-scanning file (OCR engine, English language data, PDF.js decoders) is missing or empty. It also fails if any entry file exceeds **500,000 minified bytes** before compression. Shared vendor and lazy route chunks are separate; passing this bound alone is not a claim about total load speed.

**Missing or stale build:** if `check:build`, the startup tests, or production `npm start` report `The production frontend build ... is missing or incomplete`, run `npm run build` and retry. Production startup performs the same completeness check before opening the database, so a broken build never creates storage or starts listening. Development (`npm run dev`, `npm run dev:server`) does not need `dist`.

### Verify local API connectivity

Keep `npm run dev` running in a separate terminal, then check both the direct API and frontend proxy:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/health
Invoke-RestMethod http://127.0.0.1:5187/api/health
Invoke-WebRequest http://127.0.0.1:5187/api/auth/session
```

Both health calls return `status: ok`. The session endpoint returns HTTP 200 with `null` when signed out; `/api/vault` correctly returns HTTP 401 without a session. If neither server responds, restart the combined command and retry in the website rather than reinstalling dependencies while Vite is running.

## Deploy

### Public demo on Render (free tier)

The repository includes a `Dockerfile` and a `render.yaml` Blueprint for a single free Render web service. Render's free filesystem is wiped on every restart, redeploy and spin-down, so durable state lives in a private **Backblaze B2** bucket:

- **Documents** are stored in the bucket under `documents/` when `DOCUMENT_STORAGE=s3`. They are only ever streamed through the authenticated API, never via public URLs.
- **SQLite** is continuously replicated to the bucket under `LITESTREAM_REPLICA_PATH` by [Litestream](https://litestream.io) (10 s sync interval). On startup the container restores the latest replica before Node starts; a failed restore stops the container instead of starting with an empty database.

**Owner prerequisites**

1. A Render account connected to GitHub with access to this repository.
2. A Backblaze B2 **private** bucket. Set its lifecycle setting to **"Keep only the last version of the file"**; otherwise deleted documents and old replication segments are only hidden and keep using storage.
3. A B2 application key restricted to that bucket with **Read and Write** access.

**Variables** (`render.yaml` sets the non-secret ones; also documented in `.env.example`)

| Variable                                   | Value                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| `NODE_ENV`, `COOKIE_SECURE`                | `production`, `true`                                                            |
| `TRUST_PROXY`                              | `1` (number of proxy hops in front of the app; used for per-client rate limits) |
| `DOCUMENT_STORAGE`                         | `s3`                                                                            |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`    | The bucket's `https://` S3 endpoint, name and region                            |
| `LITESTREAM_REPLICA_PATH`                  | Key prefix for the database replica, e.g. `db`                                  |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | **Secrets.** Entered only in the Render dashboard (`sync: false`)               |

Missing or malformed storage settings make the server exit with an error naming the variable (never its value) before it opens storage or listens.

**Steps**

1. Adjust `S3_ENDPOINT`, `S3_BUCKET` and `S3_REGION` in `render.yaml` if you use your own bucket, and push.
2. In Render choose **New → Blueprint**, select this repository, and enter the two key values when prompted.
3. Wait for the first deploy, then open `https://<service>.onrender.com/api/health`; it should return `{"status":"ok"}`.
4. **Restart-survival check:** with a fictional account, add a medication, log a dose and upload a document, then use **Manual Deploy → Deploy latest commit**. After it comes back, sign in again and confirm all of them, including the document download, are still there.

**Behavior and limits**

- Free services spin down after about 15 minutes without traffic; the next visit takes roughly a minute while the container starts and restores the database.
- Run exactly **one instance**. Litestream replication assumes a single writer; never scale out or run a second service against the same replica path.
- Writes in the last ~10 seconds before an abrupt stop may be lost.
- The demo build shows a "Public demo: fictional data only" notice. Do not enter real health information.
- **Rollback:** in Render, redeploy a previous successful deploy from the service's Events page. Database migrations only move forward, so roll back application code only to versions that understand the current schema; the bucket keeps both documents and the replica.
- Pushes deploy automatically only after the GitHub checks pass (`autoDeployTrigger: checksPass`).

The demo is **not live until it has been deployed and verified** with the restart-survival check above.

### Other persistent hosts

Build with `npm run build` (optionally confirm with `npm run check:build`), then run `npm start` with:

- `NODE_ENV=production`
- `COOKIE_SECURE=true`
- `HOST=0.0.0.0` if required by the host
- `PORT` set by the hosting environment
- `DATA_DIR` pointing to a **persistent disk**
- `APP_ORIGIN` set to the actual HTTPS website origin if needed behind your proxy

Express serves both the API and `dist` in production, including SPA deep links. Put it behind HTTPS on a persistent Node host (for example a VM or a service with a persistent disk). Back up SQLite **and** the documents directory consistently; use SQLite's backup facilities or stop the application for a coordinated backup.

**Do not deploy the SQLite backend to an ephemeral/serverless filesystem, including Vercel Functions.** A Vercel frontend would require a separately hosted persistent Express backend plus a same-origin `/api` reverse proxy. The simplest deployment is the combined Express app on one persistent host.

The source tree must accompany the build because Node runs the backend TypeScript directly, and `server/migrations` must ship with it; pending migrations run automatically at startup. Production startup refuses to run (exit code 1, no storage created) when `dist` is missing or incomplete, or when `COOKIE_SECURE` is not `true`. Node may print an experimental warning for its built-in SQLite API; this is not a connection or migration failure.

Limitations: medication check-ins appear only while the website is open; email, push, and background reminders are not implemented. Passing `npm run verify` locally means the project is ready to run and present; it does not mean a public instance exists. MediVault is not currently deployed as a live service, and it is a personal record-keeping tool rather than a certified medical device.

## Organization

- `server/`: Express API, authentication/session helpers, SQLite access/migration.
- `src/lib/api.ts`: typed, runtime-validated HTTP client.
- `src/lib/contracts.ts`: shared response/row contracts.
- `src/lib/schemas.ts`: validation shared by forms and backend.
- `src/contexts/`: session lifecycle and user-scoped data loading.
- `src/components/`, `src/pages/`: existing responsive healthcare UI.
- `tests/`: real backend integration plus focused form/domain tests.

This is a personal record-keeping MVP, **not a healthcare-compliance certification or medical advice**. Review legal requirements, retention, backups, access controls, and hosting before storing real patient information.
