# Spec Delta

## MODIFIED Requirements

### Requirement: Factual daily insight

The dashboard SHALL show up to three short insight statements derived only from the user's own schedule, outcome logs, and records. Historical consistency SHALL describe days with recorded outcomes, not inferred prescription completeness. Insights SHALL not diagnose, give treatment advice, judge health values, or suggest taking late or additional doses.

#### Scenario: Doses remain later today

- **WHEN** a user has taken some of today's doses and another is scheduled later today
- **THEN** an insight states how many doses are logged and names the next scheduled medication and time

#### Scenario: Earlier doses are unlogged

- **WHEN** one or more of today's doses are past their scheduled time without an outcome
- **THEN** an insight states how many are not yet logged
- **AND** it does not recommend taking them or label them missed

#### Scenario: Consistent logging streak

- **WHEN** each of three consecutive local scheduled dates has at least one stored taken or skipped outcome
- **THEN** an insight can state three consecutive days with recorded outcomes and identify the ending date
- **AND** it does not claim that every historically prescribed dose was logged or that health improved

#### Scenario: Nothing to report

- **WHEN** an account has no medications and no records
- **THEN** the insight panel offers a neutral setup prompt instead of invented statistics

## ADDED Requirements

### Requirement: Honest logged-day milestones

The dashboard SHALL show unique local scheduled dates with recorded taken or skipped outcomes and milestones at three, seven, and thirty such days. Multiple outcomes on one date SHALL count once; future dates SHALL not count. Undo and medication deletion SHALL recompute the result. Milestones SHALL remain secondary to today's check-ins and SHALL not reward additional doses or imply clinical adherence.

#### Scenario: Several outcomes on one day

- **WHEN** an account records multiple taken and skipped outcomes for the same local scheduled date
- **THEN** that date contributes one logged day
- **AND** a skipped outcome has the same logged-day contribution as a taken outcome

#### Scenario: Undo or delete the only qualifying outcome

- **WHEN** the last stored outcome for a qualifying date is undone or removed through medication deletion
- **THEN** the logged-day count and any dependent milestone are recomputed
- **AND** no cached achievement persists as if the removed log still existed

#### Scenario: Schedule changes after logging

- **WHEN** a medication's dates or times change after an outcome was recorded
- **THEN** its original saved outcome date still counts as a day with a recorded outcome
- **AND** no fully-completed historical schedule is inferred from that fact

### Requirement: Explicit current logging-run meaning

A current logging run SHALL count consecutive local scheduled dates with at least one stored outcome, ending today if today qualifies or otherwise yesterday. Older disconnected runs SHALL not be described as current. Calendar arithmetic SHALL use local dates rather than fixed twenty-four-hour UTC intervals.

#### Scenario: Today's first outcome is not yet logged

- **WHEN** yesterday ends a qualifying three-day run and today has no outcome
- **THEN** the display identifies a three-day run ending yesterday
- **AND** a day with no scheduled medication is not fabricated as a logged day

#### Scenario: An older run is interrupted

- **WHEN** neither today nor yesterday has a stored outcome
- **THEN** no positive current run is displayed
- **AND** lifetime distinct logged-day milestones can remain visible with their separate meaning

#### Scenario: Local daylight-saving boundary

- **WHEN** qualifying dates cross a local daylight-saving or year boundary
- **THEN** adjacent local calendar dates remain consecutive without duplicate or shifted days

### Requirement: Confirmed and neutral accomplishment feedback

New logging feedback SHALL follow confirmed persistence, keep taken/skipped text explicit, and never encourage medication use or penalize skipped outcomes. Failed or pending mutations SHALL not trigger accomplishment feedback. Reload, passive refresh, and sign-in SHALL not replay an achievement celebration.

#### Scenario: A dose request fails

- **WHEN** a dose logging request is rejected or interrupted
- **THEN** the user receives the existing helpful error without a success animation or milestone advance
- **AND** retry and undo semantics remain unchanged

#### Scenario: A persisted check-in crosses a milestone

- **WHEN** a confirmed explicit outcome creates the third distinct logged day
- **THEN** a brief, dismissible or self-ending neutral acknowledgment can highlight the milestone
- **AND** equivalent readable confirmation remains available with reduced motion
