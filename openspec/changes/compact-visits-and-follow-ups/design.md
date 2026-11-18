# Design

## Context

See [proposal.md](proposal.md) for motivation. The current Express/SQLite application has schema v7 and existing, uncommitted family health and UI polish changes that must be preserved. `care_visits` represents actual visits, with future dates rejected by shared validation and the visit form. `care_tracks` groups related visits; documents reference visits, and medications reference source documents.

`MedicalRecordsPage` currently renders expanded, track-first groups. `DataProvider` retrieves the entire account vault every refresh, then derives the selected profile locally. Existing private document previews, source-record query parameters, and local-only Vitest tests must remain usable. This change improves usability, not database-scale retrieval.

## Goals / Non-Goals

**Goals:** Separate planned return intent from actual visits; separate document management from history visualization; make the records timeline and discovery toolbar scan-friendly; preserve historical data and document workflows.

**Non-Goals:** Appointment booking, guaranteed reminders, automatic OCR follow-up extraction, notification-provider changes, server pagination, new packages, Supabase migration, or live deployment. No change to medication doses, logs, or treatment instructions.

## Decisions

### D1. A small follow-up entity owned by its originating visit

Add migration `008_visit_follow_ups.sql` and schema v8. Use a `visit_follow_ups` table with UUID id, user/profile ids, unique `visit_id`, `due_date`, `instruction` (trimmed, at most 2000 characters), nullable `source_record_id`, `status` (`pending`, `completed`, `cancelled`), nullable `completed_visit_id`, and timestamps.

One follow-up per originating visit is a deliberate MVP boundary; multiple future tasks are not required. A separate table avoids overloading actual visits with fictional future encounters or adding a partially populated set of planning columns to every historical visit.

Use owner/profile foreign keys and database guards consistent with migration 006. Source documents must belong to the originating visit. Return visits must differ from the origin, share its owner/profile, and be dated on or after it; a completed link is optional but legal only with completed status. Due dates cannot precede the origin, but may be in the past.

Origin deletion cascades to its follow-up; source or return deletion sets only its optional id to null. Retain the completed status when a linked return is deleted: the user's completion assertion does not depend on retaining that visit. Guard linked profile/date edits and document reassignment so existing associations cannot become invalid. Clear a source link transactionally when its document is reassigned away, preserving wording and status; reject other invalidating visit edits with an actionable error. An originating visit with a follow-up cannot change profile implicitly.

### D2. Explicit endpoint and portable contracts

Add an idempotent `PUT /api/care-visits/:id/follow-up` upsert, accepting the complete validated follow-up state (not arbitrary ownership ids). Resolve ownership and profile from the originating visit, and validate both optional links before mutation. Reopening or cancelling normalizes `completed_visit_id` to null. Follow-ups are cancelled rather than destructively deleted independently.

Expose `followUps` in the vault, filter it by the selected profile in `DataProvider`, and add `visit_follow_ups` to account export. Update shared types, Zod contracts, API client, route context, and initial empty state together. Existing visit creation/edit payloads remain unchanged; this prevents a visit metadata save from accidentally erasing its follow-up.

Reuse standard mutation feedback and refresh behavior. Return helpful validation/ownership errors without raw database errors or private metadata. Disable repeat submit while saving; retain input on failure.

### D3. Separate, manually confirmed follow-up editor

Open a focused follow-up form from a visit, not from medication scheduling. Proposed defaults: pending status, no source or completed-visit link, blank instruction, exact-date entry. The user can instead calculate from positive whole days after the actual visit date using calendar-day arithmetic; display the resulting date and require an explicit confirmation checkbox. Changing interval or base date invalidates confirmation. Only the resolved date is persisted, so future edits to the visit do not silently reschedule the follow-up.

Exact-date entry is itself explicit user selection and does not need the calculated-date confirmation. Validate real dates and safe interval arithmetic; do not guess missing values or use current time as the interval base. Label the result "Follow-up due" and "Not a booked appointment." Status edits and optional completion links are owner assertions; never auto-complete or infer attendance.

Show a compact pending-follow-up list above the records timeline, sorted by due date then stable id, independent of document filters. Include an originating-visit action that reveals its row, date, and neutral timing label (upcoming, due today, past due date). Completed/cancelled state stays available within its visit. Existing deletion confirmation must mention removal of the originating follow-up.

### D4. Flat timeline with compact disclosure

Render visits once, interleaved by `visit_date` with id as a deterministic tie breaker, rather than wrapping each track around a fully expanded group. Include a small track label in the summary, with an explicit track-management area to retain edit/delete controls and empty tracks. Keep unassigned documents as a separate section.

Each visit starts collapsed and displays date, title, provider, record count, linked-medication count and follow-up badge. Use an accessible disclosure button with `aria-expanded` and a controlled region; render edit/delete/upload controls separately, not inside a clickable summary. Document actions and notes appear in the expanded region. Permit multiple expanded rows, but start with none; reset expansion on profile changes.

Preserve `record` query scope, search, type, favourites, and date-order controls. Document constraints filter documents first, then omit visits without matching records; do not show "No documents attached" for records merely hidden by filters. Distinguish total and matching counts where needed. A single global no-match state resets the existing constraints. Without constraints, show genuine empty visits and afford adding documents.

Use visit dates for row order and record dates within expanded rows, applying the chosen direction independently; label this distinction in the UI. Do not silently flatten records across visits and discard visit context.

### D5. Move visualization to Medical history and preserve source navigation

Add a lazy-loaded protected `/medical-history` page using the existing `CareHistoryGraph` component and profile-scoped `useVault` data. Remove `showCareMap`, the toggle, and graph rendering from `MedicalRecordsPage`; do not duplicate data storage or introduce a graphics runtime. Reuse existing graph structure for tracks, chronological visits, standalone visits and unassigned documents. Add saved follow-up dates/status as read-only visit context, labelled as due dates rather than booked appointments.

Add Medical history above Health profile in shared navigation so the header, desktop sidebar, menu and command palette can derive the route consistently. The mobile dock currently uses `navigation.slice(0, 4)`; replace that positional assumption with an explicit existing-destination selection (Overview, Medications, Records, Profile). Medical history and Settings remain available in the mobile menu and command palette. Do not silently drop Profile when adding the new item.

History is an exploration page, not another document-editing surface. Document references navigate to `/medical-records?record=<id>`; medication references use `/medications?record=<source-record-id>` instead of the current unscoped medication link. A visit reference uses `/medical-records?visit=<id>` so an empty visit is reachable too. Resolve every referenced item only from the selected profile. If a link is stale or no longer available, show an explicit no-match message and an all-records action rather than substituting another visit.

Automatically reveal the containing visit for a selected `record`, including when the page is already mounted. A `visit` scope reveals that visit; explicit document filters still apply without pretending a hidden document is absent. If both scopes are supplied, combine them rather than allowing one to widen the other. The pending-follow-up visit action uses the same scoped navigation. Show-all/clear-filters removes both scopes. Editing and previewing retain scopes, expansion, scroll and trigger focus. Existing preview components remain authoritative for private byte access.

Whole-history map scoping and bounded server retrieval remain explicitly deferred. This move creates a clearer boundary for later enhancements but includes no extra visualization modes or lifetime-scale claims.

### D6. Deliberate document-discovery alignment

The current toolbar uses flex-wrap with a flexible search, fixed-width selects, two buttons and an inline result count. Inputs and selects also differ in minimum height, producing visibly uneven control edges even when they fit one row.

Use a responsive grid with Search, Document type, Date order, and Favourites in that order. At desktop content widths for 1280/1440 viewports, reserve flexible search space, bounded select columns and a compact favourite column. Give every control an explicit shared 48-pixel height and reserve the same label row above each. Keep the favourite toggle accessibly named and pressed-state aware; do not rely on an icon alone. Move result status beneath the grid. At smaller widths use deliberate two-column or stacked arrangements rather than forcing everything onto one line.

Prefer local classes/props over a global control-height change, avoiding unrelated changes to forms and header controls. Verify actual top/bottom coordinates and heights in browser checks; a visually plausible screenshot or lack of overflow alone does not establish alignment.

## Risks / Trade-offs

- Full-vault payloads still grow with history -> document this limitation; do not claim server-side pagination or performance acceptance for decades of records.
- New links can become invalid through older mutation paths -> cover visit profile/date edits, record reassignment, deletion, and direct database guards in focused tests.
- Sparse compact rows can hide actions -> include visible expansion affordances and discoverable per-visit follow-up controls; preserve stable keyboard focus.
- A new navigation item can displace an existing mobile destination -> select dock destinations explicitly and verify all routes remain reachable.
- Calculating milliseconds across daylight-saving boundaries gives wrong dates -> use existing calendar-date utilities/date-fns and test month/year/leap boundaries.
- Working tree already contains schema v7 and profile changes -> layer v8 on those changes without reverting, reseeding, or overwriting them.

## Migration Plan

1. Validate with isolated fictional data and a populated v7 fixture; verify old visits, records, medication links and family health details survive unchanged and no follow-up is invented.
2. Before any authorized deployment, take a coordinated database/document backup. Apply v8 transactionally on startup using the existing migration pattern.
3. Verify ownership, link constraints, export, persistence after reopen, and representative UI workflows locally. No remote storage call is needed for these checks.
4. Prefer a forward fix. Application rollback must understand v8; never decrement `user_version` or discard the database to start old code. Restoring a coordinated backup requires separate operator authorization.
