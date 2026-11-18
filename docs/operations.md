# Deployment and Operations

MediVault runs React and Express on Render, using Supabase Auth, PostgreSQL and
private Storage. Host disk is not a persistence dependency. Use fictional data
only; this portfolio MVP is not a healthcare-compliance claim.

## Prepare Supabase

1. Use the approved Supabase project. Apply the versioned SQL in
   [supabase/migrations](../supabase/migrations) in order, once, using the
   Dashboard SQL editor or the Supabase CLI. Do not reset a project or run
   migrations at every web startup.
2. The storage migration creates private bucket `medical-records`, limited to
   PDF/JPEG/PNG and 10 MiB. Ordinary users can read only their own object prefix;
   they cannot bypass application file validation with direct uploads.
   If using another bucket name, configure the bucket and matching read policy
   explicitly before changing `SUPABASE_DOCUMENT_BUCKET`.
3. Keep the publishable and secret keys in private environment settings.
   The secret key must never be in a `VITE_` variable, source, logs or chat.
4. In Supabase **Authentication > URL Configuration**, set Site URL to the
   deployed application origin, and Redirect URLs to its exact
   `/api/auth/callback`. For the current Render address:
   `https://medivault-dlq9.onrender.com/api/auth/callback`.
5. Keep email confirmation enabled for a public release. Verify the configured
   sender using an owner-controlled mailbox. Pending confirmation does not
   establish email delivery; PKCE links must open in the registration browser.

This is a fresh start: old SQLite accounts, passwords and health data are not
imported or deleted. Returning users must register again.

## Configure and release on Render

The [blueprint](../render.yaml) builds the [Dockerfile](../Dockerfile), serves
`/api/health`, and deploys after checks pass. An existing Render service also
needs its environment updated in the Dashboard; editing the blueprint does not
necessarily update a service created manually.

Before pushing a cutover revision, disable automatic deployment temporarily or
otherwise coordinate configuration so old code cannot deploy with new settings.
Set these variables on the existing web service:

| Variable                   | Value                                                            |
| -------------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`                 | `production`                                                     |
| `HOST`                     | `0.0.0.0` (also set in the image)                                |
| `COOKIE_SECURE`            | `true`                                                           |
| `TRUST_PROXY`              | `1`                                                              |
| `APP_ORIGIN`               | `https://medivault-dlq9.onrender.com` or the actual HTTPS origin |
| `SUPABASE_URL`             | Project root URL                                                 |
| `SUPABASE_PUBLISHABLE_KEY` | Project publishable key                                          |
| `SUPABASE_SECRET_KEY`      | Project server-only secret key                                   |
| `SUPABASE_DOCUMENT_BUCKET` | `medical-records`                                                |

Render supplies `PORT`. Remove obsolete `DOCUMENT_STORAGE`, `DATA_DIR`,
`S3_*` and `LITESTREAM_*` variables. Do not delete old remote objects or replicas.
Leave `RESEND_API_KEY`, `EMAIL_FROM`, `REMINDER_CRON_SECRET` and any reminder
scheduler disabled unless separately authorized. Remote OCR is also optional.

Run `npm run verify` and `npm audit --omit=dev`, publish the verified revision,
then deploy it. Record the actual revision and URL. Restore `checksPass`
automatic deployment after successful cutover; never bypass failing checks.

## Acceptance before calling the website live

- Check `/api/health` and a frontend deep link.
- Register, confirm if required, sign in, reload and sign out.
- In two fictional accounts, confirm that records and documents are isolated.
- Upload a valid fictional PDF, download byte-identical content, and create a
  medication, dose outcome and visit follow-up.
- Restart the Render service and verify the same saved entries and document.
- Check desktop/mobile sign-in and core pages without redesigning them.

A local build, API rehearsal or container compilation does not prove a hosted
release is active. Without Render deployment access, hosted acceptance remains
pending.

## Health and failures

Startup checks required settings, complete production assets and a bounded
managed-schema readiness RPC before listening. `/api/health` checks remote
database readiness and returns 503 when unavailable. It does not check Auth,
document bytes or backups. Do not add a storage read to each health poll.

For unavailable services, check Supabase project status, inactivity/plan limits,
API keys, bucket policy and network access. Preserve sanitized incident IDs and
the release revision, not patient data or credentials. A previous B2 transaction
cap cannot prevent the new runtime from starting; it no longer contacts B2.

## Documents, backups and recovery

Database and object operations are not atomic. A failed metadata insert attempts
to remove its new object. Incomplete cleanup reports an error for an operator;
there is no automatic orphan purge. If object deletion succeeds but metadata
deletion fails, retry the normal deletion to finish. Missing bytes produce an
explicit error, not a successful empty download.

Supabase database backups do not include Storage object bytes. Establish and
rehearse separate database and object backups before storing real data; a green
health check proves neither recoverability nor point-in-time consistency.
Confirm current plan retention, quotas and free-tier pause behavior in the
Supabase and Render dashboards. Do not change billing or retention automatically.

Prefer a compatible Supabase-capable revision or a forward fix for rollback.
The old SQLite/B2 application cannot read new Supabase writes; deploying it is
not a lossless rollback. Preserve old storage until the owner explicitly decides
its retention. Never reset Supabase or erase saved data to make readiness green.
