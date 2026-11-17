# Tasks

Each checkbox tracks implementation and its verification. Read [design.md](design.md), the six delta specs, and [review.md](review.md) before applying. Preserve the completed visual changes; do not archive or sync them automatically.

The owner retired the two unfinished verification tasks under the publication successor. The 29 retained tasks are complete; original task IDs remain stable. See the review for the historical assurance limits, not additional release work.

## 1. Engineering baseline and handbook foundations

- [x] 1.1 Run the existing `npm run verify`, record the actual baseline and any failures in the review ledger, and map F1-F8 to fixes, verification work, or explicitly deferred scaling risks; verify no pre-existing failure is reported as a new successful check.
- [x] 1.2 Create the linked handbook index, actual stack/module responsibility map, context/container/deployment diagrams, and SQLite ERD including sessions and source links; verify README links resolve and each boundary matches the reviewed modules rather than the original Supabase concept.
- [x] 1.3 Document current auth/session, upload/compensation/authorized-file, OCR/review/save, and dose/undo flows with sequence diagrams, request/response/error contracts, and local-date invariants; verify diagrams and examples against source and existing integration assertions.
- [x] 1.4 Document Windows/POSIX setup, safe startup/shutdown, fictional demo, iterative/incremental SDLC, OpenSpec/review/release flow, decision template, and initial real/mocked/manual test matrix; verify commands use the actual package scripts and no secrets, invented certifications, or real healthcare examples are included.

## 2. Owned production browser verification

- [x] 2.1 Add locked development-only Playwright and ephemeral TLS-certificate tooling, strict type-check coverage, and browser prerequisites; verify installation, test discovery, lint/type checks, and explicit missing-browser diagnostics without adding a production dependency.
- [x] 2.2 Implement isolated production-server and loopback HTTPS proxy fixtures with in-memory test keys, fictional accounts, available owned ports, health readiness, and teardown; verify Secure-cookie authentication in the primary browser, occupied-address isolation, failure cleanup, and unchanged unrelated listeners/storage.
- [x] 2.3 Add primary-engine browser journeys for existing registration/session/login/logout/password/profile, record upload/edit/discovery/preview/download/delete, medication CRUD/source links/calendar, Taken/Skipped/Undo, command navigation, sample opt-in, and JSON export; verify reload persistence, cancelled actions, byte-identical download, and two-account isolation using the real API.
- [x] 2.4 Add genuine local OCR image and text-PDF scanning/review/cancel journeys plus focused browser failures for invalid upload, failed save with retained input, stale refresh, expired session, and late preview response; verify no outside processing request, no unreviewed save, no private-content revival, and truthful errors.
- [x] 2.6 Add `test:e2e`, build-once `verify:full`, and required Linux browser CI alongside existing Windows/Linux/container verification; document fixture isolation, browser setup, evidence retention, visual-update policy, and manual print boundaries; verify a complete run consumes one immutable build and returns nonzero on an injected browser failure.

## 3. Truthful consistency and logging milestones

- [x] 3.1 Replace historical fully-logged streak inference with shared distinct scheduled-date and current-run derivation; add focused domain regressions for edited/out-of-date schedules, multiple logs per date, taken/skipped parity, today/yesterday anchoring, gaps, future dates, undo/deletion, and DST/year boundaries; verify no current-schedule completeness claim is required.
- [x] 3.2 Add secondary 3/7/30 logged-day milestones and confirmed, neutral check-in feedback while preserving Daybook priority and recorded-adherence semantics; verify component/browser checks for threshold crossing, failed/pending save, undo, reload, passive refresh, and sign-in without replaying celebrations.
- [x] 3.3 Update feature/help text and the historical-projection/milestone decision record; verify the handbook and UI both distinguish recorded days, current-run end date, current schedule, and taken/logged adherence, with no advice to take late or extra doses.

## 4. Owner-persistent document favourites

- [x] 4.1 Add the forward constrained default-false favourite migration and canonical boolean record response/type mapping; update all directly affected fixtures/contracts/export expectations and verify populated v1/v2 upgrades, clean startup, reopen, unchanged IDs/source links/file bytes, and strict response validation.
- [x] 4.2 Add validated owner-scoped desired-state `PUT /api/records/:id/favourite` and typed client support using existing mutation protections; verify repeated/concurrent same-state requests, rejected non-boolean payloads, anonymous/other-owner denial, metadata-edit preservation, record deletion, and persistence across restart.
- [x] 4.3 Add accessible pending/error-aware favourite controls and a composable favourites-only filter; verify component/browser cases combine source scope, search, category, sort, result counts, clear/reset, reload, failed mutation, preview return, and focus after a row disappears.
- [x] 4.4 Update migration/API tables, feature walkthrough, and favourite-idempotence/ownership decision notes; verify documentation matches the desired-state endpoint and that application rollback guidance accounts for the newer SQLite `user_version`.

## 5. Private printable activity summary

- [x] 5.1 Add the lazy Settings summary entry and validated local-date selection with 7/30-day presets and custom bounds; implement fresh, frozen, guarded in-memory snapshot generation and add component tests for invalid/reversed/future dates, failed load/retry, date-change invalidation, close, account change, and late responses.
- [x] 5.2 Render original recorded outcome coordinates/totals, explicitly current medication details, range-filtered record metadata, empty sections, snapshot/range labels, and opt-in profile details; verify edited schedules, zero logs, taken/logged denominator, excluded OCR/document bytes/legacy metrics, and unchanged broader JSON export.
- [x] 5.3 Add print-only light-paper layout and explicit browser Print / Save as PDF action with sensitive-copy warning; verify primary-engine print-media/PDF output for long multipage content, hidden workspace chrome, no clipping, unavailable print while loading/expired, one explicit invocation, and no fabricated download/save success.
- [x] 5.4 Add the browser generation/reload-session-expiry/print journey and document provenance, browser-save/manual-cancel rehearsal, profile selection, and sensitive local copies; verify the summary creates no persisted report, remote share, or healthcare mutation.

## 6. Coordinated glossy motion without regressions

- [x] 6.1 Consolidate a single brief route arrival and bounded overlay/selection/confirmed-action feedback; add restrained fine-pointer-only glass/perspective details and make ambient depth static; verify rapid navigation, ordinary touch/keyboard use, unchanged hit areas/focus, no page overflow, and effects within 250 ms.
- [x] 6.2 Add immediate atomic theme colors with optional nonblocking background-only CSS gloss, at-most-500-ms duration, static fallback, latest-selection wins, and route/authentication cancellation; verify missing CSS support, rapid toggles, blocked preference storage, system/cross-tab updates, live controls/focus, and no page or private-content capture.
- [x] 6.3 Extend component/browser checks for runtime reduced-motion changes, static ambient depth, authentication pause/resume, theme contrast before/during/after gloss, and preview focus/scroll restoration; verify state feedback remains readable with all nonessential motion disabled and no new console errors.
- [x] 6.4 Document the motion vocabulary, background-only CSS approach, static alternatives, and explicit exception to older blanket theme-duration limits; verify lazy PDF/OCR boundaries and the unchanged 500,000-byte minified entry budget with the existing build checker.

## 7. Storage/recovery fault evidence and operations handbook

- [x] 7.1 Add focused injected document-store/API tests for failed download, failed object deletion, upload compensation/cleanup failure, and database failure after object deletion; verify explicit non-success, truthful metadata/file state, unaffected other-account fixtures, and sanitized operation diagnostics, fixing only defects exposed by these paths.
- [x] 7.2 Add a credential-free Linux/container harness for the actual entrypoint with deterministic restore success, access-denied/cap/unknown failure, and absent-replication cases; verify failing restore prevents application launch/database creation, success reaches startup once, and fixture data remains intact without real bucket access.
- [x] 7.3 Complete the operations/decision handbook with restore/replicate diagrams, caps versus authentication/network triage, health-versus-backup limits, single-writer/RPO caveats, coordinated backup and isolated restore rehearsal, forward-compatible rollback, and controlled file reconciliation; verify no guidance bypasses restore, deletes data, increases billing automatically, or claims mocked recovery proves remote durability.
- [x] 7.4 Link F3-F7 to fault evidence and documented residual limits; verify no pagination/streaming rewrite, remote health polling, secret logging, or live provider mutation was introduced under a documentation/test task.

## 8. Integrated acceptance and handoff

- [x] 8.2 Review handbook links/diagrams and F1-F8 disposition against delivered behavior, run formatting and strict OpenSpec validation, and verify only intended changes and fictional fixtures remain with all owned test processes/storage cleaned up; report remaining platform/cloud limitations without claiming exhaustive bug freedom.

## Workflow follow-up

- Review the finished implementation before requesting publication or deployment; neither is implied by proposing or applying this change.
- A real Render/B2 durability rehearsal requires a separately authorized operator action and isolated fictional data.
- Before eventual archive/sync, reconcile the two completed visual changes in order and preserve this successor's explicit streak and motion decisions. Do not silently archive older changes.
