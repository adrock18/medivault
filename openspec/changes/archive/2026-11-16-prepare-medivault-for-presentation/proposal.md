# Proposal

## Why

MediVault's medication-and-records workflows work, but retired UI, misleading product copy, incomplete verification coverage, and navigation edge cases weaken its presentation readiness. A focused cleanup and repeatable readiness gate will make the repository easier to explain, maintain, and demonstrate without claiming clinical certification or public deployment.

## What Changes

- Remove the unreachable Health Tracker page, its chart/form/card components, UI-only helpers, obsolete UI tests, and dependencies with no remaining consumers. Preserve stored measurements, validated legacy APIs, export contracts, migrations, and the retired-route redirect.
- Align authentication messaging, browser metadata, sample-data copy, and documentation with medications, private records, and review-before-save prescription scanning.
- Fix linked-record discovery so upcoming/completed medications are not silently hidden, and preserve source filters when related edit dialogs close.
- Address React module-boundary and lifecycle lint findings without weakening race protection, adding generic architectural layers, or globally suppressing warnings.
- Add strict test-source type checking, correct stale fixtures/query options, declare the supported Node runtime, and make full verification work from a clean checkout.
- Introduce one fail-fast verification command and GitHub Actions checks, including the existing entry-byte limit and emitted local OCR assets. Exclude generated skill content from application formatting rather than rewriting it.
- Reject incomplete production frontend builds before opening application storage or listening. Add focused regression checks and a documented fictional-account presentation walkthrough.

## Capabilities

### New Capabilities

- `repository-verification`: Reproducible local and CI checks for source quality, test types, functional tests, production artifacts, and an isolated presentation rehearsal.

### Modified Capabilities

- `workspace-experience`: Current product claims accurately describe supported features across public and signed-in surfaces.
- `medication-management`: Source-scoped discovery includes all linked medication statuses initially and retains context after editing.
- `medical-record-vault`: Editing a source-linked record retains the selected-record context.
- `account-health-management`: Production startup reports missing build artifacts explicitly before creating storage or accepting requests.

## Impact

Affects retired frontend files, selected active UI/context modules, package manifests, TypeScript/lint/format configuration, production startup/build checks, tests, a repository workflow, and README presentation/deployment guidance. The design records a clean-code assessment and concrete audit evidence.

No database migration, API removal, user-data deletion, authentication-model change, cloud OCR, email delivery, new product module, broad backend rewrite, or dependency-major upgrade is planned. The existing React/Express/SQLite architecture and local-only OCR remain. No commit, push, deployment, compliance certification, or access to personal medical data is authorized by this proposal.
