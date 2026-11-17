# Production Release Implementation Plan

## 1. Preserve Local Work

- [x] 1.1 Record the existing index/worktree and exact tracked/untracked disposition for the design's cleanup paths; verify the inventory distinguishes pre-existing staged work and excludes runtime data and secret contents.
- [x] 1.2 Preserve the local testing manifest/lock/configuration context in an ignored owner-controlled location and record hashes for files to untrack; verify the preservation set contains only tooling/source material and is excluded from Git and Docker contexts.

## 2. Establish Production-Only Release Gates

- [x] 2.1 Replace test-dependent package scripts with the documented production-only `verify` chain, remove verified test-only direct dependencies and update the lockfile through npm; verify locked installation succeeds and retained development/runtime commands resolve their dependencies.
- [x] 2.2 Remove the test-project reference and Vitest include, and scope formatting/lint to maintained published inputs without weakening strict runtime checks or warning handling; verify `npm run verify` succeeds with local suites excluded and an isolated deliberate formatting/lint failure returns nonzero before restoring only the temporary verification change.
- [x] 2.3 Replace browser and container-smoke CI jobs with the retained Windows/Linux source/build, production-audit and deployment-image compilation gates; verify every referenced command exists, no job requires excluded tooling and Render still uses `checksPass` plus `/api/health`.
- [x] 2.4 Update the development/release guide beside these gate changes; verify it lists only available commands and clearly separates build gates, earlier functional results and local/operator acceptance without claiming equivalent regression coverage.

## 3. Apply the Publication Boundary

- [x] 3.1 Add precise Git/formatter/Docker exclusions for local testing inputs, test configurations, generated integration skills and the exact standalone fictional PDF; verify `git check-ignore` and the Docker ignore rules cover local preservation material without excluding migrations, public assets or runtime source.
- [x] 3.2 Remove only already tracked in-scope paths from the index while keeping local files, and leave new suites untracked; verify the intended published tree contains none of those paths, local hashes are unchanged and unrelated staged/worktree changes remain intact.
- [x] 3.3 Update README navigation and professional handbook/OpenSpec titles without renaming canonical artifacts or historical IDs; verify internal targets/anchors resolve, `openspec status` still discovers artifacts and the sample-data implementation has no dependency on the excluded PDF.

## 4. Prepare Truthful Lifecycle Reconciliation

- [x] 4.1 Compare the premium, editorial and quality deltas against current main specs and record the chronological merge/retirement map in the release evidence; verify the map identifies every successor REMOVED target and any conflict instead of assuming those targets already exist.
- [x] 4.2 Annotate the quality-upgrade review with the successor decision, keeping unexecuted Linux visual work unexecuted and distinguishing later container evidence; verify task counts remain truthful and no superseded checkbox is marked passed.
- [x] 4.3 Prepare archive warnings and confirmation choices for the 29/31 predecessor, retaining metadata and stable paths; verify strict validation of affected planning records and explicitly identify predecessor reconciliation as a prerequisite to successor spec synchronization.

## 5. Recover Local Container Acceptance Safely

- [x] 5.1 Perform narrowly scoped read-only Docker/WSL/capacity/log diagnosis and update the operations guide with observed evidence, unknowns and the smallest proposed next action; verify no host diagnostic upload, service interruption, unrelated-file cleanup or unproven root-cause claim occurs.
- [x] 5.2 Obtain action-specific authorization before capacity changes or a Docker-specific restart, preserve required data and attempt only the approved bounded repair; verify daemon readiness afterward, or leave this task blocked with the actual error and obtain a separate decision before storage repair/reset/reinstall.
- [x] 5.3 Build the deployment image and run one owned isolated container on an available port without cloud credentials; verify host-port health, a workspace deep link, non-root execution, migrations/scanning assets and absence of testing/secret/local-data material in the image, then remove only owned acceptance resources.
- [x] 5.4 Record container results and safe recovery/rollback instructions in operations documentation; verify the record distinguishes image compilation, local runtime readiness, unexecuted Linux visual checks and unverified hosted restart/backup durability.

## 6. Verify the Release Candidate as a Whole

- [x] 6.1 Export the intended candidate tree, including approved uncommitted changes rather than merely current HEAD, to an owned isolated directory without local suites, cached dependencies or data; verify locked installation, `npm run verify` and the production dependency audit there, retaining the 500,000-byte entry limit and required emitted-resource checks.
- [x] 6.2 Perform a fictional-account browser rehearsal of login/registration, navigation, record/medication/metric/profile operations, responsive layouts and the preserved authentication animation; verify actual outcomes without adding executable suites to the published tree or interpreting this rehearsal as comprehensive regression coverage.
- [x] 6.3 Review the candidate diff/index and release evidence against all three delta capabilities; verify local preservation hashes, documentation links, no testing material or secrets in the candidate, strict OpenSpec validation and whitespace checks, then report any remaining blocker without committing, pushing or deploying.

## Workflow follow-up

- Use the archive workflow for `premium-visual-refresh`, then
  `editorial-health-workspace`, assessing and verifying each requested spec sync.
- The owner received the quality-upgrade warning, retired its two unfinished
  verification tasks and selected synchronization and archival. Preserve the
  historical assurance limits without marking omitted Linux work passed.
- Only after predecessor requirements are reconciled, apply this successor's
  spec synchronization and verify all added/modified/removed targets. If
  confirmation is withheld or a conflict remains, stop rather than inventing
  targets or skipping required warnings.
- Archive this change only after its implementation and release evidence have
  been reviewed, using the normal completion/sync checks.
- Commit, push, observe hosted CI or deploy only after separate authorization;
  record a real deployment result before calling hosting verified.
