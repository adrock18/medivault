# Production Release Technical Design

## Context

See [the proposal](proposal.md) for the release goal and the owner's explicit
decision to publish no executable testing material. This is a distribution and
verification-contract change, not an application rewrite.

Observed repository state:

- The application has established `src`, `server`, `scripts`, `public`, `docker`
  and handbook boundaries. The production image already copies only built assets,
  server source, shared libraries and runtime entrypoint/configuration into its
  final stage.
- Seventeen test files and test configuration are already tracked; new browser
  suites and some additional test files are still untracked. Seven generated
  OpenSpec integration files and the root `fictional-prescription.pdf` are tracked.
  The sample-data feature generates its own PDF bytes; it does not read that file.
- `data`, `dist`, dependencies, browser reports and results are already ignored.
  Ignoring paths again is not sufficient to remove existing index entries.
- `build` runs `tsc -b`; the root TypeScript project references
  `tsconfig.test.json`, and `tsconfig.node.json` includes `vitest.config.ts`.
  Merely untracking tests would therefore leave hidden local dependencies.
- `verify` invokes `npm test`; `pretest` builds the application; `verify:full`
  adds Playwright. CI has Windows/Linux verification, Linux browser, container
  runtime smoke and production-audit jobs. Render uses `checksPass`.
- The prior Windows build passed 164 unit/API and 37 browser checks. Those are
  historical results, not promises that a reduced CI catches equivalent defects.
- The two visual predecessors are complete at 17/17 and 15/15. The quality
  upgrade is 29/31; its Linux references and integrated container acceptance
  remain unexecuted.
- The supplied Docker screenshot reports a fatal fault/SIGBUS. A fresh read-only
  probe reports the daemon unavailable, both registered WSL distributions stopped
  and approximately 3.6 GiB free on C:. Earlier image unpacking hit `ENOSPC`.
  Capacity pressure is observed context, not proof of the SIGBUS root cause.

## Goals / Non-Goals

**Goals**

- Make a fresh release checkout buildable without any local-only testing files.
- Preserve the owner's existing local files while changing the published tree.
- Keep runtime type safety, validation, private data boundaries and production
  artifact completeness checks.
- Leave professional, navigable documentation and truthful archive provenance.
- Establish a safe, permission-aware route to local Docker/container acceptance.

**Non-goals**

- No UI redesign, source-wide folder migration, API change or schema rollback.
- No functional-test replacement disguised as a build check.
- No Git history rewrite, old-commit purge, blanket PDF ignore or dependency
  deletion based solely on a name looking unnecessary.
- No Docker factory reset, global prune, WSL unregister, virtual-disk deletion,
  automated diagnostic upload or real provider recovery.
- No automatic commit, push or deployment.

## Decisions

### 1. Treat the owner's distribution choice as a breaking tooling change

The versioned tip excludes executable testing source and test-only tooling.
Historical documentation and OpenSpec evidence can still mention earlier tests;
it must not contain embedded executable suites or advertise removed commands as
available. Earlier commits remain unchanged.

Use the following initial disposition map, confirming the actual index before
acting:

| Material                                                                  | Publication disposition                                          | Local disposition                                                     |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `tests/`, `e2e/`                                                          | Untrack currently indexed files; never add new suites.           | Preserve source bytes.                                                |
| `vitest.config.ts`, `playwright.config.ts`, `tsconfig.test.json`          | Untrack/ignore and remove all required references.               | Preserve bytes with local tooling context.                            |
| `scripts/check-entrypoint.sh`, `docker/verify.Dockerfile`                 | Do not publish; remove package/CI hooks.                         | Preserve as local verification material.                              |
| `.agents/skills/`                                                         | Untrack generated integration content and ignore its exact root. | Retain working integrations; document `openspec update` regeneration. |
| Root `fictional-prescription.pdf`                                         | Untrack and ignore this exact file after confirming references.  | Preserve; retain the unrelated runtime sample generator.              |
| `test-results/`, `playwright-report/`                                     | Already ignored; keep excluded.                                  | No blanket deletion of reports currently open in the browser.         |
| `data/`, environment secrets                                              | Never stage or inspect contents for cleanup.                     | Leave untouched.                                                      |
| Runtime source, `public/favicon.svg`, migrations, lockfile, build tooling | Retain.                                                          | No cosmetic restructuring.                                            |
| OpenSpec main specs/archives and handbook                                 | Retain with current navigation and professional headings.        | Preserve evidence and canonical paths.                                |

Use root-anchored ignore entries and targeted index operations, not `git add .`,
`git rm -r --cached .` or a repository-wide reset. Record hashes for files being
untracked and compare after the operation. Existing staged user changes must not
be cleared. Separate tracked removals from never-tracked exclusions.

Local test files alone are not a supported runnable toolchain after the package
dependencies are removed. Preserve their original manifest/lock/configuration
context in an ignored owner-controlled location before dependency restoration;
do not promise that `npm test` remains available. Do not copy runtime data or
credentials into that local preservation set.

**Alternative rejected:** only changing `.gitignore`. It leaves tracked files in
the release and leaves clean-checkout build/CI failures unresolved.

### 2. Keep a production-only release contract

Retain the `verify` entry point to minimize caller churn, but make its supported
meaning explicit:

```text
locked installation
       |
       v
format --> lint --> production type/build --> emitted assets

separate required CI results:
production dependency audit + deployment-image compilation

separate local/operator acceptance:
isolated container readiness + core fictional-account rehearsal
```

Remove `pretest`, `test`, `test:integration`, `test:e2e`, `verify:full` and
`test:entrypoint` from the published package. Do not leave empty-success aliases
or use `--passWithNoTests`. Keep the existing 500,000-byte entry limit and OCR
resource checks.

Remove the test-project reference and the Vitest configuration include while
retaining strict app, server, scripts and Vite type checking. Ensure local ignored
files cannot cause extra formatting/lint/type failures; check explicit scope in
the actual tools rather than assuming every tool follows `.gitignore`.

Remove direct test-only development dependencies: `@playwright/test`,
`@testing-library/jest-dom`, `@testing-library/react`, `@types/supertest`, `jsdom`,
`selfsigned`, `supertest` and `vitest`. Update the lockfile with npm after the
manifest change. Keep React/Node type packages and build tooling.
`concurrently` is used by `scripts/dev-runtime.ts`; `cn` is imported by UI
primitives. Neither is unused.

CI retains Windows/Linux release checks, a production dependency audit and Linux
deployment-image compilation. Remove browser jobs and versioned container-smoke
test logic rather than relabeling them. Do not disable Render's `checksPass`,
readiness endpoint, restoration or protected cookie requirements to obtain a
green deployment.

**Trade-off accepted by the owner:** build and audit gates do not cover account
isolation, migration behavior, browser layout or write failures as the removed
suites did. State this plainly in active documentation.

### 3. Prefer a clean index and clear navigation over broad file moves

The runtime layout already matches module responsibilities and production COPY
paths. Keep it; moving shared code would add import/container risk without a
verified benefit.

Make the root README a concise product/quick-start/release entry, with details in
the existing handbook. Use consistent titles such as Technical Architecture,
Engineering Decisions, Development and Release Guide, and Operations and Recovery.
Update links and section anchors together.

Keep `proposal.md`, `design.md`, `tasks.md`, capability `spec.md` files and
`.openspec.yaml` under their schema-defined names. Professionalize current titles,
not the filenames the CLI discovers. Preserve existing change IDs and dated
archives; do not rename historical folders solely for appearance.

### 4. Reconcile history before applying successor removals

The successor removes requirements introduced by an unarchived predecessor.
Synchronizing it against today's main specs alone would target requirements that
do not exist there yet.

```text
premium-visual-refresh (17/17)
             |
             v
editorial-health-workspace (15/15)
             |
             v
care-workspace-quality-upgrade (29/29 retained; two tasks retired)
             |
             v
production-release-readiness (new publication contract)
```

During implementation, assess each predecessor's deltas and use the archive/sync
workflow with its own confirmation requirements. Apply in this order so the final
theme/motion and verification rules are not overwritten by an older design.
The quality-upgrade review preserves the original 29-of-31 execution record.
After the incomplete-work warning, the owner explicitly retired the two
unfinished tasks rather than marking them passed. Its retained checklist is
29/29; the omitted pinned Linux visual acceptance remains a historical limit,
separate from later successful container acceptance.

The owner selected synchronization and archival after this scope reconciliation.
If spec merge conflicts remain, leave the affected change active and block
successor synchronization rather than inventing missing requirements. After
verified predecessor synchronization, this change's REMOVED blocks have real
targets. Archive this change only after reviewing its implementation evidence.

### 5. Diagnose and recover Docker independently of repository cleanup

The current screenshot is a host Docker Desktop fault, not a MediVault stack
trace. Do not add application retries, remove restore protection or change
Render/B2 settings in response.

Recovery sequence:

1. Read daemon/WSL versions and status, capacity and narrowly relevant local log
   errors. Keep diagnostics local and sanitize any excerpts; do not use
   `gather -upload` or assume the crash dialog's collection is upload-free.
2. Identify Docker's actual configured disk location and required preservation
   scope. Establish sufficient capacity for the intended Node/Debian image build,
   including unpacking and intermediate layers. No arbitrary free-space value
   guarantees success.
3. If space recovery or a restart is needed, present exact files/services and
   impact for separate approval. Do not free space from unrelated projects,
   shared browser installations, runtime data or WSL distributions.
4. With approval, attempt the smallest Docker-specific restart/recovery that the
   evidence supports. Do not issue global `wsl --shutdown` or terminate Ubuntu as
   a shortcut. Recheck readiness after each bounded action.
5. If storage repair, reinstall or reset is indicated, stop for a separately
   approved backup/recovery plan. Docker's documented VM backup requires Docker
   fully stopped, the actual configured disk path and a safe destination with
   adequate capacity. Do not copy a large disk onto the nearly full C: drive.
6. Once healthy, build only the deployment image. The no-test-source release does
   not need the large Playwright image. Run an owned container on an available
   port with isolated local storage and record health/deep-link/non-root/runtime
   contents outcomes; remove only that container and its owned temporary data.

A hosted CI image build can provide packaging evidence while local recovery is
blocked, but is not evidence that local runtime checks ran. A Render/B2
restart-survival rehearsal requires a separate deployment authorization.

Sources:

- [Docker Desktop troubleshooting](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/)
- [Docker Desktop backup and recovery](https://docs.docker.com/desktop/settings-and-maintenance/backup-and-restore/)

## Risks / Trade-offs

- [No reproducible functional regression gate on GitHub] --> Explicit owner
  choice; preserve historical/local evidence and disclose reduced assurance.
- [Ignored local files hide a broken release] --> Verify an isolated export of
  the intended published tree, without local tests, cached dependencies or data.
- [CI changes unexpectedly affect auto-deploy] --> Retain `checksPass`, validate
  job results and stage publication only after separate authorization.
- [Cleanup loses local work] --> Exact-path index removal, hash preservation,
  narrow ignore rules and no broad deletion.
- [Archive order restores obsolete requirements] --> Chronological predecessor
  reconciliation, complete capability comparison and strict validation.
- [Host repair disrupts shared workloads or stored images] --> Separate
  action-specific consent, preservation requirements and bounded readiness probes.
- [Previous results are mistaken for current acceptance] --> Separate historical
  164/37 results, current build gates, local container acceptance and live hosting.

## Migration Plan

1. Record the current index/worktree and preserve only in-scope local tooling.
2. Apply index/ignore, package/lock, TypeScript, quality-tool and CI changes as one
   coherent distribution transition; do not publish an intermediate broken state.
3. Update current documentation and validate a clean exported release tree.
4. Reconcile/archive predecessors with their required confirmations and preserve
   incomplete-work warnings; then validate successor requirements against the
   resulting main specs.
5. Complete permission-gated Docker recovery/runtime acceptance or report the
   exact remaining blocker without claiming production readiness.
6. Present the reviewed candidate and evidence. Commit, push, hosted CI and
   deployment are separate actions requiring explicit authorization.

Rollback of the tooling/distribution change restores the prior tracked files,
manifests, scripts and CI together, preserving local modifications. It does not
roll back database schema version 3 or delete healthcare data. Historical archive
records are preserved; never use a broad reset to undo the transition.
