# account-health-management Specification

## Purpose

Preserve usable account access, personal health information, measurements, and settings throughout the medication-and-records experience upgrade.

## Requirements

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

All healthcare reads, writes, and file requests SHALL enforce account ownership on the backend. Healthcare entries and sessions SHALL survive application restarts on persistent storage or, on hosts with ephemeral filesystems, through configured durable database replication and document storage. Browser storage SHALL not hold passwords, authentication tokens, or healthcare datasets.

#### Scenario: Restart after saving healthcare data

- **WHEN** the application restarts using the same persistent data directory
- **THEN** the owner's saved profile, medications, logs, records, and measurements remain available
- **AND** another account cannot read or change them

#### Scenario: Restart on an ephemeral host with durable storage

- **WHEN** the application restarts with an empty local filesystem and durable database replication and document storage configured
- **THEN** the owner's saved profile, medications, logs, records, measurements, and documents remain available
- **AND** another account cannot read or change them

### Requirement: Validated personal health profile

Users SHALL save and edit their own name, birth date, optional gender, blood group, height, weight, allergies, conditions, and emergency contact using validated forms. Saved account names SHALL remain consistent across the profile and workspace.

#### Scenario: Save a changed display name

- **WHEN** a user saves a valid changed name in their health profile
- **THEN** the profile and workspace account display reflect that name after refresh and reload

### Requirement: Retired tracker preserves existing data

The website SHALL focus on medications and medical records rather than exposing a Health Tracker page or measurement charts. Existing measurements SHALL remain owner-specific in persistent storage and exports. Legacy measurement APIs SHALL retain validation and ownership protection for compatibility.

#### Scenario: Open a retired tracker bookmark

- **WHEN** a signed-in user visits `/health-tracker`
- **THEN** the website redirects to Medications
- **AND** existing measurements and sessions are not deleted

#### Scenario: Export previous measurements

- **WHEN** an owner exports healthcare information after the tracker is retired
- **THEN** their previous measurements remain included
- **AND** another account cannot access them

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

The documented development command SHALL start the website and API together. Production startup SHALL validate required frontend artifacts and the selected storage configuration before opening storage or listening, then serve deep links and the API on one origin with valid HTTPS and persistent-storage configuration. API unavailability SHALL produce a visible retryable error rather than fake data.

#### Scenario: Recover from an unavailable backend

- **WHEN** the backend is unavailable and later restarted
- **THEN** the website initially reports the connection failure
- **AND** retry can restore the real signed-in or signed-out state

#### Scenario: Open a production deep link

- **WHEN** a user opens a workspace route directly on the configured production host
- **THEN** the website loads and performs same-origin session and data requests

#### Scenario: Start production without a complete build

- **WHEN** production startup is attempted without the frontend entry, valid build manifest, referenced application chunks, or required local scanning assets
- **THEN** startup exits nonzero and identifies the missing or invalid build artifact with build/redeploy guidance
- **AND** it does not open application storage, bind a listening address, or announce successful startup

#### Scenario: Start production with incomplete bucket configuration

- **WHEN** bucket document storage is selected but its endpoint, bucket name, or credentials are missing or malformed
- **THEN** startup exits nonzero naming the missing setting without printing secret values
- **AND** it does not open application storage, bind a listening address, or fall back to local document storage

#### Scenario: Preserve production configuration boundaries

- **WHEN** a complete build starts in production
- **THEN** existing secure-cookie requirements, ownership checks, private document storage, and local OCR remain in effect
- **AND** neither development nor standalone non-production API startup requires a frontend build or bucket credentials

### Requirement: Safe deletion of managed family profiles

The system SHALL allow an account owner to delete a non-owner family profile only when it has no associated medical records, medications, archived measurements, care tracks, or visits. It SHALL reject deletion of the owner's self profile or another account's profile and SHALL never cascade-delete health data.

#### Scenario: Delete an empty managed profile

- **WHEN** an owner confirms deletion of a non-self profile with no associated health data
- **THEN** the profile is deleted and absent from the owner's family-profile list after refresh

#### Scenario: Preserve data for a profile with health entries

- **WHEN** an owner attempts to delete a profile that has a medical record, medication, archived measurement, care track, or visit
- **THEN** deletion is rejected with a clear explanation
- **AND** the profile and all associated health data remain unchanged

#### Scenario: Reject self or cross-account deletion

- **WHEN** an owner attempts to delete their self profile or a different account's family profile
- **THEN** the self-profile request is rejected and the other account's profile is not disclosed or changed
