# Spec Delta

## ADDED Requirements

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
