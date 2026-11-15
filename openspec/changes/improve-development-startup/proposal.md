# Proposal

## Why

Repeated duplicate development starts have produced port conflicts, and a failed API child can leave Node watch mode waiting instead of making the combined command fail. Developers need a clear, safe startup outcome without disturbing another running instance or saved healthcare data.

## What Changes

- Check the configured API and fixed frontend listening addresses before starting the combined development application; report occupied ports and safe recovery instructions.
- Report API bind failures clearly, including conflicts that occur after preflight, without claiming startup succeeded.
- Make an initial API startup failure terminate the combined development command and its owned children with a nonzero exit status rather than leaving a watcher waiting.
- Confirm API and proxied API readiness before announcing that the complete application is ready.
- Preserve successful-development watch behavior, configured API ports, the strict frontend port, separate-terminal workflows, and production startup.
- Add focused startup, duplicate-start, shutdown, restart, and persistence checks; document the revised development behavior.

## Capabilities

### New Capabilities

- `development-runtime`: Safe port checks, truthful startup readiness and failures, and lifecycle management of the local full-stack development command.

### Modified Capabilities

None. The durable spec inventory is currently empty. The completed, unarchived `enhance-medivault-experience` change already describes general full-stack startup and retryable website errors; this change adds a narrower runtime contract without editing or archiving that change.

## Impact

- Expected implementation areas: package scripts, a small development startup helper if needed, API entry-point diagnostics/lifecycle, focused subprocess tests, and README startup instructions.
- Reuse the existing `GET /api/health` response and Vite `/api` proxy; no new healthcare endpoints or dependencies are required by this proposal.
- No changes to authentication, database schema, document access, healthcare workflows, public defaults, or production hosting requirements.
- Never kill an unrelated process, automatically reuse an occupied listener, silently change ports, or delete/reset persistent data.
- This capture creates planning artifacts only; implementation and archiving remain separate actions.
