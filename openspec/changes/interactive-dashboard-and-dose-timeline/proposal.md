# Proposal

## Why

The dashboard opens with four plain number cards, and today's doses appear as a flat list. These are accurate, but they don't show at a glance how the day is going, what is next, or how today fits the recent routine. A visual, interactive overview and a time-ordered dose timeline make the daily routine easier to grasp without adding any medical judgment.

## What Changes

- Replace the dashboard's four static stat cards with an interactive overview built only from the signed-in user's persisted data, led by a single "Today" surface that pairs a day dial with today's timeline:
  - a **24-hour day dial** placing each of today's doses at its scheduled clock position with a current-time hand, a central "X of Y taken" total, and legend buttons for taken, skipped and not-yet-logged that narrow the timeline to those doses;
  - a **recorded-adherence ring** for the last 30 days, using the existing taken-divided-by-logged definition;
  - a **7-day activity chart** of taken, skipped and unlogged doses per day, where selecting a day shows that day's breakdown;
  - compact, linked counts for medical records and active medications.
- Add a **daily insight** panel: up to three short, factual statements derived only from the user's own logs, schedule and records, such as progress so far, the next scheduled dose, consecutive fully-logged days, or how many earlier doses are unlogged. No diagnosis, treatment advice, health-value judgments or nudges to take late or extra doses.
- Replace the today's-schedule list on the dashboard and medications page with a **visual dose timeline** for today:
  - doses ordered by local time, with a "now" marker separating earlier doses from later ones;
  - the next unlogged dose highlighted;
  - each dose's taken, skipped, past-time or scheduled state shown with text and an icon, not color alone;
  - the existing Taken, Skip and Undo actions, plus the To log and Logged filters, kept.
- A deliberate visual direction (following the frontend-design guidance within the original white-and-teal brief): one bold element (the dial and timeline), quiet text-led secondary figures instead of repeated identical cards, status shapes as well as colors, and a single load animation that respects reduced motion.
- Hand-drawn, theme-aware SVG visuals with no new charting dependency, so the initial JavaScript entry stays within its existing bound.
- Dashboard tests are updated for the new overview.
- Unchanged:
  - Measurement charts stay absent, as the dashboard spec requires.
  - The medications page's stat cards, medication list and 30-day history table.

## Capabilities

### New Capabilities

None. The behavior belongs to existing dashboard and medication capabilities.

### Modified Capabilities

- `dashboard-overview`:
  - the database-derived overview gains the day dial, the adherence ring, the 7-day activity chart and interactive drill-down;
  - a new requirement covers the factual daily insight and its safety limits.
- `medication-management`: today's dose tracking is presented as a time-ordered timeline with a current-time marker and next-dose emphasis, keeping explicit text outcomes and actions.

## Impact

- **Frontend:**
  - `src/pages/DashboardPage.tsx`;
  - `src/pages/MedicationsPage.tsx`, which swaps in the timeline;
  - `src/components/DoseSchedule.tsx`, which is replaced or refactored into a timeline;
  - new visualization components (day dial, adherence ring, activity chart, insight panel);
  - pure derivation helpers in `src/lib/` (daily breakdown, streak, insight selection).
- **Tests:** `tests/dashboard.test.tsx` is rewritten for the new overview; `tests/reminders.test.tsx` is adjusted for the timeline; new unit tests cover the derivation helpers.
- **Unaffected:** the backend, API, database schema and dependencies.
- **Risks:** chart readability at 320 px, contrast in Dark theme, and screen-reader equivalents for visuals, all covered in design and tasks.
