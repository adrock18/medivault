/**
 * Conservative report-text matching. Produce editable results only for recognized
 * explicit labels/units; never invent missing values or ranges.
 */

import {
  reviewedResultSchema,
  type ReviewedResult,
} from '@shared/record-results'

/** Match explicit labels and units only; leave unfamiliar report layouts for review. */
export function extractResultSuggestions(text: string): ReviewedResult[] {
  const patterns: { name: string; unit: string; pattern: RegExp }[] = [
    {
      name: 'Height',
      unit: 'cm',
      pattern: /^(?:height|ht\.?)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*cm\b/i,
    },
    {
      name: 'Weight',
      unit: 'kg',
      pattern: /^(?:weight|wt\.?)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*kg\b/i,
    },
    {
      name: 'Heart rate',
      unit: 'bpm',
      pattern: /^(?:heart rate|pulse(?: rate)?)\s*[:=-]?\s*(\d+)\s*bpm\b/i,
    },
    {
      name: 'Oxygen saturation',
      unit: '%',
      pattern:
        /^(?:oxygen saturation|spo2|sp02)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*%/i,
    },
    {
      name: 'Blood pressure',
      unit: 'mmHg',
      pattern:
        /^(?:blood pressure|b\.?p\.?)\s*[:=-]?\s*(\d{2,3}\s*\/\s*\d{2,3})\s*mm\s*hg\b/i,
    },
    {
      name: 'Blood group',
      unit: '',
      pattern:
        /^(?:blood group|blood type)\s*[:=]?\s*((?:AB|A|B|O)\s*[+-])(?!\w)/i,
    },
    {
      name: 'Hemoglobin',
      unit: 'g/dL',
      pattern:
        /^(?:ha?emoglobin|hb)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*g\s*\/\s*dl\b/i,
    },
    {
      name: 'Fasting glucose',
      unit: 'mg/dL',
      pattern:
        /^(?:fasting (?:blood )?(?:glucose|sugar)|fbs)\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*mg\s*\/\s*dl\b/i,
    },
    {
      name: 'Urine protein',
      unit: '',
      pattern: /^urine protein\s*[:=]?\s*(negative|positive|trace)\b/i,
    },
  ]
  const suggestions: ReviewedResult[] = []
  for (const line of text.split(/\r?\n/).map((value) => value.trim())) {
    for (const item of patterns) {
      const match = item.pattern.exec(line)
      if (!match) continue
      const value =
        item.name === 'Blood group'
          ? match[1].replace(/\s/g, '').toUpperCase()
          : match[1]
      const parsed = reviewedResultSchema.safeParse({
        name: item.name,
        value,
        unit: item.unit,
        context: '',
        reference_range: '',
      })
      if (parsed.success) suggestions.push(parsed.data)
    }
  }
  return suggestions
}
