# Tasks

Implementation and verification are complete. These tasks implement the [development-runtime contract](./specs/development-runtime/spec.md) using the [design](./design.md); they do not authorize archiving another change.

## 1. Configuration and address preflight

- [x] 1.1 Add a side-effect-free effective startup configuration resolver and API/frontend address preflight; verify defaults, inherited environment precedence, valid configured API ports, and invalid values with focused tests.
- [x] 1.2 Add service-specific actionable preflight errors and ensure all temporary listeners close before launch; verify API-only/frontend-only conflicts leave test-owned incumbent listeners responsive and do not initialize application storage.
- [x] 1.3 Update README configuration and occupied-port recovery guidance; verify the documented defaults, strict frontend port, and supported environment behavior match the resolver and never recommend automatic process killing or data deletion.

## 2. API readiness identity and resource lifecycle

- [x] 2.1 Add invocation-correlated development health headers without changing healthy JSON or access controls; verify matching markers identify the launched API, ordinary health clients remain compatible, and production/standalone startup does not require the marker.
- [x] 2.2 Make API bind errors actionable and resource cleanup idempotent; verify an occupied test address produces no successful-listen message, repeated shutdown is safe, and non-conflict startup errors remain explicit.
- [x] 2.3 Document the unchanged health JSON and development-only correlation behavior in the README API/startup notes; verify the marker is not described as an authentication credential or user-configured secret.

## 3. Combined launcher and owned process supervision

- [x] 3.1 Wire a thin Node launcher into `npm run dev` using the installed supervisor and existing service scripts; verify real startup on test-owned ports reaches direct and proxied healthy responses before the complete-ready message.
- [x] 3.2 Implement bounded initial readiness checks and failure cleanup; verify failed watched API startup, proxy failure, unexpected supervised exits, and a competing healthy listener after preflight all cause nonzero termination without adopting or stopping the competing listener.
- [x] 3.3 Implement idempotent interruption/termination handling for the launcher's owned command trees; verify repeated cleanup releases test-owned listeners and terminates descendants while leaving unrelated fixtures running.
- [x] 3.4 Verify real API watch restart and saved account/healthcare data plus a private test document survive a stop/restart cycle using isolated storage; assert the new process serves the same persisted data and authenticates through existing session behavior.
- [x] 3.5 Update README combined-start, timeout, interruption, and restart instructions; verify the documented 30-second readiness bound, informational optional-environment notice, separate-terminal commands, and no-data-reset recovery match observed behavior.

## 4. Integration verification

- [x] 4.1 Run the focused startup suite together with existing backend integration tests, then `npm run build` and targeted lint/format checks; verify all changed runtime files type-check and existing healthcare/API behavior remains intact.
- [x] 4.2 Perform isolated Windows cold/warm start, duplicate-start rejection, interruption/restart, and production/standalone smoke checks; record results and any limitations in this task artifact, verify saved data remains intact, and clean only exact test-owned processes and temporary paths.

## Verification evidence

- `npx vitest run tests\startup.test.ts tests\backend.test.ts`: 28 tests passed, comprising 17 startup cases and all 11 existing real backend integration cases.
- `npm run build`: frontend, backend, launcher, and startup-test TypeScript checks passed; the production frontend build succeeded.
- Targeted Oxlint and Prettier checks passed for changed runtime/configuration/documentation files. Repository-wide generated-skill formatting and unrelated pre-existing warnings were not changed.
- The real default readiness timeout was exercised, not replaced by a short test setting: failure reported `30s`, exited within the asserted 29.5-35 second window including cleanup, stopped its failed API watcher/frontend, and released test-owned addresses.
- Real API/Vite subprocesses returned matching invocation headers and healthy JSON directly and through the frontend proxy before complete readiness. A second start was rejected while the first stayed functional.
- An isolated API wrapper source edit triggered a real Node watch restart. The registered fixture's session, exact saved measurement, medical-record metadata, and private PDF bytes survived watch restart and a full stop/restart.
- API-only/frontend-only conflicts, identical API/frontend ports, a post-preflight competing healthy listener, failed proxy responses, and unexpectedly successful service exits were verified. Incumbent fixtures remained alive and rejected preflight did not create application storage.
- The actual development CLI entry was run with a missing optional environment file and a test-owned occupied API address; it exited nonzero with the correct conflict diagnostic and did not open storage.
- The launcher SIGINT path was dispatched in an isolated subprocess, with real Windows watcher descendants. Both addresses were released, and an OS process scan found zero remaining processes referencing those exact test fixture paths. This checks the signal handlers rather than physically pressing a key in the user's terminal.
- Standalone and production subprocess smoke checks passed without requiring a development marker. Production health suppressed an explicitly supplied marker and served a dashboard deep link from the built frontend.
- Each test used temporary storage and tracked process handles. Test-owned services and exact temporary directories were cleaned; the user's data directory was neither reset nor populated with test accounts/documents.
- The existing user frontend listener remained PID 34212; its API restarted normally through its existing watcher during source edits. Direct and proxied health both returned `{ "status": "ok" }` afterward. No existing instance was deliberately stopped, and no additional development instance was left running.
- No change was archived.
