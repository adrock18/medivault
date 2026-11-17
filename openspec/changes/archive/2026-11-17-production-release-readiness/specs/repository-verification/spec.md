# Production Verification Specification Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Type-checked maintained tests

**Reason:** The owner explicitly excludes automated test source and its configuration from the published repository.

**Migration:** Preserve local files before untracking and remove the test-project reference without weakening strict application, server or build-tool type checking.

#### Scenario: Build without a local suite

- **WHEN** a fresh checkout contains no local automated tests
- **THEN** its required type checks resolve only the published application, server and build-tool projects

### Requirement: Repeatable full-stack browser verification

**Reason:** The owner excludes the browser runner, fixtures and test-only tooling from Git.

**Migration:** Reconcile the predecessor addition, retire published browser commands/jobs and preserve historical outcomes without promising reproducibility from the new checkout.

#### Scenario: Inspect published release commands

- **WHEN** a contributor lists the supported release commands
- **THEN** none requires an excluded browser runner or claims to execute its local-only suites

### Requirement: End-to-end workflow and failure evidence

**Reason:** Committed functional/browser suites are no longer part of the selected distribution model.

**Migration:** Preserve earlier executed evidence as historical and disclose the loss of reproducible CI regression coverage; do not remove the application's ownership, validation or failure behavior.

#### Scenario: Read earlier verification evidence

- **WHEN** a maintainer reads the quality-upgrade review
- **THEN** previously executed checks remain accurately recorded and are not represented as current CI checks

### Requirement: Responsive visual and interaction regression checks

**Reason:** The owner excludes versioned visual suites and screenshot references rather than completing their publication.

**Migration:** Record the predecessor's Linux visual-baseline gap as superseded and unexecuted, remove the dependent required CI job and retain current responsive/accessibility product requirements.

#### Scenario: Resolve an absent visual reference

- **WHEN** the successor retires the published visual-regression contract
- **THEN** its CI no longer requires unpublished Linux screenshot references
- **AND** the predecessor record does not claim those references were generated or accepted
