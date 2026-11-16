## 1. Data helpers

- [x] 1.1 Add `src/lib/dashboard.ts` with `dayBreakdown`, `weekBreakdown`, `adherence30`, `loggedStreak`, and `dailyInsights`, all taking `now` explicitly
- [x] 1.2 Add unit tests covering start/end date exclusion, logs at times no longer scheduled, no-outcome adherence (`null`), 8 taken / 2 skipped = 80%, streak counting, max three insights, and absence of "missed"/"should" wording

## 2. Visual components

- [x] 2.1 Add `DayDial` (24-hour SVG track, dose marks at clock positions with status shapes, current-time hand, central "X of Y taken", legend buttons with counts and `aria-pressed`, empty state, compact size at 320 px)
- [x] 2.2 Add `AdherenceRing` (30-day taken ÷ logged, unavailable state)
- [x] 2.3 Add `WeekActivityChart` (7 selectable stacked bars, selected-day text summary)
- [x] 2.4 Add `DailyInsight` panel rendering helper output or a neutral setup prompt

## 3. Dose timeline

- [x] 3.1 Add `DoseTimeline` (`<ol>` rail, "Now, HH:mm" marker, "Up next" emphasis, status shape + text states) reusing `DoseRow` actions and aria-labels
- [x] 3.2 Support controlled filter (`all` / `taken` / `skipped` / `unlogged`) with an active-filter chip and clear action; keep All / To log / Logged tabs
- [x] 3.3 Make `DoseSchedule` render the timeline so the medications page uses it unchanged; update `tests/reminders.test.tsx` for the now marker and next-dose emphasis

## 4. Dashboard integration

- [x] 4.1 Replace the four stat cards in `DashboardPage` with a single "Today" surface (dial + timeline + insight lines) and a quiet secondary row (week chart, text-led adherence ring and record/medication counts) per design decision 7, sharing filter state between dial legend and timeline
- [x] 4.2 Rewrite `tests/dashboard.test.tsx` to assert the same database-derived totals via text equivalents, legend-to-timeline filtering, and existing quick actions and setup region

## 5. Verification

- [x] 5.1 Visual check in Light and Dark at 320 and 1280 px on dashboard and medications: no horizontal scroll, readable states, 44 px targets
- [x] 5.2 Design critique against design decision 7: palette and status shapes match the plan, no all-caps labels, middle-dot meta strings or repeated shadowed stat cards in the new UI, single load animation disabled under reduced motion
- [x] 5.3 Run `npm run verify` and confirm the initial JS entry stays under 500,000 bytes

## 6. Workflow follow-up

- [ ] 6.1 After review, commit, push, confirm the Render deploy, and archive the change
