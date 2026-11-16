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

### Requirement: Daily tasks take visual priority

The dashboard SHALL place today's medication check-ins and working prescription-scan, add-medication, and upload actions before historical detail. Measurement cards and charts SHALL not appear. It SHALL not place a promotional hero banner ahead of daily tasks.

#### Scenario: Open a dashboard with scheduled doses

- **WHEN** a signed-in user opens a dashboard with today's scheduled doses
- **THEN** today's routine and its available check-in actions precede historical detail
- **AND** the three quick actions are available without opening a separate navigation menu

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

The daily overview SHALL distinguish taken, skipped, and unlogged scheduled doses. Past-time indicators SHALL not automatically count doses as missed, taken, or skipped and SHALL not recommend taking late or additional doses.

#### Scenario: A scheduled time passes without a log

- **WHEN** a dose's local scheduled time passes and no outcome has been recorded
- **THEN** the dose remains unlogged and is labeled as past its scheduled time
- **AND** taken and skipped totals remain unchanged

### Requirement: Quick actions open the intended workflow

Each dashboard quick action SHALL open the corresponding prescription scan, medication, or upload workflow within the existing workspace and SHALL return the user to usable navigation after cancellation or completion.

#### Scenario: Start and cancel an upload

- **WHEN** a user selects the upload quick action and then cancels
- **THEN** the medical-record upload form opens with its required fields
- **AND** cancellation creates no document and leaves the workspace usable
