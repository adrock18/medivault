# Spec Delta

## MODIFIED Requirements

### Requirement: Consistent theme system

The website SHALL provide Light, Dark, and System appearance modes. Dark SHALL use ink and slate surfaces; Light SHALL use cloud and white surfaces. Blue SHALL identify navigation, green dose confirmations, and warm/cool accents time of day. Pages SHALL share type, spacing, and surface levels. System SHALL be the default and follow operating-system changes. A selection SHALL persist without storing health data or tokens in localStorage.

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
- **THEN** the medication feed is the primary daily task, with rounded dose cards, clear times, explicit log actions, and a quieter rhythm/activity column on wide screens
- **AND** blue capsule navigation identifies the current route, and dose state is conveyed by text and icons as well as color
- **AND** labels use sentence case, and metadata is separated by layout or words rather than middle-dot strings

### Requirement: Responsive workspace navigation

The workspace SHALL keep all current routes reachable at viewport widths of 320, 375, 768, 1280, and 1440 CSS pixels without page-level horizontal overflow. Below the desktop breakpoint, primary navigation SHALL appear as a floating dock inset from the screen edges and the device safe area, and it SHALL not cover page content or actions. Wide tables SHALL use contained scrolling or a readable compact presentation.

#### Scenario: Navigate on a narrow screen

- **WHEN** a signed-in user opens the workspace at 320 CSS pixels
- **THEN** primary navigation is usable without horizontal page scrolling
- **AND** profile and settings remain accessible through the navigation menu
- **AND** active navigation identifies the current page with text or shape as well as color

#### Scenario: Reach the end of a page on mobile

- **WHEN** a user scrolls to the bottom of any workspace page at 375 CSS pixels
- **THEN** the last content and its actions remain fully visible and operable above the floating dock

## ADDED Requirements

### Requirement: Layout-matched loading placeholders

While workspace data or page code loads for the first time, the workspace SHALL show placeholders in the shape of the page being opened instead of a lone spinner, announced to assistive technology as loading. Background refreshes SHALL keep previously loaded content visible with a small refreshing indicator. Placeholders SHALL never present invented values.

#### Scenario: Open the dashboard on a slow connection

- **WHEN** a signed-in user opens the dashboard before workspace data has loaded
- **THEN** placeholder blocks approximate the dial, timeline, and activity layout
- **AND** a screen reader announces that content is loading
- **AND** the placeholders are replaced by real content without a layout jump when data arrives

#### Scenario: Background refresh

- **WHEN** a mutation triggers a background refresh of already loaded data
- **THEN** the current content stays visible and only a small refreshing indicator appears

### Requirement: Purposeful reduced-motion-aware motion

Motion SHALL respond to navigation or a user action, such as changing route, opening a dialog, or logging a dose, and SHALL finish within 300 milliseconds. Content SHALL not animate on a timer or on scroll. When the operating system requests reduced motion, transitions SHALL be removed or replaced by an instant change, without losing any state or feedback.

#### Scenario: Change pages

- **WHEN** a user navigates between workspace pages
- **THEN** the new page content appears with one brief fade and focus and scroll behave as before

#### Scenario: Reduced motion requested

- **WHEN** the operating system requests reduced motion and the user changes pages or logs a dose
- **THEN** the change appears without animated movement
- **AND** the same text feedback and notifications are shown
