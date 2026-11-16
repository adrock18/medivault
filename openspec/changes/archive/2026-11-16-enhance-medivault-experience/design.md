# Design

## Context

See [proposal.md](proposal.md) for motivation and the five capability specifications under [specs](specs/) for observable requirements.

The current project is not a static prototype:

- [Layout](../../../src/components/Layout.tsx) supplies a desktop sidebar, mobile menu/bottom navigation, account header, and stale-data feedback.
- [App](../../../src/App.tsx) already protects workspace routes, keys the data provider by account, and lazy-loads module pages.
- [AuthContext](../../../src/contexts/AuthContext.tsx) and [DataContext](../../../src/contexts/DataContext.tsx) manage cookie-session refresh and real API-backed data.
- [MedicationsPage](../../../src/pages/MedicationsPage.tsx) already offers prescription CRUD, status filters, today's schedule, and recorded history, but no medication-name search.
- [MedicalRecordsPage](../../../src/pages/MedicalRecordsPage.tsx) already combines search/category filtering with upload/edit/delete workflows, but has no record-date sort control.
- [MedicalRecordCard](../../../src/components/MedicalRecordCard.tsx) rounds sizes to two decimal megabytes, which can display small valid documents as `0.00 MB`.
- [index.css](../../../src/index.css) defines Geist and theme variables, while several page/component treatments still use independent hard-coded colors and very small text.
- [app.ts](../../../server/app.ts), the SQLite migration, and shared schemas enforce persistence, ownership, upload validation, and dose uniqueness. Existing backend tests cover these real handlers.
- The latest build has a roughly 574 kB minified entry chunk. The frontend has a same-origin API proxy; production Express can serve the compiled frontend directly.

There are no existing main OpenSpec specs. This change introduces contracts for preserved behavior and proposed UX enhancements; it must not interpret every ADDED requirement as missing implementation.

## Goals / Non-Goals

**Goals:**

- Build a cohesive experience by refining the current components instead of replacing working modules.
- Make medication check-ins and document tasks easier to locate, complete, and verify.
- Treat accessibility, truthful persistence feedback, and small-screen use as acceptance criteria.
- Validate API, browser, and production boundaries without touching real user records.

**Non-Goals:**

- A new backend architecture, schema redesign, global state framework, component framework, or third-party service.
- New clinical interpretations or changes to the meaning of prescribed times, dosage, or recorded adherence.
- New account-role systems, background notifications, a theme switcher, or infrastructure provisioning.
- Replacing working healthcare modules merely to formalize their specification.

## Decisions

### 1. Refine the existing light visual system

Use the current Geist typography, shadcn/Base UI primitives, Tailwind utilities, and Lucide icons. Consolidate recurring page surfaces, text, borders, radii, elevation, and semantic colors through the existing theme variables and shared component treatments. Use a restrained teal primary color, white cards, a neutral workspace background, and clear text hierarchy.

Equivalent controls should share sizing, hover/focus/disabled states, and 44-pixel minimum touch targets. Status badges must pair text with color. Fix contrast by choosing appropriate foreground/background pairs rather than reducing visibility with opacity.

**Alternative:** a new UI kit or a dark/light theme system would increase surface area and risk without solving the requested workflow priorities.

### 2. Evolve the shared shell before individual pages

Refine [Layout](../../../src/components/Layout.tsx) and [common](../../../src/components/common.tsx) first so page improvements inherit one visual language. Preserve existing routes and navigation destinations. Keep primary mobile destinations readily available and profile/settings reachable through the menu; account for bottom navigation and device safe areas when sizing content.

Keep landmarks, skip navigation, accessible action names, focus visibility, and dialog focus restoration. Adapt dense tables locally so overflow stays within their containers instead of widening the page.

**Alternative:** page-specific shells would duplicate navigation and produce inconsistent behavior.

### 3. Replace promotional dashboard space with daily utility

Use a compact greeting, primary quick actions, summary cards, and today's check-ins before records/history/chart detail. Remove the existing large introductory banner rather than adding another section above the daily routine.

Derive first-use guidance from the existing data snapshot: health profile present, at least one record, and at least one measurement. Show remaining relevant actions without blocking normal use. Add-medication guidance is optional and explicitly refers to an existing prescription. Do not persist checklist flags or store health information in browser storage.

Preserve dashboard recent-record ordering by upload recency; vault sorting is a separate, explicitly labeled record-date choice.

**Alternative:** a mandatory onboarding wizard would delay useful access and wrongly assume every user needs medication.

### 4. Add lightweight, local discovery controls

Both lists already receive the complete owned dataset. Add a controlled medication search input and compose it with the existing status filter. Normalize search with trimming and case folding; do not modify source data. A clear-filters action restores an empty query and the default active status.

Add newest/oldest record-date ordering to the vault after search/category filtering. Sort a copy, never the provider's shared array. Compare normalized record dates, then use descending creation timestamp and ascending UUID as deterministic tie-breakers. Reset restores empty search/category constraints and newest record date.

**Alternative:** new search endpoints and pagination are unnecessary for this change. Revisit server-side discovery if dataset scale later requires it.

### 5. Make document and medication actions understandable

Retain existing card/form components and private file-access helpers. Strengthen metadata hierarchy and descriptive action labels. Display file sizes in bytes, kB, or MB as appropriate so non-empty documents do not round to zero.

Present pending, taken, and skipped doses as text-labeled states. Keep due/past-time information separate from recorded outcomes. Preserve existing undo, history, and confirmation semantics, including the explicit warning that deleting a medication deletes its logs.

**Alternative:** image thumbnails, OCR summaries, and a new document-preview service add privacy/performance complexity without being required for trustworthy document access.

### 6. Preserve real backend contracts and mutation behavior

Reuse [api.ts](../../../src/lib/api.ts), existing hooks, form validation, and Express ownership checks. Do not introduce demo fallbacks, change numeric/date input contracts, or rewrite authentication to support styling.

Keep form values after failures, disable duplicate submissions, and distinguish successful persistence from a failed refresh. Preserve stale-data notices and explicit retry actions. Registration, password changes, exports, and opt-in sample data continue through their existing pathways.

No database migration or new API endpoint is planned. If validation demonstrates a directly related backend defect, fix it with a focused failing test before changing behavior. Scope-changing findings require review rather than silently adding a feature.

**Alternative:** replacing auth/data providers or adding a separate client cache would enlarge regression risk without an identified need.

### 7. Enforce the build bound with measured output

Preserve lazy module routes and inspect Vite's existing Rolldown output before changing chunking. Use a targeted supported `output.codeSplitting` configuration or a demonstrably useful import boundary to keep the entry chunk at or below 500,000 bytes. Do not increase the warning threshold, remove validation, or eagerly load chart dependencies on login to pass the check.

Measure emitted bytes and inspect the initial route's requests; a smaller individual chunk is not by itself a claim of faster total loading. Avoid introducing redundant downloads or runtime initialization cycles.

**Alternative:** simply suppressing the warning would not satisfy the contract, while a bundler replacement is unrelated.

### 8. Reuse the current validation tools

Use existing Vitest/Testing Library/Supertest suites for focused discovery, ordering, checklist, failure-state, and regression coverage. Existing backend tests already exercise real SQLite/filesystem handlers; do not duplicate every baseline scenario as a new test.

Use the integrated browser for persisted journeys and responsive/keyboard checks. Start both processes once, probe direct and proxied health/session endpoints, and use disposable accounts for mutation/isolation checks. Remove only the exact test-created entries, files, and accounts; never reset the application data directory.

Validate 320, 375, 768, 1280, and 1440 CSS-pixel widths, page-level overflow, readable metadata/history, accessible control names, focus behavior, touch-target dimensions, and contrast. Exercise long names, empty datasets, failed requests, and real uploaded documents.

Run the production build and a bounded production-serving smoke check with isolated storage. Confirm SPA deep links and same-origin API calls. Documentation must distinguish the combined persistent-host deployment from an ephemeral Vercel Functions backend.

**Alternative:** adding a new end-to-end runner or accessibility dependency is not presumed necessary; existing tools can validate the requested outcomes.

## Risks / Trade-offs

- [A visual refresh accidentally changes medication semantics] -> Reuse scheduling utilities and run existing reminder/dose tests; keep wording non-prescriptive.
- [Shared styling improves one page but harms another] -> Validate all current routes and narrow widths after shell changes, not only the two primary modules.
- [Vault sorting is confused with upload recency] -> Label it as record-date order and retain upload recency on the dashboard.
- [Small or long document metadata breaks layout] -> Check human-readable size formatting, long titles/providers, and contained wrapping.
- [Chunk splitting meets the file bound but worsens loading] -> Inspect initial requests and route loading, not only reported chunk size.
- [Development servers lock native dependencies on Windows] -> Stop only the relevant server before reinstalling; keep one combined development instance running during browser checks.
- [SQLite and file deletion cannot form one atomic transaction] -> Preserve explicit partial-failure errors; do not claim atomic deletion or add a new storage architecture.
- [Persistent local data is mistaken for encrypted/compliance-certified storage] -> Retain accurate privacy and deployment documentation; require appropriate host/filesystem protections.

## Migration Plan

1. Apply the shared visual system and shell refinements, then update dashboard and primary workflows while preserving API payloads and identifiers.
2. Bring supporting routes into the same component treatments and add only directly related tests.
3. Validate the full-stack journeys, bundle bound, responsive behavior, and production serving against the capability scenarios.
4. Deploy the built frontend with the existing Express source and persistent data directory on the selected HTTPS host.

No schema migration, data reset, or healthcare-data transformation is required. Before deployment, preserve the previous source/build release and a consistent database/document backup. If rollback is needed, restore the previous application release while retaining the unchanged persistent data; do not delete or recreate it.
