# Proposal

## Why

Owners can organize records and medications for family profiles, but the care timeline needs editing controls to correct tracks and visits, and unused profiles need a safe cleanup path. These workflows must not silently remove medical data or make a family's shared account look like separate identities.

## What Changes

- Add owner-facing editing for existing care tracks and visits, including a visit's optional care-track association.
- Allow an owner to delete a non-owner family profile only when it has no associated records, medications, historical measurements, care tracks, or visits.
- Reject self-profile deletion and prevent deletion of profiles with health data; do not cascade-delete or automatically reassign health data.
- Preserve the current owner-managed family workspace model and make the API failure visible in the confirmation flow.

## Capabilities

### New Capabilities

- `care-organization`: Let an owner edit saved care tracks and visits in the profile-scoped timeline.

### Modified Capabilities

- `account-health-management`: Add safe deletion rules for owner-managed family profiles.

## Impact

- Frontend: care timeline actions and form modes, family-profile deletion confirmation, and typed API calls.
- Backend: owner-scoped family-profile deletion with a transactional dependent-data check; existing care-track and visit update endpoints remain the persistence boundary.
- Verification and documentation: focused API and browser regression coverage plus updates to the endpoint, architecture, and development guides.
- No schema migration, external service, or new clinical interpretation is introduced.

The implementation and local verification preceded this change capture; the change records the delivered behavior and its acceptance contract.
