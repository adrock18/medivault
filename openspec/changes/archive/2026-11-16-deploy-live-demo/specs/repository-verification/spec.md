# Spec Delta

## MODIFIED Requirements

### Requirement: Shared CI verification

Push and pull-request checks SHALL install locked dependencies on the documented primary Node runtime and execute the same verification contract on Windows and Linux. Linux checks SHALL also build the deployment container image and confirm its health endpoint responds using local storage. Functional tests SHALL use temporary accounts, owned processes, available test ports, and isolated data directories without deployment credentials.

#### Scenario: CI runs for a proposed change

- **WHEN** a push or pull request triggers verification
- **THEN** both platform jobs execute the documented checks and report failures
- **AND** no public deployment, personal healthcare data, or committed demo password is required

#### Scenario: Container image breaks

- **WHEN** a change prevents the deployment image from building or its health endpoint from responding
- **THEN** CI fails before the commit can be auto-deployed
- **AND** the check runs without bucket, replica, or host credentials
