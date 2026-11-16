# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
