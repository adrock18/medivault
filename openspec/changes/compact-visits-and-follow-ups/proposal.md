# Proposal

## Why

The expanded records workspace becomes difficult to scan as family histories grow, mixes document management with history visualization, and has an uneven discovery toolbar. A compact records timeline, separate Medical history page, and manually confirmed follow-ups support the presentation without introducing appointment booking.

## What Changes

- Default to compact, newest-first visit summaries with date, title, provider, document count, linked-medication count, and follow-up status. Expand a visit to inspect existing documents and actions.
- Retain care tracks as contextual links rather than forcing the main records timeline into track-first groups.
- Move the existing care map to a protected `/medical-history` page above Health profile in navigation. It visualizes the selected profile's existing tracks, visits, documents, linked medications, and saved follow-up context without copying data or inferring medical relationships.
- Remove the care-map toggle from records. Align Search, Document type, Date order, and Favourites in one equal-height desktop row, with the result count underneath and a deliberate responsive grid/stack on smaller screens.
- Add one optional follow-up per recorded visit: confirmed due date, original instruction, optional source document, pending/completed/cancelled status, and an optional link to the actual return visit.
- Accept an exact date or calculate a date from a positive number of days after the visit; require the owner to confirm the calculated date before saving.
- Show actionable follow-ups in the selected profile's records workspace. Never describe a due date as a booked appointment or an uncompleted follow-up as a missed clinical event.
- Preserve existing record search, document filters, sort direction, favourites, source links, private previews and mutation safeguards.
- Keep server-side pagination, lifetime-scale performance work, and deployment/storage migration deferred. Compact rendering is not a claim that the current full-vault fetch scales indefinitely.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `care-organization`: Owner-managed visit follow-up lifecycle and a separately navigable, profile-scoped Medical history visualization referencing existing data.
- `medical-record-vault`: Compact chronological visit discovery, aligned responsive document controls, and preserved source-record navigation from medications and Medical history.

## Impact

- SQLite migration after schema v7; shared request, response and database types; care routes; vault and account-export contracts.
- Records page, follow-up editor, existing care-map component, a Medical history route/page, shared navigation, command palette, responsive navigation and focused UI helpers; existing medications remain linked through source documents.
- Preserve the mobile dock's existing four destinations explicitly rather than inserting a navigation item and unintentionally displacing Profile through array slicing. Medical history remains reachable in the mobile menu.
- Existing local-only validation/backend/discovery tests and browser checks; related architecture, flows and operations documentation.
- No new runtime package, automatic clinical inference, email reminder extension, doctor booking, authentication rewrite, Supabase setup, live deployment, or changes to existing demo data.
