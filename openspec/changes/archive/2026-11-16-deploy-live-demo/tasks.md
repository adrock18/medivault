# Tasks

## 1. Configuration and proxy awareness

- [x] 1.1 Extend `apiConfig` in `server/config.ts` with `TRUST_PROXY`, `DOCUMENT_STORAGE` (`local` default or `s3`), and validated `S3_ENDPOINT` (https URL), `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `S3_REGION` (required), with errors that name the variable without echoing secrets. Verify with new `tests/startup.test.ts` cases: missing or malformed S3 settings exit nonzero before storage opens or the port binds, and development needs no S3 settings.
- [x] 1.2 Apply `app.set('trust proxy', n)` in `createApp` before the auth rate limiter when `TRUST_PROXY` is configured. Verify with `tests/backend.test.ts`:
  - two forwarded clients are rate-limited independently with trust enabled;
  - spoofed `X-Forwarded-For` is ignored without it.
- [x] 1.3 Document the new variables in `.env.example` (commented, no values) and verify `npm run format:check` passes.

## 2. Durable document storage

- [x] 2.1 Add `@aws-sdk/client-s3` as a runtime dependency with `npm install`, and verify that `package-lock.json` updates and `npm ci` succeeds.
- [x] 2.2 Create `server/document-store.ts`:
  - a `DocumentStore` interface;
  - `LocalDocumentStore`, which keeps the current path containment, permissions and exclusive writes;
  - `S3DocumentStore`, which uses `documents/<file_path>` keys, idempotent delete and not-found mapping.

  Verify with unit tests: local behavior, and an S3 store tested against an injected fake client for put/get/missing/delete without network access.

- [x] 2.3 Refactor the upload, view/download and delete routes in `server/app.ts` to use the injected store, preserving upload rollback, delete ordering, response headers and the existing 404 and partial-failure messages. Verify that the existing record tests pass unchanged, and add a test where a failing store upload creates no record and returns a retryable error.
- [x] 2.4 Wire the selected store from config in `server/index.ts`. Verify that `npm run verify` passes on the local default with no credentials.

## 3. Public demo notice

- [x] 3.1 Add a `DemoNotice` component shown by `AuthPage` and `Layout` when `VITE_PUBLIC_DEMO === 'true'`. It states: fictional data only, not medical advice, may be reset. Verify with a component test that it renders when the flag is set and is absent otherwise.
- [x] 3.2 Check the notice in Light and Dark themes at 320 px and 1280 px on sign-in, registration and one workspace page. Verify there is no horizontal scroll and navigation stays usable.

## 4. Container image and database replication

- [x] 4.1 Add `.dockerignore` excluding `.env*`, `data/`, `node_modules/`, `dist/`, `.git/`, `openspec/`, `.agents/` and `*.pdf` (`tests/` stays in the build context for `tsc -b` but is not copied into the runtime stage). Verify that the build context excludes them.
- [x] 4.2 Add `litestream.yml`, which replicates `${DATA_DIR}/medivault.sqlite` to the `S3_BUCKET` under `LITESTREAM_REPLICA_PATH` using the S3 endpoint, region and credentials through environment expansion, with a 10 s sync interval. Add `docker/entrypoint.sh`, which restores with `-if-db-not-exists -if-replica-exists`, exits nonzero on restore failure, then runs `litestream replicate -exec "node server/index.ts"`, or runs Node directly when replication is unset. Verify the script with `shellcheck`, or by review if shellcheck is unavailable.
- [x] 4.3 Add a multi-stage `Dockerfile` with:
  - a `node:24-bookworm-slim` base;
  - a build stage that runs `npm ci`, the build with `VITE_PUBLIC_DEMO=true`, and `check:build`;
  - a runtime stage using production dependencies, a pinned and checksum-verified Litestream v0.5.x binary, and the non-root `node` user;
  - `DATA_DIR=/data`, `HOST=0.0.0.0`, `NODE_ENV=production` and `COOKIE_SECURE=true`.

  Verify `docker build` succeeds; if Docker is unavailable locally, rely on task 4.4.

- [x] 4.4 Add an Ubuntu `container` job to `.github/workflows/verify.yml` that:
  - builds the image;
  - runs it with local storage;
  - polls `/api/health` and `/medications`;
  - asserts that `/app/.env` and stored documents are absent.

  Verify that the job passes on a pushed branch, and that a deliberately broken health check would fail it.

## 5. Render Blueprint and documentation

- [x] 5.1 Add `render.yaml` with:
  - `type: web`, `runtime: docker`, `plan: free`, `name: medivault`;
  - `healthCheckPath: /api/health` and `autoDeployTrigger: checksPass`;
  - plain values for `NODE_ENV`, `COOKIE_SECURE`, `TRUST_PROXY=1` and `DOCUMENT_STORAGE=s3`;
  - `sync: false` for the S3 and replica secrets.

  Verify against Render's Blueprint JSON schema (or with Render CLI validation).

- [x] 5.2 Update the README `## Deploy` section with:
  - the owner prerequisites (Render account linked to GitHub; Backblaze B2 private bucket with "keep only the last version" lifecycle and a bucket-scoped Read and Write application key);
  - the variable list and the Blueprint steps;
  - cold-start and spin-down behavior, and the single-instance rule;
  - the restart-survival check and rollback.

  Keep "not live until verified" wording, and verify that the commands and variable names match the code.

## 6. Live deployment (owner-assisted) and integration check

- [x] 6.1 With the owner, create the B2 bucket and application key and the Render service from the Blueprint, entering the secrets only in the Render dashboard. Verify that the first deploy goes live and `/api/health` returns `ok` at the public `onrender.com` URL.
- [x] 6.2 On the live URL, using a fictional account:
  - register, load sample data and upload `fictional-prescription.pdf`;
  - scan it and save a medication, then log a dose;
  - trigger a manual redeploy.

  Verify that the account, medication, dose log and document are all still present and downloadable afterwards, and that another account cannot access them.

- [x] 6.3 Confirm `TRUST_PROXY` by comparing logged `req.ip` with the tester's public address, and adjust the value if needed. Outcome: spoofed headers are ignored but some requests resolve to an intermediate proxy address; accepted for the small demo audience and documented as a known limitation. Then update the README with the actual live URL and the date it was verified. Verify that `npm run verify` and CI pass with the final documentation.

## Workflow follow-up

- Archive the change after the live verification in group 6 passes.
