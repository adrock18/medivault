# Tasks

## 1. Follow-up persistence and API

- [x] 1.1 Add migration 008, follow-up table and owner/profile/link guards, and advance startup to v8 while preserving existing work. Verify fresh startup and populated v7 migration in isolated backend fixtures, old data preservation, no invented follow-ups, origin cascade, optional-link deletion and invalid direct inserts/updates.
- [x] 1.2 Add shared follow-up request/row types, contracts, idempotent visit-follow-up PUT endpoint, vault/profile derivation, export and API client integration. Extend backend and validation tests for upsert without duplicates, reload/reopen persistence, status transitions, export, invalid dates, same-visit source rules, cross-profile/account rejection, and invalidating visit edits or document reassignment.
- [x] 1.3 Update data-model/API sections in architecture and flows documentation and schema-v8 migration/rollback notes in operations. Verify documented fields and deletion semantics match the endpoint and migration.

## 2. Manual follow-up experience

- [x] 2.1 Add a focused visit follow-up editor using existing forms, mutation feedback and accessible controls. Support exact dates, calendar-day calculation from the visit date, explicit calculated-date confirmation, instruction/source, statuses, and optional completed-return selection. Extend local form/helper tests for month/year/leap boundaries, invalid intervals, stale confirmation, rejected saves preserving input and reopening clearing completion links.
- [x] 2.2 Show selected-profile pending follow-ups in due-date order with originating-visit navigation and neutral timing labels, plus completed/cancelled state within visits; update origin-deletion confirmation. Verify same-profile visibility, filter independence, not-booked wording, navigation and absence of automatic completion in focused discovery tests; document the manual workflow in flows.

## 3. Compact records timeline

- [x] 3.1 Replace expanded track-first rendering with deterministic date-ordered collapsed visit summaries, document/medication counts, follow-up badges and track context; preserve track management and unassigned documents. Extend discovery tests with interleaved tracks, standalone and empty visits, expansion/reset behavior, and counts tied to each visit's records.
- [x] 3.2 Preserve document filtering, favourites, selected-record scope and sort direction; add profile-scoped visit query navigation and auto-reveal linked records or visits, including empty visits. Verify combined record/visit scopes, no-match/reset, stale references, edit/preview context retention and history-source navigation in existing discovery/preview tests; document the independent visit-date versus record-date ordering.
- [x] 3.3 Verify keyboard expansion, separate mutation controls, preview focus return, and layouts at 320, 390 and desktop widths with fictional fixtures. Keep existing private preview, upload, download, scan and medication source flows intact; record observed checks without changing the existing demo dataset.
- [x] 3.4 Replace the records toolbar's wrapping layout with an aligned responsive grid: Search, Document type, Date order, Favourites, with a separate result-status line and no care-map toggle. Verify equal 48-pixel control heights and matching top/bottom coordinates in one row at 1280/1440, readable stacking/grid at 320/390/768, 44-pixel minimum touch targets, and combined filter behavior; document the revised discovery layout in flows.

## 4. Separate Medical history workspace

- [x] 4.1 Add a protected lazy-loaded Medical history route/page reusing the existing care visualization, and remove graph rendering/state from Medical records. Add the navigation item above Health profile and preserve all four existing mobile dock destinations explicitly; verify authenticated deep linking, signed-out protection, header/sidebar/menu/command-palette discovery, and all existing dock destinations in route/layout/command tests.
- [x] 4.2 Connect Medical history to the selected profile's existing tracks, visits, documents, medication source links and saved follow-up context without copied records or inferred relationships. Verify empty and multi-profile states, standalone/unassigned context, document-to-scoped-record navigation, medication-to-source-filtered-medication navigation and visit-to-expanded-records navigation in focused discovery tests; update architecture, system overview and flows with the distinct records/history/profile responsibilities.

## 5. Integration acceptance

- [x] 5.1 Run the smallest existing local-only validation, backend, form, discovery and affected preview/layout/command suites together, then `npm run verify` and `git diff --check`. Resolve regressions introduced by this change and distinguish local checks from hosted/storage/email verification.
- [x] 5.2 Per the user's November 18 apply request, replace the end-to-end acceptance walkthrough with a site-wide desktop/mobile UI inspection. Review all routed pages and key dialogs for alignment, readability, overflow, clear states and runtime errors; report presentation readiness, a professional rating and remaining improvements. Do not claim end-to-end, hosted/storage/email verification from this visual inspection.

## Workflow follow-up

- Review and archive the completed change only after implementation acceptance.
- Supabase migration, live deployment, live email, server pagination and lifetime-scale map scoping remain separate work; do not claim them complete from these checks.

## Validation notes

- 110 focused tests passed across backend, validation, forms, discovery, preview,
  PDF preview, layout and command palette. The final live-visit refresh change
  also passed type-check and the 29 discovery/form tests.
- Type-check, lint, production build and build-artifact checks passed. The full
  `npm run verify` stops on pre-existing formatting in the untouched
  `seed/README.md`; formatting passes when that file alone is excluded.
  `git diff --check` passes. No dependencies were installed.
- Records controls measured exactly 48 CSS pixels high with matching top/bottom
  coordinates at 1280 and 1440 widths. At 320, 390 and 768 they intentionally
  stack or form a grid. Expanded visits had no page or region overflow at
  320/390/1280/1440. Keyboard disclosure and preview focus return were checked.
- The follow-up editor fit at 320 pixels without horizontal overflow. No browser
  forms were submitted, demo data reseeded, or real reminders sent. Database
  mutation/migration checks used isolated temporary fixtures.
- Authenticated history deep links render; a fresh anonymous browser context
  redirects history to login. Temporary public-page preview routing was removed.
- UI inspection covered Overview, Medications, Records, Medical history, Health
  profile, Settings, Login and Register at desktop, 390 and 320 widths, plus key
  dialogs. No page-level horizontal overflow was observed. The six authenticated
  routes produced no uncaught page errors during the sweep. Both light and dark
  appearances were sampled; this was not an exhaustive state/contrast audit.
- Remaining polish observed outside this implementation: Upload and Add
  medication dialogs have internal horizontal overflow at 320 pixels (not at
  390 or desktop); the upload fieldset expands to a long profile selection.
  Health profile selects can initially appear blank and emit
  uncontrolled-to-controlled warnings. These findings are not presented as
  resolved or accepted production behavior.
- Professional assessment: 8/10 for a local desktop presentation, with clearer
  separation between day-to-day records and history exploration. Presentable as
  a working demo, not production healthcare readiness or a claim of flawless
  mobile UI. Priorities are the remaining narrow-dialog/select polish, realistic
  coherent fictional presentation data, and separately verified storage,
  deployment and restore operations. Lifetime-scale pagination remains future
  work rather than a capability proved by this inspection.
