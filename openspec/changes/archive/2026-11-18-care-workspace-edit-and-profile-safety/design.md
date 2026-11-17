# Design

## Context

See [proposal.md](proposal.md) for motivation and the delta specifications for
the required behavior. The application already has owner-scoped update
endpoints for care tracks and visits. The shared care dialog now serves create
and edit flows; the profile page calls an owner-scoped delete endpoint. That
endpoint checks records, medications, retained measurements, care tracks, and
visits before removing a non-self profile.

## Goals / Non-Goals

**Goals:**

- Reuse existing validation, mutation feedback, reload, and ownership patterns.
- Ensure profile deletion is all-or-nothing with respect to the dependency
  check and never cascade-delete medical data.
- Keep care tracks and visits explicit organizational labels selected by the
  owner.

**Non-Goals:**

- Reassigning health data between family profiles.
- Deleting profiles that still have associated data, including archived
  measurements.
- Adding a separate family-member login, clinical inference, schema migration,
  or external service.

## Decisions

### Reuse the care create forms for editing

The care dialog accepts the existing track or visit when editing, initializes
the same validated form with its saved values, calls the existing update
operation, and reloads the vault before closing. This avoids separate edit
forms and keeps create/update validation aligned. The alternative—read-only
timeline entries or separate edit pages—would duplicate UI and make corrections
less discoverable.

### Reject family-profile deletion while any associated data exists

The delete operation verifies ownership and rejects the account owner's
`self` profile. Within a database transaction it checks every profile-bound
health-data domain before deleting the row. The UI confirms the target, displays
the server error if blocked, and refreshes the owned workspace after success.
Rejecting is preferred over cascading deletion or automatic reassignment:
neither silently discards health history nor guesses which person should own
it. The selected-profile provider falls back to the owner's profile after a
successful deletion.

### Keep local verification isolated

Backend tests exercise ownership, self-profile rejection, dependent-data
protection, and deletion of an empty profile. A focused browser workflow
exercises track/visit edits and empty-profile deletion against the local
application. No live storage, OCR provider, or email service is needed to
verify these changes.

## Risks / Trade-offs

- [Archived measurements can prevent deletion even though the tracker is
  retired] -> Explain this in the API error and preserve those measurements in
  account export rather than adding an unsafe cleanup path.
- [A profile with dependent data cannot be deleted from one action] -> Keep the
  conflict explicit; do not imply that family-profile deletion removes or
  reassigns records.
- [Edits can change user-entered organization] -> Keep care tracks and visits
  profile-scoped, validated, and owner-controlled; do not infer clinical links.

## Migration Plan

No database migration or new runtime configuration is needed. Deploy the
application code and documentation together. A rollback can remove the new UI
and delete route without a schema rollback; already-saved care edits remain
ordinary persisted values. Successfully deleted empty profiles cannot be
restored by application rollback and require a backup if recovery is needed.
