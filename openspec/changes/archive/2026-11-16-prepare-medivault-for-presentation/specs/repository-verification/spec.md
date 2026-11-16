# Spec Delta

## Purpose

Provide a reproducible repository verification contract so developers and presenters can distinguish a working, tested build from an incomplete or misleading demonstration.

## ADDED Requirements

### Requirement: Repeatable local verification

The repository SHALL expose one documented verification command covering application formatting, lint, strict application/server/test type checks, functional tests, production build, and emitted-asset checks. It SHALL exit nonzero when a required stage fails and SHALL not require personal data, an existing build, or an already-running development server.

#### Scenario: Verify a clean checkout

- **WHEN** a developer installs locked dependencies using the documented supported runtime and runs verification without an existing build or data directory
- **THEN** the required build is generated before tests that depend on it
- **AND** all required checks run against the checkout using isolated test storage
- **AND** successful verification returns exit code zero

#### Scenario: A required stage fails

- **WHEN** formatting, lint, type checking, a test, or a build-artifact check fails
- **THEN** verification returns a nonzero exit code and identifies the failed stage
- **AND** it does not announce presentation readiness or silently skip the failure

### Requirement: Type-checked maintained tests

All maintained test sources SHALL participate in strict type checking with the repository's module aliases and environment types. Type failures SHALL fail verification even when the test runner can transpile and execute the tests successfully.

#### Scenario: A typed medication fixture becomes stale

- **WHEN** a test fixture omits a required medication field or supplies an unsupported testing-library query option
- **THEN** the type-check stage rejects the test source
- **AND** the error is resolved through correct types or test inputs rather than an unsafe cast or an excluded test file

### Requirement: Explicit quality-tool scope

Formatting SHALL check maintained application, configuration, test, and documentation files while excluding generated skill content. Lint SHALL reject unexplained warnings; any necessary exception SHALL be narrowly scoped and explain the preserved behavior.

#### Scenario: Generated skill formatting differs

- **WHEN** generated skill files use formatting different from application conventions
- **THEN** application formatting can pass without rewriting those generated files
- **AND** an actual formatting error in maintained application source still fails verification

#### Scenario: A new lint warning is introduced

- **WHEN** maintained code introduces an unhandled lint warning
- **THEN** verification fails rather than suppressing warning output globally

### Requirement: Verified production artifacts

Verification SHALL reject a missing or invalid build manifest, missing referenced application chunks, missing required local OCR assets, or an entry JavaScript chunk exceeding 500,000 minified bytes before compression. Missing resources SHALL not be accepted as HTML fallback responses.

#### Scenario: A build entry exceeds its budget

- **WHEN** an emitted entry JavaScript file is larger than 500,000 bytes
- **THEN** the artifact check reports the file and measured size and exits nonzero
- **AND** shared or lazy chunks are not misrepresented as part of this entry-only budget

#### Scenario: A local scanning asset is missing

- **WHEN** a required OCR worker, language file, engine file, PDF worker, or decoder is absent from the production build
- **THEN** verification identifies the missing resource and fails
- **AND** it does not substitute a CDN or external document-processing service

### Requirement: Shared CI verification

Push and pull-request checks SHALL install locked dependencies on the documented primary Node runtime and execute the same verification contract on Windows and Linux. Functional tests SHALL use temporary accounts, owned processes, available test ports, and isolated data directories without deployment credentials.

#### Scenario: CI runs for a proposed change

- **WHEN** a push or pull request triggers verification
- **THEN** both platform jobs execute the documented checks and report failures
- **AND** no public deployment, personal healthcare data, or committed demo password is required

### Requirement: Reproducible presentation rehearsal

Documentation SHALL provide a fictional-account walkthrough covering registration, sample setup, prescription scanning and review, persisted medication/source links, dose logging and undo, document access, and appearance changes. It SHALL distinguish local demonstration, tested production configuration, and actual public deployment.

#### Scenario: Rehearse the current product

- **WHEN** a presenter follows the documented walkthrough with a separate test account
- **THEN** its required features and sample documents are available without personal health data or external AI credentials
- **AND** OCR limitations, required human review, retained legacy measurements, and deferred notifications are disclosed
- **AND** the walkthrough does not claim that a local build is publicly live or clinically certified
