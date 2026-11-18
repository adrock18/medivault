/**
 * Explicit fictional-data seeding through the normal API. Generates labeled
 * sample documents and records without bypassing account ownership.
 */

import { api } from '@/lib/api'
import { uploadRecord } from '@/features/records/lib/records'

const demoLabel = '[Demo] HL7 FHIR example'

const examples = [
  {
    profileName: '[Demo] Wile E. Coyote (fictional)',
    trackTitle: '[Demo] Laboratory example',
    trackKind: 'preventive' as const,
    visitTitle: '[Demo] Complete blood count example',
    visitReason: 'Fictional, non-clinical HL7 FHIR R4 example report.',
    visitSetting: 'diagnostic' as const,
    visitDate: '2011-03-04',
    provider: 'Acme Laboratory, Inc. (FHIR example)',
    documentTitle: `${demoLabel}: CBC report`,
    documentKind: 'lab_report' as const,
    filename: 'hl7-fhir-cbc-fictional-example.pdf',
    source: 'https://hl7.org/fhir/R4/diagnosticreport-example.json.html',
    lines: [
      'HL7 FHIR R4 DiagnosticReport example',
      'FICTIONAL TEST DATA - NOT A REAL MEDICAL RECORD',
      'Not medical advice. Do not use for care decisions.',
      'Source example patient: Wile E. Coyote (fictional)',
      'Report: Complete Blood Count (CBC)',
      'Effective date: 2011-03-04',
      'Test                 Units       Value       Reference range',
      'Haemoglobin          g/L         176         135 - 180',
      'Red Cell Count       x10*12/L    5.9         4.2 - 6.0',
      'Haematocrit                      0.55+       0.38 - 0.52',
      'Mean Cell Volume     fL          99+         80 - 98',
      'Mean Cell Haemoglobin pg         36+         27 - 35',
      'Platelet Count       x10*9/L     444         150 - 450',
      'White Cell Count     x10*9/L     4.6         4.0 - 11.0',
      'Neutrophils          x10*9/L     0.9---      2.0 - 7.5',
      'Lymphocytes          x10*9/L     0.9-        1.1 - 4.0',
      'Monocytes            x10*9/L     0.9         0.2 - 1.0',
      'Eosinophils          x10*9/L     0.92++      0.04 - 0.40',
      'Basophils            x10*9/L     0.92+++     <0.21',
      'Source: HL7 FHIR R4, DiagnosticReport example (informative).',
      'https://hl7.org/fhir/R4/diagnosticreport-example.json.html',
    ],
  },
  {
    profileName: '[Demo] Donald Duck (fictional)',
    trackTitle: '[Demo] Prescription text review',
    trackKind: 'follow_up' as const,
    visitTitle: '[Demo] MedicationRequest OCR example',
    visitReason:
      'Fictional FHIR example for OCR review only; not a valid prescription.',
    visitSetting: 'primary_care' as const,
    visitDate: '2015-01-15',
    provider: 'Patrick Pump (FHIR example)',
    documentTitle: `${demoLabel}: MedicationRequest OCR`,
    documentKind: 'prescription' as const,
    filename: 'hl7-fhir-medicationrequest-fictional-example.pdf',
    source: 'https://hl7.org/fhir/R4/medicationrequest0302.json.html',
    lines: [
      'HL7 FHIR R4 MedicationRequest example',
      'FICTIONAL TEST DATA - NOT A VALID PRESCRIPTION',
      'Not medical advice. Do not use for care decisions.',
      'Source example patient: Donald Duck (fictional)',
      'Authored date: 2015-01-15',
      'Capsule Azithromycin 250 mg',
      'Dose instruction sequence 1: Two tablets at once',
      'Dose instruction sequence 2: One tablet daily for 4 days',
      'Additional instruction: With or after food',
      'This example has multiple dose stages. MediVault does not',
      'convert it into a repeating medication schedule.',
      'Source: HL7 FHIR R4, MedicationRequest example (informative).',
      'https://hl7.org/fhir/R4/medicationrequest0302.json.html',
    ],
  },
] as const

/**
 * Escape literal PDF text characters before placing fictional sample wording into
 * a content stream.
 */
function escapePdfText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
}

/**
 * Build a small text-only PDF for the explicitly requested fictional sample
 * records.
 */
function createTextPdf(lines: readonly string[], filename: string) {
  const content = [
    'BT /F1 11 Tf 42 760 Td',
    ...lines.flatMap((line, index) => [
      ...(index ? ['0 -30 Td'] : []),
      `(${escapePdfText(line)}) Tj`,
    ]),
    'ET',
  ].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new File([pdf], filename, { type: 'application/pdf' })
}

/**
 * Create labeled fictional data through authenticated endpoints; failures
 * propagate to the requesting settings action.
 */
export async function addSampleData() {
  const existing = await api.vault()

  for (const example of examples) {
    const member =
      existing.familyMembers.find(
        (candidate) => candidate.full_name === example.profileName,
      ) ??
      (await api.family.create({
        full_name: example.profileName,
        relationship: 'other',
        date_of_birth: '',
      }))

    const track =
      existing.careTracks.find(
        (candidate) =>
          candidate.family_member_id === member.id &&
          candidate.title === example.trackTitle,
      ) ??
      (await api.care.createTrack({
        family_member_id: member.id,
        title: example.trackTitle,
        kind: example.trackKind,
      }))

    const visit =
      existing.visits.find(
        (candidate) =>
          candidate.family_member_id === member.id &&
          candidate.title === example.visitTitle,
      ) ??
      (await api.care.createVisit({
        family_member_id: member.id,
        care_track_id: track.id,
        title: example.visitTitle,
        reason: example.visitReason,
        setting: example.visitSetting,
        provider: example.provider,
        visit_date: example.visitDate,
        notes: `Fictional, source-attributed demonstration only. ${example.source}`,
      }))

    const alreadyUploaded = existing.records.some(
      (record) =>
        record.family_member_id === member.id &&
        record.title === example.documentTitle,
    )
    if (alreadyUploaded) continue

    const file = createTextPdf(example.lines, example.filename)
    await uploadRecord(
      {
        family_member_id: member.id,
        visit_id: visit.id,
        title: example.documentTitle,
        document_kind: example.documentKind,
        provider: example.provider,
        record_date: example.visitDate,
      },
      file,
    )
  }
}
