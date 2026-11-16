# Spec Delta

## Purpose

Provide a coherent, professional healthcare workspace that remains readable, accessible, and usable across supported screen sizes.

## ADDED Requirements

### Requirement: Consistent light visual system

The website SHALL use a consistent light theme with neutral surfaces, restrained teal accents, readable typography, and shared spacing, border, elevation, and interaction treatments across every current page.

#### Scenario: Navigate between modules

- **WHEN** a user visits login, dashboard, records, medications, profile, tracker, and settings
- **THEN** equivalent headings, cards, forms, buttons, and feedback states use consistent styling
- **AND** destructive and disabled actions remain distinguishable from primary actions

### Requirement: Responsive workspace navigation

The workspace SHALL keep all current routes reachable at viewport widths of 320, 375, 768, 1280, and 1440 CSS pixels without page-level horizontal overflow. Wide tables SHALL use contained scrolling or a readable compact presentation.

#### Scenario: Navigate on a narrow screen

- **WHEN** a signed-in user opens the workspace at 320 CSS pixels
- **THEN** primary navigation is usable without horizontal page scrolling
- **AND** profile and settings remain accessible through the navigation menu
- **AND** active navigation identifies the current page

### Requirement: Accessible interactions

Interactive controls SHALL expose meaningful accessible names, visible keyboard focus, and touch targets of at least 44 by 44 CSS pixels. Normal text SHALL meet a 4.5:1 contrast ratio and large text a 3:1 ratio against its background. Status meaning SHALL not rely on color alone.

#### Scenario: Complete a task using a keyboard

- **WHEN** a user navigates a form and its actions using only the keyboard
- **THEN** each focused control is visible and meaningfully labeled
- **AND** validation messages identify the affected inputs
- **AND** dose outcomes and errors have readable text labels

### Requirement: Predictable dialog behavior

Dialogs SHALL keep focus inside the open dialog, expose a title, provide an available cancellation action before submission, and return focus to the trigger when closed. Pending mutations SHALL prevent duplicate submission and accidental dismissal.

#### Scenario: Cancel a destructive dialog

- **WHEN** a user opens a delete confirmation and cancels before submitting
- **THEN** no delete request is issued
- **AND** focus returns to the originating action

### Requirement: Truthful asynchronous feedback

The workspace SHALL distinguish initial loading, background refresh, empty results, validation failure, request failure, and successful persistence. Failures SHALL retain retryable user input or visibly label previously loaded data as stale, and SHALL never display successful persistence for a failed mutation.

#### Scenario: A save request fails

- **WHEN** a user submits valid input and the server rejects or cannot complete the request
- **THEN** the website displays a helpful error and preserves the entered values
- **AND** the user can retry without creating a success-shaped placeholder entry

#### Scenario: Background refresh fails

- **WHEN** previously loaded workspace data cannot be refreshed
- **THEN** that data remains visible with an explicit stale-data notice and retry action

### Requirement: Bounded initial JavaScript entry

The production entry JavaScript chunk SHALL be at most 500,000 bytes after minification, before compression, without removing required functionality or increasing the configured warning threshold to conceal a violation.

#### Scenario: Validate the production build

- **WHEN** a production build is generated
- **THEN** the emitted entry JavaScript chunk meets the size bound
- **AND** all current routes still load and perform their supported actions
