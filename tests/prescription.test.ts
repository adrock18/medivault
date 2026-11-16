import { expect, it } from 'vitest'
import { prescriptionSuggestions } from '../src/lib/prescription'

it('copies explicit dosage wording and strength separately for different medication forms', () => {
  const tablet = 'Take ONE tablet after food; follow the printed label.'
  const cream = 'Apply a thin layer to the specified area.'
  const result = prescriptionSuggestions(
    [
      'FICTIONAL TEST PRESCRIPTION',
      '1. Tab. ExampleOne 500 mg',
      tablet,
      'Cream ExampleTwo 1%',
      cream,
      'Injection ExampleThree 10 mg/ml',
    ].join('\n'),
  )
  expect(result).toHaveLength(3)
  expect(result[0]).toEqual({
    name: 'ExampleOne',
    form: 'tablet',
    strength: '500 mg',
    dosage: tablet,
    prescription_text: `1. Tab. ExampleOne 500 mg\n${tablet}`,
  })
  expect(result[1]).toMatchObject({
    form: 'cream',
    strength: '1%',
    dosage: cream,
  })
  expect(result[2]).toMatchObject({
    form: 'injection',
    strength: '10 mg/ml',
    dosage: '',
  })
})

it('does not turn product strength, abbreviations, or an adjacent medicine into invented dose instructions', () => {
  const result = prescriptionSuggestions(
    'Tablet ExampleOne 500 mg 1-0-1\nCapsule ExampleTwo 20 mg',
  )
  expect(result.map((item) => item.dosage)).toEqual(['', ''])
  expect(result[0].prescription_text).toBe('Tablet ExampleOne 500 mg 1-0-1')
  expect(result[0]).not.toHaveProperty('times')
  expect(result[0]).not.toHaveProperty('start_date')
  expect(
    prescriptionSuggestions('Patient details\nUnclear handwritten text'),
  ).toEqual([])
})
