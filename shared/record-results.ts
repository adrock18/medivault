import { z } from 'zod'
import { calendarDateSchema } from './schemas.ts'

export const resultFields = [
  { name: 'Height', unit: 'cm' },
  { name: 'Weight', unit: 'kg' },
  { name: 'Blood group', unit: '' },
  { name: 'Blood pressure', unit: 'mmHg' },
  { name: 'Heart rate', unit: 'bpm' },
  { name: 'Oxygen saturation', unit: '%' },
] as const

export function resultIdentity(result: {
  name: string
  unit: string
  context: string
}) {
  return [result.name, result.unit, result.context]
    .map((value) => value.trim().toLowerCase())
    .join('|')
}

export const reviewedResultSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a test name.').max(80),
    value: z.string().trim().min(1, 'Enter the reported result.').max(100),
    unit: z.string().trim().max(30),
    context: z.string().trim().max(100),
    reference_range: z.string().trim().max(120),
  })
  .strict()
  .superRefine((row, ctx) => {
    const field = resultFields.find(
      (item) => item.name.toLowerCase() === row.name.toLowerCase(),
    )
    if (!field) return
    if (['Height', 'Weight', 'Blood group'].includes(field.name) && row.context)
      ctx.addIssue({
        code: 'custom',
        path: ['context'],
        message: 'Leave context blank for measurements synced to the profile.',
      })
    if (row.unit.toLowerCase() !== field.unit.toLowerCase())
      ctx.addIssue({
        code: 'custom',
        path: ['unit'],
        message: `Use ${field.unit || 'no unit'} for ${field.name}.`,
      })
    const limits =
      row.name.toLowerCase() === 'height'
        ? [1, 300]
        : row.name.toLowerCase() === 'weight'
          ? [0.1, 700]
          : row.name.toLowerCase() === 'heart rate'
            ? [20, 300]
            : row.name.toLowerCase() === 'oxygen saturation'
              ? [1, 100]
              : null
    if (
      limits &&
      (!/^\d+(?:\.\d+)?$/.test(row.value) ||
        Number(row.value) < limits[0] ||
        Number(row.value) > limits[1])
    )
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: `Enter a numeric value between ${limits[0]} and ${limits[1]}.`,
      })
    if (field.name === 'Blood group' && !/^(?:A|B|AB|O)[+-]$/.test(row.value))
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Use A+, A-, B+, B-, AB+, AB-, O+ or O-.',
      })
    if (field.name === 'Blood pressure') {
      const match = /^(\d{2,3})\s*\/\s*(\d{2,3})$/.exec(row.value)
      if (
        !match ||
        Number(match[1]) < 40 ||
        Number(match[1]) > 300 ||
        Number(match[2]) < 20 ||
        Number(match[2]) > 200 ||
        Number(match[1]) <= Number(match[2])
      )
        ctx.addIssue({
          code: 'custom',
          path: ['value'],
          message: 'Enter systolic/diastolic, for example 120/80, as printed.',
        })
    }
  })

export const reviewResultsSchema = z
  .object({
    measured_on: calendarDateSchema.refine(
      (value) =>
        value <=
        new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString().slice(0, 10),
      'Measurement date cannot be in the future.',
    ),
    results: z
      .array(reviewedResultSchema)
      .min(1, 'Add at least one result.')
      .max(100)
      .refine(
        (rows) => new Set(rows.map(resultIdentity)).size === rows.length,
        'Keep one result for each test, unit and context.',
      ),
    confirm_blood_group_change: z.boolean(),
  })
  .strict()

export const resultReviewRow = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  family_member_id: z.uuid(),
  source_record_id: z.uuid().nullable(),
  source_record_key: z.uuid(),
  source_title: z.string(),
  measured_on: calendarDateSchema,
  results: z.array(reviewedResultSchema),
  created_at: z.string(),
})

export type ReviewedResult = z.infer<typeof reviewedResultSchema>
export type ResultReview = z.infer<typeof resultReviewRow>
export type ReviewResultsValues = z.infer<typeof reviewResultsSchema>
export type ResultObservation = ReviewedResult & { review: ResultReview }

export function currentResultReviews(reviews: ResultReview[]) {
  const latest = new Map<string, ResultReview>()
  for (const review of [...reviews].sort(
    (a, b) =>
      b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id),
  ))
    if (!latest.has(review.source_record_key))
      latest.set(review.source_record_key, review)
  return [...latest.values()]
}

export function resultHistories(reviews: ResultReview[]) {
  const groups = new Map<string, ResultObservation[]>()
  for (const review of currentResultReviews(reviews))
    for (const result of review.results) {
      const key = resultIdentity(result)
      const history = groups.get(key) ?? []
      history.push({ ...result, review })
      groups.set(key, history)
    }
  for (const history of groups.values())
    history.sort(
      (a, b) =>
        b.review.measured_on.localeCompare(a.review.measured_on) ||
        b.review.created_at.localeCompare(a.review.created_at) ||
        b.review.id.localeCompare(a.review.id),
    )
  return [...groups.values()].sort(
    (a, b) =>
      a[0].name.localeCompare(b[0].name) ||
      a[0].unit.localeCompare(b[0].unit) ||
      a[0].context.localeCompare(b[0].context),
  )
}
