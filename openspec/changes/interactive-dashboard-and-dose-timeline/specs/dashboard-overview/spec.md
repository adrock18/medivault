# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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

The dashboard SHALL show up to three short insight statements derived only from the user's own schedule, outcome logs, and records. Insights SHALL state facts such as progress, the next scheduled dose, consecutive fully logged days, or unlogged earlier doses. They SHALL not diagnose, give treatment advice, judge health values, or suggest taking late or additional doses.

#### Scenario: Doses remain later today

- **WHEN** a user has taken some of today's doses and another is scheduled later today
- **THEN** an insight states how many doses are logged and names the next scheduled medication and time

#### Scenario: Earlier doses are unlogged

- **WHEN** one or more of today's doses are past their scheduled time without an outcome
- **THEN** an insight states how many are not yet logged
- **AND** it does not recommend taking them or label them missed

#### Scenario: Consistent logging streak

- **WHEN** every scheduled dose was logged on each of the previous three days
- **THEN** an insight states a three-day fully-logged streak without implying any health outcome

#### Scenario: Nothing to report

- **WHEN** an account has no medications and no records
- **THEN** the insight panel offers a neutral setup prompt instead of invented statistics
