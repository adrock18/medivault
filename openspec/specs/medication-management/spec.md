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

Today's schedule SHALL show each dose's medication, prescribed dosage, local time, and a text state in time order under Morning (before 12:00), Afternoon (12:00 to 16:59), and Evening (17:00 onward). It SHALL mark the current time and emphasize the next unlogged dose. A past unlogged dose SHALL read "Not logged", never missed. Only an explicit action SHALL create or remove a log, and each change SHALL be confirmed visibly.

#### Scenario: Record and undo an outcome

- **WHEN** a user marks a scheduled dose as taken and then explicitly undoes that log
- **THEN** the taken outcome persists before undo
- **AND** undo returns the dose to its unlogged scheduled state
- **AND** each change is confirmed by the row's updated state mark and a notification

#### Scenario: No action is taken on a past-time dose

- **WHEN** the user leaves a past-time dose unlogged
- **THEN** the dose reads "Not logged" with no outcome created
- **AND** the application does not call it missed or suggest taking an extra dose

#### Scenario: Read today's timeline

- **WHEN** a user with doses before and after the current local time opens today's schedule
- **THEN** doses appear in scheduled-time order under Morning, Afternoon, and Evening headings, omitting empty periods
- **AND** a labeled current-time marker sits between earlier and later doses
- **AND** each dose shows its state with text and an icon, not color alone
- **AND** the next unlogged dose at or after the current time is visually and textually emphasized

#### Scenario: Filter the timeline

- **WHEN** the user chooses the To log or Logged filter, or a dashboard dial legend selection narrows the timeline
- **THEN** only matching doses remain under their period headings, the active filter is indicated, and Taken, Skip, and Undo actions keep working

#### Scenario: Narrow screen

- **WHEN** the timeline is viewed at 320 CSS pixels wide
- **THEN** every dose, state, period heading, and action remains readable and operable without horizontal scrolling

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

### Requirement: Medication calendar browsing

Users SHALL browse a monthly medication calendar and select a local date to inspect a time-ordered agenda. Month controls, a Today action, and a medication filter SHALL be available. The filter SHALL include current, upcoming, and completed owned medications, respect source-record scope, and remain independent of the medication list's search/status filters. Initial selection SHALL be local today.

#### Scenario: Change months across a short month

- **WHEN** a user moves from a month with the 31st selected to a shorter month
- **THEN** the selected date becomes that month's final valid day and its agenda is displayed
- **AND** leap years, year boundaries, and local dates are handled without UTC date shifts

#### Scenario: Filter calendar entries

- **WHEN** a user selects a medication
- **THEN** date counts and the selected-day agenda contain only that medication's outcomes and schedule projections
- **AND** clearing the filter restores all medications within the current source-record scope
- **AND** unrelated list search/status controls are unchanged

#### Scenario: Return to today

- **WHEN** a user activates Today after browsing another month
- **THEN** the displayed month and selected date return to the current local day
- **AND** the calendar medication filter remains selected

#### Scenario: Change source-record context

- **WHEN** navigation changes the source-record scope
- **THEN** calendar options and entries match the new scope and its medication filter resets to all within that scope
- **AND** unrelated medications are not exposed as linked results

#### Scenario: Browse without matching entries

- **WHEN** the selected date or medication filter has no entries
- **THEN** an explicit empty agenda distinguishes no scheduled entries from an empty account
- **AND** a filtered view offers a clear filter-reset action without creating data

### Requirement: Faithful calendar outcomes and projections

Calendar counts and agendas SHALL combine current-schedule coordinates with stored outcomes, counting each medication/date/time once. Stored outcomes SHALL retain their original coordinates even after schedule edits. Unlogged historical entries SHALL be labeled as current-schedule projections, not verified historical prescriptions or missed doses. Projection limitations and the use of current medication details SHALL be visible.

#### Scenario: Review an outcome after a time edit

- **WHEN** a dose was recorded at 08:00 and the current prescription later changes to 10:00
- **THEN** that day's agenda retains the recorded 08:00 outcome
- **AND** any unlogged 10:00 entry is identified as a current-schedule projection, not an additional verified historical dose
- **AND** each entry is counted once in its corresponding recorded or projected category

#### Scenario: Review recorded states

- **WHEN** a selected date contains taken, skipped, and unlogged entries
- **THEN** stored outcomes are labeled Taken or Skipped, past unlogged projections are labeled Not logged, and future unlogged projections are labeled Upcoming
- **AND** icons and text distinguish states without relying on color alone
- **AND** no new adherence percentage is inferred from projected entries

#### Scenario: Retain an outcome outside current treatment dates

- **WHEN** a stored log's original date is outside subsequently edited treatment dates
- **THEN** that recorded outcome remains visible at its original date and time
- **AND** no current-schedule projection is created outside the inclusive current treatment dates

### Requirement: Read-only calendar inspection

Inspecting the calendar SHALL not create, remove, or change dose logs or prescribed schedules. Past and future agendas SHALL not expose logging or rescheduling actions. Today's agenda SHALL offer navigation to the existing actionable schedule without changing its Taken, Skip, Undo, uniqueness, pending, or error behavior.

#### Scenario: Inspect history or a future date

- **WHEN** a user changes dates, months, or the calendar medication filter
- **THEN** no dose mutation or medication update is requested
- **AND** the application neither marks unlogged doses missed nor suggests taking late or extra doses

#### Scenario: Continue to today's check-in

- **WHEN** the user activates Go to today's schedule
- **THEN** focus and scroll move to today's existing schedule
- **AND** any outcome change still requires its explicit existing action

### Requirement: Responsive accessible calendar

Calendar navigation, dates, and filters SHALL have meaningful accessible names, visible selection/focus, and at least 44 by 44 CSS pixel targets. Narrow displays SHALL provide a week-first date rail and stacked agenda, with an available full-month view in contained scrolling rather than page-level overflow.

#### Scenario: Browse at 320 pixels with a keyboard

- **WHEN** a user opens the full-month view at 320 CSS pixels and focuses an offscreen date
- **THEN** the calendar scrolls that date into view within its labeled region
- **AND** the page itself does not overflow horizontally or shrink date targets below the minimum size
- **AND** the selected date and agenda date remain available as text
