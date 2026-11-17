# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Isolated replica startup failure verification

Automated verification SHALL exercise the deployment entrypoint with deterministic restore success and failure outcomes without real bucket credentials. Restore failure SHALL exit nonzero before application startup or database creation. Verification SHALL distinguish startup sequencing tests from actual cloud restore and durability evidence.

#### Scenario: Restore is denied

- **WHEN** an isolated replica-command fixture reports access denied or a transaction-cap error
- **THEN** the entrypoint exits nonzero and does not start the application
- **AND** existing fixture data remains unchanged and no live storage call occurs

#### Scenario: Restore succeeds or no replication is configured

- **WHEN** the fixture reports successful restore, or replication is absent
- **THEN** the configured application startup path is reached exactly once
- **AND** the recorded result does not claim that a real remote backup was restored

### Requirement: Honest operational health boundaries

Operational guidance SHALL state that application readiness probes database availability, not private document availability or backup freshness. Remote-storage checks SHALL be explicit and low-frequency rather than added to every health request. Backup/restore checks and provider-usage review SHALL not expose object contents, credentials, or personal healthcare data in diagnostics.

#### Scenario: Healthy API during a document-storage outage

- **WHEN** the database health check succeeds while document storage is unavailable
- **THEN** the operator can distinguish application readiness from document/replica health using the documented checks and sanitized operation errors
- **AND** the application does not claim backup durability from the health endpoint alone
