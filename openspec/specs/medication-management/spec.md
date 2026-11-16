# medication-management Specification

## Purpose

Help users organize existing prescriptions and explicitly record dose outcomes through clear, reliable medication workflows.

## Requirements

### Requirement: Persisted prescription management

Users SHALL be able to add and edit their own medication name, prescribed dosage, frequency, unique dose times, inclusive start/end dates, and optional instructions. Invalid schedules SHALL be rejected without saving, and the application SHALL not prescribe or modify dosage automatically.

#### Scenario: Save and revisit a prescription

- **WHEN** a user submits a valid prescription form and reloads the medications page
- **THEN** the saved dosage, times, dates, and instructions remain available

#### Scenario: Duplicate times are entered

- **WHEN** a user submits a medication with repeated scheduled times
- **THEN** the form identifies the invalid schedule and no medication is saved

### Requirement: Combined medication discovery

The medication list SHALL support case-insensitive, whitespace-trimmed name search combined with active, upcoming, completed, or all status filters. Search/filter misses SHALL offer a clear reset action distinct from the empty-account add-medication state.

#### Scenario: Search within an active list

- **WHEN** a user selects active medications and enters part of a medication name
- **THEN** only matching active medications are listed
- **AND** clearing the filters restores the default active list without modifying saved data

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
