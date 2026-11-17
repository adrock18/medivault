# Production Release Readiness

## Why

MediVault's working feature upgrade needs a deliberate release boundary: a clean source distribution, coherent deployment checks, professional documentation and accurate change history. The owner explicitly wants no executable testing material on GitHub, while the current build and CI depend on that material and Docker Desktop is unavailable.

## What Changes

- **BREAKING:** Stop versioning automated test suites, fixtures, runners, test-only configuration and dependencies. Preserve existing local files before removing tracked paths from the index; untracked new suites must never be staged. Remove test-dependent package scripts, TypeScript references and CI jobs together.
- Retain formatting, lint, strict runtime/tooling type checks, production build, emitted-resource limits, production dependency audit and deployment-image compilation as the published release gates. These are not replacements for functional regression coverage.
- Stop tracking generated OpenSpec integration skills and the unused standalone fictional PDF while preserving local copies. Keep generated output, runtime data, credentials and local verification material excluded from publication and Docker contexts.
- Keep the existing application/server/shared-contract layout unless a specific file has a demonstrated ownership problem. Reorganize documentation navigation and titles without a broad source move or a cosmetic rewrite.
- Use professional document titles while preserving OpenSpec's canonical artifact filenames, stable capability IDs, dated archives and historical evidence.
- Plan ordered reconciliation of the completed visual changes and the partially completed quality upgrade. Preserve unexecuted Linux checks as unexecuted; do not mark them passed merely because their tooling is being removed.
- Investigate Docker's reported SIGBUS crash safely, recover capacity and service availability only with separate authorization for shared-machine changes, then verify the deployment image locally.

## Capabilities

### New Capabilities

- `repository-distribution`: Source-control boundaries, local-only tooling preservation, maintainable repository organization and traceable OpenSpec archive lifecycle.

### Modified Capabilities

- `repository-verification`: Replace the checked-in functional/browser-test contract with explicit production-only build gates; remove superseded test-source requirements after predecessor reconciliation.
- `live-demo-deployment`: Separate published image-build checks from local/operator runtime acceptance, document Docker recovery boundaries and retire the versioned entrypoint-test harness requirement introduced by the quality upgrade.

## Impact

- Affects Git index/ignore rules, package manifests/lockfile, TypeScript project references, CI, Docker build-context exclusions, README/handbook links and OpenSpec lifecycle records.
- No intended changes to UI, login animation, routes, authentication, health data, migrations, document storage, OCR, API contracts or Render/B2 settings.
- GitHub will no longer reproduce the 164 unit/API and 37 browser checks previously executed. Keeping files locally does not make them available to collaborators or CI, and old results do not validate future changes.
- Local Docker failure currently blocks local container acceptance, not Render's own engine. Render uses `checksPass`; release-gate changes must be validated rather than bypassed.
- This proposal authorizes no deletion, untracking, host repair, archive, commit, push or deployment. Implementation and any shared-service interruption require the appropriate subsequent authorization.
