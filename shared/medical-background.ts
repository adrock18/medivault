import { z } from 'zod'
import type { MedicalBackgroundEntry } from './database.types.ts'

export const medicalBackgroundEntrySchema = z
  .object({
    type: z.enum(['allergy', 'condition']),
    name: z
      .string()
      .trim()
      .min(1, 'Enter a name or remove this row.')
      .max(2000),
    instructions: z.string().trim().max(2000),
  })
  .strict()

export function medicalBackgroundText(
  entries: MedicalBackgroundEntry[],
  type: MedicalBackgroundEntry['type'],
) {
  return entries
    .filter((entry) => entry.type === type)
    .map((entry) => entry.name)
    .join('\n')
}

export const medicalBackgroundSchema = z
  .array(medicalBackgroundEntrySchema)
  .max(20, 'Use up to 20 medical-background entries.')
  .superRefine((entries, context) => {
    for (const type of ['allergy', 'condition'] as const) {
      if (medicalBackgroundText(entries, type).length > 2000)
        context.addIssue({
          code: 'custom',
          message: `Keep the combined ${type} names within 2,000 characters.`,
        })
    }
  })

// Keep legacy free text intact: commas and newlines do not reliably separate medical entries.
export function medicalBackgroundEntries(
  profile:
    | {
        medical_background?: MedicalBackgroundEntry[] | null
        allergies: string
        conditions: string
      }
    | null
    | undefined,
): MedicalBackgroundEntry[] {
  if (profile?.medical_background != null) return profile.medical_background
  const entries: MedicalBackgroundEntry[] = []
  if (profile?.allergies.trim())
    entries.push({ type: 'allergy', name: profile.allergies, instructions: '' })
  if (profile?.conditions.trim())
    entries.push({
      type: 'condition',
      name: profile.conditions,
      instructions: '',
    })
  return entries
}
