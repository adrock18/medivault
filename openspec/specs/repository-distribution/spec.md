# repository-distribution Specification

## Purpose

Define a clean, reproducible source distribution that separates release inputs from local tooling and preserves an accurate, navigable engineering history.

## Requirements

### Requirement: Publishable source boundary

The published tree SHALL exclude executable test suites, fixtures, runners, test-only configuration and dependencies, generated integration skills, reports, scratch documents, runtime data and secrets. Runtime source, production build tools, migrations, public assets, dependency locks and operational documentation SHALL remain available. Historical documentation SHALL not be erased merely because it records prior testing.

#### Scenario: Inspect a prepared release tree

- **WHEN** a maintainer inspects the staged release tree and its source archive
- **THEN** excluded local-only and executable testing material is absent
- **AND** the environment example, required runtime/build files, migrations and lockfile remain
- **AND** earlier Git history is not rewritten or claimed purged

### Requirement: Non-destructive untracking

Removing a tracked local-only file from the published tree SHALL preserve its local bytes unless deletion is separately authorized. Ignore rules SHALL prevent accidental re-addition; they SHALL not be treated as sufficient to untrack an already tracked file. Existing uncommitted changes and personal runtime storage SHALL remain untouched.

#### Scenario: Preserve an existing local suite

- **WHEN** a tracked test suite or generated integration file is excluded from publication
- **THEN** its local content remains unchanged and its path is absent from the staged tracked tree
- **AND** an ordinary subsequent staging operation does not re-add it

#### Scenario: A local file contains uncommitted work

- **WHEN** cleanup encounters modified local content or a conflicting destination
- **THEN** it preserves that content and reports any conflict before proceeding
- **AND** it does not overwrite or delete the file to make cleanup succeed

### Requirement: Professional and tool-compatible documentation

The repository SHALL provide clear product, setup, architecture, development, deployment and operational navigation with professional titles. Required OpenSpec artifact filenames, stable capability identities and archived change identities SHALL remain compatible with the workflow. Current instructions SHALL describe the delivered release gates rather than removed testing commands.

#### Scenario: Follow release documentation

- **WHEN** a contributor starts from the repository overview
- **THEN** links lead to the relevant current instructions without broken targets
- **AND** historical verification records are clearly historical rather than current executable promises
- **AND** professional titles do not prevent OpenSpec from locating its artifacts

### Requirement: Ordered and truthful change retirement

Overlapping changes SHALL be reconciled in dependency order before archival. Archival SHALL preserve metadata and historical outcomes, verify any requested spec synchronization and record superseded or unexecuted work explicitly. Incomplete work SHALL require explicit confirmation before archival and SHALL never be marked passed merely because its requirement changes.

#### Scenario: Archive successive visual changes

- **WHEN** completed visual changes modify the same capabilities
- **THEN** their deltas are reconciled chronologically before their successor
- **AND** final capability content retains the intended successor behavior

#### Scenario: Retire an incomplete predecessor

- **WHEN** a predecessor still contains unexecuted checks that the new release contract supersedes
- **THEN** the archive record identifies those checks and the superseding change
- **AND** archival waits for explicit confirmation of the incomplete-work warning
- **AND** no historical result is relabeled as successful execution
