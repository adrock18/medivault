/**
 * Shared form and request validation. Normalize accepted user input and enforce
 * calendar, schedule and linked-field rules before persistence.
 */

import { z } from 'zod'
import { localDate } from './health.ts'
import { medicationForms } from './database.types.ts'
import { medicalBackgroundSchema } from './medical-background.ts'

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.')
  .refine((value) => {
    const parsed = new Date(`${value}T12:00:00`)
    return (
      !value.startsWith('0000-') &&
      !Number.isNaN(parsed.getTime()) &&
      localDate(parsed) === value
    )
  }, 'Choose a valid calendar date.')
const date = calendarDateSchema
const optionalPastDate = z.union([
  z.literal(''),
  date.refine((value) => value <= localDate(), 'Date cannot be in the future.'),
])
/**
 * Allow blank optional measurements while validating supplied numbers against the
 * field bounds.
 */
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
export const confirmationEmailSchema = z.object({
  email: z.email('Enter a valid email address.'),
})
export const loginSchema = confirmationEmailSchema.extend({
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
const profileFieldsSchema = z.object({
  full_name: z.string().trim().min(1, 'Enter your full name.').max(120),
  date_of_birth: optionalPastDate,
  gender: z.enum(['', 'female', 'male', 'non_binary', 'prefer_not_to_say']),
  blood_group: z.enum(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  height_cm: numberOrBlank(1, 300),
  weight_kg: numberOrBlank(0.1, 700),
  allergies: z.string().trim().max(2000),
  conditions: z.string().trim().max(2000),
  medical_background: medicalBackgroundSchema.optional(),
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
/**
 * Keep retained contact fields paired for compatibility, even though the current
 * profile UI no longer edits them.
 */
const hasCompleteEmergencyContact = (value: {
  emergency_contact_name: string
  emergency_contact_phone: string
}) =>
  Boolean(value.emergency_contact_name) ===
  Boolean(value.emergency_contact_phone)
const emergencyContactIssue = {
  path: ['emergency_contact_phone'],
  message:
    'Provide both an emergency contact name and phone, or leave both blank.',
}
export const profileSchema = profileFieldsSchema.refine(
  hasCompleteEmergencyContact,
  emergencyContactIssue,
)
export const familyHealthProfileSchema = profileFieldsSchema
  .pick({
    gender: true,
    blood_group: true,
    height_cm: true,
    weight_kg: true,
    allergies: true,
    conditions: true,
    medical_background: true,
    emergency_contact_name: true,
    emergency_contact_phone: true,
  })
  .refine(hasCompleteEmergencyContact, emergencyContactIssue)
export type FamilyHealthProfileValues = z.infer<
  typeof familyHealthProfileSchema
>
export const familyMemberSchema = z.object({
  full_name: z.string().trim().min(1, 'Enter a name.').max(120),
  relationship: z.enum([
    'self',
    'spouse',
    'child',
    'parent',
    'grandparent',
    'other',
  ]),
  date_of_birth: optionalPastDate,
})
export const notificationPreferencesSchema = z
  .object({
    email_reminders_enabled: z.boolean(),
    timezone: z
      .string()
      .trim()
      .min(1, 'Enter a time zone.')
      .max(80)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone: value })
          return true
        } catch {
          return false
        }
      }, 'Enter a valid IANA time zone, such as Europe/London.'),
  })
  .strict()
export type NotificationPreferencesValues = z.infer<
  typeof notificationPreferencesSchema
>
const providerField = z.string().trim().max(323, 'Use at most 323 characters.')
export const recordSchema = z.object({
  family_member_id: z.uuid('Select a family profile.'),
  visit_id: z.union([z.literal(''), z.uuid('Select a valid visit.')]),
  title: z.string().trim().min(1, 'Enter a document title.').max(160),
  document_kind: z.enum([
    'prescription',
    'lab_report',
    'imaging_report',
    'visit_note',
    'care_instructions',
    'discharge_summary',
    'referral',
    'immunization',
    'dental_record',
    'insurance_claim',
    'other',
  ]),
  provider: providerField,
  record_date: date.refine(
    (value) => value <= localDate(),
    'Record date cannot be in the future.',
  ),
})
export const careTrackSchema = z
  .object({
    family_member_id: z.uuid('Select a family profile.'),
    title: z.string().trim().min(1, 'Enter a care track name.').max(160),
    kind: z.enum(['follow_up', 'preventive', 'dental', 'ongoing', 'other']),
  })
  .strict()
export const careVisitSchema = z
  .object({
    family_member_id: z.uuid('Select a family profile.'),
    care_track_id: z.union([
      z.literal(''),
      z.uuid('Select a valid care track.'),
    ]),
    title: z.string().trim().min(1, 'Enter a visit title.').max(160),
    reason: z.string().trim().max(1000),
    setting: z.enum([
      'primary_care',
      'specialist',
      'dental',
      'hospital',
      'diagnostic',
      'preventive',
      'telehealth',
      'other',
    ]),
    provider: providerField,
    visit_date: date.refine(
      (value) => value <= localDate(),
      'Visit date cannot be in the future.',
    ),
    notes: z.string().trim().max(2000),
  })
  .strict()
export const recordFavouriteSchema = z
  .object({ is_favourite: z.boolean() })
  .strict()
export const visitFollowUpSchema = z
  .object({
    due_date: date,
    instruction: z.string().trim().max(2000),
    source_record_id: z.union([
      z.literal(''),
      z.uuid('Select a source document.'),
    ]),
    status: z.enum(['pending', 'completed', 'cancelled']),
    completed_visit_id: z.union([
      z.literal(''),
      z.uuid('Select a return visit.'),
    ]),
  })
  .strict()
export type VisitFollowUpValues = z.infer<typeof visitFollowUpSchema>
export const medicationSchema = z
  .object({
    family_member_id: z.uuid('Select a family profile.'),
    name: z.string().trim().min(1, 'Enter the medication name.').max(120),
    dosage: z.string().trim().min(1, 'Enter the prescribed dosage.').max(120),
    form: z
      .enum(
        Object.keys(medicationForms) as [
          keyof typeof medicationForms,
          ...(keyof typeof medicationForms)[],
        ],
      )
      .optional(),
    strength: z.string().trim().max(120).optional(),
    source_record_id: z
      .union([z.literal(''), z.uuid('Select a valid source record.')])
      .optional(),
    prescription_text: z
      .string()
      .max(4000, 'Use an excerpt of at most 4,000 characters.')
      .optional(),
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
export type ProfileValues = z.infer<typeof profileSchema>
export type FamilyMemberValues = z.infer<typeof familyMemberSchema>
export type RecordValues = z.infer<typeof recordSchema>
export type CareTrackValues = z.infer<typeof careTrackSchema>
export type CareVisitValues = z.infer<typeof careVisitSchema>
export type MedicationValues = z.infer<typeof medicationSchema>
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
