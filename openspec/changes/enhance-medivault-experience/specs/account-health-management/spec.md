# Spec Delta

## Purpose

Preserve usable account access, personal health information, measurements, and settings throughout the medication-and-records experience upgrade.

## ADDED Requirements

### Requirement: Working account access

Users SHALL register, sign in, and sign out through the actual backend. Registration SHALL establish a session, authenticated users SHALL reach the dashboard, and signed-out or expired sessions SHALL not access protected workspace data.

#### Scenario: Register and reload

- **WHEN** a user registers with valid matching credentials and reloads the website
- **THEN** the account remains signed in through its persisted session
- **AND** the dashboard displays only that account's data

#### Scenario: Sign out

- **WHEN** a user signs out and revisits a protected route
- **THEN** the website redirects to login
- **AND** protected API requests are rejected

### Requirement: Persistent owner-specific healthcare data

All healthcare reads, writes, and file requests SHALL enforce account ownership on the backend. Healthcare entries and sessions SHALL survive application restarts on persistent storage, and browser storage SHALL not hold passwords, authentication tokens, or healthcare datasets.

#### Scenario: Restart after saving healthcare data

- **WHEN** the application restarts using the same persistent data directory
- **THEN** the owner's saved profile, medications, logs, records, and measurements remain available
- **AND** another account cannot read or change them

### Requirement: Validated personal health profile

Users SHALL save and edit their own name, birth date, optional gender, blood group, height, weight, allergies, conditions, and emergency contact using validated forms. Saved account names SHALL remain consistent across the profile and workspace.

#### Scenario: Save a changed display name

- **WHEN** a user saves a valid changed name in their health profile
- **THEN** the profile and workspace account display reflect that name after refresh and reload

### Requirement: Measurement management and history

Users SHALL create, edit, and delete blood-pressure, glucose, weight, and heart-rate measurements with date/time and applicable units. Future or invalid measurements SHALL be rejected, and history filters, latest cards, and charts SHALL reflect persisted values without diagnosis or treatment recommendations.

#### Scenario: Filter recorded measurements

- **WHEN** a user selects a measurement type and date range
- **THEN** the history and chart display the matching persisted values
- **AND** the empty state is explicit when no measurements match

#### Scenario: Submit a future measurement

- **WHEN** a user submits a measurement timestamp in the future
- **THEN** validation reports the problem and no measurement is saved

### Requirement: Verified password changes

Changing a password SHALL require the current password, update the account credentials, and revoke other sessions without storing or exposing plaintext passwords.

#### Scenario: Reject an incorrect current password

- **WHEN** a signed-in user submits an incorrect current password
- **THEN** the change fails with a helpful error
- **AND** the current credentials remain unchanged

### Requirement: Explicit export and sample-data actions

Settings SHALL offer an explicit export of the current user's healthcare metadata and explicit opt-in fictional sample data. Exported data SHALL exclude passwords, session tokens, and other accounts' information; sample entries SHALL be labeled fictional and SHALL not overwrite the health profile.

#### Scenario: Export owned information

- **WHEN** a user requests a healthcare export
- **THEN** the downloaded metadata contains only that user's healthcare information
- **AND** the website warns that downloaded copies are sensitive

### Requirement: Usable full-stack startup and production serving

The documented development command SHALL start the website and API together. Production startup with valid HTTPS and persistent-storage configuration SHALL serve workspace deep links and the API on one origin. API unavailability SHALL produce a visible retryable error rather than fake data.

#### Scenario: Recover from an unavailable backend

- **WHEN** the backend is unavailable and later restarted
- **THEN** the website initially reports the connection failure
- **AND** retry can restore the real signed-in or signed-out state

#### Scenario: Open a production deep link

- **WHEN** a user opens a workspace route directly on the configured production host
- **THEN** the website loads and performs same-origin session and data requests
