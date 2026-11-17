# MediVault Engineering Handbook

Start with the [repository quick start](../README.md#run-the-complete-application).
This handbook describes the implemented medication-and-records product, not the
original Supabase concept or a clinically certified system.

| Question                                                       | Read                                            |
| -------------------------------------------------------------- | ----------------------------------------------- |
| What runs where? Which module owns a responsibility?           | [Architecture and module map](architecture.md)  |
| How do authentication, documents, OCR, and dose requests work? | [Data contracts and request flows](flows.md)    |
| How do I set up, verify, review, and release a change safely?  | [Development and release guide](development.md) |
| Why were the main engineering choices made?                    | [Decision records](decisions.md)                |
| How do I triage restore/storage failures or rehearse recovery? | [Operations and recovery](operations.md)        |

Health information belongs only in private runtime storage. Use fictional data
for examples, tests, screenshots, and public demonstrations. Neither a passing
test run nor a deployment is evidence of medical-device or healthcare compliance.
