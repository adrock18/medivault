# Spec Delta

## MODIFIED Requirements

### Requirement: Working account access

Users SHALL register, sign in and sign out through Supabase Auth using the
same-origin backend. Registration SHALL return either a real persisted session
or an explicit email-confirmation-required result according to project settings.
Authenticated users SHALL reach the dashboard; signed-out, invalid or revoked
sessions SHALL NOT access protected workspace data.

#### Scenario: Register and reload

- **GIVEN** the project permits immediate email/password sessions
- **WHEN** a user registers with valid matching credentials and reloads
- **THEN** the account remains signed in through its Supabase-backed session
- **AND** the dashboard displays only that account's data

#### Scenario: Sign out

- **WHEN** a user signs out and revisits a protected route
- **THEN** the website redirects to login
- **AND** protected API requests reject the ended session

#### Scenario: Registration requires confirmation

- **GIVEN** the project requires email confirmation
- **WHEN** a valid registration does not produce an authenticated session
- **THEN** the website explains that confirmation is required instead of entering
  the dashboard or reporting malformed API data
- **AND** it does not claim that an email was delivered

#### Scenario: Complete or fail a confirmation callback

- **WHEN** a user follows a confirmation link back to the allowed application
- **THEN** a valid supported exchange establishes the session and opens the workspace
- **AND** an expired link, missing verifier or rejected exchange explains how to
  retry or sign in without exposing tokens or redirecting to an arbitrary host

#### Scenario: Auth service is unavailable

- **WHEN** an existing session cannot be verified because the provider is unavailable
- **THEN** the website receives a retryable failure rather than a fabricated
  signed-out or authenticated result
- **AND** otherwise valid cookies are not discarded solely because of the outage

### Requirement: Persistent owner-specific healthcare data

All healthcare reads, writes and file requests SHALL enforce account ownership.
Application rows SHALL persist in Supabase PostgreSQL, documents in private
Supabase Storage, and sessions in Supabase Auth. Host filesystem replacement
SHALL NOT require SQLite restoration. Browser storage SHALL NOT hold passwords,
authentication tokens or healthcare datasets.

#### Scenario: Restart after saving healthcare data

- **WHEN** the application restarts against the same configured Supabase project
- **THEN** the owner's saved profile, medications, logs, records and archived
  measurements remain available
- **AND** another account cannot read or change them

#### Scenario: Restart on an ephemeral host with durable storage

- **WHEN** the application restarts with an empty host filesystem
- **THEN** the owner's saved healthcare data and documents remain available
- **AND** their unexpired Supabase session remains usable without local restoration

#### Scenario: Refresh a session

- **WHEN** a valid refreshable session outlives its current access token
- **THEN** the backend renews secure HttpOnly cookies and retains access
- **AND** no access or refresh token is returned to browser scripts or persisted
  in browser local/session storage

### Requirement: Retired tracker preserves existing data

The website SHALL retain the medications/records focus without a Health Tracker
page or measurement charts. The managed schema and export SHALL retain the
owner-scoped archived-measurement shape, empty for fresh accounts. The approved
fresh start SHALL NOT import old SQLite measurements or reintroduce retired
measurement-mutation endpoints.

#### Scenario: Open a retired tracker bookmark

- **WHEN** a signed-in user visits `/health-tracker`
- **THEN** the website redirects to Medications
- **AND** the redirect does not reset their current account or session

#### Scenario: Export previous measurements

- **WHEN** an owner exports healthcare information in the fresh Supabase environment
- **THEN** the archived-measurement collection remains in the export contract
- **AND** old SQLite measurements are not implied to have been imported, and no
  other account's measurements are included

### Requirement: Usable full-stack startup and production serving

Development SHALL start the website/API together when required Supabase settings
are supplied. Production SHALL validate frontend artifacts, HTTPS/cookie/origin
settings and managed-service configuration before listening, then serve deep
links and API on one origin. Unavailable services SHALL produce explicit failures
instead of fake data or local-persistence fallback.

#### Scenario: Recover from an unavailable backend

- **WHEN** the backend is unavailable and later restarted
- **THEN** the website initially reports the connection failure
- **AND** retry can restore the real signed-in or signed-out state

#### Scenario: Open a production deep link

- **WHEN** a user opens a workspace route directly on the configured production host
- **THEN** the website loads and performs same-origin session and data requests

#### Scenario: Start production without a complete build

- **WHEN** production startup lacks its entry, valid manifest, referenced chunks
  or required local scanning assets
- **THEN** startup exits nonzero with build/redeploy guidance
- **AND** it does not bind a listening address or announce successful startup

#### Scenario: Start production with incomplete bucket configuration

- **WHEN** required Supabase URL, credentials or private document-bucket settings
  are missing or malformed
- **THEN** startup exits nonzero naming the setting without printing secret values
- **AND** it does not bind a listening address or use local/B2 document storage

#### Scenario: Preserve production configuration boundaries

- **WHEN** a complete build starts in production
- **THEN** secure HttpOnly cookies, request protection, owner checks, private
  document access and local OCR remain in effect
- **AND** non-production API startup requires Supabase configuration but not a
  frontend build or obsolete B2 credentials

## ADDED Requirements

### Requirement: Explicit fresh-start account boundary

The Supabase release SHALL start without importing legacy accounts, sessions or
healthcare data. Existing users SHALL receive clear re-registration guidance;
failed old logins SHALL NOT create accounts automatically. This fresh start
SHALL NOT delete or reset old local data, remote objects or replicas.

#### Scenario: Visit the replacement release with an old session

- **WHEN** a browser presents only the retired application's session cookie
- **THEN** it is treated as signed out and offered the current registration/login flow
- **AND** no existing Supabase account is created, replaced or impersonated

#### Scenario: Create a fresh account

- **WHEN** a new account is initialized
- **THEN** it contains its self profile and default-off notification preferences
- **AND** medical records, medications, visits and follow-ups remain empty until
  explicitly entered or added through the existing sample-data action
