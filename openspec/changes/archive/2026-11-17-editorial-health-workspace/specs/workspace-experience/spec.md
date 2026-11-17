# Spec Delta

## MODIFIED Requirements

### Requirement: Consistent theme system

The website SHALL provide Light, Dark, and System modes with a near-black navy dark workspace, restrained coordinated accents, readable typography, and shared spacing, border, elevation, and interaction treatments. System SHALL be the initial default and follow operating-system appearance changes. An explicit selection SHALL persist in this browser without storing health information or authentication tokens in localStorage.

#### Scenario: Navigate between modules

- **WHEN** a user visits login, dashboard, records, medications, profile, and settings
- **THEN** equivalent headings, cards, forms, buttons, and feedback states use consistent styling
- **AND** destructive and disabled actions remain distinguishable from primary actions

#### Scenario: Choose and restore an appearance

- **WHEN** a user selects Light, Dark, or System on the authentication page, workspace header, or settings page
- **THEN** all appearance controls, charts, dialogs, forms, and notifications reflect the selected appearance
- **AND** the preference is restored after reload and synchronized across browser tabs
- **AND** inability to save the preference is reported without preventing the current appearance change

#### Scenario: Follow operating-system appearance

- **WHEN** System is selected and the operating-system color preference changes
- **THEN** the website updates its appearance without requiring a reload
- **AND** an explicit Light or Dark selection overrides operating-system changes

#### Scenario: Open a new overlay in dark appearance

- **WHEN** a user opens command navigation, the medication calendar, or a document preview in Dark mode
- **THEN** the view retains near-black surfaces with readable text and restrained accents
- **AND** no bright alternate-theme frame appears while it loads

## ADDED Requirements

### Requirement: Searchable command navigation

Signed-in users SHALL open a searchable navigation-and-action palette from a visible control or Ctrl+K/Cmd+K. It SHALL offer existing workspace destinations and medication-add, prescription-scan, record-upload, and today entry points. Search SHALL normalize case and surrounding whitespace. It SHALL not run destructive or dose mutations, search medical contents, or persist search queries.

#### Scenario: Find and launch a workflow

- **WHEN** a user searches for " UPLOAD " and activates the matching action
- **THEN** the palette closes and the existing record-upload workflow opens
- **AND** cancellation creates no record and leaves ordinary workspace navigation usable

#### Scenario: Navigate and dismiss using a keyboard

- **WHEN** a user opens command navigation and uses Tab, Shift+Tab, Enter, and Escape
- **THEN** search and result actions are operable, focus remains inside the open dialog, and Escape closes it
- **AND** dismissal returns focus to the originating control

#### Scenario: Preserve editing and modal context

- **WHEN** the shortcut is pressed while focus is in editable content or another modal is open
- **THEN** command navigation does not interrupt that interaction or open a stacked dialog

#### Scenario: No action matches

- **WHEN** a search matches no available action
- **THEN** the palette displays an explicit no-results state and a way to clear the query
- **AND** closing and reopening starts with an empty query

### Requirement: Purposeful motion and static alternatives

Interaction motion SHALL communicate navigation, selection, inspection, or a confirmed state change without delaying actions or hiding content. Reduced-motion preferences SHALL remove positional and rotational effects. The existing authentication medication-form animation SHALL retain its pause/resume control and static reduced-motion presentation.

#### Scenario: Select a date and open a preview

- **WHEN** a user selects a calendar date or opens a document preview
- **THEN** selection and overlay feedback completes within 250 milliseconds, excluding network loading
- **AND** keyboard focus and the selected state remain clearly visible

#### Scenario: Reduce motion

- **WHEN** reduced motion is enabled
- **THEN** the calendar, palette, and preview remain operable without positional or rotational transitions
- **AND** the authentication illustration shows a static medication form without a misleading pause control
