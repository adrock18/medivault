# MediVault Engineering Handbook

## Purpose and audience

This is the maintained contributor and operator documentation for the implemented
MVP. "Enterprise-style" here means explicit responsibilities, navigable
references, operational procedures and honest verification boundaries. It does
not mean healthcare certification, an enterprise SLA or production approval.

| Area       | Documents                                                                                     | Audience                      |
| ---------- | --------------------------------------------------------------------------------------------- | ----------------------------- |
| Understand | [System tour](system-overview.md), [architecture](architecture.md), [request flows](flows.md) | New contributors              |
| Decide     | [Engineering decision records](decisions.md)                                                  | Maintainers and reviewers     |
| Build      | [Development guide](development.md)                                                           | Developers                    |
| Reference  | [HTTP API](reference/api.md), [data model](reference/data-model.md)                           | Frontend/backend contributors |
| Operate    | [Deployment, recovery and incident procedures](operations.md)                                 | Operators                     |
| Verify     | [Verification and limitations](quality/verification.md)                                       | Reviewers and demo presenters |

Stable existing guide paths are retained so repository links do not break.
Detailed lookup material lives under `reference/`; release evidence and product
boundaries live under `quality/`. Private learning notes and account-specific
demo inventories are intentionally outside this public handbook.

Start with the [repository quick start](../README.md#run-locally).
This handbook describes the implemented React + Express + Supabase application,
not a static mockup or a clinically certified system.

**New to the codebase?** Read the
[screen tour and request lifecycle](system-overview.md#workspace-screen-tour)
first, then follow one feature through the
[source reading order](development.md#reading-and-documenting-the-source).
The guides explain the current implementation; diagrams are navigation aids,
not substitutes for the linked code and migrations.

| Question                                                       | Read                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| What runs where? Which module owns a responsibility?           | [Architecture and module map](architecture.md)                  |
| How does a browser request reach production storage?           | [System integration and production runtime](system-overview.md) |
| How do authentication, profiles, documents and doses work?     | [Data contracts and request flows](flows.md)                    |
| How do I set up, verify, review, and release a change safely?  | [Development and release guide](development.md)                 |
| Why were the main engineering choices made?                    | [Decision records](decisions.md)                                |
| How do I triage restore/storage failures or rehearse recovery? | [Operations and recovery](operations.md)                        |

## Documentation maintenance contract

1. Treat source schemas, mounted routes and versioned migrations as the
   implementation authority; do not document an initial wish list as shipped.
2. Update the relevant reference when a request/response, relationship, UI flow or
   operational requirement changes. Update decision records for material tradeoffs.
3. Distinguish implemented, locally checked, deployed and manually confirmed.
   Never turn a build result into a claim of end-to-end coverage.
4. Keep credentials, account exports, clinical details, private screenshots and
   personal interview notes out of committed documentation.
5. Check relative links and formatting when moving or adding guides. Historical
   migrations are immutable, not documentation templates to rewrite.

Health information belongs only in private runtime storage. Use fictional data
for examples, tests, screenshots, and public demonstrations. Neither a passing
test run nor a deployment is evidence of medical-device or healthcare compliance.
