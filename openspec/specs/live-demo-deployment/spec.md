# live-demo-deployment Specification

## Purpose

Run MediVault as a reachable public demonstration whose accounts, records, and documents survive host restarts, while keeping documents private and stating clearly that only fictional data belongs there.

## Requirements

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

### Requirement: Proxy-aware request handling

When a trusted reverse-proxy hop count is configured, the server SHALL derive the client address and request scheme from that many proxy hops. Without that setting, forwarded headers SHALL be ignored. Authentication rate limiting SHALL count attempts per derived client address.

#### Scenario: Rate limit separate clients behind the host proxy

- **WHEN** one forwarded client exceeds the authentication attempt limit through a trusted proxy
- **THEN** that client receives the rate-limit error
- **AND** a different forwarded client can still attempt to sign in

#### Scenario: Ignore spoofed forwarding without a trusted proxy

- **WHEN** no trusted proxy hop count is configured and a request supplies forwarded-address headers
- **THEN** rate limiting uses the direct connection address

### Requirement: Durable database on an ephemeral host

When database replication is configured, startup SHALL restore the newest replica before opening the database if no local database exists, and SHALL continuously replicate committed changes to private S3-compatible storage while running. Startup SHALL fail rather than create an empty database when a configured replica exists but cannot be restored.

#### Scenario: Restart with an empty filesystem

- **WHEN** a user saves data and the host restarts with an empty local filesystem
- **THEN** the restored application shows that user's account, profile, medications, logs, and record metadata
- **AND** the user's existing session remains valid until it expires

#### Scenario: Unreachable replica

- **WHEN** replication is configured and the replica storage cannot be read during startup
- **THEN** startup exits nonzero with an error identifying replica restoration
- **AND** it does not serve a fresh empty database

#### Scenario: First deployment

- **WHEN** replication is configured and no replica exists yet
- **THEN** startup creates a new database through the normal migrations and begins replicating it

### Requirement: Durable private document storage

The server SHALL store uploaded documents either in its private local data directory or, when configured, in a private S3-compatible bucket under owner-scoped keys. Viewing, downloading, and deleting SHALL keep owner checks and same-origin delivery, and SHALL never return a public or presigned bucket URL.

#### Scenario: Document survives a host restart

- **WHEN** a user uploads a document with bucket storage configured and the host restarts with an empty local filesystem
- **THEN** the owner can still view and download the document through MediVault
- **AND** another account still cannot access it

#### Scenario: Upload fails in bucket storage

- **WHEN** the bucket rejects or cannot accept an upload
- **THEN** no record is created and the user sees a retryable upload error

#### Scenario: Delete a bucket-stored document

- **WHEN** the owner confirms deletion of a bucket-stored document
- **THEN** both its metadata and stored object are removed
- **AND** a partial failure is reported explicitly as it is today

### Requirement: Hosted deployment definition

The repository SHALL define the public demo service declaratively: the container runtime, `/api/health` health check, production environment, trusted proxy hop, durable storage settings, and auto-deployment of `main` only after required checks pass. Secret values SHALL be declared as host-provided and never committed.

#### Scenario: Deploy a verified commit

- **WHEN** a commit on `main` passes the required checks
- **THEN** the host builds and deploys it and routes traffic only after `/api/health` succeeds

#### Scenario: Failed checks block deployment

- **WHEN** a commit on `main` fails required checks
- **THEN** the previously deployed version keeps serving

### Requirement: Public demonstration notice

The public site SHALL display, on sign-in, registration, and every workspace page, a visible notice that it is a demonstration for fictional data only, is not medical advice, and may be reset. The notice SHALL be readable in Light and Dark themes and SHALL not obstruct navigation at narrow widths.

#### Scenario: Visitor opens the live demo

- **WHEN** a visitor opens the sign-in or registration page
- **THEN** the demo notice is visible before any account is created

#### Scenario: Signed-in user on a narrow screen

- **WHEN** a signed-in user views any workspace page at 320 pixels wide
- **THEN** the notice is visible without horizontal scrolling or covering navigation controls

### Requirement: Operator deployment documentation

Documentation SHALL identify owner prerequisites and settings, cold starts, restart-survival verification, single-writer limits, recovery-point limits, and safe rollback. It SHALL explain replica failures, storage caps, credential/network errors, and document/database consistency limits without exposing secrets. Live status SHALL require actual deployment verification.

#### Scenario: Prepare a first deployment

- **WHEN** an operator follows the deployment documentation with their own Render and Backblaze B2 accounts
- **THEN** they can create the service and storage without committing any secret
- **AND** they can verify that data survives a manual restart

#### Scenario: Storage transaction cap blocks restore

- **WHEN** startup reports a storage-provider transaction-cap error while restoring the replica
- **THEN** the runbook identifies the reported cap as distinct from a generic credential failure
- **AND** it directs an authorized operator to review provider usage and caps, restore access, redeploy, and verify persisted fictional data
- **AND** it never recommends bypassing restore, deleting the replica, or opening an empty production database

#### Scenario: Recover from partial document operations

- **WHEN** a document operation reports incomplete cleanup or a missing stored file
- **THEN** guidance explains the non-atomic database/object boundary and controlled reconciliation using backups or known ownership metadata
- **AND** destructive repairs, live test writes, and billing changes require an explicit operator decision rather than automatic cleanup

### Requirement: Honest operational health boundaries

Operational guidance SHALL state that application readiness probes database availability, not private document availability or backup freshness. Remote-storage checks SHALL be explicit and low-frequency rather than added to every health request. Backup/restore checks and provider-usage review SHALL not expose object contents, credentials, or personal healthcare data in diagnostics.

#### Scenario: Healthy API during a document-storage outage

- **WHEN** the database health check succeeds while document storage is unavailable
- **THEN** the operator can distinguish application readiness from document/replica health using the documented checks and sanitized operation errors
- **AND** the application does not claim backup durability from the health endpoint alone

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
