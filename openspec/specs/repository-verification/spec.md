# repository-verification Specification

## Purpose

Provide a reproducible repository verification contract so developers and presenters can distinguish a working, tested build from an incomplete or misleading demonstration.

## Requirements

### Requirement: Repeatable local verification

The repository SHALL expose one documented release-verification command covering formatting, lint, strict application/server/build-tool type checks, production build and emitted-asset checks. It SHALL exit nonzero when a required stage fails and SHALL work without test sources, personal data, an existing build or a running server. Success SHALL be identified as build verification, not functional or browser regression verification.

#### Scenario: Verify a clean checkout

- **WHEN** a developer installs locked dependencies using the supported runtime and runs verification without local-only files, a build or runtime storage
- **THEN** the production build and all documented source/build checks complete without requiring a test runner or suite
- **AND** successful verification returns exit code zero

#### Scenario: A required stage fails

- **WHEN** formatting, lint, runtime/tooling type checking, production build or an emitted-asset check fails
- **THEN** verification returns a nonzero exit code and identifies the failed stage
- **AND** it does not skip the failure or announce functional regression coverage

### Requirement: Explicit quality-tool scope

Formatting SHALL check maintained application, configuration and documentation while excluding generated and local-only tooling. Lint SHALL reject unexplained warnings; exceptions SHALL be narrowly scoped and explain preserved behavior. Excluded local suites SHALL not affect a fresh checkout's build or required checks.

#### Scenario: Generated skill formatting differs

- **WHEN** generated local integration skills differ from application formatting conventions
- **THEN** release formatting can pass without rewriting those local files
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

Push and pull-request checks SHALL install locked dependencies and run the published release-verification contract on Windows and Linux. Linux SHALL also compile the deployment image; a separate gate SHALL audit production dependencies. No required job SHALL invoke excluded test tooling or rely on local-only files. CI success SHALL not be described as proof of browser behavior, container runtime health or cloud durability.

#### Scenario: CI runs for a proposed change

- **WHEN** a push or pull request triggers verification
- **THEN** both platform jobs execute the documented source/build checks and report failures
- **AND** image compilation and production dependency audit report their own outcomes
- **AND** no excluded test source, deployment credential or personal healthcare data is required

#### Scenario: Container image breaks

- **WHEN** a change prevents the deployment image from compiling
- **THEN** the image-build check fails before that commit can qualify for automatic deployment
- **AND** image compilation does not claim that runtime health or restoration was exercised

### Requirement: Reproducible presentation rehearsal

Documentation SHALL provide a fictional-account walkthrough covering registration, sample setup, prescription scanning and review, persisted medication/source links, dose logging and undo, document access, and appearance changes. It SHALL distinguish local demonstration, tested production configuration, and actual public deployment.

#### Scenario: Rehearse the current product

- **WHEN** a presenter follows the documented walkthrough with a separate test account
- **THEN** its required features and sample documents are available without personal health data or external AI credentials
- **AND** OCR limitations, required human review, retained legacy measurements, and deferred notifications are disclosed
- **AND** the walkthrough does not claim that a local build is publicly live or clinically certified

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
