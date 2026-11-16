import type { MedicationFormType } from './database.types'
import type { MedicationValues } from './schemas'

export type PrescriptionSuggestion = Pick<
  MedicationValues,
  'name' | 'dosage' | 'strength' | 'form' | 'prescription_text'
>
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

export function prescriptionSuggestions(
  text: string,
): PrescriptionSuggestion[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const suggestions: PrescriptionSuggestion[] = []
  for (let index = 0; index < lines.length; index++) {
    const match = medicationLine.exec(lines[index])
    if (!match) continue
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
    const following = lines[index + 1]
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
    suggestions.push({
      name: name.length <= 120 ? name : '',
      form: forms[match[1].toLowerCase().replace('.', '')],
      strength: strength?.[0] ?? '',
      dosage: instruction.length <= 120 ? instruction : '',
      prescription_text: excerpt,
    })
  }
  return suggestions
}
