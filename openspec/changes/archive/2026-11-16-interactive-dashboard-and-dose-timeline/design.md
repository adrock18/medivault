## Context

The dashboard currently renders four `StatCard`s (records, active medications, today's doses, doses taken) plus setup links, an upcoming list, and `MedicationReminder`. Today's doses on both the dashboard and the medications page use `DoseSchedule`, a flat list with Taken/Skip/Undo actions and All/To log/Logged tabs. All data comes from `useVault()` (`records`, `medications`, `logs`, `now`) and the helpers `scheduledDoses`, `doseTiming`, and `medicationStatus` in `src/lib/utils.ts`.

Constraints from existing specs: no measurement charts on the dashboard; daily tasks come before historical detail; past-time doses are never counted automatically; no horizontal overflow at 320–1440 px; 44 px touch targets; 4.5:1 contrast; status not conveyed by color alone; initial JS entry stays under 500,000 bytes (about 357 KB now). Recharts is not installed.

## Goals / Non-Goals

**Goals:**

- Replace the dashboard stat cards with a 24-hour day dial paired with today's timeline, a 30-day recorded-adherence ring, a 7-day activity chart, compact linked counts, and a factual insight panel.
- Replace the flat dose list with a today timeline on both pages, keeping the existing actions and filters.
- Keep every visual derived from persisted data, accessible, and theme-aware.

**Non-Goals:**

- Multi-day timeline, measurement charts, notifications, or any health interpretation.
- Changing the medications page stat cards, list, or history table.
- New API endpoints or schema changes.

## Decisions

1. **Hand-drawn SVG, no chart dependency.** The day dial is a `<circle>` 24-hour track with dose marks placed at `angle = minutes / 1440 * 360°` (midnight at top) and a current-time hand; the adherence ring uses `stroke-dasharray`; the week chart uses stacked `<rect>`s. Colors use existing theme tokens so Light and Dark work. Alternative: add Recharts (~100 KB gzip) — rejected for bundle budget and the small number of shapes needed.
2. **Pure helpers in `src/lib/dashboard.ts`.** `dayBreakdown(meds, logs, day)` returns taken/skipped/unlogged for a local day: scheduled doses from medications active on that day, plus logs whose time no longer matches the schedule counted once by outcome. `weekBreakdown(meds, logs, now)` maps the last 7 days. `adherence30(logs, now)` returns taken ÷ logged or `null`. `loggedStreak(meds, logs, now)` counts consecutive fully logged previous days with at least one dose. `dailyInsights(input)` returns at most three statements from a fixed set of factual templates. All take `now` explicitly for deterministic tests.
3. **Shared filter state on the dashboard.** `DashboardPage` holds `doseFilter: 'all' | 'taken' | 'skipped' | 'unlogged'`; the dial legend and the timeline both read and set it. The timeline's own tabs (All / To log / Logged) map onto the same state; legend selections of taken or skipped show as a chip with a clear button. On the medications page the timeline keeps internal state.
4. **`DoseTimeline` replaces `DoseSchedule`'s list rendering.** `DoseRow` and its mutation logic (and aria-labels) are reused so behavior and tests for Taken/Skip/Undo stay stable. The timeline is an `<ol>` with a vertical rail, a "Now, HH:mm" list item inserted between earlier and later doses, and the next unlogged dose at or after now marked "Up next". Each state has a status shape plus its existing text label. `DoseSchedule` is kept as a thin wrapper exporting the timeline so imports and tests change minimally.
5. **Accessibility.** Dial legend items are `<button>`s with `aria-pressed`, counts, and labels such as "Show 2 not yet logged doses"; dial marks are decorative because the timeline beside it is the accessible list of the same doses. Each SVG has `role="img"` and an `aria-label` with totals. Week bars are buttons inside a labeled group; the selected day's counts render in a text line. Animations use `motion-safe:` only.
6. **Insight wording guardrails.** Templates never use "missed", "should", or health judgments; unlogged earlier doses are reported as "not yet logged" without action prompts. Unit tests assert the forbidden vocabulary is absent.
7. **Visual direction (frontend-design pass).** The original brief (white background, teal accents, rounded cards, soft shadows) stays authoritative; the skill shapes everything the brief leaves open.
   - Palette (existing tokens, light / dark): Paper `#FFFFFF` / `#15232B` (Today surface), Mist `#F4F7F8` / `#0C151B` (workspace), Pine `#233D39` / `#E5EEEC` (text), Teal `#116B60` / `#63DCC5` (taken, now hand, actions), Amber `#B45309` / `#F7CD7A` (earlier, not yet logged), Slate `#50636A` / `#AFC1C8` (skipped).
   - Type: Geist Variable stays app-wide; tabular numerals for times; scale 12 / 14 / 16 / 20 / 30 with the dial's central total the only 30 px figure. No all-caps labels, no middle-dot meta strings, no arrow-suffixed buttons.
   - Status shapes: taken = filled dot with check; skipped = dot with slash; not yet logged = hollow ring; up next = thick teal ring plus "Up next" text.
   - Layout: one "Today" surface holds the dial (left, or top on mobile) and the timeline (right), with the insight lines beneath. Below it a quiet row: the 7-day chart beside text-led adherence and record/medication counts, separated by a hairline, not boxed in separate shadowed cards. Recent records, upcoming doses and prescription linking follow unchanged.

     ```
     +--------------------------------------------------------+
     | Today                                                  |
     |  +-----------+   08:00 (v) Metformin       Taken       |
     |  | day dial  |   13:00 (/) Vitamin D       Skipped     |
     |  | 2 of 4    |   ---- Now, 20:38 --------------------  |
     |  | [legend]  |   21:00 (O) Up next  [Taken] [Skip]     |
     |  +-----------+   2 of 4 logged. Next: Metformin 21:00. |
     +----------------------------+---------------------------+
     | Last 7 days (bars)         | Adherence 80% | counts    |
     +----------------------------+---------------------------+
     ```

   - Motion: one orchestrated moment — the dial track and hand draw in on first load (`motion-safe` only); otherwise motion only answers actions (filter change, logging).
   - Review against defaults: the first draft was four equal cards (ring, adherence, chart, insight) — the generic SaaS-card kit — and a plain segmented ring. Revised to a single Today surface with a subject-specific 24-hour dial (user-approved) and text-led secondary figures.

## Risks / Trade-offs

- [Historical days use the current medication schedule, so past edits to times can misstate unlogged counts] → Logs always count by their own coordinates; only unlogged counts depend on the current schedule, documented in a code comment and spec scenario.
- [Local-day boundaries and DST] → Use existing `localDate` and date-fns day arithmetic; test around midnight.
- [Rewritten dashboard tests lose coverage] → New tests assert the same totals via text equivalents.
- [Small dial marks are hard to hit and doses at the same time overlap] → Marks are not interactive; legend buttons provide 44 px targets, and coincident marks stack inward toward the centre so each stays visible, and the timeline lists every dose.
- [The dial is busier at 320 px] → The dial shrinks to about 160 px above the timeline, hour labels reduce to 0 / 6 / 12 / 18.

## Migration Plan

Frontend-only change; deploys through the existing push → CI → Render auto-deploy. Rollback is a git revert.

## Open Questions

None.
