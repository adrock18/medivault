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
   Supabase's built-in email provider allows only two Auth emails per hour per
   project. If registration reports the confirmation email limit, wait for the
   quota to reset or configure custom SMTP in Supabase Auth. Do not disable
   confirmation to work around this on a public release.
   The login/signup recovery UI supports confirmation resend, not
   forgotten-password reset. A successful resend request does not verify
   mailbox delivery. Test an actual confirmation link in the registration
   browser; Settings password change requires knowing the current password.

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
Remove `RESEND_API_KEY`, `EMAIL_FROM`, `REMINDER_CRON_SECRET` and disable any old
medication-reminder scheduler: its routes and settings UI are no longer active.
Current-time medication status remains available while the website is open.
Supabase Auth confirmation/recovery email is unchanged. Remote OCR is optional.

Before deploying reviewed checkup results, apply the additive
`20261118072112_reviewed_record_results.sql` migration. It preserves existing data
and adds owner-isolated, append-only report review snapshots and transactional
profile syncing. Runtime readiness verifies the new RPCs are present. No existing
medical documents are automatically extracted or reinterpreted.

For the structured profile editor, also apply the additive
`20261118133310_structured_medical_background.sql` migration once. Both owner
and family health tables need its nullable JSONB column and validation trigger.
It preserves legacy text and RLS; it does not split existing allergies, erase
contacts or reinterpret medical notes. Retain the hosted migration version in
local history rather than applying a renamed duplicate.

### Restore the combined Hospital / Doctor field

For the combined-field release, apply
`20261118175417_restore_combined_provider.sql` before the matching application
cutover. The hosted demo migration was applied with explicit authorization on
18 November 2026; retain that version rather than applying a renamed duplicate.
Do not revert or reapply the two already-published split/readiness migrations.

The new migration removes the constraint that blocked nonblank `provider`
writes, joins each saved Hospital and Doctor with `/`, and drops the two
split columns. A blank side adds no separator. The 323-character limit preserves
two maximum-length 160-character names without truncation. Rows, ownership,
document bytes, relationships and unrelated fields remain unchanged.
Previously cleared text cannot be recovered by this migration.

New documents copy the selected visit's combined provider as an editable
snapshot; editing a visit later does not rewrite saved documents. The upload
parser follows the six-field metadata schema instead of hardcoded counts.
Readiness remains security-invoker and catalog-only; no patient-table grants
are added. It verifies the provider columns and the new length constraints.

Validate locally, then obtain release authorization before applying hosted
changes. Deploy matching API/frontend and refresh old tabs together with the
schema cutover: the split-field application is incompatible with the new schema.
A Git push alone does not apply database migrations.

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
The service role intentionally lacks direct access to patient tables. Readiness
must use the metadata-only RPC, not table selects or broader service-role grants.
If startup fails, inspect the sanitized readiness error code before the generic
startup error; do not repeat the provider reset to troubleshoot readiness.

For unavailable services, check Supabase project status, inactivity/plan limits,
API keys, bucket policy and network access. Preserve sanitized incident IDs and
the release revision, not patient data or credentials. A previous B2 transaction
cap cannot prevent the new runtime from starting; it no longer contacts B2.

Confirmation failures are separate from database health. Inspect the configured
Auth sender, quota, redirect allowlist and `APP_ORIGIN` without disclosing keys.
Missing verifier guidance means the PKCE link could not be tied to this browser;
it is not proof of an invalid password. See
[authentication outcomes](flows.md#authentication) for the UI/API contract.

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
