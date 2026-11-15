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
  const metrics = Array.from({ length: 7 }, (_, i) => {
    const measured = subDays(new Date(), 7 - i)
    measured.setHours(8, 0, 0, 0)
    return [
      {
        type: 'blood_pressure' as const,
        value: [118, 122, 119, 121, 116, 120, 118][i],
        secondary_value: [78, 80, 77, 79, 76, 78, 77][i],
        measured_at: measured.toISOString(),
        notes: '[Sample] Fictional morning reading.',
      },
      {
        type: 'weight' as const,
        value: [72.4, 72.2, 72.5, 72.1, 72.3, 72.1, 72][i],
        measured_at: measured.toISOString(),
        notes: '[Sample] Fictional weight reading.',
      },
      {
        type: 'heart_rate' as const,
        value: [72, 74, 71, 73, 70, 72, 71][i],
        measured_at: measured.toISOString(),
        notes: '[Sample] Fictional heart rate reading.',
      },
      {
        type: 'blood_glucose' as const,
        value: [94, 96, 92, 95, 91, 93, 94][i],
        measured_at: measured.toISOString(),
        notes: '[Sample] Fictional glucose reading, mg/dL.',
      },
    ]
  }).flat()
  for (const metric of metrics) {
    await api.metrics.save({
      ...metric,
      value: String(metric.value),
      secondary_value:
        'secondary_value' in metric ? String(metric.secondary_value) : '',
    })
  }
  const med = await api.medications.save({
    name: '[Sample] Vitamin D',
    dosage: 'Example 1000 IU - demo only',
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
    'MEDIVAULT - FICTIONAL SAMPLE REPORT',
    'Riverside Medical Center - Demonstration only',
    'This is not a real medical record or medical advice.',
    'Sample blood pressure: 118 / 77 mmHg',
    'Sample heart rate: 71 bpm',
    'Sample glucose: 94 mg/dL',
    'Sample weight: 72 kg',
    'These values are fictional, not recommendations.',
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
  const file = new File([pdf], 'fictional-wellness-report.pdf', {
    type: 'application/pdf',
  })
  await uploadRecord(
    {
      title: '[Sample] Annual wellness report',
      category: 'lab_report',
      provider: 'Riverside Medical Center (fictional)',
      record_date: localDate(),
    },
    file,
  )
}
