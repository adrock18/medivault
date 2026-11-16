# Design

## Context

See proposal.md (Why). Current state that shapes the approach:

- `server/index.ts` starts one Express process that serves `dist/` and `/api` in production. Node runs the backend TypeScript directly (`node server/index.ts`), and the backend imports `src/lib/{contracts,schemas,utils}.ts`. `package.json` already pins `engines.node >=22.18`; development uses Node 24.
- `server/database.ts` opens `DATA_DIR/medivault.sqlite` in WAL mode and applies migrations by `user_version`.
- `server/app.ts` writes uploads with `writeFile` under `DATA_DIR/documents/<userId>/<uuid>.<ext>`. It streams them back with `res.sendFile` and removes them with `unlink`. The relative key is stored in `medical_records.file_path`.
- `apiConfig` validates `PORT` and requires `COOKIE_SECURE=true` in production. There is no `trust proxy` setting, so behind a proxy `express-rate-limit` sees one shared address.
- Render Free web services: Docker runtime supported; filesystem is wiped on every deploy, restart, and spin-down (15 minutes idle, ~1 minute cold start); no persistent disks; 750 instance hours per month. Blueprints support `runtime: docker`, `healthCheckPath`, `autoDeployTrigger: checksPass`, and `sync: false` secrets.
- Litestream v0.5.x supports `restore -if-db-not-exists -if-replica-exists` and `replicate -exec`, and works with S3-compatible endpoints; v0.5+ auto-configures path-style addressing and payload signing for Backblaze B2 endpoints.

## Goals / Non-Goals

**Goals:**

- One container image that works on Render Free and on any Docker host.
- Zero data loss across Render restarts beyond the last ~10 seconds of writes.
- Local development, tests, and Windows CI unchanged and credential-free (local storage remains the default).

**Non-Goals:**

- Multi-instance scaling, paid disks, Postgres migration, presigned URLs, custom domain purchase, keep-alive pinging to defeat spin-down, or a "reset demo" feature (the notice only warns that a reset may happen).

## Decisions

### D1. Litestream sidecar in the same container for the database

The container entrypoint (`docker/entrypoint.sh`) works as follows:

- When `LITESTREAM_REPLICA_PATH` is set (a key prefix such as `db` in the same bucket as documents):
  - It runs `litestream restore -if-db-not-exists -if-replica-exists` for `$DATA_DIR/medivault.sqlite`. A restore failure exits nonzero, so Render never serves an empty database over an existing replica.
  - It then runs `exec litestream replicate -exec "node server/index.ts"`. Litestream becomes PID 1, forwards SIGTERM to Node, waits for the existing graceful shutdown to close the database, and then performs a final sync.
- When `LITESTREAM_REPLICA_PATH` is unset, it runs `exec node server/index.ts` (CI smoke test and plain Docker hosts).

Litestream is pinned to a specific v0.5.x release binary and installed from GitHub releases with a checksum verification. Configuration lives in `litestream.yml`, with credentials read from environment variables.

Alternatives considered:

- **Periodic `VACUUM INTO` snapshots uploaded by Node:** loses everything since the last snapshot on spin-down.
- **Render Postgres free tier:** expires after 30 days and needs a full data-layer rewrite.
- **Paid persistent disk:** rejected by the owner.

### D2. Pluggable document store, Backblaze B2 via the AWS S3 client

A new `server/document-store.ts` defines a small `DocumentStore` interface: `put(key, bytes, contentType)`, `get(key)` returning a stream plus length (or `null` if missing), and `delete(key)`, which is idempotent.

- `LocalDocumentStore` keeps the current behavior: path-containment check, `0o700`/`0o600` permissions, and `wx` writes.
- `S3DocumentStore` uses `@aws-sdk/client-s3` with `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION` (required; for B2 it is the endpoint's region segment such as `eu-central-003`) and `forcePathStyle`. Request/response checksums are set to `WHEN_REQUIRED` because recent SDK default checksum headers are not accepted by every S3-compatible provider.
  - Object keys are `documents/<file_path>`, reusing the existing column, so no migration is needed.
  - Keys contain a fresh UUID per upload, so overwrite protection relies on key uniqueness rather than provider-specific conditional writes.

`createApp` receives the store through options, so tests can inject an in-memory or failing store. Routes keep their current order of operations:

- **Upload:** put the object, then insert the row; if the insert fails, delete the object.
- **Delete:** delete the object, then the row.

Downloads stream the object body through Express, with the same `Content-Type`, `Content-Disposition`, `no-store`, and owner checks. A missing object maps to the existing 404 message. No public or presigned URL is ever generated, which keeps the existing "Authorized file access" requirement intact.

Alternatives considered:

- **Syncing the documents directory to the bucket with a background job:** files written just before a spin-down would be lost.
- **Presigned redirects:** these would expose bucket URLs and break the same-origin delivery model.
- **A hand-written signed `fetch` client:** fewer dependencies, but error-prone SigV4 signing.

### D3. Configuration and fail-fast validation

`apiConfig` gains the following:

- **`TRUST_PROXY`:** an integer hop count, default unset, meaning do not trust forwarded headers. It is applied with `app.set('trust proxy', n)` before the rate limiter.
- **`DOCUMENT_STORAGE=local|s3`:** defaults to `local`.
- **When `s3` is selected:** the required `S3_*` values must be present and `S3_ENDPOINT` must be a valid `https:` URL.

Errors name the missing variable and never echo secrets. The validation runs where `apiConfig` already runs, before `checkFrontendBuild` and before `openDatabase`, which satisfies the "before opening storage or listening" ordering. Startup does not probe the bucket over the network, so `startApi` stays synchronous and the existing startup tests remain valid. A bad credential surfaces on the first upload or download as a retryable error and in the logs.

Render sets `TRUST_PROXY=1`. This is verified after the first deploy by comparing logged `req.ip` values against a known client address (see Open Questions).

### D4. Container image

The `Dockerfile` is multi-stage, based on `node:24-bookworm-slim` (matching CI's primary runtime).

- **Build stage:** `npm ci`, `npm run build`, then `npm run check:build`.
- **Runtime stage:**
  - Runs `npm ci --omit=dev` and copies `dist/`, `server/` (including `migrations/`), `src/lib/`, `package*.json`, `litestream.yml`, the entrypoint script and the Litestream binary.
  - Runs as the non-root `node` user and sets `DATA_DIR=/data` (ephemeral), `HOST=0.0.0.0`, `NODE_ENV=production` and `COOKIE_SECURE=true`.
  - Render injects `PORT`.

A `.dockerignore` excludes `.env*`, `data/`, `node_modules/`, `dist/`, `.git/`, `openspec/`, `.agents/` and stray PDFs. `tests/` stays in the build context because `tsc -b` references `tsconfig.test.json`, but only the build stage sees it; the runtime stage copies just `dist`, `server` and `src/lib`. That satisfies the "no secrets or local data" scenario, and the CI job asserts it.

The build stage sets `VITE_PUBLIC_DEMO=true` so the image's frontend renders the demo notice, while `npm run dev` and local builds stay unchanged.

### D5. Public demo notice

A compact `DemoNotice` component is rendered by `AuthPage` and `Layout` when `import.meta.env.VITE_PUBLIC_DEMO === 'true'`. It is a single-line, wrapping, theme-token-styled banner that is not dismissible and contains no links to external services. It is placed in document flow (not fixed) so it cannot cover navigation at 320 px.

### D6. Render Blueprint and CI gate

`render.yaml` defines one service:

- `type: web`, `runtime: docker`, `plan: free`, `name: medivault` (giving `medivault.onrender.com` if available, else a Render-suffixed name).
- `healthCheckPath: /api/health`, `autoDeployTrigger: checksPass`.
- Plain env values `NODE_ENV`, `COOKIE_SECURE`, `TRUST_PROXY` and `DOCUMENT_STORAGE=s3`.
- `region: frankfurt` (closest to the B2 `eu-central-003` bucket).

Litestream reads the same endpoint, bucket, region and key pair through environment expansion in `litestream.yml`, with `sync-interval: 10s` to keep B2 transaction counts low.

`.github/workflows/verify.yml` gains an Ubuntu `container` job that:

- builds the image;
- runs it with local storage and secure cookies;
- polls `/api/health` and a deep link (`/medications`);
- asserts that `/app/.env` and `/data/documents` do not exist in a fresh container.

Because `checksPass` waits for all GitHub checks, a broken image blocks deployment.

## Risks / Trade-offs

- **[Writes in the last ~10 s before an abrupt kill are lost.]** → Litestream's 10 s sync interval plus the final sync on SIGTERM; Render sends SIGTERM before stopping. This is acceptable for a demo.
- **[Two instances replicating the same database would corrupt the replica.]** → Free plan runs one instance; the README forbids scaling above 1.
- **[Database and document stores can diverge.]** The database restores to a point slightly before a just-uploaded object exists. → Orphaned objects are harmless; a row whose object is missing returns the existing 404.
- **[Cold starts take about a minute, plus the restore time.]** → Documented; the database is small, so restore takes seconds.
- **[Public registration could fill B2's free 10 GB storage or burn build/bandwidth limits.]** → The 10 MB per-file limit already exists. The notice says the demo may be reset, and the operator can delete the bucket prefix. Per-user quotas are deferred.
- **[Untested credentials are only detected at first use.]** → The documentation includes a post-deploy upload/download/restart check.
- **[Litestream configuration syntax changes between releases.]** → The binary is pinned, and the version and config are verified in the CI image build.

## Migration Plan

1. Merge the code. Local, Windows, and Linux verification stay credential-free.
2. The owner creates a private Backblaze B2 bucket (EU Central, lifecycle "Keep only the last version of the file" so deleted objects do not accumulate as hidden versions) and a Read and Write application key restricted to that bucket. No payment method is required; the free tier caps rather than bills.
3. The owner creates the service in Render from the Blueprint (New → Blueprint → `adrock18/medivault`) and enters the `sync: false` secrets.
4. First deploy: there is no replica yet, so the database is created and replicated.
5. Verify: register a fictional account, add a medication, and upload the sample PDF. Then do a Manual Deploy (restart) and confirm the data and document survive.
6. Rollback: use Render's rollback to the previous deploy. The data stays in B2 and is unaffected. To abandon the deployment, suspend the service; local development is unaffected.

## Open Questions

- Is Render's effective proxy hop count 1? This is checked after the first deploy via logged `req.ip`. Only the `TRUST_PROXY` value changes, not the code.
- Is the `medivault` service name available on `onrender.com`? If it isn't, Render appends a suffix and the documentation records the actual URL.
