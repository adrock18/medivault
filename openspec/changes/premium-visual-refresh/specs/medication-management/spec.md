# Spec Delta

## MODIFIED Requirements

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
