export type Category =
  'prescription' | 'lab_report' | 'scan' | 'discharge_summary' | 'other'
export type DocumentKind =
  | 'prescription'
  | 'lab_report'
  | 'imaging_report'
  | 'visit_note'
  | 'care_instructions'
  | 'discharge_summary'
  | 'referral'
  | 'immunization'
  | 'dental_record'
  | 'insurance_claim'
  | 'other'
export type CareTrackKind =
  'follow_up' | 'preventive' | 'dental' | 'ongoing' | 'other'
export type VisitSetting =
  | 'primary_care'
  | 'specialist'
  | 'dental'
  | 'hospital'
  | 'diagnostic'
  | 'preventive'
  | 'telehealth'
  | 'other'
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
export type FamilyMember = Timestamps & {
  id: string
  user_id: string
  full_name: string
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'grandparent' | 'other'
  date_of_birth: string | null
}
export type NotificationPreferences = Timestamps & {
  user_id: string
  email_reminders_enabled: boolean
  timezone: string
}
export type MedicalBackgroundEntry = {
  type: 'allergy' | 'condition'
  name: string
  instructions: string
}
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
  medical_background?: MedicalBackgroundEntry[] | null
  emergency_contact_name: string
  emergency_contact_phone: string
}
export type FamilyHealthProfile = Timestamps & {
  user_id: string
  family_member_id: string
  gender: HealthProfile['gender']
  blood_group: HealthProfile['blood_group']
  height_cm: number | null
  weight_kg: number | null
  allergies: string
  conditions: string
  medical_background?: MedicalBackgroundEntry[] | null
  emergency_contact_name: string
  emergency_contact_phone: string
}
export type MedicalRecord = Timestamps & {
  id: string
  user_id: string
  title: string
  category: Category
  document_kind: DocumentKind
  visit_id: string | null
  provider: string
  record_date: string
  file_path: string
  file_name: string
  file_type: string
  file_size: number
  is_favourite: boolean
  family_member_id: string
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
  family_member_id: string
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
export type CareTrack = Timestamps & {
  id: string
  user_id: string
  family_member_id: string
  title: string
  kind: CareTrackKind
}
export type CareVisit = Timestamps & {
  id: string
  user_id: string
  family_member_id: string
  care_track_id: string | null
  title: string
  reason: string
  setting: VisitSetting
  provider: string
  visit_date: string
  notes: string
}
export type ArchivedHealthMetric = Timestamps & {
  id: string
  user_id: string
  type: MetricType
  family_member_id: string
  value: number
  secondary_value: number | null
  measured_at: string
  notes: string
}
export type VisitFollowUp = Timestamps & {
  id: string
  user_id: string
  family_member_id: string
  visit_id: string
  due_date: string
  instruction: string
  source_record_id: string | null
  status: 'pending' | 'completed' | 'cancelled'
  completed_visit_id: string | null
}
