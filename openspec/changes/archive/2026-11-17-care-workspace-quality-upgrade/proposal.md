# Proposal

## Why

MediVault now has a working, polished medication-and-records experience, but its engineering rationale is concentrated in a long README and browser acceptance checks are not a repeatable, committed test suite. A source-grounded quality pass should close verified defects, explain the system clearly, and add practical engagement features without compromising medication safety, privacy, or the existing Daybook design.

## What Changes

- Record review coverage and evidence-backed findings across authored application, server, test, build, and deployment code. Fix confirmed defects with regression tests; use targeted extractions only where they remove demonstrated duplication or lifecycle risk, not a blanket architectural rewrite.
- Deliver a linked engineering handbook: system/context and deployment diagrams, ERD, important request/sequence flows, module responsibilities, API/data contracts, design decisions, setup, SDLC/change workflow, verification matrix, and incident/recovery runbooks.
- Introduce coordinated route, appearance, overlay, and persisted-action motion with glass highlights and small CSS perspective details. Appearance colors change immediately and atomically, followed by optional nonblocking CSS background gloss; never capture page snapshots. Preserve reduced-motion alternatives, readability, focus, cancellation, and a dependency-light entry bundle. This is polish of the existing design, not another visual replacement.
- Add the three user-approved features: honest logging-day milestones, persisted private document favourites, and an explicitly requested printable activity summary with browser Print / Save as PDF.
- Commit isolated browser E2E and visual/accessibility checks alongside existing Vitest/API/startup coverage. Exercise failures, races, restart persistence, local scanning, ownership boundaries, and deployment recovery using fictional fixtures; document what is automated versus manually verified.
- Preserve the retired Health Tracker boundary, current prescriptions and dose semantics, local-only OCR, authenticated document access, and fail-closed database restoration.

## Capabilities

### New Capabilities

- `activity-summary`: Owner-only, date-bounded activity preview and print presentation with explicit disclosure, data provenance, and sensitive-copy warnings.

### Modified Capabilities

- `dashboard-overview`: Replace unsupported historical fully-logged streak claims with actual logged-day consistency and bounded milestones; retain Daybook priority and existing numerical meanings.
- `medical-record-vault`: Persist owner-scoped favourites, combine the filter with existing discovery, and retain private preview and source-link context.
- `workspace-experience`: Coordinate route motion, immediate readable appearance changes with background-only CSS gloss, and confirmed-action feedback, retaining live controls, accessible static alternatives, and existing appearance behavior.
- `repository-verification`: Require repeatable browser verification, review traceability, maintainable engineering documentation, and honest test evidence.
- `live-demo-deployment`: Document and deterministically test restoration-failure behavior, including the recently observed storage transaction-cap failure, without requiring cloud credentials.

## Impact

- Frontend: existing providers, theme/CSS, layout/navigation, dashboard/domain helpers, record discovery/cards, settings and a lazy activity-summary view.
- Backend/data: a small forward SQLite migration and validated owner-scoped favourite mutation/response contract; existing rows, metadata updates, exports, sessions, and document bytes remain compatible. No replacement of Express/SQLite or deployment architecture.
- Verification: Playwright and ephemeral test-TLS certificate generation as justified development-only dependencies, isolated production-server fixtures, targeted fault injection, CI browser jobs, and documented visual baselines. No production animation, 3D, PDF-generation, analytics, or AI dependency is planned.
- Documentation: keep the README as an approachable entry point and link focused handbook pages. Public product/platform references inform interaction patterns, not copied assets, clinical claims, or borrowed compliance certifications.
- Planning depends on the completed but unarchived `premium-visual-refresh` and `editorial-health-workspace` behavior. This change does not archive or sync them; its deltas explicitly address relevant overlaps.
- Out of scope: appointments, refills/inventory, family sharing, cloud AI, treatment recommendations, new notification channels, restored measurement UI, billing changes, enterprise frameworks, and promises of exhaustive bug freedom.

## Release Scope Reconciliation

The owner subsequently selected `production-release-readiness` and retired the two unfinished verification tasks from this checklist. The retained 29 tasks are complete; the original Linux visual-reference and integrated-acceptance gaps remain historical limitations, not passed checks. The successor removes published executable suites and their requirements. Preserve the implementation evidence below that boundary.
