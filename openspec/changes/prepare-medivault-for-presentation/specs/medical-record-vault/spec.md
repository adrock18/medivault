# Spec Delta

## ADDED Requirements

### Requirement: Retained linked-record context

Opening, cancelling, or successfully saving metadata edits from a source-linked record view SHALL retain the selected-record scope and discovery controls. Returning to the unscoped vault SHALL require an explicit navigation or filter-reset action.

#### Scenario: Edit the source of a medication

- **WHEN** a user follows a medication's source link and saves valid changes to that record's metadata
- **THEN** the refreshed view remains scoped to the same record
- **AND** unrelated documents do not appear because the edit dialog closed
- **AND** the changed metadata and existing private file remain available

#### Scenario: Cancel a source-record edit

- **WHEN** a user cancels metadata editing while viewing a selected source record
- **THEN** its selected-record scope, search, category, and sort controls remain unchanged
- **AND** no metadata update request is issued

#### Scenario: Leave the source scope explicitly

- **WHEN** the user chooses show-all-records or clear-filters
- **THEN** the selected-record scope is removed
- **AND** clear-filters retains its existing behavior of clearing search/category and restoring newest-record-date order
