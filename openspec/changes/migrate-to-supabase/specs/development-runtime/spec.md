# Spec Delta

## MODIFIED Requirements

### Requirement: Preserve existing development and production workflows

Startup SHALL retain the default loopback API/frontend addresses, explicit
configured API port, optional environment file, watch reloads, separate-terminal
commands and production serving. Both development and production SHALL require
valid Supabase configuration; missing settings SHALL NOT select local SQLite or
document storage.

#### Scenario: Start without an environment file

- **GIVEN** required Supabase settings are supplied through the process environment
- **WHEN** development runs without an environment file
- **THEN** it uses API port 3001 and frontend port 5187 on loopback by default
- **AND** the missing optional file is not presented as a startup failure

#### Scenario: Configure an API port

- **WHEN** a valid API port is supplied through supported environment configuration
- **THEN** the API, preflight and frontend proxy use that port
- **AND** the frontend remains on its documented strict port

#### Scenario: Reload after a source change

- **GIVEN** combined startup completed against a configured Supabase project
- **WHEN** a watched API source file changes
- **THEN** the API restarts and becomes reachable through the frontend proxy
- **AND** the normal watch restart is not misclassified as initial startup failure

#### Scenario: Use existing alternate commands

- **WHEN** developers use documented separate-terminal commands or production startup
- **THEN** those workflows retain their supported serving behavior with Supabase
- **AND** production does not require a development readiness marker

#### Scenario: Missing managed-service settings

- **WHEN** development lacks required Supabase settings or cannot pass initial
  schema readiness
- **THEN** startup fails within its documented bound with actionable configuration
  or dependency feedback and stops only its owned children
- **AND** no local vault is created and no unrelated listener is adopted or stopped
