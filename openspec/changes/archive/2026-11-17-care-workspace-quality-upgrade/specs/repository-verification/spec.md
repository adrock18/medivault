# Spec Delta

## MODIFIED Requirements

### Requirement: Shared CI verification

Push and pull-request checks SHALL install locked dependencies on the primary Node runtime and run existing verification on Windows and Linux. Linux SHALL also run required browser E2E and container checks. Tests SHALL use fictional accounts, owned processes, available ports, and isolated storage without deployment credentials. Failed required checks SHALL block deployment readiness.

#### Scenario: CI runs for a proposed change

- **WHEN** a push or pull request triggers verification
- **THEN** both platform jobs execute the documented existing checks and report failures
- **AND** a required Linux browser job exercises the real built frontend and API
- **AND** no public deployment, personal healthcare data, or committed demo password is required

#### Scenario: Container image breaks

- **WHEN** a change prevents the deployment image from building or its health endpoint from responding
- **THEN** CI fails before the commit can be auto-deployed
- **AND** the check runs without bucket, replica, or host credentials

## ADDED Requirements

### Requirement: Repeatable full-stack browser verification

The repository SHALL provide a documented full-verification command that builds once, runs existing quality gates, and exercises the production application in a real browser. Browser prerequisites SHALL be explicit. The runner SHALL not reuse an unrelated server or real storage, rebuild assets while serving them, or leave owned processes and fictional storage running after completion.

#### Scenario: Verify without a running development server

- **WHEN** a contributor installs documented browser prerequisites and runs full verification from a clean checkout
- **THEN** the runner starts its own healthy production application and uses isolated test storage
- **AND** browser or prerequisite failures return a helpful nonzero result rather than skipping coverage

#### Scenario: Test address is already occupied

- **WHEN** an unrelated process occupies the chosen browser-test address
- **THEN** the runner selects a genuinely available owned test address or fails explicitly
- **AND** it never adopts or terminates the unrelated listener

### Requirement: End-to-end workflow and failure evidence

Browser verification SHALL cover registration/session/logout, profile saving, record upload/edit/discovery/private preview/download/delete, local scanning/review/cancel, medication CRUD/calendar/source links, dose taken/skipped/undo, favourites, summary printing, and settings. Focused API/domain tests SHALL cover races, restart persistence, and deterministic storage failures. Tests SHALL assert saved behavior, not only visible controls.

#### Scenario: Complete and revisit core workflows

- **WHEN** the fictional end-to-end journey completes and the browser reloads
- **THEN** confirmed changes persist and cancelled or rejected actions do not create entries
- **AND** document downloads match the uploaded fixture and a second account cannot read or mutate the first account's data

#### Scenario: Exercise unhappy paths

- **WHEN** the browser encounters rejected validation, failed mutation, expired session, slow or failed preview, or failed background refresh
- **THEN** it retains truthful pending/error/stale feedback and recoverable input where appropriate
- **AND** late requests cannot restore private data after sign-out

### Requirement: Responsive visual and interaction regression checks

Verification SHALL check current pages at 320, 375, 768, 1280, and 1440 CSS pixels in Light and Dark modes for overflow and reachable actions. Representative browser checks SHALL cover keyboard/modal focus, 44-pixel targets, required text contrast, reduced motion, and unsupported transitions. Visual references SHALL be generated and compared in a pinned environment, with intentional updates reviewed.

#### Scenario: Browser layout regression

- **WHEN** a page, calendar, preview, or summary causes overflow, hidden actions, or obscured focus at a required width
- **THEN** the relevant browser check fails with evidence of the affected view
- **AND** tolerance is not widened merely to accept the regression

#### Scenario: Cross-engine smoke checks

- **WHEN** the required browser job runs
- **THEN** the main functional journey runs in its pinned primary engine
- **AND** additional supported engines receive navigation, appearance, and private-preview smoke checks with documented limitations

### Requirement: Source-grounded engineering handbook

Documentation SHALL provide a linked setup and module map, architecture/deployment diagrams, ERD, important request flows, API and data contracts, design rationale, SDLC/change workflow, verification matrix, and operations/recovery guidance. Descriptions SHALL match implemented behavior, explain material trade-offs, and distinguish current features, compatibility APIs, and deferred work.

#### Scenario: New contributor follows the handbook

- **WHEN** a contributor starts at the README
- **THEN** linked instructions explain prerequisites, configuration, local startup, fictional demo data, tests, production setup, and safe shutdown
- **AND** diagrams explain authentication, document/OCR, medication-log, and persistence/recovery boundaries without exposing secrets or user data

#### Scenario: Explain an engineering decision

- **WHEN** a maintainer consults the documented architecture and decisions
- **THEN** they can identify each module's responsibility, relevant invariants, chosen approach, rejected alternatives, and operational limits
- **AND** the documentation does not claim certification or tooling that the repository does not have

### Requirement: Traceable review and honest completion evidence

The engineering review SHALL record reviewed authored files, excluded/generated/private material, evidence-backed findings, disposition, and associated regression checks. Required tests SHALL have recorded commands and outcomes. Passing checks SHALL not be described as proof that all defects are absent; untested cloud recovery and environment-specific checks SHALL remain explicit.

#### Scenario: A finding is resolved

- **WHEN** a verified defect is marked fixed
- **THEN** its review entry points to the relevant change and a regression check demonstrating the corrected behavior
- **AND** a maintainability preference or scaling risk is not misrepresented as a reproduced failure
