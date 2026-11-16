export type Category =
  'prescription' | 'lab_report' | 'scan' | 'discharge_summary' | 'other'
export type Frequency = 'once_daily' | 'twice_daily' | 'three_daily' | 'custom'
export const medicationForms = {
  unspecified: 'Not specified',
  tablet: 'Tablet',
  capsule: 'Capsule',
  cream: 'Cream',
  ointment: 'Ointment',
  gel: 'Gel',
  injection: 'Injection',
  liquid: 'Liquid / syrup',
  drops: 'Drops',
  inhaler: 'Inhaler',
  patch: 'Patch',
  suppository: 'Suppository',
  other: 'Other',
} as const
export type MedicationFormType = keyof typeof medicationForms
export type MetricType =
  'blood_pressure' | 'blood_glucose' | 'weight' | 'heart_rate'
type Timestamps = { created_at: string; updated_at: string }
export type Profile = Timestamps & { id: string; full_name: string }
export type HealthProfile = Timestamps & {
  id: string
  user_id: string
  full_name: string
  date_of_birth: string | null
  gender: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | null
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null
  height_cm: number | null
  weight_kg: number | null
  allergies: string
  conditions: string
  emergency_contact_name: string
  emergency_contact_phone: string
}
export type MedicalRecord = Timestamps & {
  id: string
  user_id: string
  title: string
  category: Category
  provider: string
  record_date: string
  file_path: string
  file_name: string
  file_type: string
  file_size: number
}
export type Medication = Timestamps & {
  id: string
  user_id: string
  name: string
  dosage: string
  form: MedicationFormType
  strength: string
  source_record_id: string | null
  prescription_text: string
  frequency: Frequency
  times: string[]
  start_date: string
  end_date: string | null
  instructions: string
}
export type DoseLog = Timestamps & {
  id: string
  user_id: string
  medication_id: string
  scheduled_date: string
  scheduled_time: string
  status: 'taken' | 'skipped'
  logged_at: string
}
export type HealthMetric = Timestamps & {
  id: string
  user_id: string
  type: MetricType
  value: number
  secondary_value: number | null
  measured_at: string
  notes: string
}
