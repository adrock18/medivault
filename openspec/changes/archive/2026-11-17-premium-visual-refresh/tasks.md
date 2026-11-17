# Tasks

## 1. Tokens and surfaces

- [x] 1.1 Retune `:root` and `.dark` tokens in `src/index.css` to the design.md palette. Add `--surface-raised` and `--control-border`, point input borders at `--control-border`, and set `index.html` `theme-color` to `#0E6B5F`. Verify: run the contrast script over every text/background pair listed in design.md. Text pairs must reach at least 4.5 and control borders at least 3.0.
- [x] 1.2 Add `tone: 'raised' | 'section'` to `Panel` in `src/components/common.tsx`. `section` is the default, with a border and no shadow. `raised` uses the raised fill, the top highlight and the only shadow. Apply `raised` to the Dashboard Today surface and to the Medications "Today's schedule" panel. Verify: `npm run typecheck` passes, and screenshots show exactly one shadowed surface per page.

## 2. Navigation and template cleanup

- [x] 2.1 Restyle the desktop sidebar in `src/components/Layout.tsx`:
  - remove the all-caps eyebrow;
  - give the active item an accent bar plus the wash, so it isn't distinguished by color alone;
  - reduce the privacy card to one muted line;
  - remove the footer middle dot.

  Verify: a `tests/` assertion that the active nav link has `aria-current="page"`, and that no element text matches `/[A-Z]{4,} [A-Z]{4,}/`.

- [x] 2.2 Replace the mobile bottom bar with the floating inset dock. The dock has a safe-area offset, a raised fill, and an active pill with semibold text, and content gets `pb-32` below `lg`. Verify: headless screenshots at 320 and 375 px in both themes. At the end of the dashboard and medications pages, the last action must sit fully above the dock, with no horizontal overflow.
- [x] 2.3 Remove middle-dot meta strings and uppercase labels from:
  - `MedicationCard`, `MedicalRecordCard` and `MedicationReminder`;
  - the Dashboard upcoming list;
  - the Medications page description;
  - the `AuthPage` eyebrow.

  Use stacked lines, label/value pairs or words instead, as in design.md decision 9. Verify: running `grep` for `&middot;|·|uppercase|tracking-\[` over `src/` returns no matches.

## 3. Loading and motion

- [x] 3.1 Add `Skeleton` and `PageSkeleton` to `src/components/common.tsx`, with dashboard, list and form variants, `role="status"` and visually hidden loading text. Verify: add a test that each variant renders a status with an accessible "Loading" name and no numeric text.
- [x] 3.2 Add a `Suspense` around `<Outlet />` in `Layout`, and use the pathname-chosen `PageSkeleton` for both that fallback and the workspace data-loading state. Keep the top-level `Suspense` and the background-refresh spinner. Verify: in a test, lazy route loading keeps the header and nav rendered while the skeleton status shows. Manually, a throttled reload shows the dashboard-shaped skeleton.
- [x] 3.3 Add the route fade: key `<main>`'s inner wrapper by pathname and give it the motion-safe fade-in, 200 ms. Add a global `prefers-reduced-motion: reduce` rule that collapses animation and transition durations. Verify: headless Edge with `reducedMotion: 'reduce'` reports a `getComputedStyle(...).animationDuration` of at most `0.01ms` on the route wrapper and on the dial hand.

## 4. Dose timeline

- [x] 4.1 Add `partOfDay(time)` to `src/lib/dashboard.ts`: before 12:00 is Morning, 12:00–16:59 is Afternoon, and 17:00 onward is Evening. Verify: unit tests for 00:00, 11:59, 12:00, 16:59, 17:00 and 23:59 in `tests/dashboard-helpers.test.ts`.
- [x] 4.2 Group `DoseTimeline` into period sections, each an `h3` and an `ol`. Skip empty periods, keep the now marker inside the correct period, and keep the up-next emphasis, the filters, the dial legend filtering and the "Today's doses in time order" accessible region name. Verify: tests in `tests/dashboard.test.tsx` or `tests/reminders.test.tsx` cover these cases:
  - headings appear only for periods that have doses;
  - doses stay in time order;
  - the now marker sits between the earlier and later doses;
  - the "To log" filter keeps the headings of matching periods only.
- [x] 4.3 Change the past unlogged label to "Not logged". Add the `mark-pop` keyed state-mark animation and the row background transition on log and undo. Verify: update `tests/reminders.test.tsx` to expect "Not logged". Add a test asserting that no rendered text contains "missed" (case-insensitive). Check manually that Taken, Undo and Skip still show the toasts.

## 5. Verification

- [x] 5.1 Run `npm run verify` (format, lint, typecheck, tests, and the 500,000-byte entry budget). Verify: the command exits 0, and the reported entry size is under the budget.
- [x] 5.2 Run the headless Edge visual pass on an isolated server with a seeded `[Sample]` account. Cover the dashboard, medications, records, profile, settings and login pages, in Light and Dark, at 320 and 1280 px. Verify:
  - no horizontal overflow;
  - every interactive target is at least 44 px;
  - the screenshots show one raised surface, no eyebrow labels, the floating dock on mobile, and timeline period headings.

## 6. Reference-led revision

The user rejected the initial visual direction after local review. These tasks supersede its palette and composition acceptance criteria; the functional and accessibility requirements remain.

- [x] 6.1 Recompose the dashboard around the reference-inspired medication feed, move the dial and activity into a desktop side column, and move optional setup below daily tasks.
- [x] 6.2 Apply ink/cloud themes, blue capsule navigation, warm/cool period icons, green confirmations, rounded dose cards and an abstract capsule authentication illustration. Preserve existing actions and integrations without new dependencies.
- [x] 6.3 Match dashboard skeletons to the revised layout and use a short reduced-motion-aware route entrance and dose confirmation.
- [x] 6.4 Verify all routes in both themes on mobile and desktop, explicit dose actions, dialog behavior, target sizes, overflow, reduced motion and final automated checks.

  Fix anything found, then rerun 5.1.

## Workflow follow-up

- After review, commit, push, confirm the Render deploy serves the new assets, and archive the change.
