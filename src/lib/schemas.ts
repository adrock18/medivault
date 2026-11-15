import { z } from 'zod'
import { localDate, metricInfo } from './utils.ts'

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.')
  .refine((value) => {
    const parsed = new Date(`${value}T12:00:00`)
    return !Number.isNaN(parsed.getTime()) && localDate(parsed) === value
  }, 'Choose a valid calendar date.')
const date = calendarDateSchema
const optionalPastDate = z.union([
  z.literal(''),
  date.refine((value) => value <= localDate(), 'Date cannot be in the future.'),
])
const numberOrBlank = (min: number, max: number) =>
  z.union([
    z.literal(''),
    z
      .string()
      .refine(
        (v) =>
          Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max,
        `Enter a value between ${min} and ${max}.`,
      ),
  ])
export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.').max(128),
})
export const registerSchema = loginSchema
  .extend({
    full_name: z.string().trim().min(1, 'Enter your full name.').max(120),
    password: z.string().min(8, 'Use at least 8 characters.').max(128),
    confirm_password: z.string(),
  })
  .refine((value) => value.password === value.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match.',
  })
export const profileSchema = z
  .object({
    full_name: z.string().trim().min(1, 'Enter your full name.').max(120),
    date_of_birth: optionalPastDate,
    gender: z.enum(['', 'female', 'male', 'non_binary', 'prefer_not_to_say']),
    blood_group: z.enum(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    height_cm: numberOrBlank(1, 300),
    weight_kg: numberOrBlank(0.1, 700),
    allergies: z.string().trim().max(2000),
    conditions: z.string().trim().max(2000),
    emergency_contact_name: z.string().trim().max(120),
    emergency_contact_phone: z
      .string()
      .trim()
      .max(30)
      .refine(
        (v) =>
          !v ||
          (/^\+?[\d\s()-]{7,30}$/.test(v) && v.replace(/\D/g, '').length >= 7),
        'Enter a valid phone number.',
      ),
  })
  .refine(
    (v) =>
      Boolean(v.emergency_contact_name) === Boolean(v.emergency_contact_phone),
    {
      path: ['emergency_contact_phone'],
      message:
        'Provide both an emergency contact name and phone, or leave both blank.',
    },
  )
export const recordSchema = z.object({
  title: z.string().trim().min(1, 'Enter a document title.').max(160),
  category: z.enum([
    'prescription',
    'lab_report',
    'scan',
    'discharge_summary',
    'other',
  ]),
  provider: z.string().trim().max(160),
  record_date: date.refine(
    (value) => value <= localDate(),
    'Record date cannot be in the future.',
  ),
})
export const medicationSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter the medication name.').max(120),
    dosage: z.string().trim().min(1, 'Enter the prescribed dosage.').max(120),
    frequency: z.enum(['once_daily', 'twice_daily', 'three_daily', 'custom']),
    times: z.string().trim().min(1, 'Enter at least one dose time.'),
    start_date: date,
    end_date: z.union([z.literal(''), date]),
    instructions: z.string().trim().max(2000),
  })
  .superRefine((v, ctx) => {
    const times = v.times.split(',').map((t) => t.trim())
    if (
      times.length > 12 ||
      times.some((t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) ||
      new Set(times).size !== times.length
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['times'],
        message:
          'Enter up to 12 unique times in HH:MM format, separated by commas.',
      })
    }
    const expected = {
      once_daily: 1,
      twice_daily: 2,
      three_daily: 3,
      custom: times.length,
    }[v.frequency]
    if (times.length !== expected)
      ctx.addIssue({
        code: 'custom',
        path: ['times'],
        message: `Enter ${expected} dose time(s) for this frequency.`,
      })
    if (v.end_date && v.end_date < v.start_date)
      ctx.addIssue({
        code: 'custom',
        path: ['end_date'],
        message: 'End date cannot be before start date.',
      })
  })
export const metricSchema = z
  .object({
    type: z.enum(['blood_pressure', 'blood_glucose', 'weight', 'heart_rate']),
    value: z.string().min(1, 'Enter a measurement.'),
    secondary_value: z.string(),
    measured_at: z.string().min(1, 'Choose the date and time.'),
    notes: z.string().trim().max(1000),
  })
  .superRefine((v, ctx) => {
    const n = Number(v.value),
      info = metricInfo[v.type]
    if (!Number.isFinite(n) || n < info.min || n > info.max)
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: `Enter a value between ${info.min} and ${info.max} ${info.unit}.`,
      })
    if (v.type === 'blood_pressure') {
      const d = Number(v.secondary_value)
      if (
        !v.secondary_value ||
        !Number.isFinite(d) ||
        d < 20 ||
        d > 200 ||
        d >= n
      )
        ctx.addIssue({
          code: 'custom',
          path: ['secondary_value'],
          message:
            'Enter diastolic pressure between 20 and 200, below systolic.',
        })
    }
    const time = new Date(v.measured_at).getTime()
    if (!Number.isFinite(time) || time > Date.now())
      ctx.addIssue({
        code: 'custom',
        path: ['measured_at'],
        message: 'Choose a valid date and time that is not in the future.',
      })
  })
export type ProfileValues = z.infer<typeof profileSchema>
export type RecordValues = z.infer<typeof recordSchema>
export type MedicationValues = z.infer<typeof medicationSchema>
export type MetricValues = z.infer<typeof metricSchema>
export const passwordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, 'Enter your current password.')
      .max(128),
    password: z.string().min(8, 'Use at least 8 characters.').max(128),
    confirm_password: z.string(),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match.',
  })
