# Design

## Context

See [proposal.md](./proposal.md) for motivation and the [development-runtime specification](./specs/development-runtime/spec.md) for the acceptance contract.

- The current combined command uses `concurrently -k` around two npm scripts. The API script runs Node watch mode; a failed watched child can exit while the watcher remains alive.
- The original API logged success inside an Express listen callback. Implementation's real bind-conflict test established that Express 5 also invokes this callback on error, reproducing the misleading success message. Success must instead use the actual HTTP server `listening` event.
- `server/index.ts` validates configuration, creates SQLite-backed application resources, and handles server errors and shutdown signals. Existing backend tests mostly exercise `createApp`, not the full watched process lifecycle.
- `GET /api/health` runs a database probe and returns `{ "status": "ok" }`. Vite proxies `/api` to loopback, using its environment-loaded API port.
- The frontend command uses strict port 5187. Defaults, optional `.env`, separate-terminal commands, persistent storage, and production HTTPS requirements must remain intact.

The design is warranted because the change crosses package scripts, process supervision, API readiness, and subprocess testing.

## Goals / Non-Goals

**Goals**

- Put initial configuration, address checks, readiness, and cleanup under one owner.
- Reuse installed tooling and existing health checks rather than introducing another service manager or new dependencies.
- Make success and failure observable in process-level tests, including Windows cleanup.

**Non-Goals**

- No background service installation, automatic process discovery/termination, automatic port selection, or new user-facing configuration options.
- No production readiness orchestration, storage migration, healthcare changes, or continuous health-monitoring platform.
- No change to the website's existing retry behavior during normal development reloads.

## Decisions

### Use a thin combined-development launcher with the existing supervisor

Replace the shell-only `dev` command with a small Node TypeScript entry point. Use the installed `concurrently` package's programmatic supervision and process-tree cleanup rather than implementing a second process manager. Keep the existing API and frontend scripts as the supervised commands so separate-terminal use remains available.

The launcher owns an initial readiness guard and one idempotent cleanup path. Startup errors cancel pending probes, stop only commands created by this invocation, await their termination, and exit nonzero. Preserve supervisor failure propagation and interruption handling; a supervised command unexpectedly exiting successfully is still a full-stack failure.

**Alternatives:** A preflight-only shell prefix would improve duplicate starts but leave watched-child failures unresolved. Replacing watch mode or writing a complete custom process manager would broaden scope unnecessarily.

### Resolve effective configuration before touching application storage

Load optional `.env` using the existing Node mechanism and preserve inherited-environment precedence. Validate the effective API port using the same rules as the API entry point; share a small side-effect-free resolver if needed. Pass the resolved port, including its default, to the children so proxy setup cannot disagree with the preflight value.

Probe the API bind address and strict frontend address with short-lived exclusive TCP listeners, then close all probes before launch. Check both services and report address-specific failures. Do not initialize SQLite as part of preflight, inspect another service's private data, or treat permission/invalid-host errors as occupied-port errors.

**Alternatives:** OS-specific process-name inspection is unnecessary and unsafe as a recovery mechanism. Silent fallback ports break documented URLs and conceal the real conflict.

### Correlate initial readiness with this invocation

Poll direct and proxied health with bounded requests, requiring HTTP 200 and the existing healthy JSON shape. Use a fixed, documented 30-second initial readiness timeout; report the failing leg and useful final error without dumping credentials or health data.

A port check is not a reservation. Generate a fresh development startup identifier in the launcher and pass it only to its child environment. The launched API adds that identifier as a development-only header on its health response; both probes must match it. This prevents another healthy API that wins a bind race from satisfying the new invocation's readiness check.

The marker is correlation metadata, not an authentication credential. It must not grant access, enter the health JSON contract, be persisted, appear in `VITE_` variables, or be required by standalone/production startup. This requires a narrowly scoped health-handler option in `server/app.ts`, set by the API entry point only for the combined development workflow.

The initial guard ends after successful readiness. Normal API watch restarts remain supported; ongoing unavailability continues to use the website's existing error/retry UX.

**Alternatives:** Positive health JSON alone cannot identify a competing MediVault process. Parsing human-readable watcher output is brittle. A new control endpoint or persistent startup-status file is unnecessary.

### Keep real bind failures and resource cleanup authoritative

Preflight improves diagnostics but does not replace API and Vite bind-error handling. Preserve strict frontend behavior. Give API bind conflicts an actionable address/port message while retaining explicit non-conflict error reporting.

Make API shutdown/resource disposal idempotent across bind failure, interruption, and repeated signals. Do not claim success until the listen callback actually runs. The launcher must verify termination of its owned command trees; any forced-cleanup fallback must remain ownership-scoped and report failures explicitly.

**Alternatives:** Killing whichever PID occupies a port risks another user's process. Resetting SQLite or deleting documents cannot solve a listening-address conflict.

### Verify processes with isolated storage and test-owned ports

Add a focused Node-environment Vitest startup suite. Test the launcher through a narrowly testable configuration boundary, allowing ephemeral ports and test command fixtures without exposing new production settings. Include real API/Vite subprocess checks as well as deterministic failure fixtures.

Use a fresh temporary data directory for each process scenario and preserve a saved account/healthcare row across stop/restart. Occupied-listener fixtures belong to the test and must remain alive after a rejected startup. Cleanup uses tracked process handles and exact temporary paths; tests never terminate listeners on the user's normal development ports.

**Alternatives:** Existing in-process Supertest coverage cannot prove watcher failure, port release, or process-tree cleanup. Running tests against the user's active instance risks sessions and healthcare data.

## Risks / Trade-offs

- [Port availability can change after preflight] -> Keep real bind errors authoritative and require the invocation's marker for readiness.
- [Node watch mode can outlive its failed child] -> The initial guard expires independently of watcher liveness and shuts down the owned command tree.
- [Windows signal and descendant cleanup differ from Unix] -> Exercise the real supervision path on Windows and assert that test-owned listeners disappear; do not rely only on mocked child exits.
- [Cold dependency optimization may exceed the readiness budget] -> Surface a clear timeout, document the bound, and verify representative cold/warm starts rather than waiting indefinitely.
- [Readiness requests race with shutdown] -> Abort probes and make cleanup idempotent before returning a final exit status.
- [Development source errors after readiness can cause transient outages] -> Preserve watch recovery and existing website retry behavior; do not turn this into continuous automatic shutdown.

## Migration Plan

1. Implement the launcher, development readiness correlation, and API lifecycle fixes without changing persistent schemas or defaults.
2. Run focused startup tests, existing backend regression tests, and the normal type-check/build.
3. Verify duplicate-start rejection and interruption/restart on Windows using isolated data and test-owned ports; update README startup and recovery instructions.
4. Adopt the revised `npm run dev` command after stopping any prior development instance in its owning terminal.
5. Roll back by restoring the previous combined script and removing only this change's helper/readiness instrumentation. No database rollback or data deletion is needed.
