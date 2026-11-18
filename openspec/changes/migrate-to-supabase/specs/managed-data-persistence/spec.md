# Spec Delta

## Purpose

Keep MediVault's relational healthcare data durable in managed PostgreSQL while
enforcing account boundaries and preserving clinical-record relationships under
direct access, concurrent changes and provider failure.

## ADDED Requirements

### Requirement: Fresh managed relational schema

The application SHALL use a versioned Supabase PostgreSQL schema for all current
relational data, with native identifiers, dates, types, indexes and constraints.
It SHALL NOT create application password/session tables, import legacy SQLite
data automatically, or reset an existing database during ordinary startup.

#### Scenario: Initialize an empty project

- **WHEN** the approved migrations are applied to a new empty Supabase project
- **THEN** the current account, family health, record, medication, log, track,
  visit, follow-up, preference and archived-measurement structures exist
- **AND** no legacy account or healthcare dataset has been copied into them

#### Scenario: Restart after initialization

- **WHEN** the application starts against an initialized project
- **THEN** it checks compatibility without reinitializing or deleting data
- **AND** an incompatible or inaccessible schema produces an explicit failure

### Requirement: Database-enforced owner isolation

Exposed healthcare relations SHALL enforce RLS and least-privilege grants.
Anonymous users SHALL have no healthcare access. Authenticated requests SHALL
only access their own rows and SHALL NOT forge or change owner identifiers.
Ordinary application CRUD SHALL execute with the current user's authorization,
not an unrestricted administrative identity.

#### Scenario: Bypass the application with another account's identifier

- **WHEN** an authenticated account directly queries or mutates a different
  account's identifiers through the data service
- **THEN** no private row is returned or changed
- **AND** a write assigning another owner is rejected

#### Scenario: Exercise grants beyond row policies

- **WHEN** an anonymous or ordinary authenticated caller attempts an unauthorized
  table-wide operation or internal worker function
- **THEN** grants reject the operation independently of the caller's row filters
- **AND** no credential, recipient list or delivery state is disclosed

### Requirement: Atomic account and family consistency

Account creation SHALL atomically initialize one account profile, exactly one
self family profile and default-off notification preferences. Profile-name
synchronization and managed-family deletion SHALL preserve existing account and
health relationships without partial updates or care-data cascades.

#### Scenario: Bootstrap fails

- **WHEN** required account-profile initialization fails during registration
- **THEN** registration does not report an authenticated usable account
- **AND** no partial set of profile/self/preferences rows remains

#### Scenario: Concurrently delete a family profile and add care data

- **WHEN** an owner deletes a non-self profile while another request attaches
  health data to it
- **THEN** database constraints or transaction ordering reject one conflicting
  operation
- **AND** no committed health data is orphaned or cascade-deleted

#### Scenario: Edit the owner name

- **WHEN** a valid owner health-profile name change commits
- **THEN** account, self-profile and health-profile names change together
- **AND** a failed change leaves their previous names consistent

### Requirement: Preserved medication and dose invariants

Medication schedules SHALL retain valid unique times, frequency counts and
same-profile source links. New dose logs SHALL match the schedule and be unique
per medication/date/time. Existing log coordinates SHALL remain immutable and
historical logs SHALL survive later schedule edits.

#### Scenario: Concurrent duplicate dose outcomes

- **WHEN** concurrent requests log the same medication/date/time
- **THEN** only one outcome row commits and the conflict is reported
- **AND** the existing dose is not silently overwritten

#### Scenario: Bypass schedule validation

- **WHEN** a direct authenticated write uses an unscheduled time, invalid
  frequency count or another profile's source record
- **THEN** the database rejects it even without application form validation

### Requirement: Preserved care and follow-up invariants

Tracks, visits, documents and follow-ups SHALL retain owner/profile constraints,
manual lifecycle rules and existing unlink/cascade semantics. Follow-up upsert
SHALL be unique per origin and enforce valid due/source/return relationships.
Invalidating edits SHALL fail atomically, including concurrent edits.

#### Scenario: Change a linked visit incompatibly

- **WHEN** an origin or return visit edit would invalidate a saved follow-up's
  dates or family profile
- **THEN** the change is rejected without partial updates
- **AND** the owner receives actionable conflict feedback

#### Scenario: Remove or reassign optional context

- **WHEN** a source document is reassigned or deleted, or a completed return
  visit is deleted
- **THEN** its optional follow-up association is cleared without removing the
  due date, instruction or asserted status
- **AND** origin-visit deletion still removes its own follow-up

#### Scenario: Delete organizational context

- **WHEN** the owner deletes a track or a visit
- **THEN** track deletion retains its visits as unassigned
- **AND** visit deletion retains its documents as unassigned and clears optional
  return links without deleting the other visits

#### Scenario: Concurrent origin changes and follow-up upserts

- **WHEN** concurrent requests change an origin date/profile and save its follow-up
- **THEN** transaction ordering or database guards reject any incompatible result
- **AND** at most one valid follow-up remains for the origin

### Requirement: Complete typed aggregate reads

Vault and account-export responses SHALL preserve their documented field shapes,
types, profile scoping and deterministic ordering without silently truncating
data to a provider's default row limit. Provider failures SHALL be explicit
errors, never empty-vault or local-data success fallbacks.

#### Scenario: Read more than the default provider page

- **WHEN** an owner has more than 1,000 dose logs and requests the vault or export
- **THEN** every applicable log is included in stable order
- **AND** numbers, booleans, nulls, date-only values and HH:mm times retain their
  application contract types

#### Scenario: Database becomes unavailable

- **WHEN** an authenticated vault or mutation request cannot reach PostgreSQL
- **THEN** the request fails with useful retryable feedback
- **AND** it does not report a successful empty account or use legacy storage

### Requirement: Isolated reminder delivery persistence

Only the authorized server worker SHALL discover reminder recipients and claim
or complete delivery state. Claims SHALL be atomic per dose, respect consent and
existing lease/retry rules, and preserve provider idempotency without holding a
database transaction open during message delivery.

#### Scenario: Overlapping scheduler requests

- **WHEN** two authorized scheduler invocations process the same due dose
- **THEN** no two active claims for that dose are committed simultaneously
- **AND** completion updates apply only to the matching claim attempt

#### Scenario: Ordinary user attempts worker access

- **WHEN** an ordinary account calls worker functions or edits delivery state
- **THEN** access is denied even for that account's own dose
- **AND** email preferences remain editable only through the permitted owner path
