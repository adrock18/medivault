# MediVault Engineering Handbook

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

Health information belongs only in private runtime storage. Use fictional data
for examples, tests, screenshots, and public demonstrations. Neither a passing
test run nor a deployment is evidence of medical-device or healthcare compliance.
