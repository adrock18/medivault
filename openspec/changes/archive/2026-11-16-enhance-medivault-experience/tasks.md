# Tasks

The capability specs contain preserved behavior as well as proposed additions. Reuse working implementations and existing tests; do not rebuild compliant features. Groups follow implementation dependencies, not a schedule.

## 1. Shared visual system and workspace

- [x] 1.1 Refine existing theme variables and shared card, heading, button, input, and status treatments; verify consistent styling on current pages and measured normal/large-text contrast of at least 4.5:1/3:1.
- [x] 1.2 Refine the existing sidebar, header, mobile navigation, and content boundaries; verify every route remains reachable and there is no page-level horizontal overflow at the five specified viewport widths.
- [x] 1.3 Apply 44-by-44 CSS-pixel minimum touch targets, meaningful control names, visible focus, and consistent pending/cancellation behavior to shared controls/dialogs; verify keyboard entry, cancellation, focus restoration, and prevention of duplicate submissions.
- [x] 1.4 Extend existing form tests only for introduced feedback/dialog behavior, including retained input after failed submission; verify the focused test selections pass.
- [x] 1.5 Document the shared visual/accessibility conventions in the README; verify they match the implemented controls and do not imply a supported theme switcher.

## 2. Action-oriented dashboard

- [x] 2.1 Replace the promotional banner with a compact daily hierarchy and place upload/add-medication/record-measurement actions before history; verify all three actions open their intended forms and cancellation does not create entries.
- [x] 2.2 Add non-blocking, data-derived guidance for missing profile, record, and measurement setup, with optional existing-prescription guidance; verify empty, partially populated, and populated accounts do not receive fictional statistics or mandatory medication prompts.
- [x] 2.3 Refine daily progress and latest/recent presentations without changing scheduling or upload-recency semantics; verify taken/skipped/unlogged totals against persisted data and after a dose mutation/reload.
- [x] 2.4 Extend the existing dashboard tests for first-use guidance and quick-action destinations; verify these cases and existing database-derived total tests pass together.
- [x] 2.5 Update the README dashboard description to explain daily priority and optional setup guidance; verify documented actions match the rendered workflows.

## 3. Medication experience

- [x] 3.1 Add trimmed, case-insensitive medication-name search composed with existing status filters and a clear-filters action; verify matching, no-match, reset-to-active, and empty-account behavior without mutating the data snapshot.
- [x] 3.2 Refine medication cards, schedule rows, prescription forms, and dose-history presentation; verify long names, narrow layouts, readable prescribed values, text-labeled outcomes, and usable taken/skipped/undo actions.
- [x] 3.3 Add focused discovery/reset cases to the existing frontend test structure and run the existing reminder/form tests; verify local-time boundaries, duplicate-time validation, and unlogged-dose semantics remain unchanged.
- [x] 3.4 Document medication search, outcome labels, and retained history semantics in the README; verify no wording recommends changing dosage or taking late/extra doses.

## 4. Medical-record vault experience

- [x] 4.1 Add newest/oldest record-date sorting after normalized search/category filtering, with deterministic creation-time/UUID tie-breakers and reset-to-newest behavior; verify combined controls, equal dates, and that the shared source array is unchanged.
- [x] 4.2 Refine document cards, upload/edit forms, and action labels, and display appropriate non-zero file-size units; verify small files, long titles/providers, missing providers, supported file types, and accessible action identification.
- [x] 4.3 Add focused tests for combined discovery, ordering/ties/reset, and small-file formatting; verify those cases and existing upload-validation tests pass without adding a replacement upload backend.
- [x] 4.4 Document record-date sorting and private document access in the README; verify this is distinguished from the dashboard's upload-recency order and that existing file-size/privacy limits remain accurate.

## 5. Supporting account and health pages

- [x] 5.1 Bring login/registration, profile, tracker, and settings into the shared visual language without changing their API payloads; verify account redirects, profile/name persistence, units/date filters, charts, and settings actions through their existing pathways.
- [x] 5.2 Improve contained measurement/dose table scrolling or compact presentation where needed; verify exact values and labeled actions remain readable at 320 and 375 CSS pixels.
- [x] 5.3 Run the existing authentication and form tests and add only focused cases for introduced presentation behavior; verify invalid input and server errors remain explicit and preserve user input.
- [x] 5.4 Keep README account, measurement, export, and sample-data instructions aligned with the implemented experience; verify they retain sensitive-download warnings and explicit fictional-data opt-in.

## 6. Build and runtime readiness

- [x] 6.1 Apply targeted supported Vite chunking or import-boundary changes; verify the production entry JavaScript is at most 500,000 minified bytes, the warning threshold is unchanged, and login does not eagerly request chart modules.
- [x] 6.2 Document a reproducible emitted-entry-size check in the README; verify the documented check reads the actual build output and fails when the specified bound is exceeded.
- [x] 6.3 Verify the combined development command and direct/proxied health/session calls, plus a bounded production SPA/API smoke check using isolated storage; verify expected 200 responses, anonymous protected-data rejection, and clean helper shutdown.
- [x] 6.4 Update runtime/deployment instructions only where needed and verify commands work as written; retain Windows file-lock guidance, HTTPS/secure-cookie requirements, persistent-storage requirements, and the Vercel Functions limitation.

## 7. Cross-module integration acceptance

- [x] 7.1 Run the complete existing test suite, lint, formatting check, and production build after the cross-cutting changes; verify tests/type-check/build pass and report remaining warnings rather than hiding them.
- [x] 7.2 Exercise disposable-account registration/login/logout, profile save, document upload/view/download/edit/delete, medication add/edit/delete, taken/skipped/undo, and measurement CRUD in the browser; verify reload persistence and accurate dashboard updates without altering real accounts.
- [x] 7.3 Confirm existing real backend tests still prove two-account isolation, exact upload-size limits, concurrent dose uniqueness, historical-log retention, password-session revocation, and persistence after reopen; verify failures are investigated with focused evidence before changing backend behavior.
- [x] 7.4 Check current pages at 320, 375, 768, 1280, and 1440 CSS pixels and perform keyboard/focus/contrast/touch-target checks; verify no page-level overflow, reachable settings/profile, readable long-content cases, and explicit empty/error/stale states.
- [x] 7.5 Reconcile each capability scenario with automated or browser evidence, remove only exact disposable test data/files/accounts, and stop temporary helpers; verify persistent application data remains intact and report any unmet acceptance criteria.

## Verification evidence

- **Workspace:** 30 populated protected-route/viewport combinations and 10 login/register combinations passed page-overflow and 44-pixel target checks. Keyboard dialog containment, confirmation focus restoration, pending locks, mobile profile/settings navigation, and keyboard table scrolling passed. Normal/large-text contrast checks passed on pages, charts, and forms; public pages measured at least 5.42:1 and populated protected text at least 5.14:1.
- **Dashboard:** automated empty/partial/complete guidance and database-derived counts passed. Browser cancellation created no entries; taken/skipped/undo survived reload and produced the expected 1 taken, 1 skipped, 0 pending out of 2 scheduled doses. Recent uploads retained upload-recency order independently of vault record-date ordering.
- **Medications and vault:** combined discovery, reset, deterministic sorting, source-array preservation, and small-file formatting passed focused tests. Browser prescription/document CRUD, private viewer content, dispatched file downloads, metadata/date edits, canceled deletion, cascading medication-log deletion, and a 45-byte report passed against the real API.
- **Account and measurements:** registration/session reload, profile/name persistence, measurement CRUD/type/date filtering/charts, incorrect-current-password rejection, password update/login, owned credential-free export, and explicitly labeled sample-data opt-in passed. Injected save/refresh failures preserved inputs or labeled stale data; real retries recovered.
- **Build and backend:** all 41 tests across 7 suites passed, including 11 real backend cases covering isolation, exact upload-size boundaries, concurrent dose uniqueness, retained historical coordinates, session revocation, and database reopen. Type-check/build passed; the final entry is 354,655 bytes. The documented size check rejected oversized and missing entries. Production login requested no chart modules; isolated SPA/API smoke checks passed.
- **Cleanup and remaining warnings:** the exact disposable account, healthcare rows, private files, downloaded PDF/export, and isolated production storage were removed. Other-account row counts and the existing user session were preserved; only the normal combined development server remains running. Lint reports six non-blocking warnings. Repository-wide formatting still reports six unchanged generated OpenSpec skill files; application/test/configuration/documentation formatting passes.
