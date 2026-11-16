# Spec Delta

## Purpose

Make the local MediVault development command start, report failures, and stop predictably without interfering with other processes or persistent healthcare data.

## ADDED Requirements

### Requirement: Check listening addresses before combined startup

The combined development command SHALL check the configured API and frontend listening addresses before launching either service. An occupied address SHALL cause a nonzero exit with the affected service, address, port, and safe recovery instructions.

#### Scenario: Duplicate development start

- **GIVEN** a MediVault development instance is already listening on the configured addresses
- **WHEN** a second combined development command is run
- **THEN** the second command exits nonzero before launching its services
- **AND** its message advises using the existing instance or stopping it in its owning terminal
- **AND** the first instance remains responsive

#### Scenario: Only the frontend address is occupied

- **GIVEN** the API address is available but the frontend address is occupied
- **WHEN** the combined development command is run
- **THEN** it identifies the frontend conflict and exits nonzero
- **AND** it does not start an API process

### Requirement: Preserve listener ownership and explicit ports

The development command SHALL NOT terminate or automatically adopt an existing listener, switch to another port, or delete application data to resolve a conflict. Cleanup SHALL affect only processes created by that invocation.

#### Scenario: An unrelated process occupies the API address

- **WHEN** combined startup encounters an unrelated listener on the configured API address
- **THEN** startup fails without terminating or adopting that listener
- **AND** no service silently moves to another port
- **AND** stored healthcare data remains unchanged

### Requirement: Announce complete application readiness truthfully

The combined command SHALL announce complete application readiness only after its API and the frontend-proxied API both return HTTP 200 with the existing healthy response. A different listener returning healthy responses SHALL NOT qualify as that invocation's API.

#### Scenario: Healthy combined startup

- **GIVEN** the configured addresses are available and application configuration is valid
- **WHEN** the development command starts its services
- **THEN** it verifies direct and frontend-proxied API health
- **AND** only then announces the application URL and API URL as ready
- **AND** ordinary service-level listening messages remain distinguishable from complete application readiness

#### Scenario: Frontend proxy cannot reach the API

- **WHEN** the frontend serves a page but its proxied API health request fails
- **THEN** the combined command does not announce complete readiness
- **AND** it fails startup within its documented finite readiness timeout

### Requirement: Bound initial startup failures

The combined command SHALL exit nonzero and stop its owned service processes when initial startup fails, including configuration errors, bind races, or readiness timeout. A watcher waiting after a failed API child SHALL NOT keep the combined command running beyond that timeout.

#### Scenario: API child fails while its watcher remains alive

- **WHEN** the initial API child fails and its watcher waits for a file change
- **THEN** the combined command reports API startup failure or readiness timeout
- **AND** it exits nonzero within the documented startup bound
- **AND** its owned frontend and watcher processes are stopped

#### Scenario: Address is taken after preflight

- **GIVEN** preflight found an API address available
- **WHEN** another process binds that address before the new API can bind
- **THEN** the failed API identifies the bind conflict without logging its own successful listen
- **AND** the combined invocation fails without mistaking the other listener for its API
- **AND** the other process remains running

### Requirement: Shut down owned development services cleanly

The combined development command SHALL stop its owned services on interruption or an unexpected supervised-command exit, release its listening addresses, and close API resources. Repeated shutdown requests SHALL be safe, and stopping development SHALL NOT erase persisted data.

#### Scenario: Interrupt and restart

- **GIVEN** the combined development instance is healthy
- **WHEN** its terminal receives an interruption and development is then restarted
- **THEN** the old owned services have released their listening addresses
- **AND** the new instance starts without a conflict from those services
- **AND** previously saved account and healthcare data remain accessible

#### Scenario: A supervised command exits unexpectedly

- **WHEN** either supervised service command exits unexpectedly
- **THEN** the combined invocation terminates its other owned service
- **AND** it reports failure instead of continuing as a working full-stack instance

### Requirement: Preserve existing development and production workflows

Startup changes SHALL retain the default API address, strict frontend address, configured API port, optional environment file, working watch reloads, separate-terminal commands, and existing production startup requirements.

#### Scenario: Start without an environment file

- **WHEN** the development command runs without an environment file
- **THEN** it uses API port 3001 and frontend port 5187 on loopback
- **AND** any missing-optional-file notice is not presented as the startup failure

#### Scenario: Configure an API port

- **WHEN** a valid API port is supplied through the supported environment configuration
- **THEN** the API, preflight, and frontend proxy use that port
- **AND** the frontend remains on its documented strict port

#### Scenario: Reload after a source change

- **GIVEN** combined startup has completed successfully
- **WHEN** a watched API source file changes
- **THEN** the API restarts and becomes reachable through the frontend proxy
- **AND** the development command does not misclassify the normal watch restart as initial startup failure

#### Scenario: Use existing alternate commands

- **WHEN** developers use the documented separate-terminal commands or production startup
- **THEN** those workflows retain their existing configuration and serving behavior
- **AND** production does not require a development readiness marker
