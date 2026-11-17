# Tasks

## 1. Care timeline editing

- [x] 1.1 Add edit actions for care tracks and visits and reuse the validated create dialogs for updates; verify saved edits persist through the focused local Chromium workflow.
- [x] 1.2 Preserve profile-scoped care associations and document the care update endpoints and design constraints in the architecture and request-flow guides.

## 2. Safe family-profile deletion

- [x] 2.1 Add owner-scoped deletion that rejects self profiles and checks all associated health-data domains before removal; verify self, cross-owner, dependent-data, and empty-profile cases in backend tests.
- [x] 2.2 Add a confirmation flow that surfaces server errors and refreshes the family list after success; verify empty-profile deletion in the local browser workflow and document the restrictions.

## 3. Integration verification

- [x] 3.1 Run `npm run verify`, the local Vitest suite, the focused Chromium workflow, and `git diff --check`; confirm all pass without contacting live providers.

## Workflow follow-up

- Archive the change after review and confirm the resulting main specifications and archived status.
