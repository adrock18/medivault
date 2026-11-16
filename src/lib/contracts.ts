import { z } from 'zod'
import { medicationForms } from './database.types.ts'
import type {
  Profile,
  HealthProfile,
  MedicalRecord,
  Medication,
  DoseLog,
  HealthMetric,
} from './database.types.ts'
const timestamps = { created_at: z.string(), updated_at: z.string() }
export const profileRow: z.ZodType<Profile> = z.object({
  id: z.uuid(),
  full_name: z.string(),
  ...timestamps,
})
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
  provider: z.string(),
  record_date: z.string(),
  file_path: z.string(),
  file_name: z.string(),
  file_type: z.string(),
  file_size: z.number(),
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
  frequency: z.enum(['once_daily', 'twice_daily', 'three_daily', 'custom']),
  times: z.array(z.string()),
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
  scheduled_time: z.string(),
  status: z.enum(['taken', 'skipped']),
  logged_at: z.string(),
  ...timestamps,
})
export const metricRow: z.ZodType<HealthMetric> = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  type: z.enum(['blood_pressure', 'blood_glucose', 'weight', 'heart_rate']),
  value: z.number(),
  secondary_value: z.number().nullable(),
  measured_at: z.string(),
  notes: z.string(),
  ...timestamps,
})
export const sessionSchema = z.object({
  user: z.object({ id: z.uuid(), email: z.email(), full_name: z.string() }),
})
export type Session = z.infer<typeof sessionSchema>
export const vaultSchema = z.object({
  profile: profileRow,
  healthProfile: healthProfileRow.nullable(),
  records: z.array(recordRow),
  medications: z.array(medicationRow),
  logs: z.array(doseLogRow),
  metrics: z.array(metricRow),
})
export type VaultData = z.infer<typeof vaultSchema>
