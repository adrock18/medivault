# Spec Delta

## MODIFIED Requirements

### Requirement: Reproducible container packaging

The repository SHALL build an image with supported Node, production dependencies,
frontend artifacts and local scanning assets, without cloud credentials at build
time. It SHALL listen on the host-provided port at runtime with required Supabase
configuration. Active SQLite/Litestream restoration SHALL be absent, and the host
readiness gate SHALL remain enabled.

#### Scenario: Build and start the image without credentials

- **WHEN** an operator builds a clean checkout without cloud credentials and
  attempts production startup without required runtime Supabase settings
- **THEN** image compilation succeeds but runtime startup fails explicitly
- **AND** compilation is not presented as successful runtime acceptance

#### Scenario: Start the image with configured managed services

- **WHEN** an operator builds a clean checkout and starts production against an
  isolated configured Supabase project with secure cookies
- **THEN** `/api/health` reports success on the host-provided port and a workspace
  deep link returns the website
- **AND** recorded runtime acceptance remains distinct from image compilation

#### Scenario: Image excludes local and secret material

- **WHEN** the built image contents are inspected
- **THEN** no environment secret, personal runtime data, uploaded document or
  executable testing material is present
- **AND** required local scanning resources remain available without a Litestream
  executable, replica configuration or local-database startup dependency

### Requirement: Durable database on an ephemeral host

Application data SHALL persist in Supabase PostgreSQL independently of the web
host's filesystem. Startup SHALL verify the required managed schema and reject
unavailable or incompatible configuration without opening a fresh local database.
Ordinary application startup SHALL NOT reset or apply schema migrations.

#### Scenario: Restart with an empty filesystem

- **WHEN** a user saves data and the web host restarts with an empty local filesystem
- **THEN** the application shows that user's profile, medications, logs, records,
  visits and follow-ups from the same Supabase project
- **AND** their valid Supabase session remains usable

#### Scenario: Unreachable managed database

- **WHEN** the configured managed database cannot pass startup readiness
- **THEN** the application fails readiness explicitly within the documented bound
- **AND** it does not serve a new local account/database as a fallback

#### Scenario: Unreachable replica

- **WHEN** the retired B2 replica is unreachable but Supabase is correctly
  configured and available
- **THEN** the new application starts without contacting that replica
- **AND** it neither treats the old replica failure as lost Supabase data nor
  opens a local fallback database

#### Scenario: First deployment

- **WHEN** the operator prepares a new empty project for its first deployment
- **THEN** versioned migrations are applied explicitly before application startup
- **AND** startup validates the schema without importing old data

### Requirement: Durable private document storage

Uploaded documents SHALL persist in a private Supabase bucket under opaque
owner-scoped keys. Viewing, downloading and deleting SHALL retain ownership
checks and same-origin application delivery without public or presigned bucket
URLs. Missing configuration SHALL NOT select local or Backblaze storage.

#### Scenario: Document survives a host restart

- **WHEN** a user uploads a document and the host restarts with an empty filesystem
- **THEN** the owner can still view and download byte-identical content
- **AND** another account still cannot access it

#### Scenario: Upload fails in bucket storage

- **WHEN** the bucket rejects or cannot accept an upload
- **THEN** no successful record response is created and the user sees a retryable error

#### Scenario: Delete a bucket-stored document

- **WHEN** the owner confirms deletion and the operation succeeds
- **THEN** both metadata and the stored object are removed
- **AND** any partial failure is reported explicitly with a safe retry path

### Requirement: Hosted deployment definition

The repository SHALL define the demo container, `/api/health`, production origin,
cookie and proxy settings, required Supabase settings, and deployment of `main`
only after required checks pass. Secret values SHALL remain host-provided.
Deployment SHALL coordinate code and configuration so incompatible old backend
settings are not used by an automatic release.

#### Scenario: Deploy a verified commit

- **WHEN** a commit passes required checks and matching Supabase settings/schema
  have been prepared
- **THEN** the host builds and deploys it, routing traffic only after health succeeds
- **AND** the release records its actual revision and URL

#### Scenario: Failed checks block deployment

- **WHEN** a commit fails required checks
- **THEN** the previously deployed version keeps serving

#### Scenario: Required cloud settings are missing

- **WHEN** a release lacks required Supabase or production-origin configuration
- **THEN** startup identifies missing setting names without exposing values
- **AND** the release is not reported healthy or live

### Requirement: Operator deployment documentation

Documentation SHALL cover Supabase/Render prerequisites, private secrets, schema
and bucket setup, auth confirmation/redirect settings, fresh registration,
restart checks, plan limits and rollback. It SHALL distinguish database backups
from document backups and forbid treating an old SQLite rollback as recovery of
new Supabase writes. Live status SHALL require actual hosted verification.

#### Scenario: Prepare a first deployment

- **WHEN** an operator follows setup with their own Supabase and Render accounts
- **THEN** they can configure a new project and deploy without committing secrets
- **AND** instructions verify owned data/documents across restart

#### Scenario: Storage transaction cap blocks restore

- **WHEN** the old release reports a B2 cap or the new provider reports a limit
- **THEN** guidance distinguishes the old replica incident from Supabase service
  access, quota or inactivity problems
- **AND** it never bypasses readiness or opens an empty fallback database

#### Scenario: Recover from partial document operations

- **WHEN** a document operation reports incomplete cleanup or missing stored bytes
- **THEN** guidance explains the non-atomic boundary and controlled reconciliation
- **AND** database backups are not presented as containing document objects
- **AND** destructive repairs, live test writes and billing changes require an
  explicit operator decision rather than automatic cleanup

### Requirement: Honest operational health boundaries

Operational guidance SHALL distinguish remote database readiness from Auth,
document availability and recoverable backups. Storage checks SHALL be explicit
and low-frequency, not added to every health request. Local builds or mocked
providers SHALL NOT establish hosted access, policy enforcement or durability.
Diagnostics SHALL exclude credentials and healthcare content.

#### Scenario: Healthy API during a document-storage outage

- **WHEN** the database health check succeeds while document storage is unavailable
- **THEN** the operator can distinguish readiness from document/backup health
- **AND** the application does not claim backup durability from the health endpoint

#### Scenario: Deployment access is unavailable

- **WHEN** local verification succeeds but project/hosting access is unavailable
- **THEN** implementation reports the hosted checks as blocked or unexecuted
- **AND** it does not mark the service live or silently skip those checks
