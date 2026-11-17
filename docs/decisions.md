# Engineering Decisions

Each record states context, decision, alternatives and consequences. These are
documented choices, not claims of security or healthcare certification.

## D1. Single-origin modular monolith and SQLite

- **Context:** A personal medication/records MVP needs reliable ownership and a
  small deployment, not independently scaled services.
- **Decision:** Keep React + Express on one origin, Node SQLite with WAL/foreign
  keys/strict migrations, and shared validated contracts.
- **Alternatives:** Supabase or a separately operated PostgreSQL service;
  microservices/ORM migration. These add migration and operations work without a
  measured requirement.
- **Consequences:** One writer per SQLite replica. Complete owned datasets and
  buffered uploads suit current small accounts, not an established production
  capacity guarantee. Measure history size, latency and concurrent memory before
  introducing pagination/aggregation or streaming.
- **Where:** [app](../server/app.ts), [database](../server/database.ts),
  [configuration](../server/config.ts).

## D2. Opaque cookie sessions

- **Context:** Browser scripts do not need a bearer token in persistent storage.
- **Decision:** Store an opaque random token in an HttpOnly/Lax cookie, its
  SHA-256 hash in SQLite, and scrypt password hashes with independent salts.
- **Alternatives:** JWT/localStorage, third-party identity. Neither is required
  for this same-origin MVP.
- **Consequences:** Session lookup/revocation is server-owned; production needs
  HTTPS/Secure cookies. There is no email-based recovery flow. Browser downloads
  already saved cannot be revoked by logout.
- **Where:** [auth](../server/auth.ts), [session handlers](../server/app.ts),
  [AuthProvider](../src/contexts/AuthProvider.tsx).

## D3. Private file delivery and explicit compensation

- **Context:** Medical documents cannot be public static assets.
- **Decision:** Keep owner-scoped local/B2 bytes and deliver through authenticated
  API checks; compensate if metadata creation fails after upload.
- **Alternatives:** Public bucket, bearer/presigned links, database-stored files.
- **Consequences:** The server streams every authorized request. Separate storage
  systems are not atomic; partial failures need explicit errors and controlled
  reconciliation, not success-shaped fallbacks.
- **Where:** [document store](../server/document-store.ts),
  [document handlers](../server/app.ts), [flows](flows.md#documents).

## D4. Local OCR is an editable draft, not interpretation

- **Context:** Printed prescription text may be useful but recognition can fail.
- **Decision:** Serve PDF/OCR workers locally and require human review plus normal
  form validation before saving explicit wording.
- **Alternatives:** Cloud AI/OCR, automatic medication creation, inferring doses
  from strength or shorthand.
- **Consequences:** Larger lazy worker assets and mobile processing cost. English,
  page/pixel limits and cancellation are explicit. No claim of handwriting,
  clinical interpretation or guaranteed recognition.
- **Where:** [OCR](../src/lib/ocr.ts),
  [scanner](../src/components/PrescriptionScanner.tsx),
  [draft parser](../src/lib/prescription.ts).

## D5. Recorded outcomes and projected history are distinct

- **Context:** Prescriptions can be edited; earlier schedule versions are not
  stored. Original outcome coordinates remain available.
- **Decision:** Keep stored taken/skipped outcomes factual and label calendar
  unlogged entries as projections from current details.
- **Alternatives:** Treat every historical projection as a prescribed or missed
  dose; create a prescription-versioning domain now.
- **Consequences:** Historical completeness cannot be proved. Distinct original
  scheduled dates with any stored taken or skipped outcome count once; future
  dates do not count. Current runs end today when qualified, otherwise yesterday,
  or have no current ending date. Local calendar arithmetic preserves DST/year
  adjacency. Recorded adherence remains taken divided by logged outcomes in the
  last 30 days, excluding unlogged entries.
- **Where:** [calendar](../src/lib/calendar.ts),
  [dashboard helpers](../src/lib/dashboard.ts),
  [dose constraints](../server/migrations/001_initial.sql).

## D6. Derived logging milestones, not stored achievements

- **Context:** Neutral acknowledgment can support record keeping without
  rewarding medication use or pretending history proves prescription completion.
- **Decision:** Derive lifetime 3/7/30 distinct-date milestones from actual outcome
  rows on every refresh. Taken and skipped count equally. Keep them secondary to
  today's check-ins; identify the current run's ending date separately.
- **Alternatives:** Persist achievement flags, infer historical completeness from
  today's schedule, celebrate every refresh, or reward extra doses.
- **Consequences:** Undo and deletion remove the corresponding derived progress.
  Original log coordinates survive schedule edits. A neutral self-ending toast
  follows only an explicit successful check-in crossing a known threshold; static
  progress does not replay feedback on reload, refresh or sign-in. No healthcare
  recommendation or cached achievement is introduced.
- **Where:** [shared derivation](../src/lib/dashboard.ts),
  [check-in](../src/components/DoseSchedule.tsx),
  [secondary display](../src/components/DashboardVisuals.tsx).

## D7. Owner-persistent desired-state favourites

- **Context:** A user needs a private, durable way to find important documents
  without duplicating files or changing the existing date-based order.
- **Decision:** Migration 003 adds `medical_records.is_favourite`, an integer
  constrained to 0/1 with default 0. The SQL boundary validates that representation;
  API contracts require a boolean without a permissive missing-field default.
  `PUT /api/records/:id/favourite` accepts only `{is_favourite:boolean}`, checks
  ownership and normal mutation protections, and returns the canonical record.
- **Alternatives:** localStorage-only stars, a separate bookmarks table, and a
  read-then-toggle endpoint. They either lose cross-session state or complicate
  ownership, deletion, and repeated requests unnecessarily.
- **Consequences:** Repeated/concurrent same-state requests do not flip the flag
  or touch metadata/file bytes; an unchanged desired state keeps `updated_at`.
  Different desired states are last-commit-wins. Metadata edits preserve the flag;
  record deletion removes it. JSON export includes the canonical boolean.
  Pending controls lock, failures keep confirmed state and expose retry, and an
  unfavourited filtered row returns focus to the persistent result count.
- **Migration / rollback:** Existing v1/v2 databases upgrade forward to version
  3 and existing documents begin unfavourited. Keep rollback code compatible with
  schema version 3. Older code rejecting newer versions must not be forced to
  open the database by decrementing `user_version` or dropping columns. Reverting
  to a coordinated pre-migration database/document backup requires a separately
  authorized restore and loses later writes; it is not a routine code rollback.
- **Where:** [migration](../server/migrations/003_record_favourites.sql),
  [SQL representation](../server/database.ts), [handler](../server/app.ts),
  [discovery](../src/pages/MedicalRecordsPage.tsx).

## D8. Frozen private summaries and browser-owned printing

- **Context:** A user needs a concise local copy without a report service,
  persistent duplicate of medical data, or invented historical prescriptions.
- **Decision:** Lazy-load the Settings summary. Validate inclusive local dates,
  fetch a fresh owner-checked vault, and project an independent in-memory copy.
  Keep original outcome coordinates and taken/logged counts, explicitly current
  medication details, range-filtered record metadata and optional profile pairs.
  Exclude file bytes/paths, OCR wording, credentials and legacy measurements;
  preserve the broader JSON export.
- **Alternatives:** Persist generated reports, add a PDF service, share remote
  links, or derive past prescription details from today's schedule.
- **Consequences:** Generation/owner guards reject late responses; changing inputs
  or dismissing the account/report discards the snapshot. Print checks the session
  again and calls the browser once without claiming save/download success.
  Copies saved outside MediVault remain sensitive and cannot be remotely revoked.
  Native print/save/cancel requires the documented manual rehearsal.
- **Print correctness:** Print CSS removes portal positioning, animation and
  independent transforms, and allows natural multipage flow. The production CSS
  optimizer folds literal `translate: none` into `transform`, leaving Tailwind's
  independent translation active. CSS-wide `initial` resets preserve the actual
  independent properties. Real PDF readback caught the resulting off-page text;
  checking a white preview or element dimensions alone was insufficient.
- **Where:** [projection](../src/lib/summary.ts),
  [summary](../src/components/ActivitySummary.tsx),
  [print layout](../src/index.css),
  [manual rehearsal](development.md#rehearsing-private-activity-summaries).

## D9. Live appearance colors with background-only gloss

- **Context:** A native full-page snapshot blocked ordinary Chromium clicks even
  with non-interactive transition pseudo-elements. The full Windows WebKit app
  also crashed during that presentation; minimal API probes alone did not fail.
- **Decision:** Commit semantic colors synchronously, suppress individual color
  interpolation during that commit, and optionally animate only the existing
  decorative background for 420 ms. Controls and focus remain live. Route,
  overlay and feedback effects stay at or below 250 ms; this background-only
  appearance effect is the explicit exception to older blanket duration limits.
- **Alternatives:** Native page snapshots, whole-document opacity crossfades,
  browser denylists and an animation framework. They add interaction, contrast,
  private-image capture, compatibility or bundle risks.
- **Consequences:** No outgoing page or private-content capture. Missing CSS
  animation support and reduced motion are static; system and cross-tab changes
  never play gloss. Replacement, route/account changes and runtime reduced motion
  cancel it. A storage failure still reports that persistence failed without
  reverting the selected appearance. Ambient washes otherwise remain static;
  auth medication decoration alone retains explicit pause/resume.
- **Vocabulary:** Feedback 180 ms, route arrival 200 ms, overlay 160 ms, explicit
  theme gloss 420 ms. The original authentication-only 460 ms glass entrance
  is retained at the user's request; workspace routes still have one short
  arrival without nested card entrances. Reduced motion suppresses the entrance.
  Fine-pointer-only icon perspective does not resize targets.
  PDF/OCR stay lazy; no production animation dependency is added.
- **Where:** [theme store](../src/lib/theme.ts), [CSS](../src/index.css).

## D10. Fail-closed startup and separate recovery evidence

- **Context:** A storage transaction cap denied replica listing during startup.
  Application readiness alone cannot demonstrate backup or document health.
- **Decision:** Preserve restore-before-Node and nonzero refusal on restore
  failure. Earlier isolated verification used local fake commands and both absent
  and existing databases; that harness is now local-only. Keep real-provider
  recovery separately authorized.
- **Alternatives:** Bypass restore, start empty, poll the bucket with every health
  request, automatically raise caps, or infer durability from API readiness.
- **Consequences:** Restore faults may keep the service unavailable rather than
  silently presenting an empty account. One writer, sync lag, coordinated
  database/document backups and compatible forward migrations are operational
  constraints. Document-operation diagnostics expose operation/opaque correlation,
  not provider messages or private paths. Fault tests establish compensation and
  explicit partial errors, not a distributed transaction or remote durability.
- **Where:** [entrypoint](../docker/entrypoint.sh),
  [operator procedures](operations.md).

## D11. Production-only published verification

- **Context:** The owner explicitly excludes executable testing material from
  GitHub while retaining local copies.
- **Decision:** Remove suites and test-only tooling from the published tree,
  package commands, TypeScript graph and CI together. Preserve strict runtime
  checks, emitted assets, production audit and deployment-image compilation.
- **Alternatives:** Keep regression sources (greater reproducibility but contrary
  to the owner's choice), or merely ignore them (leaves tracked files and broken
  clean-checkout references).
- **Consequences:** No reproducible functional/browser regression coverage in a
  fresh checkout. Local historical results do not validate later changes.
  Existing local bytes and tooling context are preserved, not guaranteed runnable.
  Container runtime acceptance and hosted durability remain separate evidence.
- **Where:** [release commands](../package.json),
  [CI](../.github/workflows/verify.yml),
  [development guide](development.md),
  [historical quality evidence](../openspec/changes/archive/2026-11-17-care-workspace-quality-upgrade/review.md).

## Decision template for future changes

Record the problem, chosen behavior, invariants, alternatives rejected, migration
and rollback requirements, operational consequences, linked code, acceptance
scenarios and measured verification. Update the relevant record when behavior
changes rather than leaving contradictory historical claims in the handbook.
