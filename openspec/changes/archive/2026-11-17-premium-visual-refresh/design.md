# Design

## Active reference-led revision

The user rejected the initial token-only direction and supplied a medication-app image. This revision supersedes decisions 1, 2, 3 and 8 below, and updates the route transition in decision 5. The original plan is retained below as historical context, not as the current visual acceptance criteria.

### Visual system

| Role                     | Dark                      | Light                     |
| ------------------------ | ------------------------- | ------------------------- |
| Workspace                | `#0E1320`                 | `#F3F5FB`                 |
| Section surface          | `#171F2F`                 | `#FFFFFF`                 |
| Dose surface             | `#1C2636`                 | `#EDF0F8`                 |
| Navigation selection     | `#405DFF` with white text | `#405DFF` with white text |
| Primary text             | `#F5F6FB`                 | `#131C30`                 |
| Muted text               | `#A2ADC3`                 | `#606B81`                 |
| Confirmation             | `#53E37D`                 | `#16783A`                 |
| Morning / afternoon icon | `#FFB447`                 | `#A75E00`                 |
| Evening icon             | `#36C5F0`                 | `#087BA2`                 |

Geist Variable remains the only font. The Today title uses a responsive 42–72 px scale with tight tracking. Other page headings use 38–48 px; dose names use 16–18 px with a separate dosage line. Times remain tabular figures.

### Composition

```text
desktop
  inset navigation rail    greeting / date tile / Today       add medication
                           medication feed                    daily rhythm
                           rounded dose cards                 weekly activity
                           scan / upload / profile
                           recent records / upcoming schedule
                           optional setup

mobile
  compact header
  greeting / date / Today
  medication feed
  daily rhythm / weekly activity
  supporting records and actions
  floating capsule navigation
```

The medication feed, not the dial, is the main visual element. Sun, sunset and moon icons identify dose periods. Each card separates the medication, prescribed dosage, scheduled time, outcome and explicit Taken/Skip/Undo controls. The next dose has an outlined emphasis. Logged cards change state without disappearing. No swipe gesture is required, and no new dose or schedule behavior is introduced.

The sidebar is inset with a rounded shell. The active route uses an electric-blue capsule, matching the mobile dock. The dock is inset 16 px from the viewport and safe-area bottom. Content retains bottom clearance.

Authentication uses an abstract CSS capsule illustration, not mock patient data or fabricated statistics. Shared theme tokens and panel typography carry the direction through records, profile and settings. The previous all-caps labels and middle-dot metadata remain removed.

### Motion and rendering

One 240 ms route entrance combines opacity and a 6 px translation. Dose actions retain the 180 ms confirmation mark and use a 220 ms surface transition. No per-card idle or scroll animations are added. Reduced motion collapses all durations. Dashboard skeletons now approximate the feed-first, side-column composition. All visuals use existing CSS and SVG; no new dependencies or backend changes.

## Original plan (superseded where noted above)

## Context

- **Styling.** Styling uses Tailwind 4 tokens in `src/index.css`. Theme switching works through a `.dark` class driven by `src/lib/theme.ts`, which supports System, Light and Dark. `tw-animate-css` and Geist Variable are already installed. There is no motion library and no chart library: the dashboard visuals are hand-built SVG.
- **Panel.** Every surface is the same `Panel`: `rounded-2xl`, a border, and one soft shadow. That uniformity is the "SaaS-card kit" look the brief wants to leave behind.
- **Loading.** `App.tsx` wraps the entire router in one `Suspense`, so loading lazy page code blanks the whole workspace to a spinner. `Layout.tsx` also shows a spinner while workspace data loads.
- **Mobile navigation** is a full-width bar fixed to the bottom.
- **Dose timeline.** `DoseTimeline` in `src/components/DoseSchedule.tsx` already handles time order, the now marker, up-next emphasis and filters. It labels past unlogged doses "Past scheduled time".
- **Constraints.** The specs require 44 px targets, 4.5:1 text contrast, no overflow from 320 to 1440 px, a 500 KB entry chunk, System as the default theme, and logs created only by explicit actions.

## Goals / Non-Goals

**Goals:**

- One token change that refreshes every page in both themes.
- Hierarchy through surface levels, not through more decoration.
- Loading that keeps the page frame, and motion that only answers navigation or a user action.

**Non-Goals:**

- New routes or features: calendar, reports, emergency card, appointments, vault, refills and family come in later changes.
- New dependencies: no Framer Motion and no Recharts.
- Changes to the server, API or data model.
- Changing the typeface.

## Decisions

### 1. Design plan (reviewed against generic defaults)

**Subject.** Subject: a private medication and records companion that people open once or twice a day to see what is due and log it. Audience: adults managing their own long-term prescriptions. Primary job: answer "what do I take now, and have I logged it?" in one glance.

**Color.** Dark follows the brief's palette. Light is its daylight counterpart rather than an inversion. Ratios marked † are for non-text elements such as borders, which need 3:1.

| Role                 | Dark      | Light     | Verified contrast                            |
| -------------------- | --------- | --------- | -------------------------------------------- |
| Workspace            | `#0B151A` | `#EEF4F3` | Text on workspace 16.5 / 12.7                |
| Surface (card)       | `#172930` | `#FFFFFF` | Text on surface 13.4 / 12.7+                 |
| Raised / popover     | `#1D333C` | `#FFFFFF` | Text on raised 11.8                          |
| Accent (teal-mint)   | `#54D6BE` | `#0E6B5F` | Accent on surface 8.4 / 6.4                  |
| On-accent text       | `#06261F` | `#FFFFFF` | 9.0 / 6.4                                    |
| Text                 | `#EAF4F3` | `#12302B` | See above                                    |
| Muted text           | `#9DB4BA` | `#4E6561` | On surface 6.9 / 6.3; on workspace 8.5 / 5.6 |
| Hairline border      | `#263B43` | `#DCE7E5` | Decorative only                              |
| Input/control border | `#5E7F89` | `#73908A` | 3.5 / 3.5 †                                  |
| Accent wash          | `#173C37` | `#E3F3EE` | Accent text on wash 6.8 / 5.6                |

The amber and red state tokens keep their current values, which were already checked.

**Type.** Geist Variable stays as the only family. Personality comes from the scale and from figures:

- page titles are 30/36 semibold with −0.02em tracking;
- section titles are 18 semibold;
- body text is 14/22;
- metadata is 12/18 muted;
- every time, count and percentage uses `tabular-nums`, so the timeline's time column and the dial totals align like an instrument readout.

There are no ALL-CAPS labels and no monospace labels.

**Layout concept.** Three surface levels replace "everything is a card":

```
workspace (#0B151A)
┌ raised ──────────────────────────────┐  primary daily task: day dial + timeline
│  stronger fill, faint 1px top light, │  (one per page at most)
│  shadow only here                    │
└──────────────────────────────────────┘
┌ section ─────────┐ ┌ section ─────────┐  secondary groups: border, no shadow
│ row              │ │ row              │
│ ──────────────── │ │ ──────────────── │  rows: dividers, never their own card
│ row              │ │ row              │
└──────────────────┘ └──────────────────┘
```

Content is left-aligned. Numbers in tables and timelines are right-aligned within their column.

**Principles.**

- Spend the boldness on one thing: the day dial on the dashboard stays the hero, and everything around it gets quieter.
- Metadata is separated by layout (stacked lines, or a label and value) or by words, never by middle dots.
- Motion only ever confirms something the person did.

**Review against the generic defaults.** My first instinct was a dark navy page with a glowing mint gradient on every card, a fade-up on every section, and a "YOUR HEALTH" eyebrow on each heading. That is the near-black-with-one-bright-accent and SaaS-card-kit default. The plan changes three things:

- glow and gradients become one shadowed surface level;
- per-section entrances become a single route fade;
- eyebrows are removed and the sidebar group label becomes sentence case.

The brief's own palette is kept exactly in Dark because the client specified it.

### 2. Tokens, not page rewrites

All color changes go through CSS variables in `src/index.css`, both in `:root` and in `.dark`. Two new variables are added: `--surface-raised` and `--control-border`. The existing `slate-*` and `teal-*` aliases are retuned, so the many pages that use them pick up the new palette without edits. `index.html` `theme-color` becomes `#0E6B5F`.

_Alternative:_ a page-by-page restyle, which would mean far more churn and more risk for the same visual result.

### 3. `Panel` gains a `tone` prop

`Panel` takes `tone: 'raised' | 'section'` and defaults to `'section'`.

- `section` keeps the border and drops the shadow.
- `raised` uses `--surface-raised`, adds an inset 1 px top highlight, and is the only tone with a shadow.

The Dashboard Today surface and the Medications "Today's schedule" use `raised`. Medication and record cards stay `section`. Compact record rows already use dividers.

_Alternative:_ separate components per level. They would duplicate padding and radius logic.

### 4. Route-level Suspense and skeletons

The top-level `Suspense` stays, so auth still has a fallback. `Layout` gets its own `Suspense` around `<Outlet />`, so changing route keeps the sidebar and header in place.

`common.tsx` adds two pieces:

- `Skeleton`: a muted block with `motion-safe:animate-pulse`.
- `PageSkeleton`: takes `variant: 'dashboard' | 'list' | 'form'` and wraps the blocks in `role="status"` with visually hidden "Loading…" text.

Both the Layout data-loading state and the route Suspense fallback pick the variant from `location.pathname`:

- dashboard: dial, timeline, week;
- medications and records: title plus card grid;
- profile and settings: form.

`LoadingState` remains for small inline uses.

_Alternative:_ per-page loading inside each page. That doesn't work for the data-loading case, which Layout owns.

### 5. CSS-only motion

`tw-animate-css` utilities and two keyframes in `index.css`:

- **Route fade.** `<main>`'s inner wrapper is keyed by `location.pathname` and uses `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200`. Focus and scroll restoration are unchanged.
- **Dose confirm.** The `StatusMark` wrapper in `DoseRow` is keyed by the dose state and uses a `mark-pop` keyframe (scale 0.6 → 1, 180 ms). The row background transitions over 200 ms.
- **Dialogs** keep their existing tw-animate entrances.

A global `@media (prefers-reduced-motion: reduce)` rule sets animation and transition durations to near zero, which covers the existing `dial-draw` animation too. Nothing loops except the pulse on skeletons, and the reduced-motion rule stops that as well.

_Alternative:_ Framer Motion. It adds about 40 KB to the entry chunk with no capability we need.

### 6. Timeline periods

The pure helper `partOfDay(time)` in `src/lib/dashboard.ts` maps a time to a period:

- Morning: before 12:00;
- Afternoon: 12:00 to 16:59;
- Evening: 17:00 onward.

`DoseTimeline` groups the filtered doses by period and renders each period as a `<section>` with an `h3` and its own `<ol>`, which keeps the semantics nested correctly. Empty periods are skipped. The now marker goes into the period that contains the current time, before its first later dose. If no dose is later than now, the marker goes after the last period.

Up-next emphasis, the filter tabs, the dial legend filters and the row actions are unchanged.

_Alternative:_ separate timeline components per period. They would split the now-marker logic.

### 7. "Not logged" wording

In `DoseSchedule.tsx`, the `past_time` label becomes "Not logged". The internal `doseTiming` value stays `past_time`, so the helpers and the reminder logic don't change. The amber state color remains, and the text carries the meaning.

### 8. Navigation

**Desktop sidebar.**

- The "YOUR HEALTH SPACE" eyebrow is removed; the nav needs no label.
- The active item gets a 3 px accent bar on the left plus the accent wash.
- The privacy card turns into a single muted line with an icon.
- The footer middle dot is replaced with words.

**Mobile dock.**

- A `fixed` pill inset 12 px from the sides and `calc(12px + env(safe-area-inset-bottom))` from the bottom.
- `rounded-2xl`, `--surface-raised` fill, border, and the raised shadow.
- Four items. The active item shows an accent wash pill behind its icon plus semibold text.
- Content bottom padding grows to clear the dock, using `pb-32` below `lg`.

### 9. Meta strings

Middle-dot strings are rewritten:

- **`MedicationCard`:** the form and strength go on separate lines, and the frequency is shown as a label with its times below.
- **`MedicalRecordCard`:** the date, size and type become a small `dl` row, and the privacy line drops its dot.
- **`MedicationReminder`:** "1 taken, 2 skipped". Its uppercase label becomes sentence case.
- **The Dashboard upcoming list** and the **Medications page description** get the same treatment.
- **AuthPage:** its uppercase eyebrow becomes sentence-case text.

## Risks / Trade-offs

- **Contrast regressions on retuned aliases.** Some pages pair `slate-400` text with `slate-50` backgrounds. → Mitigation: run the contrast script over the final token pairs, and spot-check the screenshots at 320 and 1280 px in both themes.
- **Skeleton and content height mismatch causing a jump.** → Mitigation: size the skeleton blocks from the measured heights of the real sections, and accept small differences on very small accounts.
- **Keyed route wrapper remounts page state on navigation.** It already remounts per route today, so this is not a behavior change.
- **Grouped lists change test selectors.** The existing tests query `Today's doses in time order` as a single `ol`. → Mitigation: keep that accessible name on the wrapping region, and update the tests to find doses within it.
- **The floating dock may cover the last action on short pages.** → Mitigation: increase the bottom padding, and add a 375 px end-of-page check to verification.

## Migration Plan

This is a frontend-only change. It ships through the usual flow: `npm run verify`, push to `main`, and Render auto-deploys. Rollback is a git revert. There's no data migration.
