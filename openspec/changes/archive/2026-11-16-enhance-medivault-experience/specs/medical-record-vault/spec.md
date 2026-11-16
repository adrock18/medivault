# Spec Delta

## Purpose

Provide private, searchable medical-document storage with understandable metadata and reliable document-access workflows.

## ADDED Requirements

### Requirement: Validated private uploads

Users SHALL upload PDF, JPG, or PNG documents with title, category, record date, and optional provider. Files SHALL be non-empty and no larger than 10,485,760 bytes, with matching extension, MIME type, and supported file signature. Rejected uploads SHALL create no record.

#### Scenario: Upload an accepted document

- **WHEN** a signed-in user uploads a valid supported file with valid metadata
- **THEN** its metadata and private document are persisted for that account
- **AND** the document remains available after reloading the page

#### Scenario: Reject an oversized or mismatched file

- **WHEN** an upload exceeds the size limit or has an unsupported or mismatched type/signature
- **THEN** the application reports why it was rejected
- **AND** no record is added to the vault

### Requirement: Combined document discovery and sorting

The vault SHALL combine case-insensitive, whitespace-trimmed title/provider/file-name search, category filtering, and newest/oldest record-date sorting. Newest SHALL be the default, equal record dates SHALL have deterministic ordering, and displayed results SHALL report their count.

#### Scenario: Find older laboratory reports

- **WHEN** a user selects lab reports, searches for a provider, and chooses oldest first
- **THEN** only matching lab reports appear in ascending record-date order
- **AND** the displayed count matches those results

#### Scenario: Clear an unmatched search

- **WHEN** discovery controls produce no matching documents and the user clears filters
- **THEN** search and category constraints are cleared and newest-first ordering is restored
- **AND** saved documents are unchanged

### Requirement: Clear document identity and actions

Document presentations SHALL expose title, category, provider or its absence, record date, file type, and a non-zero human-readable size for non-empty files. View, download, edit, and delete controls SHALL identify their purpose and target document accessibly.

#### Scenario: Inspect a small report

- **WHEN** a user views the card for a supported non-empty document smaller than one megabyte
- **THEN** its displayed file size does not misleadingly round to zero
- **AND** its document actions remain understandable without relying solely on icons

### Requirement: Authorized file access

Viewing and downloading SHALL require the current signed-in document owner and SHALL not expose a public document URL. Anonymous or other-account requests SHALL not return file bytes or private metadata.

#### Scenario: Attempt access from another account

- **WHEN** a different account requests a document's content or metadata mutation
- **THEN** the system denies access without returning private content
- **AND** the owner's record remains unchanged

#### Scenario: View or download an owned document

- **WHEN** the owner requests a stored document
- **THEN** the viewer or download receives the stored content
- **AND** a failed access request displays an error rather than a success notification

### Requirement: Persisted metadata edits

Owners SHALL edit title, category, provider, and record date without replacing the uploaded file. Successful edits SHALL update discovery results and remain visible after reload; invalid edits SHALL preserve input and saved metadata.

#### Scenario: Edit a record date

- **WHEN** an owner saves a valid changed record date
- **THEN** the new date persists and sorting uses the new date
- **AND** the original document remains viewable

### Requirement: Confirmed document deletion

Document deletion SHALL require confirmation identifying the document and permanent removal of its file. Cancellation SHALL preserve both. A successful delete SHALL remove metadata and private content, while a partial failure SHALL explicitly report the incomplete operation.

#### Scenario: Delete an owned document

- **WHEN** an owner confirms deletion and the operation succeeds
- **THEN** the record disappears from refreshed and reloaded vault views
- **AND** its previous file-access request no longer returns content
