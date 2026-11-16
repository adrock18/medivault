# Tasks

## 1. Retire obsolete presentation code and misleading claims

- [x] 1.1 Remove the unreachable tracker page, its chart/card/form components, obsolete metric-form UI test, and helpers/client mutations with no remaining active consumers; verify reference searches, focused form/backend tests, the tracker-bookmark redirect, and retained metric export/API behavior.
- [x] 1.2 Remove the now-unused direct Recharts, clsx, and tailwind-merge dependencies using npm, preserving cn and concurrently; verify the lockfile is consistent and the application builds after removal.
- [x] 1.3 Replace measurement-chart claims in authentication and browser metadata, correct sample-confirmation wording, and update the README's current-scope explanation; verify signed-out screens and the sample prompt advertise only supported workflows in light and dark modes.

## 2. Repair linked-record discovery context

- [x] 2.1 Make a record's linked-medication action initially include active, upcoming, and completed linked medications, including navigation into an already-mounted page; add focused discovery regressions covering all three statuses, unrelated-record exclusion, and ordinary unscoped active defaults.
- [x] 2.2 Preserve source scope and existing discovery controls when medication/record edit dialogs save or cancel, changing only transient action parameters; add focused tests for both pages and verify explicit clear/show-all actions still leave scope correctly.
- [x] 2.3 Update README navigation guidance and verify the actual record-to-medication-to-record browser path, including a completed medication and edit cancellation, without modifying personal healthcare entries.

## 3. Clarify React module boundaries without changing lifecycle semantics

- [x] 3.1 Separate provider components from context/hook exports and remove the unused buttonVariants export; update dependent imports/mocks and the medication form's trailing React import, then verify the existing auth/form/theme tests and a Fast Refresh/browser navigation check.
- [x] 3.2 Preserve the data provider's request-generation and initial-fetch behavior, explaining the two intentional lifecycle lint exceptions locally; verify existing authentication race tests, focus refresh, stale-data retry, and cross-account isolation without globally disabling hook rules.

## 4. Complete strict type and formatting coverage

- [x] 4.1 Add a strict test TypeScript project with the correct aliases/environment types, reference it from the root, and make tooling strictness explicit; move startup-test checking out of the server-only project if needed to avoid duplicate ownership, and verify all maintained test files are included.
- [x] 4.2 Fix the two unsupported testing-library exact options and complete the reminder medication fixture; verify the full type-check graph and focused discovery/reminder tests pass without unsafe casts, test exclusions, or reduced strictness.
- [x] 4.3 Exclude generated skill content from Prettier, make lint fail on unexplained warnings, declare the documented Node minimum, and add the typecheck/pretest scripts; update README command/runtime guidance and verify formatting, lint, typecheck, and the full npm test lifecycle succeed.

## 5. Validate complete production builds and fail startup safely

- [x] 5.1 Implement the dependency-free artifact validator and check:build command using actual manifest references and a shared local-scanning asset definition; add focused temporary-fixture tests for invalid/missing manifests, missing/empty resources, and the exact 500,000-byte accepted versus 500,001-byte rejected entry boundary.
- [x] 5.2 Run production frontend validation before createApp opens storage or binds; extend startup tests using isolated working/data directories to verify missing/incomplete builds fail explicitly without creating storage, while valid production deep links and standalone development API behavior remain intact.
- [x] 5.3 Extend the production smoke checks to verify referenced application/OCR/PDF resources have the expected content rather than SPA fallback HTML, and preserve CSP/local-only processing; verify the checks against a newly generated build.
- [x] 5.4 Add the fail-fast verify script, keep targeted test commands lightweight, and replace the README's manual-only artifact check with documented commands and missing-build recovery guidance; verify the aggregate command runs in the intended order and propagates a failed-stage exit code.

## 6. Add repeatable CI and a usable presentation walkthrough

- [x] 6.1 Add push/pull-request GitHub Actions verification on Windows and Linux with Node 24, locked installation, the shared verify command, and an explicit production-dependency audit; verify workflow structure, secret-free execution, and platform-specific commands, documenting that hosted job execution awaits publication.
- [x] 6.2 Add a concise README presentation walkthrough using a separate fictional account, sample prescription, reviewed form/strength/dosage, explicit dates/times, persistence/source navigation, document access, dose log/undo, appearance, and sign-out; execute the walkthrough and verify it needs neither personal data nor external AI credentials.
- [x] 6.3 Retain accurate deployment prerequisites and limitations in the README, including persistent storage, HTTPS cookies, backend source/migrations, backups, deferred notifications, and the distinction between local readiness and a publicly live service; verify the documented commands/configuration match the implementation.

## 7. Perform final cross-cutting acceptance checks

- [x] 7.1 Run npm run verify and the production dependency audit on the final tree, plus an isolated fresh-checkout-equivalent install/build/test without touching existing data or dist; verify no hidden dependency on prior builds, accounts, occupied default ports, or private environment files.
- [x] 7.2 Rehearse image OCR, native/scanned/mixed PDF paths, review-required saves, cancellation/error recovery, persistence, and owned source deletion under production CSP using fictional temporary data; verify the actual browser flow rather than treating server health as end-to-end coverage.
- [x] 7.3 Verify current pages/dialogs in light and dark at 320, 375, 768, 1280, and 1440 CSS pixels, keyboard focus/cancellation, legacy tracker redirect, and measurement export preservation; report observed results and unresolved limitations without claiming clinical accuracy or public deployment.
- [x] 7.4 Validate this OpenSpec change strictly, check diff whitespace and intended scope, and confirm all test-owned processes/temporary directories are cleaned up; report the readiness outcome without committing, pushing, deploying, resetting user data, or altering unrelated work.
