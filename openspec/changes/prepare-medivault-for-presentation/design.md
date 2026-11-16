# Design

## Context

See [proposal.md](proposal.md) for motivation and scope. The current working tree already contains the completed theme and prescription-scanning work; it is the baseline to preserve, not a clean historical checkout to restore.

The application has a same-origin React client, Express API, SQLite migrations, private filesystem documents, shared Zod contracts, local OCR workers, and user-scoped contexts. The Health Tracker route redirects to medications, but its implementation remains. No GitHub Actions workflow or aggregate verification command exists.

### Observed readiness baseline

These are inspection results, not completed fixes:

| Area                   | Evidence                                                                                                                                                                                                                                 | Consequence                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Functional tests       | `npm test`: 67 tests pass across 10 files with the existing build present.                                                                                                                                                               | Useful baseline; passing execution alone does not establish test-source type safety.                                                           |
| Build and dependencies | `npm run build` passes; entry is approximately 356.92 kB before compression. `npm audit --omit=dev` reports zero vulnerabilities.                                                                                                        | Preserve lazy OCR loading and the 500,000-byte entry bound; the bound is not a total-load-speed claim.                                         |
| Formatting             | `npm run format:check` fails only on six generated `.agents/skills/*/SKILL.md` files.                                                                                                                                                    | Define maintained formatting scope instead of reformatting generated instructions.                                                             |
| Lint                   | Six warnings: three mixed component/non-component exports, two data-provider lifecycle findings, and one retired metric-form warning.                                                                                                    | Resolve module-boundary issues and review lifecycle findings semantically, not mechanically.                                                   |
| Test typing            | A strict, temporary project-based check with correct aliases reports two unsupported `exact` options in `discovery.test.tsx` and a medication fixture missing four new fields in `reminders.test.tsx`. The temporary files were removed. | Most tests are not included in the normal build's type-check projects; transpilation conceals these errors.                                    |
| Retired UI             | [HealthTrackerPage](../../../src/pages/HealthTrackerPage.tsx) references three tracker-only components; `HealthMetricForm` still has a UI test, and Recharts is used only by the retired chart.                                          | Remove obsolete presentation code while retaining the legacy storage/API/export boundary.                                                      |
| Misleading copy        | [AuthPage](../../../src/pages/AuthPage.tsx) advertises measurement logging/charts; [index.html](../../../index.html) mentions measurements; Settings confirmation still says sample readings.                                            | The first presentation screen contradicts current product scope.                                                                               |
| Linked navigation      | Record cards count all linked medications, but [MedicationsPage](../../../src/pages/MedicationsPage.tsx) starts with the active filter. Both discovery pages clear every query parameter when an edit closes.                            | Completed/upcoming links can appear empty; editing unexpectedly drops source context. These are code-path findings requiring regression tests. |
| Runtime/build coupling | The startup suite fetches the actual built dashboard, but `npm test` does not generate a build. [Production startup](../../../server/index.ts) opens storage before any frontend-artifact check.                                         | Fresh-checkout testing can depend on a prior build, and API health alone cannot establish that the full production UI is present.              |

### Clean-code assessment

| Principle                                      | Current strength                                                                                                                | Focused action                                                                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single responsibility / separation of concerns | Pages, reusable controls, HTTP access, validation, database access, and OCR parsing have identifiable boundaries.               | Separate context/provider exports where Fast Refresh needs it. Keep the cohesive Express entry point rather than introducing controllers/services/repositories solely for aesthetics.    |
| DRY / single source of truth                   | Forms and API handlers share validation; response contracts and medication-form labels are centralized.                         | Reuse existing contracts, document helpers, and mutation feedback. Share a small build-artifact definition/check where needed rather than copying asset lists into several tools.        |
| KISS / YAGNI                                   | Local OCR and SQLite satisfy the product without external AI infrastructure.                                                    | Delete the retired UI island and unused direct dependencies. Do not introduce a state-management framework, dependency-injection layer, notification system, or speculative abstraction. |
| Type safety                                    | Active application and backend builds use strict TypeScript and runtime response parsing.                                       | Extend checking to all maintained tests, fix fixtures and query types, and make the tooling project's strictness explicit. Do not cast away failures.                                    |
| Explicit failure / lifecycle correctness       | API errors are structured, forms retain failed inputs, stale data is labeled, and request generations protect refresh ordering. | Preserve those guarantees while resolving warnings; add missing-build diagnostics before startup side effects.                                                                           |
| Intent-revealing organization                  | Most names reflect medications and records.                                                                                     | Remove tracker-specific imports/helpers and obsolete marketing copy. Consolidate the trailing `useState` import in the medication form without unrelated style churn.                    |
| Reproducibility / testability                  | Real backend, migration, ownership, file, and startup tests already exist.                                                      | Add a shared verification gate, clean-build preparation, production artifact checks, and a concise documented browser rehearsal.                                                         |

## Goals / Non-Goals

**Goals**

- Make a freshly installed checkout verifiable without relying on private local state.
- Make source-linked navigation and product messaging match presenter expectations.
- Keep cleanup deletions distinguishable from intentionally supported compatibility code.
- Use measurable pass/fail criteria, not a claim that software is "perfect."

**Non-Goals**

- No schema migration, data purge, medication behavior change, legacy metric endpoint removal, or authentication redesign.
- No general rewrite of the Express app, generated shadcn primitives, or working theme palette.
- No new browser-testing dependency unless a later explicit requirement warrants one; use existing Vitest/Supertest tests and available browser tooling for this change.
- No public-host selection, deployment execution, secret creation, medical/compliance certification, dependency-major upgrade, or Git publication.

## Decisions

### 1. Delete the retired presentation island, not retained data support

Remove `HealthTrackerPage`, `HealthChart`, `HealthMetricCard`, and `HealthMetricForm`; remove only their obsolete UI test and now-unreferenced presentation helpers/client metric mutations. Keep metric row/types, vault measurements, validation metadata used by the server, migrations, metric endpoint ownership tests, JSON export, and `/health-tracker` redirection.

Remove Recharts after its final consumer is gone. Direct `clsx` and `tailwind-merge` dependencies also have no source consumers; the current `cn` package is a compiled replacement, so remove these redundant direct declarations using npm. Keep `cn`, which active controls import, and `concurrently`, which the launcher imports. Recheck consumers before removal if the working tree has changed.

**Alternative rejected:** deleting every metric reference would break the explicit retained-data compatibility requirement. Keeping all dead UI "for later" leaves unnecessary maintenance and lint surface.

### 2. Treat source scope as navigation context, not a modal action

Keep the existing `record` query parameter and separate it from transient `action`/`source` parameters. Entering a record's linked-medication view explicitly selects all statuses, including when navigation reuses a mounted medication page. User-selected filters continue to combine normally; no effect should force the status back to all on every render.

Opening/closing add, scan, or edit dialogs must not replace unrelated discovery parameters. Saving/cancelling edits retains source scope and existing search/status/category/sort controls. Explicit reset/show-all actions remain the way to leave scope. The ordinary unscoped medication default stays active. No new URL state-management library is needed.

**Alternative rejected:** changing every medication page to default to all statuses would alter the daily routine unnecessarily. Blindly clearing all query parameters caused the context loss.

### 3. Resolve lint by preserving semantics

Keep provider components and context/hook exports in Fast-Refresh-compatible modules, updating dependent imports/tests consistently. Stop exporting unused `buttonVariants` if it remains internal rather than adding a module just to hold it.

For data refresh, retain latest-request-wins behavior, user-keyed provider isolation, unmount invalidation, focus refresh, minute refresh, and stale-data feedback. In particular, do not capture an old generation number merely to silence the cleanup-ref warning: cleanup must invalidate the current pending generation. Keep the intentional initial external fetch and cleanup invalidation, using narrowly explained lint exceptions for these two findings rather than restructuring correct lifecycle logic. Run existing authentication race tests and browser refresh/account-change checks; add a focused regression only if a real lifecycle defect is found and fixed.

Once addressed, use lint's existing `--deny-warnings` option so future warnings are visible failures.

**Alternative rejected:** switching state libraries or weakening hook rules would obscure the root issue and expand the change.

### 4. Make the existing toolchain a complete verification gate

Add a test TypeScript project with the correct aliases, Node/DOM/Vite types, and strict checking for all maintained test files; include it in root project references. Make the Node tooling configuration strict. Fix the two unsupported testing-library options and complete the reminder fixture rather than weakening test types.

Declare the documented Node minimum of 22.18 in package metadata and continue recommending Node 24 LTS. CI uses Node 24 on Windows and Linux; do not claim a new runtime certification matrix.

Use the existing npm tools:

- `typecheck`: run the complete TypeScript project graph.
- `pretest`: build the application, because the full startup suite exercises actual production output.
- `check:build`: use a small Node TypeScript script to check emitted artifacts and the entry-byte bound.
- `verify`: run maintained formatting, warning-failing lint, the full `npm test` lifecycle (including type-checked build), then artifact checks, stopping at the first failure.

Keep targeted integration/test commands lightweight; the documented direct startup-suite invocation must state its build prerequisite. Add `.agents/skills` to the formatter's generated-content exclusions, without excluding maintained source, tests, current docs, or change artifacts.

Add push/PR GitHub Actions jobs that run `npm ci` and `npm run verify` on both platforms. Keep production dependency auditing explicit as a separate registry-dependent check; do not automatically force dependency upgrades. CI requires no deployment credentials or real accounts.

**Alternative rejected:** a second linter, dead-code platform, bespoke task runner, or Playwright installation is unnecessary for the identified gaps.

### 5. Verify the built application, not just HTTP health

Promote the README's entry-size check into a maintained command. Read the actual Vite manifest, validate it, inspect every referenced application output, and check the required locally emitted OCR engine/language/PDF/decoder files. Missing entries, invalid metadata, zero-length resources, missing chunks, and oversized entry files fail explicitly. Keep entry sizing separate from total lazy asset size.

Before `startApi` calls `createApp` in production, validate that required frontend artifacts exist and are usable. Share small dependency-free build metadata/checks where appropriate; production must not import Vite/Vitest runtime packages. Missing builds fail before database creation or binding. Standalone development API startup remains possible without `dist`, and secure production cookies remain mandatory.

Extend the existing startup/artifact tests rather than introducing another server framework. Test missing and incomplete builds using isolated working/data directories, never by renaming or deleting the presenter's build. Assert actual resource content types, not merely status 200 from SPA fallback. Preserve production CSP and same-origin assets.

**Alternative rejected:** a successful `/api/health` or HTML shell alone cannot verify scanning resources. Serving a CDN fallback would violate the local-processing boundary.

### 6. Keep presentation preparation honest and reproducible

Update public copy, metadata, sample confirmation, and README to describe the actual modules. Add a short README presentation sequence: separate fictional account, opt-in samples, existing sample PDF scan, review/edit/confirm a cream or tablet, explicitly enter dates/times, save/reload, navigate source links, log/undo a dose, view/download, switch appearance, and sign out. No sample account credentials belong in source.

During implementation, rehearse the real browser flow on isolated fictional data, including clear printed image OCR and the PDF paths under production CSP. Also check cancellation/error states, keyboard dialogs, and responsive light/dark layouts. Record what was actually checked in the completion report; do not label a server-only smoke check as browser end-to-end coverage.

Keep deployment instructions explicit about HTTPS, persistent disk, source/migration files, backups, and the incompatibility of the SQLite backend with ephemeral Vercel Functions. A passing local gate is not proof of public deployment or healthcare compliance.

## Risks / Trade-offs

- **Deleting shared metric code by mistake** -> preserve backend/export contracts and run the existing migration, legacy endpoint, ownership, persistence, and export checks.
- **Context refactoring introduces request races** -> keep generation logic unchanged, run the existing authentication race tests, and verify focus refresh, stale errors, and account isolation in the browser.
- **CI reveals platform-specific startup issues** -> run real owned-process tests on Windows and Linux; fix observed portability faults rather than weakening assertions or killing unrelated listeners.
- **Full tests now generate a build** -> accept this explicit cost for production-output tests; retain lightweight targeted commands.
- **Artifact validation drifts from emitted OCR files** -> reuse a small canonical asset description without adding development-only runtime dependencies to production.
- **Windows dependency files are locked by an active dev server** -> coordinate stopping only the owning development invocation before dependency changes if necessary; never kill processes by name.
- **OCR remains variable across source quality/devices** -> retain human review, conservative extraction, explicit errors, and the printed-English limitation.
- **Existing uncommitted changes overlap cleanup** -> integrate the current implementation; do not reset or discard earlier work.

## Migration Plan

1. Apply focused cleanup, navigation fixes, test typing, and quality-tool configuration without changing the database schema.
2. Update the lockfile with npm for the identified dependency removals. Do not reset the existing data directory.
3. Generate a new build, run verification, and rehearse using temporary storage or a separate fictional account.
4. Validate the OpenSpec change and update README instructions alongside the implementation.
5. If later deployed, ship source, migrations, dependencies, and the newly verified build together to the existing persistent-host architecture. Deployment itself requires a separate request.

Rollback is a code/package-lock/build rollback only. Existing measurements, document metadata/files, sessions, and medication history require no downgrade or destructive reset.
