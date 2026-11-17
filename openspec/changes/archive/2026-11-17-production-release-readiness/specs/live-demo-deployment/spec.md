# Production Deployment Specification Delta

## MODIFIED Requirements

### Requirement: Reproducible container packaging

The repository SHALL build an image running the production build on supported Node with production dependencies, required migrations and local scanning assets. It SHALL listen on the host-provided port on all interfaces and contain no secrets, local data or development artifacts, including executable testing material. Image compilation SHALL be distinguished from runtime acceptance; the host readiness gate SHALL remain enabled.

#### Scenario: Build and start the image without credentials

- **WHEN** an operator builds a clean checkout and starts the image in production mode with isolated local storage and secure cookies enabled
- **THEN** `/api/health` reports success on the host-provided port and a workspace deep link returns the website
- **AND** the recorded outcome identifies runtime acceptance separately from the CI image-build result

#### Scenario: Image excludes local and secret material

- **WHEN** the built image contents are inspected
- **THEN** no environment secret, personal runtime data, uploaded document or executable testing material is present
- **AND** required migrations and local scanning resources remain available

## ADDED Requirements

### Requirement: Controlled local container recovery

Docker recovery SHALL distinguish observed failures from suspected causes and protect other workloads and stored data. Read-only diagnosis SHALL precede repair. Shared-service interruption, storage migration or repair, software replacement and destructive cleanup SHALL require explicit authorization. Diagnostics SHALL remain local and sanitized; recovery SHALL not alter application persistence or bypass restore/readiness gates.

#### Scenario: Docker Desktop reports a SIGBUS crash

- **WHEN** Docker Desktop reports a fatal fault and its daemon is unavailable
- **THEN** diagnosis records daemon/WSL status, available capacity and relevant local error evidence without asserting an unproven cause
- **AND** it does not automatically reset Docker, terminate unrelated workloads or upload diagnostic bundles

#### Scenario: Repair could affect other workloads

- **WHEN** the next recovery action would restart shared services, modify a virtual disk or remove stored objects
- **THEN** the operator sees the proposed action, affected scope and preservation/backup requirements before authorizing it
- **AND** application data, unrelated WSL distributions and credentials remain outside automatic cleanup

#### Scenario: Local engine recovers

- **WHEN** the local daemon becomes healthy with sufficient capacity for the intended build
- **THEN** the operator can record actual image build and isolated runtime readiness outcomes
- **AND** local recovery is not represented as a successful Render deployment or remote backup restoration

## REMOVED Requirements

### Requirement: Isolated replica startup failure verification

**Reason:** The owner excludes executable testing harnesses and fixtures from the published tree.

**Migration:** Preserve the existing local harness and its ten recorded sequencing outcomes, retire the package/CI hooks and retain fail-closed production restoration plus the operational recovery guidance.

#### Scenario: Inspect production restoration after cleanup

- **WHEN** the entrypoint harness is excluded from publication
- **THEN** the runtime entrypoint still refuses to start the application after a configured restore failure
- **AND** historical sequencing evidence is not claimed to be a current hosted check
