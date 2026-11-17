import { z } from 'zod'
import type { VaultData } from './contracts.ts'
import { calendarDateSchema } from './schemas.ts'
import { localDate } from './utils.ts'

export const summaryRangeSchema = z
  .object({ from: calendarDateSchema, to: calendarDateSchema })
  .superRefine((value, context) => {
    if (value.from > value.to)
      context.addIssue({
        code: 'custom',
        message: 'Start date must not follow end date.',
      })
    if (value.from > localDate() || value.to > localDate())
      context.addIssue({
        code: 'custom',
        message: 'Summary dates cannot be in the future.',
      })
  })

export function activitySnapshot(
  data: VaultData,
  ownerId: string,
  range: z.infer<typeof summaryRangeSchema>,
  includeProfile: boolean,
) {
  if (data.profile.id !== ownerId)
    throw new Error(
      'The signed-in account changed. Close this summary and sign in again.',
    )
  const inside = (day: string) => day >= range.from && day <= range.to
  const medications = data.medications.map((medication) => ({
    id: medication.id,
    name: medication.name,
    form: medication.form,
    strength: medication.strength,
    dosage: medication.dosage,
    frequency: medication.frequency,
    times: [...medication.times],
    start_date: medication.start_date,
    end_date: medication.end_date,
    instructions: medication.instructions,
  }))
  const names = new Map(
    medications.map((medication) => [medication.id, medication.name]),
  )
  const logs = data.logs
    .filter((log) => inside(log.scheduled_date))
    .map((log) => {
      const name = names.get(log.medication_id)
      if (name === undefined)
        throw new Error(
          'An outcome has no current medication details. Refresh your data and retry.',
        )
      return {
        id: log.id,
        date: log.scheduled_date,
        time: log.scheduled_time,
        status: log.status,
        currentName: name,
      }
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.time.localeCompare(b.time) ||
        a.id.localeCompare(b.id),
    )
  const records = data.records
    .filter((record) => inside(record.record_date))
    .map((record) => ({
      id: record.id,
      title: record.title,
      category: record.category,
      provider: record.provider,
      date: record.record_date,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const health = data.healthProfile
  const profile: [string, string][] | null = includeProfile
    ? [
        ['Name', health?.full_name || data.profile.full_name],
        ['Date of birth', health?.date_of_birth ?? 'Not recorded'],
        ['Gender', health?.gender?.replaceAll('_', ' ') ?? 'Not recorded'],
        ['Blood group', health?.blood_group ?? 'Not recorded'],
        [
          'Height',
          health?.height_cm == null ? 'Not recorded' : `${health.height_cm} cm`,
        ],
        [
          'Weight',
          health?.weight_kg == null ? 'Not recorded' : `${health.weight_kg} kg`,
        ],
        ['Allergies', health?.allergies || 'Not recorded'],
        ['Conditions', health?.conditions || 'Not recorded'],
        ['Emergency contact', health?.emergency_contact_name || 'Not recorded'],
        ['Emergency phone', health?.emergency_contact_phone || 'Not recorded'],
      ]
    : null
  return {
    ownerId,
    from: range.from,
    to: range.to,
    generatedAt: new Date().toISOString(),
    medications,
    logs,
    records,
    profile,
    taken: logs.filter((log) => log.status === 'taken').length,
    skipped: logs.filter((log) => log.status === 'skipped').length,
  }
}
export type ActivitySnapshot = ReturnType<typeof activitySnapshot>
