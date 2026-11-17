# Spec Delta

## ADDED Requirements

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
