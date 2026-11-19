# Verification, Demo Safety and Known Limitations

## Evidence levels

| Evidence                           | What it establishes                             | What it does not establish                                     |
| ---------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| Formatting/lint/TypeScript         | Source consistency and static checks            | Correct clinical data, working database or browser             |
| Production build/artifact checks   | Buildability and configured bundle/asset limits | Full functional coverage                                       |
| Container compilation              | Image can be built                              | Successful hosted runtime/configuration                        |
| Health endpoint                    | Managed schema readiness at that moment         | Auth email delivery, each stored file or backup recoverability |
| Isolated functional/browser checks | The exercised scenarios under their fixtures    | Universal OCR accuracy or every real account/device            |
| Explicit live smoke check          | The observed deployed workflow at that time     | Stress, security certification or general production approval  |

The [published CI workflow](../../.github/workflows/verify.yml) runs
`npm run verify` on Windows/Linux, container compilation and a production
dependency audit. Private functional/browser suites are not distributed or
executed by that workflow. Do not invent a public `npm test` command.

For a code change, run the smallest relevant existing functional checks if
available, then the required repository gates. For documentation-only edits,
check Markdown formatting, local links and source-backed claims; no application
test run is required solely because a document moved.

## Minimal presentation rehearsal

Use an explicitly authorized fictional account. Preserve prepared data; perform
delete demonstrations only on clearly disposable additions.

1. Sign in, select the intended profile and verify the dashboard matches it.
2. Open one visit and one PDF/image. Preview/download must show the saved file.
3. Exercise search/Important! and clear filters before changing demo sections.
4. Read one known printed sample locally with OCR. Review suggestions against the
   original; do not guess missing dates, times, amounts or units.
5. Demonstrate a fictional medication schedule with explicit taken/skipped/undo
   and a refresh. Do not represent a software schedule as treatment.
6. Show a manually recorded follow-up and its pending/completed state.
7. Preview the selected-profile activity summary. JSON export is account-wide
   and does not contain original document files.
8. Reopen the deployed app after a release. Old tabs can refer to removed hashed
   chunks; a fresh page load may be necessary before presenting.

Record pass/fail/not-run separately. Account creation, mailbox delivery,
dependents' creation and login are distinct flows; dependent profiles do not get
their own credentials. Do not repeat signup requests to work around email quotas.

## Current limitations

| Area                        | Boundary / safe response                                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intended use                | Portfolio/MVP, fictional public demonstrations; no clinical interpretation, healthcare certification or treatment recommendations                                                                    |
| OCR                         | Printed-English, bounded local processing; handwriting and arbitrary layouts are not guaranteed. Suggestions recognize limited explicit patterns, not every medicine. Human review remains mandatory |
| Missing schedule data       | OCR does not determine dose times or dates; strength is not the prescribed amount                                                                                                                    |
| Measurement dates           | Confirmed review dates are fixed for a source. Record-date edits do not repair an incorrect reviewed date; document correction needs deliberate follow-up                                            |
| Historical medication views | Unlogged history is projected from the current schedule; prescription versions are not stored                                                                                                        |
| Adherence                   | Taken divided by logged outcomes, excluding unlogged doses; not clinical adherence or proof of a missed dose                                                                                         |
| Reminders                   | Open-website status only, no medication email/background push                                                                                                                                        |
| Accounts                    | Confirmation delivery depends on Auth configuration/quotas; forgotten-password self-service is not implemented                                                                                       |
| Family                      | One owner manages dependents; no independent family login or delegated access                                                                                                                        |
| Capacity                    | Full account snapshots and buffered files suit the MVP; no established high-volume/concurrency guarantee                                                                                             |
| Storage                     | Database and object mutations are not one transaction; explicit compensation/partial-failure recovery required                                                                                       |
| Privacy                     | Local downloads and browser-generated print copies cannot be revoked remotely                                                                                                                        |
| Demo samples                | Reused public examples are unrelated documents, not a coherent longitudinal patient history; never infer trends from reuse                                                                           |

The Settings sample-data action was removed. Prepare fictional accounts and
uploads manually or through explicitly authorized development tooling. Removing
informational Settings panels does not disable authentication, RLS or Storage
protection.

### Date-boundary observation requiring follow-up

A browser-default record date was rejected as future while an explicit
previous-calendar-day fixture date succeeded. Current date-only upper-bound
validation uses the executing environment's local calendar date on both client
and server. A browser/server timezone difference is therefore a boundary to
resolve deliberately, not by silently allowing future clinical dates. The exact
timezone configuration was not fully diagnosed during minimal demo preparation.
Do not treat changing an actual document's date as a production fix.

## Release and incident discipline

Keep local verification, a pushed commit, CI success, deployment success and a
live smoke result distinct. A Render release does not apply schema migrations
or reset users. Apply schema changes only with separate authorization and the
[migration procedure](../operations.md).

Keep new defects in an evidence-based issue/report: observed behavior, expected
behavior, minimal reproduction, affected scope, small proposed fix, validation,
and what remains unknown. Report major design/schema changes for approval rather
than hiding them inside a layout cleanup.
