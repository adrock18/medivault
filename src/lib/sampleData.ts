import { addDays, subDays } from 'date-fns'
import { api } from './api'
import { localDate } from './utils'
import { uploadRecord } from './records'

// Explicit opt-in samples are real database rows, visibly labeled, never a fake backend.
export async function addSampleData() {
  const existing = await api.vault()
  if (existing.medications.some((med) => med.name === '[Sample] Vitamin D'))
    throw new Error(
      'Sample data is already present. Remove sample entries before adding it again.',
    )
  const med = await api.medications.save({
    name: '[Sample] Vitamin D',
    dosage: 'Example 1000 IU - demo only',
    form: 'tablet',
    strength: 'Example 1000 IU - fictional',
    frequency: 'once_daily',
    times: '08:00',
    start_date: localDate(subDays(new Date(), 7)),
    end_date: localDate(addDays(new Date(), 14)),
    instructions:
      'Fictional sample. Not a prescription or a recommendation. Delete this entry when finished exploring.',
  })
  for (let i = 0; i < 5; i++) {
    await api.doses.add({
      medication_id: med.id,
      scheduled_date: localDate(subDays(new Date(), 5 - i)),
      scheduled_time: '08:00',
      status: i === 2 ? ('skipped' as const) : ('taken' as const),
    })
  }
  const lines = [
    'MEDIVAULT - FICTIONAL SAMPLE PRESCRIPTION',
    'Riverside Medical Center - Demonstration only',
    'This is not a real medical record or medical advice.',
    'Tablet ExampleOne 10 mg',
    'Take one tablet at the printed scheduled time.',
    'Cream ExampleTwo 1%',
    'Apply the amount specified by the fictional prescriber.',
    'Fictional examples only. Do not follow these instructions.',
  ]
  const stream = `BT /F1 14 Tf 50 760 Td ${lines.map((line, i) => `${i ? '0 -28 Td ' : ''}(${line}) Tj`).join('\n')} ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  const file = new File([pdf], 'fictional-prescription.pdf', {
    type: 'application/pdf',
  })
  await uploadRecord(
    {
      title: '[Sample] Prescription for scanning',
      category: 'prescription',
      provider: 'Riverside Medical Center (fictional)',
      record_date: localDate(),
    },
    file,
  )
}
