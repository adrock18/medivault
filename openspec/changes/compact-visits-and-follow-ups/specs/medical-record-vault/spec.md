# Spec Delta

## ADDED Requirements

### Requirement: Compact chronological visit browsing

The records workspace SHALL default to collapsed chronological visit summaries for the selected profile, newest first with deterministic ties. Each summary SHALL show date, title, provider or its absence, document count, source-linked medication count, optional care-track context, and saved follow-up status. Expanding SHALL expose existing document workflows without duplicating document ownership.

#### Scenario: Scan a mixed care history

- **WHEN** a profile has visits in several tracks and standalone visits
- **THEN** the default timeline interleaves them by visit date instead of expanding full track groups
- **AND** opening one visit reveals its documents, notes, edit, upload, and delete actions
- **AND** other visits remain collapsed

#### Scenario: Switch profile

- **WHEN** the owner changes the selected family profile
- **THEN** expanded visit state is reset and only that profile's summaries and documents appear
- **AND** medication counts reflect source records attached to each visit, not all medications in its track

### Requirement: Compact discovery preserves document scope

Search, document type, favourites, selected-record scope, and record-date sorting SHALL remain effective in compact browsing. Active document constraints SHALL omit visits with no matching records and show matching document counts. Record-date sorting SHALL order documents; visit summaries SHALL use visit dates in the corresponding direction. Source-linked records SHALL be revealed without requiring the user to find their collapsed visit manually.

#### Scenario: Open a medication's source

- **WHEN** an owner follows a medication's source-record link
- **THEN** the matching visit is expanded or the unassigned document is shown directly
- **AND** unrelated visit rows and documents are excluded
- **AND** previewing or editing retains the selected-record scope and discovery controls

#### Scenario: No matching records

- **WHEN** active document filters match no records
- **THEN** one helpful no-match state offers clear filters instead of a sequence of misleading empty visits
- **AND** a genuinely empty visit remains visible when no document constraint is active

### Requirement: Accessible progressive disclosure and medical-history navigation

Visit expansion SHALL use keyboard-operable controls with meaningful names and expanded state. Document mutations SHALL be separate from expansion controls. At 320 CSS pixels summaries and expanded actions SHALL fit without page-level horizontal overflow. Medical history SHALL be a separate page; navigating from it to a record or visit SHALL reveal the corresponding scoped records context.

#### Scenario: Navigate a compact visit with the keyboard

- **WHEN** a keyboard user expands a visit and previews then closes a document
- **THEN** focus returns to its document action, the visit remains expanded, and filters and scroll context are preserved
- **AND** expanding or collapsing alone causes no write

#### Scenario: Follow a history record

- **WHEN** the owner activates a record link in Medical history
- **THEN** the timeline shows that record in its expanded visit or unassigned section
- **AND** no care map is rendered on the records page

#### Scenario: Follow a history visit

- **WHEN** the owner opens a visit from Medical history
- **THEN** the records workspace reveals that visit's expanded details even when it has no documents
- **AND** the user can explicitly return to all visits and documents

### Requirement: Aligned responsive record-discovery controls

The records toolbar SHALL align Search, Document type, Date order, and Favourites in one equal-height row on sufficiently wide desktop content areas, with the result count beneath. Narrow layouts SHALL use an intentional grid or stack without clipped labels or page overflow. Labels, keyboard focus, touch targets and existing combined filter behavior SHALL remain accessible.

#### Scenario: Inspect desktop alignment

- **WHEN** the records workspace is displayed at 1280 or 1440 CSS pixels with desktop navigation
- **THEN** all four discovery controls occupy one row with equal control heights and aligned top and bottom edges
- **AND** their labels occupy a consistent area above the controls, the result count occupies a separate line, and no care-map toggle competes for width

#### Scenario: Use discovery on a narrow device

- **WHEN** the records workspace is displayed at 320, 390 or 768 CSS pixels
- **THEN** its discovery controls use a readable responsive grid or stack with no page-level horizontal overflow
- **AND** search, document type, date ordering and favourite filtering still combine correctly
- **AND** interactive targets remain at least 44 by 44 CSS pixels
