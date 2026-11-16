# Proposal

## Why

MediVault now has a distinctive dark palette and animated artwork, but its signed-in screens still repeat rounded containers and require too much navigation between daily tasks, history, and documents. The next improvement should make the product feel deliberately composed and faster to use, rather than adding another layer of decorative effects.

## What Changes

- Introduce a "MediVault Daybook" composition: an asymmetric daily workspace, a clear date/time spine, quieter supporting information, and fewer nested boxes. Preserve the near-black palette, subtle lavender/mint/peach/sky accents, glass focal surfaces, and existing Light/System modes.
- Add a keyboard-accessible command palette for existing navigation and safe workflow entry points: add medication, scan prescription, upload record, and return to today. This is navigation/action search, not AI or a new medical-data search service.
- Add an interactive medication calendar inside Medications: month navigation, a medication filter, and a selected-day agenda. Clearly distinguish persisted Taken/Skipped logs from unlogged or future schedule projections. Historical and future days are read-only; today's existing Taken/Skip/Undo workflow remains authoritative.
- Add an in-app medical-document preview drawer, full-screen on narrow displays, retaining authorized downloads, an explicit open-in-new-tab alternative, and existing edit/delete/scan/source-link workflows.
- Make motion explain actions: calendar selection, drawer opening, palette results, and saved dose confirmation. Preserve the existing four-form authentication illustration and its pause/reduced-motion behavior; do not add autoplay spectacle to working screens.
- Ground the direction in reviewed references: Reflect's dark product framing and focused hierarchy (Awwwards Honorable Mention, May 11, 2023) and Lusion's deliberate composition and interaction craft (Site of the Day, May 20, 2019). Borrow principles, not their assets, copy, WebGL, or marketing-page behavior. Current live sites are not assumed to be their historical award submissions.
- Keep all statistics and document content account-derived. No AI, backend/schema changes, new runtime dependencies, public sharing, or changes to prescribed schedules.

## Capabilities

### New Capabilities

None. Extend the existing behavior boundaries rather than introducing overlapping capabilities.

### Modified Capabilities

- `workspace-experience`: near-black editorial design system, accessible command navigation, and purposeful motion.
- `dashboard-overview`: daybook composition with today's tasks first; preserve the dial, activity chart, adherence calculation, and honest state labels.
- `medication-management`: read-only calendar discovery and truthful historical-log reconciliation.
- `medical-record-vault`: authorized in-app previews with recoverable loading/error states and retained discovery context.

## Impact

- Frontend: shared layout/styles, Dashboard, Medications, Records, existing dialog primitives, and small calendar/palette/preview components and helpers.
- Reuse `useVault`, `scheduledDoses`, local-date utilities, existing React Router actions, private `api.records.file`, and installed PDF.js. Preserve OCR worker behavior when sharing PDF setup.
- Add focused interaction/helper tests and responsive/browser acceptance checks; retain the 500,000-byte minified entry budget.
- The unarchived `premium-visual-refresh` change is the implementation baseline, not a second palette to reapply. This successor supersedes its older ink-palette and uniform-card visual criteria only; it does not archive, commit, deploy, or weaken its functional safeguards.
- Out of scope: appointments, family accounts, refill inventory, emergency sharing, achievements, reports/export redesign, drag-to-reschedule, historical schedule versioning, new authentication, and a public marketing site.
