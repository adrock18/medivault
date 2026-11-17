# Engineering Review: Evidence and Coverage

## Publication Successor and Retired Verification Scope

The owner subsequently selected
[`production-release-readiness`](../2026-11-17-production-release-readiness/proposal.md):
executable suites and their tooling leave the published tree, while local files
and the executed evidence below remain preserved. Earlier test commands and CI
descriptions in this review are historical, not current checkout instructions.
Use the [current release guide](../../../../docs/development.md) instead.

On 2026-11-17 the owner explicitly retired and removed the two unfinished
verification tasks from the checklist. The retained scope is **29/29 complete**,
not 31 executed tasks. Historically, 29 of the original 31 tasks were complete:
former task 2.5 lacked inspected pinned Linux visual references, and former task
8.1 lacked that part of integrated acceptance. Neither was passed or executed
by removing it. Historical evidence below remains unchanged.

The owner selected chronological spec synchronization and archival. Reconcile
premium, editorial and quality deltas before synchronizing the successor removals. The
[release reconciliation map](../2026-11-17-production-release-readiness/review.md#predecessor-reconciliation-map)
also records the approved documentation-only motion reconciliation.

Subsequent local operations: the separately approved Desktop-only restart and
the production release's deployment-image build/runtime acceptance succeeded;
see [the successor evidence](../2026-11-17-production-release-readiness/review.md#linux-deployment-image-and-local-runtime-acceptance).
This clears the local engine/container blocker recorded later in this historical
review, not the omitted pinned Linux visual comparison. Retirement does not
provide equivalent regression assurance.

## Implementation verification

| Stage                          | Command                                                                  | Result                                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unchanged baseline, 2026-11-17 | `npm run verify`                                                         | Passed formatting, lint, strict build/type checks, all 128 tests in 17 files, and 42 emitted-asset checks. Entry: 442,408 bytes against the unchanged 500,000-byte limit.                                      |
| Handbook foundations           | Prettier; local Markdown link validation; manual diagram/contract review | Passed 86 local links. Architecture, ERD, module map, auth/document/OCR/dose flows, setup and SDLC are linked from the README and checked against current handlers/migrations. This is not a new runtime test. |

F1 is assigned to logging semantics and regressions; F2 to coordinated motion/static ambient depth; F3 to entrypoint sequencing tests; F4/F5 to document-operation fault tests and diagnostics; F6 remains an explicitly deferred scaling risk; F7 to operational health/recovery guidance; F8 to the handbook and committed browser verification. None is marked resolved solely because the baseline passed.

## Status and limits

Connected Chromium workflow evidence: record upload/edit/search/category/date
ordering, private image preview, byte-identical download, cancelled/confirmed
deletion and second-owner denial passed against the real production API.
Medication CRUD, source navigation, read-only calendar movement, Taken/Skipped/
Undo and retained original coordinates after schedule edits passed. Profile
reload persistence, command navigation, cancelled/confirmed fictional samples,
structured export, password change and subsequent UI login passed. These checks
use fictional accounts and generated documents in isolated storage. Browser time
and timezone are fixed; the production server's real cookie clock is unchanged.
Worker/network requests are restricted to the owned fixture origin, and service
workers are blocked rather than permitted to bypass that boundary. Broader
visual, motion and print checks remain separate pending tasks.

Local OCR/failure evidence: all five Chromium checks in `ocr.spec.ts` and
`failures.spec.ts` passed. Actual Tesseract worker/language requests and image
recognition, actual PDF.js rendering/text extraction, explicit review gating,
scan-worker cancellation, invalid files, recoverable failed uploads, failed/stale
refresh, out-of-order refresh completion, revoked sessions and late private-file
responses were exercised. Failure responses are deliberately injected where
indicated; successful retries and account/session state use the real API.

Logging semantics evidence: 20 targeted domain/dashboard checks passed under
`TZ=America/New_York`, including spring/fall DST, leap/year boundaries, retained
original log dates, taken/skipped parity, undo/deletion recomputation, gaps,
future-date exclusion and runs beyond the former 60-day cap. The current-run
insight now names its ending date without inferring historical completeness.
Type checking passed after these changes.

Milestone delivery evidence: the production build, 22 targeted domain/component
checks, explicit Chromium milestone journey, lint and emitted-resource check
passed. The journey proves pending/failed writes do not advance progress or play
confirmed feedback, a persisted skipped outcome acknowledges the third distinct
date, reload/passive refresh/sign-in do not replay it, and undo removes progress.
The entry remains 442,408 bytes; all 42 emitted resources were checked. README
help and decision D6 explain the separate lifetime/current-run/adherence meanings.

Earlier platform limitation (cleared during continued implementation): the pinned Linux browser-image pull failed because Docker
Desktop reports it cannot start. The normal API and a process-local 1.47
compatibility probe both failed; no shared Docker service was restarted or
reconfigured. Windows browser work continues with the user's approval. Required
Linux visual/container evidence was left pending, not silently waived. Docker
subsequently became responsive without a service restart or reconfiguration.
The exact Playwright 1.65.1 Noble image was pulled successfully at digest
`sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579`.
Actual Linux browser/container results are recorded separately when executed.

Subsequent environment blocker: unpacking that image for the dedicated
verification build hit host `ENOSPC` and the Docker build connection ended with
EOF. One concurrent Windows registration fixture failed from the same
disk-exhaustion event; it is not counted as a product regression or a pass.
Afterward the host reported about 4 GB free, but Docker again reported unable to
start. No shared service restart, global prune, Docker-data deletion or
configuration change was attempted. The earlier ten-case shell run remains real
Linux evidence; pinned visual references and deployment-image smoke are still
pending until the engine and adequate disk capacity are available.

Favourite delivery evidence: the strict production build, all 41 selected
backend/discovery/preview/dashboard tests, five connected Chromium journeys and
lint passed. Populated v1/v2 upgrades and reopen preserve IDs, existing links and
file bytes; flag constraints/defaults and strict boolean responses are tested.
Real API tests cover anonymous/other-owner denial, header/origin protection,
invalid payloads, repeated/concurrent equal desired states, metadata preservation,
restart persistence and deletion. Browser checks cover combined discovery,
pending/failure recovery, preview return, result-count focus after unfavouriting,
clear/reset and additive JSON export. Existing core/account/check-in journeys
also passed against migration 003. All 100 handbook/README file targets resolve;
the ERD addition and version-3 rollback guidance were manually source-checked.

Summary delivery evidence: strict production build, all 12 summary
domain/component tests, both connected Chromium journeys and lint passed.
Fresh snapshot guards, date/profile invalidation, failure/retry, dismissal,
reload, account/session expiry and late response isolation are covered. Actual
browser PDF output contains five pages; PDF.js readback confirms the final
medication and record sentinel, not just an HTML preview. Original log coordinates
survive an edited schedule; profile is opt-in and excluded content stays absent.
The unchanged JSON export retains legacy measurements. The summary creates no
health/document writes; only a subsequent fixture-only upload reads back the
generated PDF. Native OS dialog save/cancel and physical printing are documented
manual boundaries, not claimed executed checks.

The PDF check reproduced off-page text despite a white preview and no descendant
width overflow. Emitted CSS had folded literal independent-transform `none`
resets into `transform`, leaving Tailwind's `translate` active. CSS-wide `initial`
resets survive production optimization; ancestor motion is also disabled for
printing. Assertions now check the real translation reset and actual PDF text.
Decision D8 records provenance, lifecycle, printing and this build-time failure.

Earlier motion experiment (superseded by the replacement evidence below): the strict build and 20 selected
theme/auth/layout/dashboard component checks passed; lint passed after removing
an unused style-read expression. Static ambient depth and authentication
pause/resume/runtime reduced-motion checks passed in Chromium. The connected
Chromium appearance/navigation/private-preview smoke passed after reloading the
fixture's API-created record into the already-mounted application.

Native reveal blocker: a real, paused Chromium root-snapshot transition
intercepts clicks as the HTML root, even with `pointer-events: none` on every
transition pseudo-element. A minimal in-memory page with no application code
reproduces this hit-testing behavior. Thus the planned full-page snapshot reveal
does not currently satisfy the approved nonblocking-interaction requirement;
the interruption test intentionally remains failing rather than forcing clicks
or widening timeouts. Separately, Windows WebKit repeatedly closes/crashes its
page during the application's appearance transition. Minimal WebKit native and
glass-background probes finish, so this is not evidence that the whole API is
unsupported or grounds for an unverified user-agent exclusion. No native-theme
task was marked complete from this experiment. The user subsequently approved
replacing snapshots with immediate colors and background-only CSS gloss; the
proposal, workspace delta, design and tasks now reflect that decision.

Replacement motion evidence: all eight maintained motion checks passed on
Windows. Chromium/Firefox/WebKit each exercise real navigation/private preview
and held background-gloss interruption, runtime reduced motion, latest choice,
bounded cleanup and authentication cancellation. Ordinary clicks remain live;
no forced interaction, browser denylist or native snapshot is used. Active
navigation contrast is measured from opaque browser-computed colors before,
during and after gloss; broader composited page contrast remains task 2.5.
The private preview restores actual nonzero page scroll and trigger focus in all
three engines. Chromium additionally covers auth pause/resume/static ambient depth
and rapid touch navigation, unchanged target dimensions, no overflow and static
reduced-motion behavior. Twenty selected theme/auth/layout/dashboard tests,
type checking and lint passed. The resource checker passed all 43 resources with
443,810 entry bytes against the unchanged 500,000-byte limit. D9 and contributor
help document the shared durations and static alternatives.

Storage-fault evidence: all six new focused API tests passed. Real temporary
SQLite/files plus injected put/get/delete failures and insert/delete triggers
prove non-success, successful compensation versus orphan bytes, metadata retained
after partial deletion, an explicit completing retry and unaffected second-owner
bytes. Document diagnostics now expose only operation, opaque record correlation
and random incident ID, not injected private provider/SQL messages. Operations
and D10 explain the remaining non-atomic boundary and controlled reconciliation.

Linux entrypoint evidence: the real shell entrypoint passed ten credential-free
cases in the pinned browser container with networking disabled. Both absent and
populated fixture databases cover unconfigured replication, successful restore,
access denial, transaction cap and unknown failure. Restore failures never launch
Node or create a missing database; existing bytes survive every case. Success
orders restore, replicate, Node exactly once. This is sequencing evidence only,
not a remote restore, provider availability or deployment result.

Operations disposition: [the runbook](../../../../docs/operations.md) and D10 now
cover F3 (real entrypoint sequencing harness), F4 (compensation/partial-state
tests), F5 (sanitized operation diagnostics), F6 (documented unpaginated/buffered
MVP scaling boundary, deliberately not rewritten) and F7 (database readiness
versus separately checked document/replica health). All 124 README/handbook file
links resolve; restore/replicate and triage procedures were checked against the
actual entrypoint, configuration, sync interval and document handlers. No live
provider write, cloud recovery, billing change, destructive reconciliation,
remote health polling or production deployment was performed.

Browser-fixture implementation evidence: all three real Chromium/Firefox/WebKit
registration, persisted-session reload, and logout-isolation checks passed on
Windows. Two fixture lifecycle tests passed for occupied-listener isolation,
owned-storage cleanup and injected startup failure. Type checking and lint
passed. A deliberately missing browser returned nonzero with installation
guidance. No test used the shared development server or real storage.

Full-gate failure propagation: `npm run verify:full -- -- --grep "intentional runner failure"`
performed one production build, passed all 164 Vitest checks in 19 files and
all 43 resource checks, then returned exit 1 from an actual deliberately failing
browser assertion. The temporary test was deleted immediately afterward.
This proves propagation, not a passing acceptance run.

The first normal Windows full gate passed those 164 checks and 33 of 37 browser
checks. Two contrast audits sampled before a reduced-motion entrance had settled;
two calendar audits selected the hidden mobile date button on desktop. The audit
now finishes the reduced-motion screenshot before measuring, and selects the
single visible pressed date. No tolerance or retry was added. The next run
exposed a real 768-pixel record-filter defect: fixed-width filters squeezed search
to 26 pixels. The search now has a responsive minimum width so filters wrap.
PNG transfer uses base64 instead of enormous JSON number arrays, preserving the
same browser-native pixel comparison while reducing trace/transport overhead.
The superseded parallel run was cancelled, its process tree stopped and only its
three explicitly identified temporary fixture directories removed.

At the user's request, login/signup keep the original responsive layout and
medicine rotation, and regain the original 460 ms glass-form entrance rather than
the workspace's shorter arrival. The live login showed the restored animation;
the browser regression now checks both routes, pause/resume and reduced motion.
This authentication-only entrance does not add nested workspace card effects.

Final Windows integrated evidence: `npm run verify:full -- -- --workers 2 --fully-parallel`
passed formatting, lint, strict build/type checks, all 164 Vitest checks in 19
files, all 43 emitted-resource checks, and all 37 browser checks. Exactly one
production build served every browser worker/engine. Browser execution finished
in 4.3 minutes with two isolated workers. The entry remains 443,810 bytes against
the unchanged 500,000-byte limit. Actual image OCR, text-PDF rendering, multipage
PDF generation/readback, failure recovery and private-session checks passed in
that run, not only in earlier focused runs.

All fourteen Windows matrix cases passed: seven pages at five widths in both
themes (70 views), plus four overlays/calendar states at two widths in both themes
(16 views). Layout, 44-pixel controls, viewport composited text contrast,
keyboard/modal focus and reduced-motion checks ran; all fourteen resulting contact
sheets were visually inspected. Firefox/WebKit navigation, appearance, private
preview/focus/scroll and session smoke also passed. This is not pinned Linux
reference acceptance: no Linux baseline was generated or blindly accepted.

Final handbook checks resolved all 127 local README/handbook links. Strict
OpenSpec validation and diff whitespace checks passed. The six final browser
fixture directories were confirmed absent after automatic teardown; the
deliberate failing test is absent. The changed-file inventory contains only the
quality-upgrade implementation, handbook, tests, migration and verification
configuration; generated reports and fictional PDFs remain ignored.

| Delta area              | Acceptance evidence                                                                                 | Remaining boundary                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Activity summary        | Domain/component guards; both real browser journeys; actual multipage PDF readback.                 | Native save/cancel and physical printing are manual.                                            |
| Dashboard overview      | Logged-date/DST regressions; confirmed milestone/undo browser journey.                              | Counts describe records, not clinical adherence or historical completeness.                     |
| Live demo deployment    | Six storage-fault cases; ten actual Linux entrypoint sequences; operations runbook.                 | Deployment-image recheck is blocked by Docker; real provider recovery is separately authorized. |
| Medical record vault    | Migration/ownership/favourite API regressions; connected discovery and private-file workflows.      | No real bucket or personal document was used.                                                   |
| Repository verification | Passing build-once Windows full gate; explicit injected browser-failure propagation; pinned CI job. | Linux visual references and published CI execution remain pending.                              |
| Workspace experience    | All Windows matrix and three-engine motion checks; restored authentication entrance.                | Pinned Linux visual comparison remains pending.                                                 |

Handoff remains partially blocked, not waived: Docker still reports
`Docker Desktop is unable to start`, with approximately 3.9 GB host disk free
after the earlier unpacking failure. Task 2.5 awaits inspected pinned Linux
references and task 8.1 awaits the Linux/deployment-container acceptance evidence.
No shared Docker restart, prune, configuration change, cloud mutation, commit,
push, deployment, archive or spec sync was performed. These results do not claim
exhaustive bug freedom or production durability.

Windows WebKit reported `SameSite: None` in automation cookie metadata even
though the actual registration `Set-Cookie` header contains `SameSite=Lax`.
The browser check asserts that wire policy separately from Secure/HttpOnly/path
metadata and real session behavior; it does not claim to prove all cross-site
cookie enforcement. A premature reload also produced a native WebKit cancelled
fetch diagnostic; the persistence journey now waits for loaded dashboard content
before its intentional reload, without ignoring page errors.

The source-review ledger below describes baseline `939ecb9`; implementation verification is recorded separately above. The user approved all three proposed features and small backward-compatible backend changes.

The review read all 53 authored `src` files, all nine server source/migration files, all four scripts, all 17 existing tests, and the configuration/documentation listed below through EOF. Frontend coverage comprises 8,937 physical source lines and 2,107 frontend-test lines; this is not a coverage percentage or proof of correctness. Backend final-line counts were not retained consistently, so no aggregate line-count claim is made.

Excluded: dependencies, generated build/lock/worker content, generated skills, binary assets and sample documents, private application storage, environment secrets, live user accounts, and production mutations. Public marketing/platform pages were read only as design references. No cloud durability, browser behavior, or reported defect was dynamically reproduced during this planning pass.

## Findings and disposition

| ID  | Evidence and consequence                                                                                                                                                                                                                                                                                                                                                                                       | Classification                                                                                | Planned disposition                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | [dashboard helpers](../../../../src/lib/dashboard.ts#L37) combine current projections and retained outcomes; the streak calculation at lines 81-86 can describe edited/unscheduled history as fully logged. [Calendar disclosure](../../../../src/components/MedicationCalendar.tsx#L317) correctly acknowledges historical schedule reconstruction.                                                           | Confirmed source-level semantic defect; not dynamically reproduced in this pass.              | Replace historical completeness claims with actual distinct logged dates and explicit current-run rules. Regression cases cover edits, orphaned coordinates, skipped outcomes, undo, gaps, future dates, and local-date boundaries. |
| F2  | [Ambient motion](../../../../src/index.css#L513) runs indefinitely; [pause rules](../../../../src/index.css#L1020) stop the authentication showcase, not the ambient backdrop. Reduced-motion handling exists at lines 1234-1258.                                                                                                                                                                              | Bounded accessibility/motion improvement, not a claimed conformance failure.                  | Make ambient depth static; retain the authentication pause control and reduced-motion behavior while adding deliberate interaction feedback.                                                                                        |
| F3  | [Startup tests](https://github.com/adrock18/medivault/blob/939ecb9/tests/startup.test.ts#L151) and [baseline CI](https://github.com/adrock18/medivault/blob/939ecb9/.github/workflows/verify.yml#L27) exercise production serving and the local-storage image, but not the entrypoint replica restore path. [Entrypoint](../../../../docker/entrypoint.sh#L16) correctly refuses startup on restoration error. | Verification gap.                                                                             | Add credential-free entrypoint success/failure harness; document the limits of mocked restore versus real remote durability.                                                                                                        |
| F4  | [Document operations](../../../../server/app.ts#L458) compensate for upload metadata failure; deletion at lines 523-534 removes content before metadata. Database and object storage cannot commit atomically.                                                                                                                                                                                                 | Existing consistency boundary; no observed data-loss incident.                                | Inject download/delete/cleanup failures, preserve explicit errors, and document controlled reconciliation. Do not invent a distributed transaction or automatic destructive repair.                                                 |
| F5  | Upload-store failure is mapped explicitly at [lines 458-460](../../../../server/app.ts#L458); download/delete at lines 510 and 526 can reach the generic handler at line 716.                                                                                                                                                                                                                                  | Error-diagnostic/test consistency opportunity; generic failure is not itself a false success. | Add fault assertions and sanitized operation context where needed. Preserve safe 500/503 meanings unless reliable classification justifies a change; never label every provider 403 transient.                                      |
| F6  | [Vault reads](../../../../server/app.ts#L351) return the complete owned dataset. [Memory upload middleware](../../../../server/app.ts#L425) bounds individual uploads but not aggregate concurrent buffering.                                                                                                                                                                                                  | Documented scaling risks, not reproduced MVP failures.                                        | Explain capacity limits and revisit aggregation/pagination or streaming only with measured account/load requirements. No such rewrite is bundled.                                                                                   |
| F7  | [Health](../../../../server/app.ts#L246) probes SQLite, not object availability or backup freshness; [Render](../../../../render.yaml#L10) uses this endpoint.                                                                                                                                                                                                                                                 | Operational semantics/documentation gap.                                                      | State the boundary, separate low-frequency backup/provider checks, and document cap-related restore recovery without increasing per-request bucket traffic.                                                                         |
| F8  | [Existing frontend tests](https://github.com/adrock18/medivault/blob/939ecb9/tests/discovery.test.tsx) exercise components and helpers; no committed real-browser journey exists. The README documents setup and privacy but has no engineering handbook/ERD/decision catalogue.                                                                                                                               | Verification and onboarding gap.                                                              | Commit isolated browser workflows plus a linked architecture, module, SDLC, test and operations handbook.                                                                                                                           |

These are not reasons to replace the application architecture. No findings justify microservices, a new ORM/state library, a cloud-AI dependency, or bulk commentary of self-explanatory code. New implementation discoveries must distinguish reproduced defects, missing tests, and speculative risks.

## Verified strengths to preserve

- Shared Zod request/response validation and strict TypeScript; explicit API failures and retained stale-data/input states.
- Appropriate modular monolith: UI/providers/domain helpers, API/auth/config/database/document-store boundaries, additive migrations, SQLite constraints, and transactional profile/password updates.
- Real account-scoped queries and two-user integration tests; opaque session hashes, private file delivery, and current-password verification.
- Database-enforced unique medication/date/time outcomes, explicit Taken/Skipped/Undo, and recorded-adherence denominator disclosure.
- Local review-gated OCR, lazy PDF/OCR resources, preview race guards and cleanup, source-link context retention, keyboard-aware dialogs.
- Production artifact budget/completeness checks and development startup that protects unrelated listeners and persistent data.
- Linux/Windows verification and a non-root local-storage container smoke test.

## Reviewed-file ledger

All entries below were read in full. Parent directories group filenames for compactness; they do not imply unlisted files were read.

| Directory                  | Authored files reviewed                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src`                      | `App.tsx`, `main.tsx`, `index.css`                                                                                                                                                                                                                                                                                                                                                     |
| `src/pages`                | `AuthPage.tsx`, `DashboardPage.tsx`, `MedicalRecordsPage.tsx`, `MedicationsPage.tsx`, `ProfilePage.tsx`, `SettingsPage.tsx`                                                                                                                                                                                                                                                            |
| `src/contexts`             | `AuthContext.ts`, `AuthProvider.tsx`, `DataContext.ts`, `DataProvider.tsx`                                                                                                                                                                                                                                                                                                             |
| `src/hooks`                | `useMutation.ts`, `useQueryParams.ts`                                                                                                                                                                                                                                                                                                                                                  |
| `src/lib`                  | `api.ts`, `calendar.ts`, `contracts.ts`, `dashboard.ts`, `database.types.ts`, `navigation.ts`, `ocr.ts`, `pdf.ts`, `prescription.ts`, `records.ts`, `sampleData.ts`, `schemas.ts`, `theme.ts`, `utils.ts`                                                                                                                                                                              |
| `src/components`           | `CommandPalette.tsx`, `DashboardVisuals.tsx`, `DoseSchedule.tsx`, `Layout.tsx`, `MedicalRecordCard.tsx`, `MedicationCalendar.tsx`, `MedicationCard.tsx`, `MedicationForm.tsx`, `MedicationReminder.tsx`, `MedicationShowcase.tsx`, `PdfPreview.tsx`, `PrescriptionScanner.tsx`, `RecordPreview.tsx`, `ThemeSelect.tsx`, `UploadDialog.tsx`, `common.tsx`                               |
| `src/components/ui`        | `alert-dialog.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`                                                                                                                                                                                                                                                                     |
| `server`                   | `app.ts`, `auth.ts`, `config.ts`, `database.ts`, `document-store.ts`, `frontend-build.ts`, `index.ts`, `tsconfig.json`                                                                                                                                                                                                                                                                 |
| `server/migrations`        | `001_initial.sql`, `002_prescription_links.sql`                                                                                                                                                                                                                                                                                                                                        |
| `scripts`                  | `check-build.ts`, `dev-runtime.ts`, `dev.ts`, `ocr-assets.ts`                                                                                                                                                                                                                                                                                                                          |
| `tests`                    | `auth.test.tsx`, `backend.test.ts`, `build-artifacts.test.ts`, `command-palette.test.tsx`, `dashboard-helpers.test.ts`, `dashboard.test.tsx`, `discovery.test.tsx`, `document-store.test.ts`, `forms.test.tsx`, `layout.test.tsx`, `pdf-preview.test.tsx`, `prescription.test.ts`, `preview.test.tsx`, `reminders.test.tsx`, `startup.test.ts`, `theme.test.tsx`, `validation.test.ts` |
| Root configuration         | `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json`, `.env.example`, `.dockerignore`, `.gitignore`, `.oxlintrc.json`, `.prettierrc.json`, `.prettierignore`, `.gitattributes`, `components.json`, `index.html`                                                                                      |
| Deployment                 | `Dockerfile`, `docker/entrypoint.sh`, `litestream.yml`, `render.yaml`, `.github/workflows/verify.yml`                                                                                                                                                                                                                                                                                  |
| Documentation/spec context | Entire README, OpenSpec configuration and all eight main specs, all four editorial delta specs, premium workspace-motion/theme delta; other historical artifacts are context rather than a claim of exhaustive archive review.                                                                                                                                                         |

## Current product and intentional boundaries

Already present: authentication, health profile, private record CRUD/discovery/preview, reviewed local prescription scanning, prescription/source linking, medication CRUD, read-only calendar, explicit daily outcomes/undo, recorded adherence, Daybook/dial/activity, command navigation, appearance, password change, JSON export, and opt-in fictional samples.

New in this proposal: logged-day milestones, persisted favourites, printable activity summary, coordinated motion, committed browser checks, and engineering documentation. These are additions, not replacements for already completed calendar/palette/preview work.

Deliberately retained: measurements are stored/exported and have protected compatibility APIs, but `/health-tracker` redirects to Medications. No historical prescription versioning exists. No extra-dose rewards, AI interpretation, new notification channel, appointment/refill domain, or family-access model is introduced.

## Reference interpretation

- [Apple Health](https://www.apple.com/health/): inspiration for clear hierarchy, privacy-conscious presentation, and legible personal summaries, not evidence that MediVault has Apple's sensors, clinical validation, or certifications.
- [Medisafe patient experience](https://medisafe.com/solutions/for-patients): inspiration for clear setup and daily workflow emphasis. Its adaptive reminders, caregiver programs, clinical claims, and AI/behavioral interventions are explicitly not adopted.
- [MDN View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition): feature detection and progressive fallback; native support is not assumed.
- [W3C interaction animation guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) and [reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion): inform static alternatives; citing guidance does not certify conformance.
- [MDN printing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing): print-specific styles and browser print, not a claimed direct PDF download.
- [Playwright server fixtures](https://playwright.dev/docs/test-webserver) and [visual comparisons](https://playwright.dev/docs/test-snapshots): owned test-server lifecycle and environment-pinned visual references. Unlike the permissive reuse example, this project must not reuse unrelated listeners.

The Apple support article attempted during discovery was rate-limited and is not used as evidence. The reported B2 cap incident comes from the user's deployment output; no failed or guessed provider-documentation URL is cited.
