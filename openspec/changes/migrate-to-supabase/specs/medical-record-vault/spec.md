# Spec Delta

## MODIFIED Requirements

### Requirement: Validated private uploads

Users SHALL upload PDF, JPG or PNG documents with title, category, record date
and optional provider through the validated backend. Files SHALL be non-empty,
at most 10,485,760 bytes, and match extension, MIME and signature. Accepted bytes
SHALL persist privately in Supabase Storage with PostgreSQL metadata. Rejected
uploads SHALL create no record.

#### Scenario: Upload an accepted document

- **WHEN** a signed-in user uploads a valid supported file with valid metadata
- **THEN** its metadata and private document are persisted for that account
- **AND** the document remains available after reloading the page

#### Scenario: Reject an oversized or mismatched file

- **WHEN** an upload exceeds the size limit or has an unsupported or mismatched
  type/signature
- **THEN** the application reports why it was rejected
- **AND** no record is added to the vault

#### Scenario: Store failure or metadata compensation

- **WHEN** object persistence fails or the following metadata insert fails
- **THEN** upload reports failure rather than a saved record
- **AND** metadata failure triggers removal of the new object, with an explicit
  partial-operation error if cleanup also fails

### Requirement: Authorized file access

Viewing and downloading SHALL require the current signed-in document owner and
deliver private Supabase content through the existing same-origin file API.
Anonymous or other-account requests SHALL return neither bytes nor private
metadata. The application SHALL NOT return public or presigned bucket URLs.

#### Scenario: Attempt access from another account

- **WHEN** a different account requests a document's content or metadata mutation
- **THEN** the system denies access without returning private content
- **AND** the owner's record remains unchanged

#### Scenario: View or download an owned document

- **WHEN** the owner requests a stored document
- **THEN** the viewer or download receives the stored content
- **AND** a failed access request displays an error rather than a success notification

#### Scenario: Attempt anonymous bucket access

- **WHEN** a signed-out caller requests an object directly from the storage service
- **THEN** the private bucket does not serve the document
- **AND** application object paths do not grant access by themselves

## ADDED Requirements

### Requirement: Controlled managed-object mutations

Only the trusted server storage boundary SHALL create or remove document objects,
after authentication, ownership and upload validation. Ordinary user credentials
SHALL NOT bypass file validation through direct bucket writes. Object creation
SHALL NOT overwrite existing bytes, and partial deletions SHALL remain explicit
and retryable.

#### Scenario: Attempt a direct unvalidated upload

- **WHEN** an ordinary authenticated user sends an object upload directly to the
  configured bucket
- **THEN** the storage policy denies the write
- **AND** the supported validated application upload still succeeds for that user

#### Scenario: Choose another account's object path

- **WHEN** a metadata write attempts to reference a different owner's object
- **THEN** the database or backend rejects the write
- **AND** no other-account document is read, replaced or deleted

#### Scenario: Finish deletion after a partial failure

- **WHEN** object removal succeeds but metadata deletion fails
- **THEN** the application explains the incomplete operation
- **AND** an explicit retry can finish metadata deletion without requiring the
  removed object to reappear
