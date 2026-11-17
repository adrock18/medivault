# Spec Delta

## Purpose

Let an owner review and print a factual, date-bounded snapshot of their saved medication activity and record metadata without sharing private documents or implying clinical interpretation.

## ADDED Requirements

### Requirement: Explicit owner-only summary generation

The authenticated workspace SHALL offer an activity-summary preview from Settings. The user SHALL choose an inclusive local-date range, with seven-day and thirty-day presets, before generating a freshly fetched snapshot. Invalid, reversed, or future date bounds SHALL prevent generation. Failed loading SHALL report an error and offer retry without presenting stale data as a new summary.

#### Scenario: Generate a bounded snapshot

- **WHEN** an owner selects a valid inclusive range and generates a summary
- **THEN** the preview shows that range, the snapshot time, and only that owner's saved data
- **AND** later background refreshes do not silently change the displayed snapshot before printing

#### Scenario: Invalid bounds or failed refresh

- **WHEN** a user submits invalid dates or the snapshot request fails
- **THEN** the interface explains the problem and does not enable printing a newly generated summary
- **AND** the date inputs remain available for correction or retry

### Requirement: Factual activity and current-detail provenance

The summary SHALL distinguish stored taken/skipped outcomes from current saved medication details. Dose counts SHALL use original scheduled dates within the selected range. Record metadata SHALL use record dates within the range. Unlogged historical projections SHALL not become verified doses, missed outcomes, or an adherence denominator. Empty sections SHALL state their absence.

#### Scenario: Prescription changed after an outcome

- **WHEN** a selected range includes an outcome preceding a medication edit
- **THEN** the outcome retains its saved scheduled date, time, and status
- **AND** accompanying medication names, dosage, and instructions are labeled current saved details rather than a historical prescription

#### Scenario: Counts are inspectable

- **WHEN** a summary contains taken and skipped outcomes
- **THEN** the displayed totals equal its recorded rows
- **AND** any recorded-adherence value is labeled taken divided by logged outcomes and is unavailable for zero outcomes

#### Scenario: No matching activity

- **WHEN** the chosen range contains no saved outcomes or record metadata
- **THEN** the summary displays truthful empty sections
- **AND** it does not invent activity, infer missed doses, or recommend treatment

### Requirement: Explicit sensitive print copies

Printing SHALL require an explicit action after preview and a warning that printed or saved copies are sensitive. The action SHALL invoke browser Print / Save as PDF, not claim automatic PDF generation or completed saving. The print presentation SHALL omit workspace chrome, private document bytes, OCR excerpts, credentials, and unselected profile details, and SHALL remain readable on light paper.

#### Scenario: Preview and cancel printing

- **WHEN** a user invokes printing and cancels the browser dialog
- **THEN** the application does not claim that a file was downloaded or saved
- **AND** no remote sharing, analytics payload, or healthcare mutation occurs

#### Scenario: Print long content

- **WHEN** a summary with long names, instructions, or multiple pages is printed
- **THEN** text wraps without clipped columns and sections have usable page breaks
- **AND** navigation, floating controls, decorative backgrounds, and animation do not obscure the report

### Requirement: Ephemeral authenticated summary lifecycle

Summary snapshots SHALL remain in application memory only and SHALL clear when dismissed, signed out, or session-invalidated. Print access SHALL be unavailable while loading or after access expires. Existing JSON export SHALL remain available with its retained legacy measurements.

#### Scenario: Session expires during summary generation

- **WHEN** authentication expires while a snapshot is loading or displayed
- **THEN** private summary content is removed and a late response cannot restore it
- **AND** returning to summary generation requires a valid session
