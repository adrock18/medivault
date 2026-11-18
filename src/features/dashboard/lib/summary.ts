/**
 * Printable-summary validation and snapshot projection. Copy only the requested
 * owner/profile activity and date range from a fresh vault response.
 */

import { z } from 'zod'
import type { VaultData } from '@shared/contracts'
import { calendarDateSchema } from '@shared/schemas'
import { localDate } from '@shared/health'

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

/**
 * Verify owner/profile identity and build a detached summary containing only the
 * selected activity scope.
 */
export function activitySnapshot(
  data: VaultData,
  ownerId: string,
  familyMemberId: string,
  range: z.infer<typeof summaryRangeSchema>,
  includeProfile: boolean,
) {
  if (data.profile.id !== ownerId)
    throw new Error(
      'The signed-in account changed. Close this summary and sign in again.',
    )
  const member = data.familyMembers.find(
    (item) => item.id === familyMemberId && item.user_id === ownerId,
  )
  if (!member)
    throw new Error(
      'The selected family profile is unavailable. Refresh your data and retry.',
    )
  const inside = (day: string) => day >= range.from && day <= range.to
  const medications = data.medications
    .filter((medication) => medication.family_member_id === familyMemberId)
    .map((medication) => ({
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
  const medicationIds = new Set(medications.map((medication) => medication.id))
  const names = new Map(
    medications.map((medication) => [medication.id, medication.name]),
  )
  const logs = data.logs
    .filter(
      (log) =>
        inside(log.scheduled_date) && medicationIds.has(log.medication_id),
    )
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
    .filter(
      (record) =>
        record.family_member_id === familyMemberId &&
        inside(record.record_date),
    )
    .map((record) => ({
      id: record.id,
      title: record.title,
      category: record.category,
      provider: record.provider,
      date: record.record_date,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const health = data.healthProfile
  const familyHealth = data.familyHealthProfiles.find(
    (item) => item.family_member_id === familyMemberId,
  )
  const profile: [string, string][] | null = includeProfile
    ? member.relationship === 'self'
      ? [
          ['Name', health?.full_name || data.profile.full_name],
          ['Date of birth', health?.date_of_birth ?? 'Not recorded'],
          ['Gender', health?.gender?.replaceAll('_', ' ') ?? 'Not recorded'],
          ['Blood group', health?.blood_group ?? 'Not recorded'],
          [
            'Height',
            health?.height_cm == null
              ? 'Not recorded'
              : `${health.height_cm} cm`,
          ],
          [
            'Weight',
            health?.weight_kg == null
              ? 'Not recorded'
              : `${health.weight_kg} kg`,
          ],
          ['Allergies', health?.allergies || 'Not recorded'],
          ['Conditions', health?.conditions || 'Not recorded'],
          [
            'Emergency contact',
            health?.emergency_contact_name || 'Not recorded',
          ],
          [
            'Emergency phone',
            health?.emergency_contact_phone || 'Not recorded',
          ],
        ]
      : [
          ['Name', member.full_name],
          ['Date of birth', member.date_of_birth ?? 'Not recorded'],
          [
            'Gender',
            familyHealth?.gender?.replaceAll('_', ' ') ?? 'Not recorded',
          ],
          ['Blood group', familyHealth?.blood_group ?? 'Not recorded'],
          [
            'Height',
            familyHealth?.height_cm == null
              ? 'Not recorded'
              : `${familyHealth.height_cm} cm`,
          ],
          [
            'Weight',
            familyHealth?.weight_kg == null
              ? 'Not recorded'
              : `${familyHealth.weight_kg} kg`,
          ],
          ['Allergies', familyHealth?.allergies || 'Not recorded'],
          ['Conditions', familyHealth?.conditions || 'Not recorded'],
          [
            'Emergency contact',
            familyHealth?.emergency_contact_name || 'Not recorded',
          ],
          [
            'Emergency phone',
            familyHealth?.emergency_contact_phone || 'Not recorded',
          ],
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
