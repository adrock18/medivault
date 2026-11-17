# Spec Delta

## ADDED Requirements

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
