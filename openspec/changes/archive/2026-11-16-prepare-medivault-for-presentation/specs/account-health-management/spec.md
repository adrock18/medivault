# Spec Delta

## MODIFIED Requirements

### Requirement: Usable full-stack startup and production serving

The documented development command SHALL start the website and API together. Production startup SHALL validate required frontend artifacts before opening storage or listening, then serve deep links and the API on one origin with valid HTTPS and persistent-storage configuration. API unavailability SHALL produce a visible retryable error rather than fake data.

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

#### Scenario: Preserve production configuration boundaries

- **WHEN** a complete build starts in production
- **THEN** existing secure-cookie requirements, ownership checks, private document storage, and local OCR remain in effect
- **AND** neither development nor standalone non-production API startup requires a frontend build
