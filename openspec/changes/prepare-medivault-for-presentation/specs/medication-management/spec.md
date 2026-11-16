# Spec Delta

## MODIFIED Requirements

### Requirement: Combined medication discovery

The medication list SHALL combine normalized name search with active, upcoming, completed, or all status filters and an optional source-record scope. Entering through a record's linked-medication action SHALL initially show every linked status. Closing an edit dialog SHALL retain the source scope. Search/filter misses SHALL offer a clear reset action distinct from the empty-account add-medication state.

#### Scenario: Search within an active list

- **WHEN** a user selects active medications and enters part of a medication name
- **THEN** only matching active medications are listed
- **AND** name matching is case-insensitive and trims surrounding whitespace
- **AND** clearing the filters restores the default active list without modifying saved data

#### Scenario: Follow a source link with non-active medications

- **WHEN** a user follows a record's linked-medication action for a record with active, upcoming, and completed medications
- **THEN** the initial results include all medications linked to that record regardless of status
- **AND** unrelated medications remain excluded
- **AND** the user can intentionally narrow the linked results using name and status controls

#### Scenario: Close an edit within linked results

- **WHEN** a user saves or cancels an edit while viewing medications scoped to a source record
- **THEN** the source-record scope and discovery controls remain in effect
- **AND** unrelated medications do not appear merely because the dialog closed

#### Scenario: Reset linked discovery explicitly

- **WHEN** a user chooses the existing clear-filters or show-all-medications action
- **THEN** the source scope is removed explicitly
- **AND** clear-filters restores the ordinary unscoped active-list default without changing saved medications
