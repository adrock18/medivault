export { cn } from 'cn'
import { format } from 'date-fns'
import type { DoseLog, Medication, MetricType } from './database.types.ts'

export const localDate = (date = new Date()) => format(date, 'yyyy-MM-dd')
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
export const metricInfo: Record<
  MetricType,
  { label: string; unit: string; min: number; max: number }
> = {
  blood_pressure: { label: 'Blood pressure', unit: 'mmHg', min: 40, max: 300 },
  blood_glucose: { label: 'Blood glucose', unit: 'mg/dL', min: 1, max: 1500 },
  weight: { label: 'Weight', unit: 'kg', min: 0.1, max: 700 },
  heart_rate: { label: 'Heart rate', unit: 'bpm', min: 20, max: 300 },
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
export const MAX_FILE_SIZE = 10 * 1024 * 1024
export async function validateDocument(file: File) {
  if (file.size === 0 || file.size > MAX_FILE_SIZE)
    throw new Error('Choose a non-empty file no larger than 10 MB.')
  const allowed: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!allowed[file.type]?.includes(extension))
    throw new Error('Only PDF, JPG, and PNG documents are supported.')
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const valid =
    file.type === 'application/pdf'
      ? [0x25, 0x50, 0x44, 0x46, 0x2d].every((b, i) => bytes[i] === b)
      : file.type === 'image/png'
        ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
            (b, i) => bytes[i] === b,
          )
        : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (!valid)
    throw new Error(
      'The file contents do not match its type. Choose a valid PDF or image.',
    )
}
