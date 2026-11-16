# Proposal

## Why

MediVault works, but still reads as a generic admin kit. The initial token-only refresh was rejected. The supplied medication-app reference now guides the design: ink/slate surfaces, large rounded dose cards, time-of-day icons, green confirmations, and blue capsule navigation. This change covers the visual system, screen composition and interaction polish. Later changes (calendar and reports, emergency card, appointments, vault, refills, family) remain out of scope.

## What Changes

- Rebuild both themes around the reference. Dark uses ink `#0E1320` and slate `#1C2636`; Light uses cloud `#F3F5FB` and white. Blue identifies navigation, green confirms logging, and amber/cyan identify time of day. System remains the default.
- Recompose the dashboard around the medication feed, with large rounded dose cards and explicit actions. Place the existing rhythm dial and weekly activity in a quieter side column on desktop, stacked on mobile. Move optional setup below daily tasks.
- Redesign authentication with a CSS capsule illustration, without invented statistics or medication information.
- Move the mobile bottom bar into a floating, inset navigation dock with a clear active indicator and safe-area spacing. Desktop keeps the sidebar, restyled to the new tokens.
- Replace full-page spinners with layout-matched skeletons while workspace data and route code load. Background refresh keeps the existing small indicator.
- Add one short, reduced-motion-aware fade when the route changes, and confirmation motion when a dose is logged or undone (the row's state mark animates and the row settles). Nothing animates without a reason.
- Group today's dose timeline under Morning, Afternoon, and Evening headings, keeping time order, the current-time marker, and the up-next emphasis.
- Label a past, unlogged dose "Not logged" instead of "Past scheduled time". It is never called missed and never logged automatically.
- No new runtime dependencies. Motion is CSS only, and charts stay hand-built SVG. No AI features. No backend or API changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace-experience`: the theme system gains reference-inspired ink/cloud palettes and a medication-first composition. It also adds skeleton loading, purposeful reduced-motion-aware transitions, and capsule navigation.
- `medication-management`: today's dose timeline groups doses by part of day, labels past unlogged doses "Not logged", and confirms dose-state changes with motion.
- `dashboard-overview`: the honest-progress requirement changes its past-time label from "past its scheduled time" to "Not logged".

## Impact

- **Code:**
  - `src/index.css`: tokens, keyframes and the reduced-motion rules.
  - `src/components/Layout.tsx`: sidebar, header and mobile dock.
  - `src/components/common.tsx`: Panel variants, skeletons and LoadingState usage.
  - `src/App.tsx`: per-route Suspense inside the layout.
  - `src/components/DoseSchedule.tsx`: grouping, the label and motion.
  - `MedicationCard.tsx`, `MedicalRecordCard.tsx`, `MedicationReminder.tsx`: meta strings.
  - `index.html`: `theme-color`.
  - Dashboard and auth: recomposed layouts. Medications: reference-inspired dose cards. Records, profile and settings: shared surface and theme treatment.
- **Tests:** update `tests/reminders.test.tsx` for the new label. Add timeline grouping and skeleton coverage.
- **APIs, database, dependencies:** unchanged. The entry-bundle budget (500 KB) still applies.
