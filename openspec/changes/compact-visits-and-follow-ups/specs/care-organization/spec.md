# Spec Delta

## ADDED Requirements

### Requirement: Manually confirmed visit follow-up

An owner SHALL save one optional follow-up per recorded visit with a due date, original instruction, and optional source document. The owner SHALL enter an exact date or confirm a date calculated from positive whole days after the visit. The system SHALL distinguish a follow-up due from a booked appointment and SHALL NOT create follow-ups automatically from OCR.

#### Scenario: Calculate from the original visit date

- **WHEN** an owner records a visit on November 18 and enters return after five days
- **THEN** the editor previews November 23 regardless of the current date
- **AND** saving the calculated date requires explicit confirmation
- **AND** changing the visit date or interval invalidates that confirmation

#### Scenario: Validate dates and preserve failed input

- **WHEN** a follow-up has an invalid date, precedes its visit, or uses a zero, negative, or fractional interval
- **THEN** saving is rejected with a field-specific explanation and existing data remains unchanged
- **AND** a valid historical due date is permitted for historical record keeping

### Requirement: Explicit follow-up lifecycle

A follow-up SHALL have an owner-managed pending, completed, or cancelled status and permit due-date edits without modifying the original visit date. Completion SHALL optionally link to a different actual return visit for the same profile. Pending dates that pass SHALL remain pending, labelled past due date rather than automatically missed or completed.

#### Scenario: Complete with a return visit

- **WHEN** the owner completes a follow-up and selects an actual return visit on or after the originating visit date
- **THEN** both visits remain distinct and the link persists after reload
- **AND** no appointment is booked, medication changed, or dose outcome recorded

#### Scenario: Reschedule or reopen

- **WHEN** an owner edits the due date or changes a completed follow-up back to pending
- **THEN** the original visit and attached documents remain unchanged
- **AND** reopening or cancelling clears the completed-visit link

### Requirement: Follow-up ownership and link integrity

Follow-ups and their source and return-visit links SHALL be confined to the same account and family profile. A source document SHALL belong to the originating visit. Deleting the source document or return visit SHALL clear only that optional link; deleting the originating visit SHALL remove its follow-up with explicit confirmation.

#### Scenario: Reject invalid associations

- **WHEN** a request links another account's data, another family profile, an unrelated source document, the originating visit as its own return, or an earlier return visit
- **THEN** the request is rejected without changing saved data or revealing another account's private metadata

#### Scenario: Delete linked context

- **WHEN** an owner confirms deletion of a follow-up's source document or completed return visit
- **THEN** the original instruction, due date, and status remain and the unavailable link is removed
- **AND** moving a source document to another visit cannot leave an invalid source association

### Requirement: Visible and portable follow-up state

The selected profile's records workspace SHALL expose pending follow-ups with due dates and originating visits independently of document filters. Follow-up data SHALL persist across reloads and be included in authorized account export. Existing visits SHALL acquire no invented follow-up on upgrade.

#### Scenario: Find a pending return

- **WHEN** the owner opens records for a profile with pending follow-ups
- **THEN** a compact list shows pending dates in ascending due-date order with the visit context and an explicit not-booked distinction
- **AND** switching profiles removes the previous profile's follow-ups
- **AND** an account export includes saved follow-up data

### Requirement: Separate profile-scoped medical history

The workspace SHALL expose a protected Medical history page above Health profile in navigation, reusing the care visualization for the selected profile. It SHALL reference existing tracks, visits, documents, medication links and saved follow-up context without duplicating data or inferring clinical relationships. It SHALL remain reachable through mobile and command navigation without displacing existing mobile dock destinations.

#### Scenario: Open a family's medical history

- **WHEN** the owner navigates to Medical history for the selected family profile
- **THEN** only that profile's care tracks, chronological visits, document references, linked medications and saved follow-up context appear
- **AND** standalone visits and unassigned documents remain represented
- **AND** an empty profile shows an honest empty state rather than invented history
- **AND** switching profile updates the visualization without retaining the previous person's content

#### Scenario: Navigate from history to existing workflows

- **WHEN** an owner activates a document or linked-medication reference in Medical history
- **THEN** a document opens its scoped records view and a medication reference opens medications scoped to its source record
- **AND** the existing owner checks, preview controls and medication workflows remain authoritative
- **AND** a history visit reference can reveal the actual visit in the records workspace even if it has no documents

#### Scenario: Separate history from profile and records

- **WHEN** the owner moves between Medical records, Medical history, and Health profile
- **THEN** records manages documents and actual visits, history visualizes saved relationships, and health profile retains its existing personal health fields
- **AND** the records toolbar contains no care-map toggle
- **AND** a signed-out request to Medical history redirects through the existing authentication guard
