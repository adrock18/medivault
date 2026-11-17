# Product Landscape and Staged Roadmap

## Product position

MediVault is currently a **personal medication and medical-document organizer**.
It is not a provider portal, pharmacy, clinical decision-support system, or
general-purpose medical AI assistant. Its most defensible product story is
continuity and provenance: a person can keep a private copy of a document, link
that source to a medication, review extracted wording, and separately record
what happened at scheduled times.

The market already contains mature products with broader ecosystems. The goal
for this project should not be to claim that basic medication lists, record
storage, or reminders are unique. A credible portfolio product demonstrates
good engineering and a focused difference: privacy-conscious local OCR,
transparent source-to-medication links, explicit user review, and careful
separation of a schedule from a confirmed outcome.

## Current feature inventory

| Capability                       | Implemented behavior                                                                                               | Boundary to explain                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Medication management            | CRUD, frequency/times, active/completed views, today's schedule and taken/skipped dose logs.                       | The app does not prescribe, change a dose, or prove that a dose was taken.                                  |
| Medical records                  | Private PDF/JPG/PNG storage, searchable metadata, preview/download, favourites, and confirmed deletion.            | No provider/EHR feed; files are uploaded by the user.                                                       |
| Visit-centered organization      | Optional care tracks group dated visits; records can be attached to a same-profile visit or left unassigned.       | Owner-defined organization only; the app does not infer a clinical relationship.                            |
| Record-to-medication association | A medication can retain a source record ID and reviewed prescription text; the record can show linked medications. | This is provenance, not prescription verification or a pharmacy connection.                                 |
| Family workspace                 | Account owners can add managed profiles and assign records, visits, tracks and medications per person.             | Members share one owner login; no separate identity, consent/delegation, or caregiver access.               |
| Prescription reading             | Embedded PDF text extraction and local OCR by default; optional OCR.Space forwarding requires per-scan consent.    | OCR is English/print oriented and can be wrong; external processing must not receive real health documents. |
| Profile/dashboard                | Personal profile plus counts and schedule derived from the account's stored data.                                  | No diagnostic scoring or treatment recommendations.                                                         |
| Settings/export                  | Password change, JSON export, and a private printable activity summary.                                            | Exported/downloaded copies leave the app's control.                                                         |
| Email reminders                  | Opt-in generic reminder emails with time-zone settings, delivery records and duplicate suppression.                | Requires Resend credentials and an external scheduler; delivery is best-effort, not an alert guarantee.     |

## What comparable products teach us

These are examples of product categories, not an exhaustive competitive analysis
or a claim that MediVault should replicate their full scope:

- **Provider portals:** [MyChart's feature overview](https://www.mychart.org/Features)
  describes provider-connected records and sharing, medication lists/refills,
  test results, messaging, appointments, alerts, and care-plan features. Those
  capabilities depend on participating healthcare organizations and their
  systems; they are not merely additional CRUD screens.
- **Personal health platforms:** [Apple Health](https://www.apple.com/health/)
  emphasizes health and fitness information, insights, device-connected
  features, and user privacy controls. This represents a broader device/data
  platform rather than a standalone document vault.
- **Medication engagement:** [Medisafe](https://medisafe.com/) presents
  patient- and provider-facing medication engagement and support across
  treatment journeys. Its current positioning illustrates that medication
  products can extend beyond a list into between-visit engagement.
- **Interoperability:** [HL7 FHIR](https://www.hl7.org/fhir/) is a published
  healthcare data-exchange standard with resources for clinical and medication
  information. Connecting a real provider requires a provider endpoint,
  authorization, version/profile mapping, consent, and error handling; choosing
  a JSON format alone is not interoperability.

The existing MediVault scope is intentionally smaller. Competing with a provider
portal feature-for-feature would be misleading and would increase privacy,
clinical, interoperability, support, and reliability obligations.

## Prescription reading and OCR

Yes: there is a local-by-default OCR workflow, plus an optional third-party
OCR.Space integration. Neither is a production-grade clinical extraction
pipeline or an AI/LLM medical interpretation feature.

1. The user selects an owned record; the browser fetches it through the
   authenticated document API.
2. `src/features/records/lib/ocr.ts` extracts embedded text from PDFs when
   available. Image-based PDF pages and JPG/PNG uploads are rendered and sent
   to locally packaged Tesseract workers by default.
3. The scanner displays editable text. `src/features/medications/lib/prescription.ts`
   uses conservative patterns to suggest a name, form, strength, and explicit
   instruction wording.
4. The user checks the original, edits the medication form, and confirms before
   save. Suggested dates and times are not invented.

If `OCR_SPACE_API_KEY` is configured, a user can instead affirm consent for
that scan and ask the authenticated server to forward the owned document to
OCR.Space. Its free tier has a 1 MB upload limit and supports up to three PDF
pages, but the application does not preflight page counts. The free service is
not covered by a signed DPA: the UI explicitly warns not to send real or
sensitive medical records. The API still enforces the size limit and does not
log document content or the provider key. Local OCR remains available.

Current safeguards include local processing by default, per-scan consent for
external forwarding, cancellation, a 10-page local PDF limit, a 25-megapixel
image limit, explicit empty/unreadable errors, and no automatic medication
creation. Current limitations include printed-English focus,
heuristic parsing, no field-level confidence or source highlighting, and no
clinical terminology normalization. A realistic description is **“private,
review-first OCR-assisted data entry,”** not “AI understands prescriptions.”

### Safe OCR quality improvements

1. **Make uncertainty visible:** retain OCR confidence and bounding boxes from
   the engine; show them as review cues, never as proof that a field is correct.
2. **Preserve provenance:** associate each suggested field with the source
   text/page that produced it. Let users compare the suggestion and source
   document side-by-side.
3. **Improve predictable parsing:** support only explicitly recognized
   structures, add ambiguity/unsupported-format states, and avoid guessing
   dosage, dates, frequency, or patient identity.
4. **Review accessibility and failure modes:** handle rotated, low-resolution,
   multi-column, protected, and large documents with bounded processing and
   clear retry/manual-entry paths.
5. **Validate with consented synthetic fixtures:** measure field-level
   extraction quality and false-positive rates before expanding languages or
   formats. Do not use real patient documents as unapproved test data.
6. **Keep a human confirmation gate:** never auto-save or change an existing
   medication from OCR output.

Do not treat the optional OCR.Space provider as an LLM or a medical “AI”
feature. Remote OCR introduces third-party disclosure and retention concerns;
the current provider's free tier is not covered by a signed DPA, so it must not
process real health documents. Any future model/AI integration would require a
separate privacy/security review, an appropriate vendor/data-processing
arrangement, explicit consent, strict data minimization, and human review.

## A product roadmap that stays proportionate

### Stage 0 — Finish the presentable foundation

- Keep feature ownership and API modules easy to navigate.
- Document system boundaries and ensure setup, build, and the demo link work.
- Explain the current backup, error, and notification limits honestly.
- Use only fictional demo data and verify the live instance without entering
  real health data.

### Stage 1 — Improve the existing core (low architectural change)

- Improve OCR confidence/provenance display and the manual review experience.
- Make the record ↔ medication relationship more visible: source record,
  linked medication list, source excerpt, and easy navigation in both
  directions.
- Add optional manual refill/review dates and user-configured reminders without
  proposing a medication or changing clinician-authored instructions.
- Add a privacy-preserving in-app activity/notification center for events the
  user explicitly records. Keep it clearly distinct from clinical alerts.
- Improve operational feedback for slow/cold starts and API/storage failures;
  never return success-shaped data when a request fails.

### Stage 2 — Operate the optional reminder integration responsibly

The minimal email path is implemented, but not self-operating:

- The owner explicitly opts in and can turn the preference off. Messages go to
  the account email and include no medicine or family-member names.
- `server/routes/notifications.ts` stores time-zone preferences and per-dose
  delivery state. A scheduler must call the secret-protected route; Resend
  credentials and the cron secret stay server-side.
- Delivery is best-effort and can be delayed or missed if the host, scheduler,
  or provider is unavailable. It is not proof of dose outcome, an emergency
  alert, or treatment advice.
- Before enabling for real users, verify sender-domain setup, scheduler cadence,
  provider quotas, failure/retry behavior, credential rotation and opt-out.

An in-app banner while the user is signed in is not a background notification.
The Web Notification API by itself is not a reliable server-scheduled delivery
system. Push remains deferred until there is product demand and an authorized
provider/operational owner.

### Stage 3 — Consider provider data exchange only with a real use case

A read-only FHIR connection could import selected allergies, medication
statements, or documents, but it needs a real participating provider or sandbox,
OAuth authorization, patient matching, consent/revocation, resource/version
mapping, provenance, conflict handling, token security, and support for stale or
unavailable sources. This is materially larger than adding an endpoint. It
should be a separate project after a provider partnership/use case exists.

### Explicitly defer

- AI diagnosis, symptom triage, clinical recommendations, or dose changes.
- Automatic medication reconciliation or inferred prescription schedules.
- Public or shareable document links without a designed authorization model.
- Separate family-member logins or delegated caregiver access without consent,
  revocation, audit, and identity-lifecycle design.
- An “AI” feature whose output cannot be traced to supplied source content.

## Suggested success criteria

Measure product behavior rather than adding feature count:

- A new user can create a medication and upload a fictional prescription with
  clear feedback and no broken path.
- A user can navigate from a medication to its source record and back.
- OCR suggestions retain evidence and require explicit confirmation.
- A scheduled-but-unlogged dose is distinguishable from a taken/skipped result.
- API/storage failures leave existing data visible as stale or report an error;
  they do not fabricate success.
- A user can find and export their data and understand that exported copies are
  outside the app's control.
- No notification or AI flow sends health data to a provider without explicit
  consent and an approved data-handling design.

## Sources

- [MyChart official feature overview](https://www.mychart.org/Features)
- [Apple Health official product overview](https://www.apple.com/health/)
- [Medisafe official product overview](https://medisafe.com/)
- [HL7 FHIR published specification](https://www.hl7.org/fhir/)

Product pages describe vendor capabilities and positioning; they are not
independent evaluations. Re-check feature availability and terms before using
this as a formal market or purchasing analysis.
