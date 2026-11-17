export { cn } from 'cn'
import { format } from 'date-fns'
import type { DoseLog, Medication } from '../../shared/database.types.ts'
import { localDate } from '../../shared/health.ts'

export { localDate } from '../../shared/health.ts'
export { MAX_FILE_SIZE, validateDocument } from '../../shared/documents.ts'
export function displayDate(value: string) {
  return format(
    value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value),
    'MMM d, yyyy',
  )
}
export const categories = {
  prescription: 'Prescription',
  lab_report: 'Lab report',
  scan: 'Scan',
  discharge_summary: 'Discharge summary',
  other: 'Other',
} as const
export const documentKinds = {
  prescription: 'Prescription',
  lab_report: 'Lab report',
  imaging_report: 'Imaging report',
  visit_note: 'Visit note',
  care_instructions: 'Care instructions',
  discharge_summary: 'Discharge summary',
  referral: 'Referral',
  immunization: 'Immunization',
  dental_record: 'Dental record',
  insurance_claim: 'Insurance claim',
  other: 'Other',
} as const
export const frequencies = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_daily: 'Three times daily',
  custom: 'Custom',
} as const
export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`
  const unit = bytes < 1024 * 1024 ? 'KiB' : 'MiB'
  const value = bytes / (unit === 'KiB' ? 1024 : 1024 * 1024)
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`
}
export function medicationStatus(med: Medication, day = localDate()) {
  if (med.start_date > day) return 'upcoming'
  if (med.end_date && med.end_date < day) return 'completed'
  return 'active'
}
export type ScheduledDose = {
  medication: Medication
  date: string
  time: string
  log: DoseLog | undefined
}
export function doseTiming(dose: ScheduledDose, now: Date) {
  if (dose.log) return dose.log.status
  const scheduled = new Date(`${dose.date}T${dose.time}:00`).getTime()
  const elapsed = now.getTime() - scheduled
  if (elapsed < 0) return 'scheduled'
  if (elapsed < 60_000) return 'due'
  return 'past_time'
}
export function scheduledDoses(
  meds: Medication[],
  logs: DoseLog[],
  day = localDate(),
): ScheduledDose[] {
  const index = new Map(
    logs.map((log) => [
      `${log.medication_id}|${log.scheduled_date}|${log.scheduled_time}`,
      log,
    ]),
  )
  return meds
    .filter((med) => medicationStatus(med, day) === 'active')
    .flatMap((medication) =>
      medication.times.map((time) => ({
        medication,
        date: day,
        time,
        log: index.get(`${medication.id}|${day}|${time}`),
      })),
    )
    .sort(
      (a, b) =>
        a.time.localeCompare(b.time) ||
        a.medication.name.localeCompare(b.medication.name),
    )
}
