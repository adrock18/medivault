# Proposal

## Why

MediVault already has working Express/SQLite authentication and healthcare CRUD, but its experience needs a more cohesive visual system, clearer daily priorities, and easier medication and document workflows. This change makes the existing personal healthcare website feel professional and complete without replacing its backend or adding unrelated clinical functionality.

## What Changes

- Refine the light healthcare theme with consistent typography, neutral surfaces, restrained teal accents, spacing, elevation, and accessible interaction states.
- Improve the desktop/mobile workspace and apply the same presentation standards to authentication, profile, tracker, and settings.
- Prioritize today's medication check-ins and useful quick actions on the dashboard; replace the promotional banner with concise, data-derived first-use guidance when appropriate.
- Add medication-name search alongside existing status filters, and make scheduled, taken, and skipped doses unmistakably different.
- Improve document discovery with existing search/category filters plus newest/oldest record-date sorting, clearer file details, and accessible view/download/edit/delete controls.
- Make loading, validation, retry, success, and destructive-action feedback consistent across real API-backed workflows.
- Verify persisted user journeys, private-file authorization, responsive layouts, and production startup; reduce the initial entry JavaScript chunk to at most 500 kB without hiding build warnings.
- Preserve existing dosage/schedule semantics, health data, API contracts, password handling, and account isolation. No breaking API or database changes are planned.

## Capabilities

### New Capabilities

No durable OpenSpec capabilities exist yet. These specifications formalize existing behavior together with the explicitly proposed experience improvements; they do not imply that the core application must be rebuilt.

- `workspace-experience`: Cohesive visual styling, responsive navigation, accessibility, asynchronous feedback, and first-load performance.
- `dashboard-overview`: Database-derived health overview, prioritized daily check-ins, quick actions, and contextual first-use guidance.
- `medication-management`: Prescription CRUD, medication discovery, local schedules, explicit dose outcomes, and accurate history.
- `medical-record-vault`: Private uploads, document discovery/sorting, authorized viewing/downloads, metadata editing, and confirmed deletion.
- `account-health-management`: Working authentication, personal profile, health measurements, settings, and preservation of user-specific data.

### Modified Capabilities

None; the project has no existing main specifications to modify.

## Impact

- Frontend: shared styles and components, workspace layout, all current pages, medication/document cards, dialogs, tables, and API-connected feedback.
- Backend: existing Express routes, SQLite constraints, and private filesystem storage remain the source of truth; only directly related defects demonstrated by validation may require fixes during implementation.
- Validation: reuse Vitest, Supertest, and integrated-browser checks; add focused tests only for newly introduced behavior or demonstrated regressions.
- Build/deployment: targeted Vite chunking and updated run/deployment verification instructions in the README. No dependency additions are presumed necessary.
- Out of scope: deadlines or time-based phases, clinician/admin portals, prescribing or diagnosis, OCR/AI summaries, email/push reminders, password recovery services, a theme switcher, database migration to another platform, and production infrastructure provisioning.
