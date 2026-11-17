# dashboard-overview Specification

## Purpose

Give users a clear, actionable overview of their own health information and prescribed medication routine without promotional clutter.

## Requirements

### Requirement: Database-derived overview

The dashboard SHALL derive record counts, active medication counts, scheduled/taken/skipped/pending dose totals, recent records, linked-medication counts, and upcoming schedules exclusively from the signed-in user's persisted data.

#### Scenario: A new account opens its dashboard

- **WHEN** an account with no healthcare entries opens the dashboard
- **THEN** counts reflect the empty account and absent schedules or records have explicit empty states
- **AND** no fictional entries or sample statistics are displayed automatically

#### Scenario: A completed mutation refreshes the overview

- **WHEN** a user successfully uploads a document or logs a dose
- **THEN** the refreshed dashboard totals and corresponding entries reflect the persisted result
- **AND** a page reload retains that result

#### Scenario: Visual totals match the underlying data

- **WHEN** a user with scheduled doses, outcome logs, records, and medications opens the dashboard
- **THEN** every dial mark, ring, chart bar, and count shows the same totals as the user's persisted data
- **AND** each visual exposes those totals as text available to assistive technology

### Requirement: Daily tasks take visual priority

The dashboard SHALL place today's medication check-ins and working prescription-scan, add-medication, and upload actions before historical detail. The daily routine SHALL be the dominant reading area, with supporting activity secondary in both desktop composition and narrow-screen reading order. Measurement cards and charts SHALL not appear. It SHALL not place a promotional hero banner ahead of daily tasks.

#### Scenario: Open a dashboard with scheduled doses

- **WHEN** a signed-in user opens a dashboard with today's scheduled doses
- **THEN** today's routine and its available check-in actions precede historical detail
- **AND** the three quick actions are available without opening a separate navigation menu

#### Scenario: Read the dashboard on a narrow screen

- **WHEN** the dashboard is viewed at 320 or 375 CSS pixels
- **THEN** today's routine and quick workflow actions precede the historical activity and recent-record sections in reading order
- **AND** the floating navigation does not cover the final available action

### Requirement: Contextual first-use guidance

The dashboard SHALL offer concise links for missing health-profile, document, and medication setup using persisted data to determine completion. Medication setup SHALL be optional and described as recording an existing prescription, not an instruction to start medication.

#### Scenario: Complete a setup item

- **WHEN** a user completes their profile and returns to the dashboard
- **THEN** the profile setup item is shown as complete or omitted
- **AND** the user can continue to use the dashboard without completing every other item

#### Scenario: No medication is recorded

- **WHEN** a user's account contains no medications
- **THEN** the dashboard does not treat medication use as mandatory or imply a treatment recommendation

### Requirement: Honest medication progress

The daily overview SHALL distinguish taken, skipped, and unlogged scheduled doses. A dose whose time has passed without an outcome SHALL be labeled "Not logged". Past-time indicators SHALL not automatically count doses as missed, taken, or skipped and SHALL not recommend taking late or additional doses.

#### Scenario: A scheduled time passes without a log

- **WHEN** a dose's local scheduled time passes and no outcome has been recorded
- **THEN** the dose remains unlogged and is labeled "Not logged"
- **AND** taken and skipped totals remain unchanged
- **AND** the word missed is not used for that dose

### Requirement: Quick actions open the intended workflow

Each dashboard quick action SHALL open the corresponding prescription scan, medication, or upload workflow within the existing workspace and SHALL return the user to usable navigation after cancellation or completion.

#### Scenario: Start and cancel an upload

- **WHEN** a user selects the upload quick action and then cancels
- **THEN** the medical-record upload form opens with its required fields
- **AND** cancellation creates no document and leaves the workspace usable

### Requirement: Today's dose dial

The dashboard SHALL show today's scheduled doses on a 24-hour dial, each at its local scheduled time and marked as taken, skipped, or not yet logged by shape and text, with a current-time hand and a central "X of Y taken" total. Legend controls for each state SHALL show counts and narrow today's timeline to that state, and the selection SHALL be clearable.

#### Scenario: Inspect today's progress

- **WHEN** a user has four doses today with one taken, one skipped, and two unlogged
- **THEN** the dial shows four marks at their scheduled times, a current-time hand, and "1 of 4 taken" or equivalent text
- **AND** a legend names each state with its count

#### Scenario: Drill into unlogged doses

- **WHEN** the user selects the not-yet-logged legend control using a pointer or keyboard
- **THEN** today's timeline shows only unlogged doses and indicates the active filter
- **AND** clearing the selection restores every dose

#### Scenario: No doses today

- **WHEN** no doses are scheduled today
- **THEN** the dial shows an explicit empty state instead of a zero total or percentage

### Requirement: Recorded adherence ring

The dashboard SHALL show recorded adherence for the last 30 days as a ring using taken outcomes divided by logged outcomes, labeled as such, and SHALL show an unavailable state when no outcomes exist in that period.

#### Scenario: Outcomes exist

- **WHEN** a user logged eight taken and two skipped outcomes in the last 30 days
- **THEN** the ring shows 80% labeled as taken divided by logged doses
- **AND** unlogged doses are not counted

#### Scenario: No outcomes

- **WHEN** a user has no outcome logs in the last 30 days
- **THEN** the ring shows an unavailable state rather than 0% or 100%

### Requirement: Seven-day dose activity chart

The dashboard SHALL chart the last seven local days, including today, showing taken, skipped, and unlogged scheduled doses per day. Each day SHALL be selectable to reveal its counts in text. Days before a medication's start date or after its end date SHALL not count that medication's doses.

#### Scenario: Review the past week

- **WHEN** a user opens the dashboard with dose logs on several of the last seven days
- **THEN** the chart shows one column per day with taken, skipped, and unlogged portions
- **AND** selecting a day by pointer or keyboard shows its date and the three counts in text

#### Scenario: Logs that no longer match the current schedule

- **WHEN** an outcome was logged for a time that is no longer in the medication's schedule
- **THEN** that outcome still counts for its original day
- **AND** it is not also counted as an unlogged scheduled dose

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

### Requirement: Daybook composition

The dashboard SHALL organize the date, scheduled times, medication identity, and check-in actions into a clearly aligned daily reading flow. Desktop supporting information SHALL occupy a secondary region rather than a uniform grid of equal-emphasis cards. The existing dose dial, state filters, seven-day chart, recorded-adherence ring, insights, and record/upcoming lists SHALL remain available with their existing data semantics.

#### Scenario: Inspect and act on the daily routine

- **WHEN** a user opens the desktop dashboard
- **THEN** the date and aligned dose times establish the routine's reading flow, with readable medication names, dosage, and explicit actions
- **AND** visual grouping does not depend on nesting every item inside another decorative card

#### Scenario: Use existing visual drill-downs

- **WHEN** a user selects a dial state or a day in the seven-day chart after the composition change
- **THEN** the existing timeline filtering or textual day breakdown still works
- **AND** Taken, Skip, and Undo retain their persistence, pending-state, and failure behavior

#### Scenario: Open an empty account

- **WHEN** the signed-in account has no medications or documents
- **THEN** the layout provides truthful empty states and optional setup actions
- **AND** it does not fill the composition with fictional health values or imply that taking medication is mandatory

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
