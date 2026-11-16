# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit local-time dose tracking

Today's schedule SHALL display medication identity, prescribed dosage, local scheduled time, and a text-labeled scheduled, taken, or skipped outcome as a time-ordered timeline. The timeline SHALL mark the current time, distinguish earlier from later doses, and emphasize the next unlogged dose. Only an explicit user action SHALL create or remove an outcome log.

#### Scenario: Record and undo an outcome

- **WHEN** a user marks a scheduled dose as taken and then explicitly undoes that log
- **THEN** the taken outcome persists before undo
- **AND** undo returns the dose to its unlogged scheduled state

#### Scenario: No action is taken on a past-time dose

- **WHEN** the user leaves a past-time dose unlogged
- **THEN** the application does not create an outcome or suggest taking an extra dose

#### Scenario: Read today's timeline

- **WHEN** a user with doses before and after the current local time opens today's schedule
- **THEN** doses appear in scheduled-time order with a labeled current-time marker between earlier and later doses
- **AND** each dose shows its state with text and an icon, not color alone
- **AND** the next unlogged dose at or after the current time is visually and textually emphasized

#### Scenario: Filter the timeline

- **WHEN** the user chooses the To log or Logged filter, or a dashboard dial legend selection narrows the timeline
- **THEN** only matching doses remain, the active filter is indicated, and Taken, Skip, and Undo actions keep working

#### Scenario: Narrow screen

- **WHEN** the timeline is viewed at 320 CSS pixels wide
- **THEN** every dose, state, and action remains readable and operable without horizontal scrolling
