/**
 * Conservative prescription-text parser. Match explicit medicine/form/strength
 * wording into editable suggestions without prescribing a schedule.
 */

import type { MedicationFormType } from '@shared/database.types'
import type { MedicationValues } from '@shared/schemas'

export type PrescriptionSuggestion = Pick<
  MedicationValues,
  'name' | 'dosage' | 'strength' | 'form' | 'prescription_text'
> &
  Partial<Pick<MedicationValues, 'frequency'>>
const forms: Record<string, MedicationFormType> = {
  tab: 'tablet',
  tablet: 'tablet',
  tablets: 'tablet',
  cap: 'capsule',
  capsule: 'capsule',
  capsules: 'capsule',
  cream: 'cream',
  ointment: 'ointment',
  gel: 'gel',
  inj: 'injection',
  injection: 'injection',
  syrup: 'liquid',
  liquid: 'liquid',
  drops: 'drops',
  inhaler: 'inhaler',
  patch: 'patch',
  suppository: 'suppository',
}
const medicationLine =
  /^\s*(?:\d+[.)]\s*)?(tablets?|tab\.?|capsules?|cap\.?|cream|ointment|gel|injection|inj\.?|syrup|liquid|drops|inhaler|patch|suppository)\s+(.+)$/i
const strengthPattern =
  /\b\d+(?:\.\d+)?\s*(?:mcg|mg|g|ml|iu|units?|%)(?:\s*\/\s*(?:\d+(?:\.\d+)?\s*)?(?:ml|g|dose))?(?!\w)/i
const sprayProduct =
  /^(?:\d+[.)]\s*)?([a-z][a-z0-9'-]*(?:\s+(?:perlingual|sublingual|nasal|oral))?\s+spray)$/i
const sprayDose = /^(?:(?:take|use)\s+)?\d+\s+sprays?\b/i

/** Only recognize a complete simple daily instruction, not conditional regimens. */
function dailyFrequency(
  instruction: string,
): PrescriptionSuggestion['frequency'] {
  const match =
    /^(?:(?:take|use|inhale|instill)\s+)?(?:\d+|one|two|three)\s+(?:sprays?|tablets?|capsules?|puffs?|drops?|ml)(?:\s+(?:sublingually|orally|intranasally))?\s+(once daily|twice daily|three times daily)[.!]?$/i.exec(
      instruction,
    )
  switch (match?.[1].toLowerCase()) {
    case 'once daily':
      return 'once_daily'
    case 'twice daily':
      return 'twice_daily'
    case 'three times daily':
      return 'three_daily'
    default:
      return undefined
  }
}

/** Suggest editable fields from explicit text patterns without inferring a regimen. */
export function prescriptionSuggestions(
  text: string,
): PrescriptionSuggestion[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim())
  const suggestions: PrescriptionSuggestion[] = []
  for (let index = 0; index < lines.length; index++) {
    const match = medicationLine.exec(lines[index])
    const following = lines[index + 1]
    if (!match) {
      const product = sprayProduct.exec(lines[index])
      if (!product || !following || !sprayDose.test(following)) continue
      const instruction = following.split(/(?<=[.!?])\s+/)[0]
      const remainder = following.slice(instruction.length).trim()
      const frequency =
        (!remainder || /^(?:avoid|store|keep)\b/i.test(remainder)) &&
        !/\b(?:if|unless|until|then|when|as needed|prn)\b/i.test(
          `${following} ${lines[index + 2] ?? ''}`,
        )
          ? dailyFrequency(instruction)
          : undefined
      const dosage = frequency ? instruction : following
      suggestions.push({
        name: product[1].length <= 120 ? product[1] : '',
        form: 'other',
        strength: '',
        dosage: dosage.length <= 120 ? dosage : '',
        prescription_text: lines
          .slice(index, index + 3)
          .join('\n')
          .trim(),
        ...(frequency ? { frequency } : {}),
      })
      continue
    }
    const strength = strengthPattern.exec(match[2])
    const instructionAt = match[2].search(
      /\b(?:take|apply|inject|instill|inhale|use)\b/i,
    )
    const endName = Math.min(
      strength?.index ?? Infinity,
      instructionAt >= 0 ? instructionAt : Infinity,
    )
    const name = match[2]
      .slice(0, endName)
      .replace(/\s*[-\u2013\u2014:,]\s*$/, '')
      .trim()
    const instruction =
      instructionAt >= 0
        ? match[2].slice(instructionAt)
        : following &&
            /^(?:take|apply|inject|instill|inhale|use)\b/i.test(following)
          ? following
          : ''
    const excerpt =
      lines[index] +
      (instruction && instruction === following ? `\n${instruction}` : '')
    const frequency = dailyFrequency(instruction)
    suggestions.push({
      name: name.length <= 120 ? name : '',
      form: forms[match[1].toLowerCase().replace('.', '')],
      strength: strength?.[0] ?? '',
      dosage: instruction.length <= 120 ? instruction : '',
      prescription_text: excerpt,
      ...(frequency ? { frequency } : {}),
    })
  }
  return suggestions
}
