# Design

## Context

See [proposal.md](proposal.md) for motivation and scope.

- React Router mounts the signed-in `Layout` beneath a user-keyed `DataProvider`. The provider already loads all owned medications, logs, and document metadata, refreshes on focus/every minute, and exposes loading, error, and stale-data feedback.
- Dashboard already has a medication-first layout, a 24-hour dial, a selectable seven-day chart, and an adherence ring. These remain functional rather than being replaced with decorative statistics.
- Medications has today's actionable schedule, independent list search/status controls, source-record routing, and a 30-day log table. `scheduledDoses` derives schedules for any local date; `dayBreakdown` reconciles unmatched historical logs.
- Records combines search, category, sort, and a `record` query scope. `viewRecord` currently opens an authorized blob in a new tab; `downloadRecord` uses the private file API.
- Base UI dialogs/selects, date-fns, PDF.js, Lucide, CSS motion, and Geist Variable are installed. PDF.js worker configuration currently lives in the dynamically imported OCR module.
- Main specs still describe an earlier teal palette. The unarchived, implemented `premium-visual-refresh` and subsequent local refinements are the actual visual baseline. Do not silently restore those older colors or archive the previous change.

## Goals / Non-Goals

**Goals:** Make the same account data easier to navigate and inspect; give each screen a clear reading hierarchy; add bounded, accessible interactions without enlarging the global data model.

**Non-Goals:** A separate design-system framework, configurable dashboards, historical prescription reconstruction, new network endpoints, a command execution engine, or copying reference-site assets.

## Decisions

### 1. Daybook, not another bento-card kit

Keep the existing dark tokens. The six anchor colors are ink `#080D15`, glass base `#101722`, raised surface `#182232`, lavender `#C4B5EF`, mint `#95D8C6`, and peach `#EFBEA2`. Preserve the existing sky accents and accessible status colors rather than recoloring health outcomes to match decoration. Light mode retains its current palette.

Use the installed Geist family with optical hierarchy: fluid page/date headings around 40-64 px, section headings 18-22 px, body 14-16 px, and secondary labels no smaller than 12 px. Use tabular numbers for dose times. Left-align task content; avoid all-caps eyebrows, marketing copy, and a second display font download.

Give the routine one dominant glass surface. Place time markers on a shared vertical alignment, use restrained separators inside the feed instead of enclosing every sub-section in another tinted box, and let whitespace separate secondary information. Keep supporting dial/chart surfaces quieter, not hidden. Use different radii for workspace panels, controls, and status chips instead of one large radius everywhere.

Desktop concept:

```text
Navigation | Date / Today                       Search actions
           |-------------------------------------------------
           | Time spine + medication routine  | Daily rhythm
           | Explicit Taken / Skip / Undo      | Weekly activity
           |----------------------------------| Adherence
           | Scan / Add / Upload actions
           | Recent documents                 | Upcoming doses
```

Mobile: date/title, today's routine/actions, quick workflows, then supporting visuals and records; keep the floating dock and safe-area clearance. Calendar is a Medications workspace tool, not a dashboard hero that displaces check-ins.

**Alternative rejected:** Another full-screen palette change or an equal-sized card mosaic. Both repeat the last iteration without improving task flow.

### 2. Treat award references as constraints on craft, not templates

Reviewed on November 16, 2026:

| Reference                                                                                                       | Verified recognition            | Adapt for MediVault                                                               | Do not import                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [Reflect award entry](https://www.awwwards.com/sites/reflect), [current product site](https://reflect.app/home) | Honorable Mention, May 11, 2023 | Dark depth, disciplined typography, a focused product viewport                    | Its wording, illustrations, promotional hero, or any AI functionality           |
| [Lusion award entry](https://www.awwwards.com/sites/lusion), [current studio site](https://lusion.co/)          | Site of the Day, May 20, 2019   | Deliberate asymmetry, one visual focal point, interaction with clear cause/effect | WebGL, continuous 3D scenes, scroll hijacking, custom cursors, or copied assets |

The current live designs may differ from the historical award submissions. Calendar and command navigation are proposed product decisions, not claimed features of those award entries.

**Critique and revision:** "Dark + glow + identical glass cards" would still be generic. Spend visual emphasis on the date/time spine and medication routine; retain glass as a material, not the information architecture. Do not add more drifting layers or entrance animations to every item.

### 3. A small navigation palette, not global health search

Mount `CommandPalette` once inside authenticated `Layout`, using the existing dialog primitives and a shared registry of the existing navigation links. Add a visible "Search actions" trigger to the header, compact but meaningfully named on mobile.

- Search route/action labels and a short static keyword list with trimmed, case-insensitive substring matching.
- Offer the five current destinations plus add medication, scan prescription, upload record, and today's schedule through existing routes/query actions.
- Use a labeled input and a semantic list of ordinary action buttons. Tab/Shift+Tab and Enter work normally; Escape closes and returns focus. Do not claim combobox/listbox semantics without implementing their interaction model.
- Ctrl+K / Cmd+K opens it when focus is not in an input, textarea, editable content, or another modal. The visible trigger always remains available.
- Selecting an action closes the palette before navigating; do not stack it over an edit/scan/upload dialog.
- Clear the query when closed. No recent-search storage, entity metadata indexing, network search, medical-content localStorage, or destructive/dose shortcuts.

**Alternative rejected:** Fuzzy global record/medication search. It duplicates existing discovery, expands privacy/navigation semantics, and is unnecessary for the agreed focused upgrade.

### 4. Calendar is a read-only lens, not prescription editing

Add `MedicationCalendar` on Medications without replacing today's schedule, the medication list, or the existing log table. Keep its month/selected date/medication filter in component state. Initial selection is the provider's local today. Use Monday-first weeks with explicit weekday headings.

- Month arrows preserve the selected day number where possible and clamp to the last day otherwise. "Today" resets month/date, not the selected medication.
- The calendar's medication filter includes active, upcoming, and completed owned medications and is independent of the list's name/status filters. The current source-record scope applies to its options and entries; changing that scope resets the calendar medication filter to all within the new scope.
- Reuse local-date/date-fns helpers, `scheduledDoses`, and the reconciliation semantics of `dayBreakdown`. Do not parse a date-only value as UTC.
- The selected-day agenda is the union of current-schedule coordinates and stored logs on that day, deduplicated by medication/date/time. Unmatched stored logs remain at their original coordinates, marked "Recorded outcome".
- Match the counts to that union. Past unlogged projections say "Not logged", future unlogged projections say "Upcoming"; icons and text accompany color. Never infer "Missed" or calculate a new adherence percentage from projections.
- State visibly: "Schedule projections use your current prescription. Past schedule changes may not be reflected." Current names/dosages are not historical snapshots; distinguish them from stored outcome coordinates.
- Calendar inspection creates no dose mutations. For today, "Go to today's schedule" moves focus/scroll to the existing actionable schedule. Past/future days have no Taken, Skip, Undo, or rescheduling actions.

On desktop use a month grid plus agenda. At narrow widths default to an easy-to-scroll week-date rail and stacked agenda; provide a Month control with the full grid in a labeled contained scroller. A seven-column grid of 44 px targets cannot fit inside a padded 320 px viewport: do not shrink targets to conceal that constraint. Keep month controls outside the scroller and focused dates visible.

**Alternative rejected:** Calendar editing, retrospective outcome mutation, or treating the current schedule as a versioned historical prescription. Those would change safety/product behavior and require different scope.

### 5. Private previews reuse the existing access boundary

Add a lazy `RecordPreview` mounted by Records and Dashboard, with each page owning its selected-record state. Pass an optional preview callback to compact/full `MedicalRecordCard`; preserve `viewRecord` as the explicit open-in-new-tab alternative. Do not reuse the existing `record` query parameter to mean preview: it already scopes source-linked results.

The drawer is a Base UI modal dialog styled as a right-side inspection panel on desktop and a full-screen sheet on mobile. Show record metadata, preview, Download, Open in new tab, and Close. Keep existing management/scan/link actions in their current workflows; close the preview before navigating to another dialog.

Fetch through `api.records.file` only when opened. Render supported images with alt text. For PDFs, lazily load PDF.js, share a minimal worker-configuration module with OCR if needed, and render one page at a time with previous/next controls and "Page X of Y". Do not import Tesseract to preview a PDF, apply OCR's ten-page scanning limit to preview, or download remote viewer scripts. Bound each rendered canvas to 12 million pixels by lowering render scale, not by discarding pages.

Use a request generation/disposal guard to ignore results after close/record change. Revoke image object URLs and destroy PDF loading/render tasks/documents on replacement, close, and provider unmount/logout. Do not cache document bytes in persistent browser storage.

Keep close available during a read-only fetch. Expose loading and inline retryable access/render errors, retaining metadata and the alternative authorized download/open controls. Do not toast success before a file request succeeds. On close preserve record scope, search, category, sort, page scroll, and trigger focus; if a refreshed record was removed, show unavailable state and use a stable page heading as focus fallback.

**Alternative rejected:** An external embedded PDF viewer or iframe-only preview. The former discloses private content; the latter cannot give consistent multipage/loading/error behavior across supported browsers.

### 6. Motion is bounded feedback

Keep the four-form authentication cycle, its pause state, and reduced-motion behavior unchanged. Reuse existing CSS transitions for route and dose feedback; add only palette entry (120-160 ms), selected-date feedback (120-180 ms), and drawer movement (180-240 ms). Avoid large height animations, count-up health values, movement on scrolling, and layout-shifting font loads.

Reduced motion removes positional/rotational transitions and leaves content/confirmation immediately readable. Overlays must not flash an alternate theme or obscure keyboard focus. Preserve the existing entry-bundle cap; calendar and PDF work stay in lazy route/component chunks.

**Alternative rejected:** Framer Motion, a calendar package, a command library, or a WebGL scene. Existing dependencies cover the required interactions.

## Risks / Trade-offs

- Historical schedules are not versioned -> label projections and retain saved log coordinates; never present a reconstructed schedule as verified history.
- Month grids compete with mobile touch targets -> week-first layout, optional contained month scrolling, 44 px targets, and explicit keyboard/focus checks.
- PDF workers/canvases can retain memory -> one page at a time, bounded pixels, lazy loading, disposal and request-race tests.
- Glass can reduce text contrast -> validate composited surfaces in both themes; keep normal text at 4.5:1 and large text at 3:1.
- Global shortcuts can interrupt forms -> exclude editable targets/open modals and keep ordinary visible navigation.
- Existing work is uncommitted -> preserve it, review this successor as a separate patch, and do not auto-archive or revert the earlier visual refresh.

## Migration Plan

No data migration or API deployment is needed. Apply presentation/navigation first, then calendar and preview as separate reviewable units. Keep all existing routes and file helpers working during integration. Run focused tests before the existing full verification and browser pass. Publishing remains a separate user action.

Rollback the new frontend patch only; no persisted health data, logs, or documents need transformation or reversal. Do not discard unrelated uncommitted work when preparing or reverting that patch.
