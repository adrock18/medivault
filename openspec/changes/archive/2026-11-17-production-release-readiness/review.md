# Production Release Review and Acceptance

## Distribution and Build Evidence

Implementation date: 2026-11-17. This is not a commit, hosted CI result or
deployment report.

- Initial inventory: 27 tracked cleanup paths, 17 untracked local-only inputs,
  no pre-existing staged changes. Only those removals were staged at the initial
  untracking checkpoint; after explicit operator approval, the complete verified
  candidate was staged together, including the preceding quality implementation.
- Exact-path index removal preserved all 44 inventoried source hashes, including
  modified suites and generated integrations. The standalone PDF remains local.
- Ten original tooling/configuration files and the source inventory are preserved
  in ignored `.local-verification/production-release-readiness/`. No credentials
  or runtime data were copied. The working dependency installation was not
  replaced, avoiding interference with an existing development server.
- A separate 178-input candidate exported current tracked and nonignored new
  files, not merely HEAD. It contained no suites, generated skills, local
  preservation set, dependencies, build output or runtime storage.
- `npm ci` in that export installed 222 packages. `npm run verify` passed
  formatting, warning-free lint, strict application/server/tooling build and
  all 43 emitted-resource checks. Entry: 443,810 bytes / 500,000-byte limit.
- `npm audit --omit=dev` reported zero vulnerabilities. npm reported an unapproved
  optional Tesseract funding postinstall; no additional script was approved.
  The build and local scanning assets passed without it.
- An intentionally malformed local-only source probe made the actual `verify`
  chain exit 1 during formatting. Formatting that probe exposed its unused
  variable and made the same chain exit 1 at lint. The probe was deleted.
- CI command references resolve; excluded harnesses are absent. Render's
  `checksPass` and `/api/health` settings are unchanged. Linux/image jobs have
  not been executed by this local Windows verification.
- 126 current README/handbook links and section anchors resolve to publishable
  files. Source inspection confirms the sample PDF is generated in memory.

The earlier 164 unit/API and 37 browser results belong to the
[quality-upgrade review](../2026-11-17-care-workspace-quality-upgrade/review.md). They are
historical, not reproducible regression gates in this published distribution.
Current checks deliberately provide less functional assurance.

## Predecessor Reconciliation Map

Archive/sync operations remain separate workflow follow-up, not implied by this
review. Preserve stable IDs, metadata and canonical artifact filenames.

| Order | Change                                            | Main-spec effects to reconcile before its successor                                                                                             |
| ----- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `premium-visual-refresh` (17/17)                  | Workspace theme/navigation, loading/motion; dashboard progress; medication timeline.                                                            |
| 2     | `editorial-health-workspace` (15/15)              | Workspace theme/commands/motion; Daybook composition; medication calendar; private record inspection.                                           |
| 3     | `care-workspace-quality-upgrade` (29/29 retained) | Final theme/motion semantics; logging milestones; favourites; summaries; handbook/CI contracts; operational guidance and entrypoint sequencing. |
| 4     | `production-release-readiness`                    | Production-only distribution/build contract; controlled Docker recovery; the five removals below.                                               |

| Successor REMOVED requirement                       | Target's origin                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Type-checked maintained tests                       | Existing main `repository-verification` spec.                                      |
| Repeatable full-stack browser verification          | Quality-upgrade `repository-verification` addition; absent from today's main spec. |
| End-to-end workflow and failure evidence            | Quality-upgrade `repository-verification` addition; absent from today's main spec. |
| Responsive visual and interaction regression checks | Quality-upgrade `repository-verification` addition; absent from today's main spec. |
| Isolated replica startup failure verification       | Quality-upgrade `live-demo-deployment` addition; absent from today's main spec.    |

Retain the quality upgrade's handbook, honest-evidence and operational-health
requirements. Retain the main production-resource, presentation, privacy,
restoration and product-behavior requirements.

### Merge Cautions and Archive Hold Points

- Theme descriptions overlap in all three predecessors. Preserve the final
  near-black palette, both hierarchy and overlay scenarios, and the final
  immediate-colors/background-gloss behavior. Do not let an older delta restore
  a superseded palette.
- The owner approved reconciling the old blanket motion limit with existing
  behavior: workspace effects at most 250 ms, background-only appearance gloss
  at most 500 ms (currently about 420 ms), the restored 460 ms authentication
  entrance, and the pausable/static-alternative authentication illustration.
  The quality delta explicitly modifies the older requirement; no runtime
  change is requested.
- After the incomplete-work warning, the owner retired and removed former
  tasks 2.5 and 8.1 from the quality checklist. Retained scope is 29/29 complete;
  original execution was 29 of 31 tasks. Pinned Linux visual acceptance remains
  unexecuted, not passed. Later container acceptance cannot prove it ran.
- The owner selected chronological synchronization and archival, leaving the
  release staged without a commit or push. If a merge target/conflict remains
  unresolved, stop before synchronizing this successor's removals.
- Verify each requested sync before moving a change. Do not archive this new
  change merely because its planning artifacts exist.

## Browser Rehearsal and Boundaries

The exported production frontend and a separately owned loopback development
API served one new fictional-only storage directory. Direct API/proxied health
and a workspace deep link succeeded before rehearsal. Production Secure-cookie
guards were not changed; this HTTP rehearsal is not production cookie evidence.

Using the pre-existing local browser installation (not a published runner),
rehearsal passed registration/login, explicit sample creation, taken/reload/undo,
medication creation/edit/reload/confirmed deletion, profile save/reload and record
upload/edit/reload/private PDF rendering/download/confirmed deletion. Legacy
measurement create/update/delete ran through the retained authenticated API;
its retired route redirected to Medications. Both themes passed five routes at
320/768/1280 pixels without page overflow (30 combinations). Logout revoked vault
access; auth retained its 460 ms entrance, pause/play and static reduced motion.

The shared integrated browser was hidden and its animation clock remained at
zero, preventing ordinary stable-element clicks. Rehearsal moved to an owned
headless browser rather than forcing those clicks. Early one-off selectors also
used incorrect action labels and the wrong confirmation role; corrected labels
and `alertdialog` completed the real actions. These attempts are not represented
as product defects or passing journeys.

This bounded rehearsal is not an exhaustive regression suite. The later local
container evidence is recorded separately below. A public deployment and
provider durability rehearsal require separate authorization.

## Docker Diagnosis and Permission Boundary

Read-only diagnosis reports Desktop stopped and daemon startup unavailable.
Ubuntu and docker-desktop WSL2 distributions are stopped. The latest backend log
contains ten `SIGBUS` and ten bus-error signatures; no full log or diagnostic
bundle was uploaded. Earlier unpacking `ENOSPC` and current low capacity are
context, not a proven SIGBUS cause.

After both owned rehearsal services were stopped and their temporary candidate
and fictional storage removed, approximately 3.6 GiB is free. The default WSL
Docker disk file exists (about 9.3 GiB file length); no disk contents were read,
copied, repaired or deleted. The actual configured storage/backup scope must be
confirmed before a storage repair.

The smallest proposed next action is an explicitly authorized **Docker
Desktop-only start**, potentially resuming existing shared workloads. It does
not include reset, prune, WSL-wide shutdown, disk deletion or reinstall. If that
fails, stop for a new decision. Deployment-image build/runtime acceptance remains
unexecuted, not waived. See the [runbook](../../../../docs/operations.md#local-docker-desktop-recovery).

The operator authorized that start only. `docker desktop start` returned
`Docker Desktop is already running`, but the subsequent Desktop status remained
`stopped` and the daemon returned `Docker Desktop is unable to start` (exit 1).
Task 5.2 therefore remains incomplete; no restart, reset or storage repair was
silently substituted for the approved action.

The operator then separately authorized one Desktop-only restart.
`docker desktop restart` completed; Desktop reports `running`, daemon 29.9.2
responds, and Docker reports zero existing/running containers. Approximately
3.56 GiB remains free. Task 5.2 is now complete. No reset, prune, disk repair,
reinstall or WSL-wide shutdown was performed; this does not establish a definitive
cause for the earlier fault.

## Linux Deployment Image and Local Runtime Acceptance

The actual production Dockerfile built successfully with locked dependencies,
strict runtime/tooling checks and all 43 emitted-resource checks. Its public-demo
entry is 444,455 bytes against the unchanged 500,000-byte limit (the non-demo
Windows build is 443,810). No provider credentials were supplied.

One owned container served `http://127.0.0.1:19040`; database readiness and the
Medications SPA deep link passed. Inspection confirmed UID 1000, production mode,
Secure-cookie configuration, migrated schema 3 and required OCR/PDF resources.
Fourteen excluded source/configuration paths were absent from the final image.
A separate cached build-stage inspection confirmed that all eleven local-only
source/preservation paths were absent from the actual COPY context, not merely
omitted by the final stage.

Both owned acceptance containers are absent; the runtime container and its
ephemeral database were removed, as were the two uniquely named acceptance
image tags. Original `medivault:local`, the browser image and shared build cache
were not pruned. Both owned Node/preview services and the temporary export and
fictional browser storage were also removed.

Docker remains responsive, but C: has approximately **1.48 GiB free** after image
builds. Further capacity management needs a separate scoped decision; no global
prune, disk compaction or storage repair is implied. Local runtime acceptance
does not establish B2 availability, a hosted deployment, backup durability or the
still-unexecuted pinned Linux visual comparison.

## Final Candidate Review

After the operator's own C: cleanup, the final capacity probe reports about
58.46 GiB free. Docker daemon 29.9.2 still responds. The Desktop CLI briefly
reported `stopped` despite that successful daemon response; readiness was checked
against the daemon rather than assuming either UI status or a new crash. No
additional restart was attempted.

The approved staged tree has 179 paths and includes the preceding quality
implementation, its migration/handbook and this cleanup coherently. No excluded
testing/local-preservation/runtime-data/environment-secret paths are present;
all 44 preserved local source hashes match. Current handbook and review checks
resolve 144 publishable local links/anchors. All four active changes pass strict
OpenSpec validation, formatting and staged/worktree whitespace checks pass, and
owned acceptance ports/resources have been released.

No commit, push, hosted CI, deployment, archive or main-spec synchronization was
performed. Archive follow-up still needs the incomplete-predecessor confirmation,
sync decisions and resolution of the documented older motion-limit wording.

## Lifecycle Closure

On 2026-11-17, after the candidate review above, the owner approved chronological
spec synchronization and archival. Each change's complete delta set was compared
against main specs and verified before its folder moved, retaining metadata:

1. [Premium visual refresh](../2026-11-17-premium-visual-refresh/tasks.md): 17/17 tasks.
2. [Editorial health workspace](../2026-11-17-editorial-health-workspace/tasks.md): 15/15 tasks.
3. [Care workspace quality upgrade](../2026-11-17-care-workspace-quality-upgrade/tasks.md):
   29/29 retained tasks after the owner retired the two unfinished verification
   tasks. The original 29-of-31 execution record is not 31 passed tasks.
4. [Production release readiness](tasks.md): 19/19 tasks.

The approved motion reconciliation preserves the existing login animation and
bounded workspace/theme behavior. The successor removes five published testing
requirements while preserving runtime privacy, restoration and product contracts.
All established main-spec titles and Purpose sections remain unchanged; the two
new capabilities inherit their authored delta purposes.

No active changes remain. The omitted Linux visual acceptance remains a historical
assurance limitation. The release is left staged, without commit, push or
deployment, as requested.

Link acceptance covers the current README/handbook, main specs and these four
new archives. A broader inventory also found 17 pre-existing broken source links
in the older `2026-11-16-enhance-medivault-experience` and
`2026-11-16-prepare-medivault-for-presentation` archives. Those unrelated historical
files were not changed; scoped acceptance does not claim their links pass.

Final archive acceptance: `npm run format:check` and
`openspec validate --all --strict` passed (10 main specifications). All 154 scoped
publishable local links/anchors resolve. Staged and worktree whitespace checks
passed; the index contains 181 publishable paths and no excluded tooling or
runtime material. Archival changed only planning and documentation, not runtime
source.
