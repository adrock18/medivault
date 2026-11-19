# HTTP API Reference

## Contract and authorization

All paths in the table are relative to the `/api` prefix. The browser uses the
[typed client](../../src/lib/api.ts); Express mounts routes in
[app.ts](../../server/app.ts). Success payloads are validated with
[response contracts](../../shared/contracts.ts); request fields use
[shared schemas](../../shared/schemas.ts).

Private endpoints require the Supabase session held in HttpOnly cookies.
Mutations require `X-MediVault-Request: 1`; a supplied Origin must be allowed.
The server derives `user_id` from the authenticated session, not a JSON field.
Managed-profile links must belong to that owner and agree with linked visits and
prescription sources. Ordinary database requests also run under owner RLS.

`GET` reads; `POST` creates or performs a specific action; `PATCH` updates;
`PUT` supplies a desired state/upsert; `DELETE` removes. These are HTTP
conventions, not a claim that every resource has a separate single-item GET.
Lists are delivered by the authorized vault snapshot.

## Mounted endpoints

| Method | Path                                 | Purpose / persistence                                                                                    |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| GET    | `/health`                            | Metadata-only managed-schema readiness; no patient payload                                               |
| GET    | `/auth/session`                      | Public session lookup: user summary or null                                                              |
| POST   | `/auth/register`                     | Supabase Auth signup; bootstrap profile/self-member/preferences; session or confirmation-required result |
| POST   | `/auth/login`                        | Supabase password login; cookie session and public user summary                                          |
| POST   | `/auth/resend-confirmation`          | Rate-limited signup confirmation resend; generic acknowledgment                                          |
| GET    | `/auth/callback`                     | Browser-bound PKCE code exchange and safe redirect                                                       |
| POST   | `/auth/logout`                       | Sign out local Auth session and clear cookies                                                            |
| POST   | `/auth/password`                     | Verify current password, update password, revoke other sessions                                          |
| GET    | `/vault`                             | Account snapshot plus reviewed results and feature flags                                                 |
| GET    | `/account/export`                    | Authorized account-wide JSON; excludes original file bytes                                               |
| PUT    | `/health-profile`                    | Upsert owner's `health_profiles`; related name guard synchronizes identity                               |
| POST   | `/family-members`                    | Create owned non-self `family_members` row                                                               |
| PATCH  | `/family-members/:id`                | Update non-self member demographics                                                                      |
| DELETE | `/family-members/:id`                | Remove eligible non-self member; associated health data prevents deletion                                |
| PUT    | `/family-members/:id/health-profile` | Upsert that member's `family_health_profiles`                                                            |
| POST   | `/care-tracks`                       | Create `care_tracks` group                                                                               |
| PATCH  | `/care-tracks/:id`                   | Update owned group                                                                                       |
| DELETE | `/care-tracks/:id`                   | Remove group; visits remain unassigned to a track                                                        |
| POST   | `/care-visits`                       | Create owned, profile-scoped `care_visits`                                                               |
| PATCH  | `/care-visits/:id`                   | Update visit subject to follow-up/link consistency                                                       |
| DELETE | `/care-visits/:id`                   | Delete visit; unassign documents, remove its originating follow-up                                       |
| PUT    | `/care-visits/:id/follow-up`         | `save_visit_follow_up` RPC; one follow-up per visit                                                      |
| POST   | `/records`                           | Multipart metadata plus one validated file; private Storage and `medical_records`                        |
| PATCH  | `/records/:id`                       | Update record metadata/visit assignment, not uploaded bytes                                              |
| PUT    | `/records/:id/favourite`             | Desired `{is_favourite: boolean}`; UI label is Important!                                                |
| GET    | `/records/:id/file`                  | Owner-checked private bytes; `?download=1` requests attachment disposition                               |
| DELETE | `/records/:id`                       | Remove private object, then metadata; explicit partial-failure handling                                  |
| POST   | `/records/:id/ocr`                   | Optional configured OCR.Space forwarding; explicit per-request consent required                          |
| POST   | `/records/:id/results`               | `save_reviewed_results` RPC: append review and eligible profile synchronization                          |
| POST   | `/medications`                       | Create validated `medications`; no inferred dose times                                                   |
| PATCH  | `/medications/:id`                   | Update prescription/schedule details; existing logs retain original coordinates                          |
| DELETE | `/medications/:id`                   | Remove medication and its related dose logs                                                              |
| POST   | `/dose-logs`                         | Create explicit taken/skipped outcome for valid schedule coordinate                                      |
| PATCH  | `/dose-logs/:id`                     | Update recorded outcome, not the original dose coordinate                                                |
| DELETE | `/dose-logs/:id`                     | Undo outcome; schedule projection becomes unlogged                                                       |

Route implementations:
[Auth](../../server/routes/auth.ts),
[vault/profile/results](../../server/routes/vault.ts),
[care](../../server/routes/care.ts),
[records](../../server/routes/records.ts),
[medications](../../server/routes/medications.ts).
The unused notification-preference/internal reminder route module has been
removed; those endpoints remain unavailable. Legacy database structures are
retained for compatibility, not active delivery. There is no
active `/metrics` API or email-based forgotten-password reset API.

## Request examples

Examples are shapes, not reusable patient facts. A normal browser session and
mutation header are required; never place tokens in example commands.

```json
{
  "family_member_id": "<owned-family-member-uuid>",
  "care_track_id": "",
  "title": "DEMO FIXTURE - routine visit",
  "reason": "Fictional software demonstration",
  "setting": "primary_care",
  "provider": "Demo Clinic / Dr Example",
  "visit_date": "2026-10-01",
  "notes": "Fictional visit metadata; attached public samples are unrelated."
}
```

`POST /records` sends these six text fields plus `file`:
`family_member_id`, `visit_id`, `title`, `document_kind`, `provider`,
`record_date`. Optional link/provider inputs are empty strings, not omitted
made-up IDs. The upload parser derives field/part limits from the record schema.
Supported files are PDF/JPEG/PNG up to 10 MB, validated beyond the filename.

Medication form `times` is a comma-separated `HH:MM` string. The API validates
unique times and frequency/count consistency, then stores a sorted array.
Optional end dates and source IDs normalize to null. A source must be an owned
prescription belonging to the same managed profile.

```json
{
  "medication_id": "<owned-medication-uuid>",
  "scheduled_date": "2026-11-19",
  "scheduled_time": "08:00",
  "status": "skipped"
}
```

The dose-log create route validates that this coordinate belongs to the saved
schedule. A database uniqueness constraint prevents duplicate outcomes for the
same owner, medication, date and time. No response implies treatment advice.

## Responses, errors and side effects

Creation normally returns `201` and a validated row. Updates return the row;
successful deletes/logout/password actions use `204`. Auth callbacks redirect.
Errors use `{ "error": "safe message", "code"?: "stable_code" }`.
See [flow error classifications](../flows.md#common-contract) for statuses.

Private API responses use `Cache-Control: no-store`. File delivery is
authenticated proxying, **not public URLs or signed links exposed to the UI**.
The Storage adapter buffers downloaded bytes before exposing a Node readable
stream; this is not constant-memory object streaming. Upload compensation and
retryable partial deletion are documented in
[operations](../operations.md) and [request flows](../flows.md#documents).

Local OCR is not this remote OCR endpoint: PDF.js/Tesseract run in browser
workers after an authorized file read. Text extraction, medication suggestions,
human confirmation and database save are separate stages.
