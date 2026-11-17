# Spec Delta

## MODIFIED Requirements

### Requirement: Consistent theme system

The website SHALL provide Light, Dark, and System modes with near-black navy dark surfaces, white light surfaces, restrained coordinated accents, and shared readable type, spacing, and elevation. System SHALL be the default and follow operating-system changes. Explicit selection SHALL persist and synchronize without storing health data or tokens in localStorage. Appearance transitions SHALL preserve legibility.

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

#### Scenario: Surfaces communicate hierarchy

- **WHEN** a user opens the dashboard or medications page in either appearance
- **THEN** the medication feed remains the primary task with clear dose times and actions and quieter supporting activity on wide screens
- **AND** active navigation and dose states have text or shape as well as color
- **AND** metadata and labels retain the existing readable sentence-case presentation

#### Scenario: Open a new overlay in dark appearance

- **WHEN** a user opens command navigation, the medication calendar, a summary, or a document preview in Dark mode
- **THEN** the view retains near-black surfaces with readable text and restrained accents
- **AND** no bright alternate-theme frame appears while it loads

### Requirement: Purposeful reduced-motion-aware motion

Workspace interaction motion SHALL finish within 250 milliseconds without delaying actions. Explicit appearance changes MAY use nonblocking background-only gloss up to 500 milliseconds. The authentication entrance MAY last 460 milliseconds; its existing pausable illustration is the sole continuous decorative exception. Reading content SHALL not animate on scroll. Reduced motion SHALL remove nonessential effects without losing state or feedback.

#### Scenario: Change pages

- **WHEN** a user navigates between workspace pages
- **THEN** the new page content appears with one brief fade and focus and scroll behave as before

#### Scenario: Reduced motion requested

- **WHEN** the operating system requests reduced motion and the user changes pages or logs a dose
- **THEN** the change appears without animated movement
- **AND** the same text feedback and notifications are shown

#### Scenario: Preserve authentication presentation

- **WHEN** a user opens login or registration without reduced motion
- **THEN** the existing authentication entrance finishes within 460 milliseconds without delaying controls
- **AND** the continuous medication illustration remains explicitly pausable and has a static reduced-motion alternative

## ADDED Requirements

### Requirement: Coordinated bounded workspace transitions

Route, overlay, selection, and confirmed-action effects SHALL finish within 250 milliseconds, excluding loading. Explicit appearance changes SHALL apply semantic colors immediately and atomically and MAY add background-only CSS gloss of at most 500 milliseconds. Effects SHALL not capture page or private-content snapshots, delay persistence, obscure text, intercept controls, or duplicate navigation. Unsupported CSS presentation SHALL fall back without losing functionality.

#### Scenario: Navigate rapidly between modules

- **WHEN** a user quickly moves from overview to medications to records
- **THEN** only the final selected destination remains active without stacked transitions or duplicate actions
- **AND** focus, scroll, and working navigation remain predictable

#### Scenario: Switch appearance while a transition is active

- **WHEN** an explicit appearance change interrupts another presentation effect
- **THEN** the final selected appearance wins immediately without a flash or stuck effect
- **AND** text retains its required contrast rather than blending foreground and background through unreadable intermediate colors
- **AND** controls, hit-testing, and keyboard focus remain live throughout the background-only effect

#### Scenario: Browser does not support enhanced transitions

- **WHEN** a user navigates or changes appearance without enhanced-transition support
- **THEN** the destination or theme still updates correctly with a static or existing brief fallback
- **AND** no console error or blocked control results

#### Scenario: Authentication changes during a transition

- **WHEN** a user signs out or the session expires while a workspace effect is active
- **THEN** the private view is removed promptly and any appearance decoration is cancelled
- **AND** the transition cannot revive private content under the signed-out interface

### Requirement: Restrained glass and perspective feedback

Glassy highlights and small decorative perspective effects SHALL reinforce existing surfaces and user actions without moving reading content on scroll. Hover depth SHALL apply only to fine pointers. Effects SHALL not obscure labels, clip focus rings, create page overflow, or introduce a required graphics runtime.

#### Scenario: Use a touch device or keyboard

- **WHEN** a user operates cards and actions on a touch device or with a keyboard
- **THEN** meaningful states remain visible without requiring hover or perspective
- **AND** controls retain their existing target size, readable text, and visible focus

### Requirement: Static and reduced-motion alternatives

Reduced motion SHALL disable nonessential route/theme movement, rotation, perspective, and celebration while preserving state and readable feedback. Ambient background depth SHALL be static except for the bounded explicit appearance gloss. The authentication illustration SHALL retain its pause/resume control and static reduced-motion presentation; operating-system and cross-tab appearance updates SHALL change colors immediately without launching decorative gloss.

#### Scenario: Reduce motion while using the workspace

- **WHEN** reduced motion is enabled before or during a route, appearance, or accomplishment interaction
- **THEN** positional and rotational effects stop or are skipped and the final correct state remains visible
- **AND** no required action or status depends on animation

#### Scenario: Pause authentication decoration

- **WHEN** a user pauses the authentication illustration
- **THEN** its medication-form and orbit motion stop
- **AND** no other continuous ambient animation competes with the paused presentation
