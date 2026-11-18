/**
 * Runtime API response contracts and inferred types shared by browser and server.
 * Reject incompatible payloads at the network boundary.
 */

import { z } from 'zod'
import { medicationForms } from './database.types.ts'
import { resultReviewRow } from './record-results.ts'
import { medicalBackgroundSchema } from './medical-background.ts'
import type {
  Profile,
  FamilyMember,
  FamilyHealthProfile,
  NotificationPreferences,
  HealthProfile,
  MedicalRecord,
  Medication,
  DoseLog,
  ArchivedHealthMetric,
  CareTrack,
  CareVisit,
  VisitFollowUp,
} from './database.types.ts'
const timestamps = { created_at: z.string(), updated_at: z.string() }
export const profileRow: z.ZodType<Profile> = z.object({
  id: z.uuid(),
  full_name: z.string(),
  ...timestamps,
})
export const familyMemberRow: z.ZodType<FamilyMember> = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  full_name: z.string(),
  relationship: z.enum([
    'self',
    'spouse',
    'child',
    'parent',
    'grandparent',
    'other',
  ]),
  date_of_birth: z.string().nullable(),
  ...timestamps,
})
export const notificationPreferencesRow: z.ZodType<NotificationPreferences> =
  z.preprocess(
    (value) => {
      const row = z
        .object({
          email_reminders_enabled: z.union([
            z.literal(0),
            z.literal(1),
            z.boolean(),
          ]),
        })
        .passthrough()
        .parse(value)
      return {
        ...row,
        email_reminders_enabled:
          row.email_reminders_enabled === 1 ||
          row.email_reminders_enabled === true,
      }
    },
    z.object({
      user_id: z.uuid(),
      email_reminders_enabled: z.boolean(),
      timezone: z.string(),
      ...timestamps,
    }),
  )
export const healthProfileRow: z.ZodType<HealthProfile> = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  full_name: z.string(),
  date_of_birth: z.string().nullable(),
  gender: z
    .enum(['female', 'male', 'non_binary', 'prefer_not_to_say'])
    .nullable(),
  blood_group: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .nullable(),
  height_cm: z.number().nullable(),
  weight_kg: z.number().nullable(),
  allergies: z.string(),
  conditions: z.string(),
  medical_background: medicalBackgroundSchema.nullable().optional(),
  emergency_contact_name: z.string(),
  emergency_contact_phone: z.string(),
  ...timestamps,
})
export const familyHealthProfileRow: z.ZodType<FamilyHealthProfile> = z.object({
  user_id: z.uuid(),
  family_member_id: z.uuid(),
  gender: z
    .enum(['female', 'male', 'non_binary', 'prefer_not_to_say'])
    .nullable(),
  blood_group: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .nullable(),
  height_cm: z.number().nullable(),
  weight_kg: z.number().nullable(),
  allergies: z.string(),
  conditions: z.string(),
  medical_background: medicalBackgroundSchema.nullable().optional(),
  emergency_contact_name: z.string(),
  emergency_contact_phone: z.string(),
  ...timestamps,
})
export const recordRow: z.ZodType<MedicalRecord> = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  title: z.string(),
  category: z.enum([
    'prescription',
    'lab_report',
    'scan',
    'discharge_summary',
    'other',
  ]),
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
  visit_id: z.uuid().nullable(),
  hospital_name: z.string(),
  doctor_name: z.string(),
  record_date: z.string(),
  file_path: z.string(),
  file_name: z.string(),
  file_type: z.string(),
  file_size: z.number(),
  is_favourite: z.boolean(),
  family_member_id: z.uuid(),
  ...timestamps,
})
export const medicationRow: z.ZodType<Medication> = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  name: z.string(),
  dosage: z.string(),
  form: z.enum(
    Object.keys(medicationForms) as [
      keyof typeof medicationForms,
      ...(keyof typeof medicationForms)[],
    ],
  ),
  strength: z.string(),
  source_record_id: z.uuid().nullable(),
  prescription_text: z.string(),
  family_member_id: z.uuid(),
  frequency: z.enum(['once_daily', 'twice_daily', 'three_daily', 'custom']),
  times: z.array(
    z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d(?::00)?$/)
      .transform((value) => value.slice(0, 5)),
  ),
  start_date: z.string(),
  end_date: z.string().nullable(),
  instructions: z.string(),
  ...timestamps,
})
export const doseLogRow: z.ZodType<DoseLog> = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  medication_id: z.uuid(),
  scheduled_date: z.string(),
  scheduled_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(?::00)?$/)
    .transform((value) => value.slice(0, 5)),
  status: z.enum(['taken', 'skipped']),
  logged_at: z.string(),
  ...timestamps,
})
export const careTrackRow: z.ZodType<CareTrack> = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  family_member_id: z.uuid(),
  title: z.string(),
  kind: z.enum(['follow_up', 'preventive', 'dental', 'ongoing', 'other']),
  ...timestamps,
})
export const careVisitRow: z.ZodType<CareVisit> = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  family_member_id: z.uuid(),
  care_track_id: z.uuid().nullable(),
  title: z.string(),
  reason: z.string(),
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
  hospital_name: z.string(),
  doctor_name: z.string(),
  visit_date: z.string(),
  notes: z.string(),
  ...timestamps,
})
export const archivedHealthMetricRow: z.ZodType<ArchivedHealthMetric> =
  z.object({
    id: z.uuid(),
    user_id: z.uuid(),
    type: z.enum(['blood_pressure', 'blood_glucose', 'weight', 'heart_rate']),
    value: z.number(),
    secondary_value: z.number().nullable(),
    measured_at: z.string(),
    notes: z.string(),
    family_member_id: z.uuid(),
    ...timestamps,
  })
export const visitFollowUpRow: z.ZodType<VisitFollowUp> = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  family_member_id: z.uuid(),
  visit_id: z.uuid(),
  due_date: z.string(),
  instruction: z.string(),
  source_record_id: z.uuid().nullable(),
  status: z.enum(['pending', 'completed', 'cancelled']),
  completed_visit_id: z.uuid().nullable(),
  ...timestamps,
})
export const accountExportSchema = z.object({
  record_result_reviews: z.array(resultReviewRow),
  exported_at: z.string(),
  profile: profileRow,
  family_members: z.array(familyMemberRow),
  health_profile: healthProfileRow.nullable(),
  family_health_profiles: z.array(familyHealthProfileRow),
  medical_records: z.array(recordRow),
  medications: z.array(medicationRow),
  medication_logs: z.array(doseLogRow),
  care_tracks: z.array(careTrackRow),
  care_visits: z.array(careVisitRow),
  visit_follow_ups: z.array(visitFollowUpRow),
  archived_health_metrics: z.array(archivedHealthMetricRow),
})
export const sessionSchema = z.object({
  user: z.object({ id: z.uuid(), email: z.email(), full_name: z.string() }),
})
export type Session = z.infer<typeof sessionSchema>
export const registrationResultSchema = z.union([
  sessionSchema,
  z.object({ confirmation_required: z.literal(true) }),
])
export type RegistrationResult = z.infer<typeof registrationResultSchema>
export const vaultSchema = z.object({
  resultReviews: z.array(resultReviewRow),
  profile: profileRow,
  familyMembers: z.array(familyMemberRow),
  notificationPreferences: notificationPreferencesRow,
  features: z.object({
    remoteOcrAvailable: z.boolean(),
    emailRemindersConfigured: z.boolean(),
  }),
  healthProfile: healthProfileRow.nullable(),
  familyHealthProfiles: z.array(familyHealthProfileRow),
  records: z.array(recordRow),
  medications: z.array(medicationRow),
  logs: z.array(doseLogRow),
  careTracks: z.array(careTrackRow),
  visits: z.array(careVisitRow),
  followUps: z.array(visitFollowUpRow),
})
export type VaultData = z.infer<typeof vaultSchema>
