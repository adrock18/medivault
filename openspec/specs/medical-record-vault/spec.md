# medical-record-vault Specification

## Purpose

Provide private, searchable medical-document storage with understandable metadata and reliable document-access workflows.

## Requirements

### Requirement: Simple local prescription scanning

Owners SHALL scan saved or newly uploaded PDF, JPG, and PNG records locally in the browser without sending document contents to an external OCR or AI service. OCR SHALL target clear printed English, support image-based PDFs up to 10 pages, and report unreadable or unsupported documents explicitly. Prescription text and suggestions SHALL remain drafts until reviewed and submitted.

#### Scenario: Review a scanned prescription

- **WHEN** an owner scans a readable printed prescription
- **THEN** the recognized text can be compared with the original and corrected
- **AND** explicit form/name/strength and instruction wording may prefill a medication draft without paraphrasing or inferring missing doses
- **AND** saving requires valid details and explicit confirmation of review
- **AND** existing source records and medications expose navigation links in both directions

#### Scenario: Recognition is incomplete

- **WHEN** handwriting, an unfamiliar layout, or missing instructions prevent reliable suggestions
- **THEN** the text remains available for manual review and entry
- **AND** no guessed medication, dosage, start date, or dose time is saved

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

### Requirement: In-app private document inspection

Owners SHALL open a document preview from vault cards and dashboard recent-record entries without losing the workspace. The preview SHALL show document identity and metadata, authorized PDF/image content, Close, Download, and an explicit Open in new tab alternative. Existing edit, delete, scan, and linked-medication workflows SHALL remain available. No content SHALL be sent to an external preview service.

#### Scenario: Inspect a saved image

- **WHEN** an owner activates View for a JPG or PNG record
- **THEN** an in-app inspection panel displays the authorized image with meaningful alternative text and record metadata
- **AND** the existing download and new-tab access paths remain available

#### Scenario: Inspect a multipage PDF

- **WHEN** an owner opens a readable multipage PDF
- **THEN** the preview shows the selected page, its current/total page count, and previous/next controls with correct boundary states
- **AND** all pages remain reachable without applying the prescription-scanning page limit to document viewing

#### Scenario: Continue an existing document workflow

- **WHEN** the user closes the preview and chooses edit, delete, scan, or a linked-medication action
- **THEN** that existing workflow remains functional with its original confirmation, review, and authorization safeguards

### Requirement: Recoverable preview feedback

The preview SHALL distinguish loading, loaded content, unavailable documents, and access/render failures. A failure SHALL retain available metadata, explain the problem, and offer retry and authorized alternative access controls. Close SHALL remain available while reading. Failed requests SHALL not display success or substitute unrelated content.

#### Scenario: File access fails

- **WHEN** the file request fails
- **THEN** the panel displays a helpful error with Retry and remains dismissible
- **AND** no preview or download success is claimed

#### Scenario: Rendering fails after access succeeds

- **WHEN** a corrupt, protected, or otherwise unreadable PDF cannot be rendered
- **THEN** the panel identifies a rendering problem rather than showing an empty success state
- **AND** Open in new tab and Download remain explicit authorized alternatives

### Requirement: Retained preview context

Opening and closing a preview SHALL preserve the vault's source-record scope, search, category, sorting, and scroll position. Closing SHALL return focus to the originating action or a stable page heading if that action no longer exists. Preview selection SHALL not repurpose the existing source-record filter.

#### Scenario: Inspect within filtered linked results

- **WHEN** an owner previews and closes a record while using linked-record scope and discovery controls
- **THEN** the same scope, controls, result order, scroll position, and usable trigger focus remain
- **AND** unrelated documents do not appear merely because inspection ended

#### Scenario: Inspect from the dashboard

- **WHEN** an owner opens and closes a recent-record preview
- **THEN** the dashboard remains at its prior scroll position with focus restored to the view action

### Requirement: Accessible bounded preview lifecycle

Preview SHALL act as a titled, keyboard-accessible modal, using a side panel on desktop and a full-screen presentation on narrow screens. Closing, changing the selected record, or signing out SHALL discard the old visible content and prevent late responses from restoring it. Viewing SHALL retain the existing owner-only file-access rules and SHALL not persist document bytes in browser storage.

#### Scenario: Close before loading completes

- **WHEN** the user closes a preview before its file request finishes
- **THEN** the late result does not reopen the panel or restore private content
- **AND** reopening a different record never displays the previous record's bytes under its metadata

#### Scenario: Inspect at 320 pixels

- **WHEN** a user opens a preview at 320 CSS pixels
- **THEN** its title, close/action controls, and page navigation remain readable and keyboard-operable with at least 44 by 44 pixel targets
- **AND** zoomed or wide document content is contained without page-level horizontal overflow

#### Scenario: Session changes while inspecting

- **WHEN** the account signs out or its session expires
- **THEN** private preview content is removed with the authenticated workspace
- **AND** subsequent document access still requires the current authorized owner

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
