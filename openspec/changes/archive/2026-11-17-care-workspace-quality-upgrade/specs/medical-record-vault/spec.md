# Spec Delta

## MODIFIED Requirements

### Requirement: Combined document discovery and sorting

The vault SHALL combine case-insensitive, whitespace-trimmed title/provider/file-name search, category filtering, an optional favourites-only filter, and newest/oldest record-date sorting. Newest SHALL be the default, equal record dates SHALL have deterministic ordering, and displayed results SHALL report their count. Existing selected-record scope SHALL remain effective.

#### Scenario: Find older laboratory reports

- **WHEN** a user selects lab reports, searches for a provider, and chooses oldest first
- **THEN** only matching lab reports appear in ascending record-date order
- **AND** the displayed count matches those results

#### Scenario: Clear an unmatched search

- **WHEN** discovery controls produce no matching documents and the user clears filters
- **THEN** search, category, favourites-only, and selected-record constraints are cleared and newest-first ordering is restored
- **AND** saved documents and their favourite states are unchanged

#### Scenario: Combine favourites with linked discovery

- **WHEN** the owner enables favourites-only within a selected-record scope and a category or search filter
- **THEN** only documents matching every active constraint appear with an accurate count
- **AND** a no-match state offers reset without confusing it with an empty vault

## ADDED Requirements

### Requirement: Persisted private document favourites

Owners SHALL explicitly favourite or unfavourite their saved medical records. State SHALL survive reload, session renewal, and backend restart. Existing records SHALL begin unfavourited after upgrade. Setting the same desired state repeatedly SHALL be idempotent and SHALL not replace document bytes, change metadata, or grant access.

#### Scenario: Favourite and revisit a record

- **WHEN** an owner favourites a document and later reloads or signs in again
- **THEN** the document remains favourited and appears in favourites-only results
- **AND** existing preview, download, metadata, source links, and scan workflows remain usable

#### Scenario: Repeated desired-state requests

- **WHEN** the same owner submits the same desired favourite state repeatedly or concurrently
- **THEN** the final state equals the requested state rather than flipping once per request
- **AND** no duplicate favourite or document is created

#### Scenario: Account boundary and deletion

- **WHEN** another account attempts to read or change a record's favourite state
- **THEN** the request returns no private metadata and does not change the owner's record
- **AND** deleting an owned record removes its favourite state without leaving a separate dangling entry

### Requirement: Recoverable accessible favourite controls

Favourite controls SHALL identify the target document and current pressed state, retain visible keyboard focus, and meet the existing touch-target minimum. Pending changes SHALL prevent duplicate interaction. Failure SHALL preserve or restore the last confirmed state and show an explicit error; success SHALL reflect persistence rather than a local-only preference.

#### Scenario: A favourite request fails

- **WHEN** the server rejects or cannot complete a favourite change
- **THEN** the saved-state presentation remains truthful and the user receives a useful error
- **AND** no success confirmation is shown and retry remains possible

#### Scenario: Favourite while inspecting filtered results

- **WHEN** a user changes a favourite while using discovery controls or closes the record preview
- **THEN** the selected-record scope, search, category, sort, and favourites-only selection remain unchanged
- **AND** if an unfavourited row leaves favourites-only results, focus moves to a stable result or heading rather than the document body
