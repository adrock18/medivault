# medication-management Specification

## Purpose

Help users organize existing prescriptions and explicitly record dose outcomes through clear, reliable medication workflows.

## Requirements

### Requirement: Persisted prescription management

Users SHALL add and edit their own medication name, prescribed dosage, form, optional strength, frequency, unique times, inclusive dates, instructions, and owned source-record links with prescription wording. Invalid schedules SHALL be rejected. Strength SHALL remain distinct from the amount to take or apply, and the application SHALL not prescribe or alter dosage automatically.

#### Scenario: Save and revisit a prescription

- **WHEN** a user submits a valid prescription form and reloads the medications page
- **THEN** the saved dosage, times, dates, and instructions remain available

#### Scenario: Choose the prescribed medication form

- **WHEN** a user records a medication
- **THEN** form choices include tablet, capsule, cream, ointment, gel, injection, liquid, drops, inhaler, patch, suppository, other, and unspecified
- **AND** strength/concentration and prescribed dosage remain separately labeled

#### Scenario: Link a reviewed prescription

- **WHEN** a user confirms valid scan-derived medication details
- **THEN** the saved form, strength, dosage wording, source excerpt, and source link survive reload
- **AND** dates and dose times are explicitly entered rather than inferred from OCR
- **AND** links to another account's records are rejected by the backend and database

#### Scenario: Remove a source document

- **WHEN** the owner deletes a linked medical record
- **THEN** the medication's source link is cleared
- **AND** the medication, dose logs, and saved prescription wording remain intact

#### Scenario: Duplicate times are entered

- **WHEN** a user submits a medication with repeated scheduled times
- **THEN** the form identifies the invalid schedule and no medication is saved

### Requirement: Combined medication discovery

The medication list SHALL combine normalized name search with active, upcoming, completed, or all status filters and an optional source-record scope. Entering through a record's linked-medication action SHALL initially show every linked status. Closing an edit dialog SHALL retain the source scope. Search/filter misses SHALL offer a clear reset action distinct from the empty-account add-medication state.

#### Scenario: Search within an active list

- **WHEN** a user selects active medications and enters part of a medication name
- **THEN** only matching active medications are listed
- **AND** name matching is case-insensitive and trims surrounding whitespace
- **AND** clearing the filters restores the default active list without modifying saved data

#### Scenario: Follow a source link with non-active medications

- **WHEN** a user follows a record's linked-medication action for a record with active, upcoming, and completed medications
- **THEN** the initial results include all medications linked to that record regardless of status
- **AND** unrelated medications remain excluded
- **AND** the user can intentionally narrow the linked results using name and status controls

#### Scenario: Close an edit within linked results

- **WHEN** a user saves or cancels an edit while viewing medications scoped to a source record
- **THEN** the source-record scope and discovery controls remain in effect
- **AND** unrelated medications do not appear merely because the dialog closed

#### Scenario: Reset linked discovery explicitly

- **WHEN** a user chooses the existing clear-filters or show-all-medications action
- **THEN** the source scope is removed explicitly
- **AND** clear-filters restores the ordinary unscoped active-list default without changing saved medications

### Requirement: Explicit local-time dose tracking

Today's schedule SHALL display medication identity, prescribed dosage, local scheduled time, and a text-labeled scheduled, taken, or skipped outcome. Only an explicit user action SHALL create or remove an outcome log.

#### Scenario: Record and undo an outcome

- **WHEN** a user marks a scheduled dose as taken and then explicitly undoes that log
- **THEN** the taken outcome persists before undo
- **AND** undo returns the dose to its unlogged scheduled state

#### Scenario: No action is taken on a past-time dose

- **WHEN** the user leaves a past-time dose unlogged
- **THEN** the application does not create an outcome or suggest taking an extra dose

### Requirement: Unique dose outcomes

The system SHALL permit at most one outcome log for a medication, scheduled date, and scheduled time, including concurrent submissions. A duplicate SHALL produce a helpful conflict message instead of a second log.

#### Scenario: Submit the same dose concurrently

- **WHEN** two requests attempt to log the same scheduled dose
- **THEN** only one outcome is persisted
- **AND** the other request reports the conflict

### Requirement: Faithful history and adherence

Schedule edits SHALL retain original historical log coordinates. Recorded adherence SHALL mean taken outcomes divided by logged outcomes in the last 30 days, excluding unlogged doses, and SHALL show an unavailable state when no outcomes exist.

#### Scenario: Change future medication times

- **WHEN** a user edits dose times after recording earlier outcomes
- **THEN** the earlier logs retain their original dates and times
- **AND** adherence remains explicitly labeled as taken divided by logged doses

### Requirement: Confirmed medication deletion

Deleting a medication SHALL require confirmation naming the medication and explaining that its dose history will also be removed. Cancellation SHALL leave both unchanged; successful deletion SHALL remove both from refreshed and reloaded views.

#### Scenario: Confirm deletion

- **WHEN** a user confirms deletion of their medication
- **THEN** the medication and its outcome logs are removed
- **AND** the updated dashboard no longer counts its scheduled doses
