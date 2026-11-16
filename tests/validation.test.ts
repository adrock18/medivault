import { describe, expect, it } from 'vitest'
import {
  medicationSchema,
  metricSchema,
  profileSchema,
  recordSchema,
} from '../src/lib/schemas'
import {
  scheduledDoses,
  medicationStatus,
  validateDocument,
  MAX_FILE_SIZE,
  fileSize,
} from '../src/lib/utils'
import type { DoseLog, Medication } from '../src/lib/database.types'
const medication = {
  id: 'med-1',
  user_id: 'user-1',
  name: 'Example',
  dosage: 'As prescribed',
  form: 'tablet',
  strength: '',
  source_record_id: '',
  prescription_text: '',
  frequency: 'twice_daily',
  times: ['20:00', '08:00'],
  start_date: '2026-01-01',
  end_date: '2026-01-03',
  instructions: '',
  created_at: '',
  updated_at: '',
} satisfies Medication
describe('medication schedule and validation', () => {
  it('includes start and end dates, excludes upcoming and completed medications, and sorts dose times', () => {
    expect(
      scheduledDoses([medication], [], '2026-01-01').map((d) => d.time),
    ).toEqual(['08:00', '20:00'])
    expect(scheduledDoses([medication], [], '2026-01-03')).toHaveLength(2)
    expect(scheduledDoses([medication], [], '2026-01-04')).toEqual([])
    expect(medicationStatus(medication, '2025-12-31')).toBe('upcoming')
  })
  it('matches dose logs by medication, local date, and exact time without treating scheduled doses as taken', () => {
    const log: DoseLog = {
      id: 'log-1',
      user_id: 'user-1',
      medication_id: 'med-1',
      scheduled_date: '2026-01-02',
      scheduled_time: '08:00',
      status: 'skipped',
      logged_at: '',
      created_at: '',
      updated_at: '',
    }
    const doses = scheduledDoses([medication], [log], '2026-01-02')
    expect(doses[0].log?.status).toBe('skipped')
    expect(doses[1].log).toBeUndefined()
    expect(
      scheduledDoses([medication], [log], '2026-01-03')[0].log,
    ).toBeUndefined()
  })
  it.each(['08:00, 08:00', '25:00, 08:00', '08:00', '08:60, 20:00'])(
    'rejects duplicate, invalid, or wrong-count times: %s',
    (times) => {
      expect(medicationSchema.safeParse({ ...medication, times }).success).toBe(
        false,
      )
    },
  )
  it('rejects reversed dates and invalid calendar dates', () => {
    expect(
      medicationSchema.safeParse({
        ...medication,
        times: '08:00, 20:00',
        end_date: '2025-12-01',
      }).success,
    ).toBe(false)
    expect(
      recordSchema.safeParse({
        title: 'Test',
        category: 'other',
        provider: '',
        record_date: '2026-02-30',
      }).success,
    ).toBe(false)
  })
})
describe('health profile and measurement validation', () => {
  const metric = {
    type: 'blood_pressure',
    value: '120',
    secondary_value: '80',
    measured_at: '2025-01-01T08:00',
    notes: '',
  }
  it('requires diastolic pressure below systolic and within its input range', () => {
    expect(metricSchema.safeParse(metric).success).toBe(true)
    for (const value of ['', '120', '201', '19'])
      expect(
        metricSchema.safeParse({ ...metric, secondary_value: value }).success,
      ).toBe(false)
  })
  it('rejects future timestamps, non-numeric values and out-of-range glucose', () => {
    expect(
      metricSchema.safeParse({ ...metric, measured_at: '2999-01-01T00:00' })
        .success,
    ).toBe(false)
    expect(metricSchema.safeParse({ ...metric, value: 'NaN' }).success).toBe(
      false,
    )
    expect(
      metricSchema.safeParse({
        ...metric,
        type: 'blood_glucose',
        value: '1501',
      }).success,
    ).toBe(false)
  })
  it('accepts optional demographics but requires a meaningful emergency phone', () => {
    const profile = {
      full_name: 'Alex',
      date_of_birth: '',
      gender: '',
      blood_group: '',
      height_cm: '',
      weight_kg: '',
      allergies: '',
      conditions: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    }
    expect(profileSchema.safeParse(profile).success).toBe(true)
    expect(
      profileSchema.safeParse({ ...profile, emergency_contact_name: 'Sam' })
        .success,
    ).toBe(false)
    expect(
      profileSchema.safeParse({
        ...profile,
        emergency_contact_name: 'Sam',
        emergency_contact_phone: '-------',
      }).success,
    ).toBe(false)
  })
})
describe('document validation', () => {
  it('displays small non-empty files without rounding to zero and uses binary units at boundaries', () => {
    expect(fileSize(1)).toBe('1 byte')
    expect(fileSize(50)).toBe('50 bytes')
    expect(fileSize(1023)).toBe('1023 bytes')
    expect(fileSize(1024)).toBe('1 KiB')
    expect(fileSize(1024 * 1024)).toBe('1 MiB')
  })
  it('accepts valid PDF, JPG, PNG signatures and rejects disguised files', async () => {
    await expect(
      validateDocument(
        new File(['%PDF-1.4 test'], 'report.PDF', { type: 'application/pdf' }),
      ),
    ).resolves.toBeUndefined()
    await expect(
      validateDocument(
        new File([new Uint8Array([255, 216, 255, 0])], 'image.jpg', {
          type: 'image/jpeg',
        }),
      ),
    ).resolves.toBeUndefined()
    await expect(
      validateDocument(
        new File(
          [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
          'image.png',
          { type: 'image/png' },
        ),
      ),
    ).resolves.toBeUndefined()
    await expect(
      validateDocument(
        new File(['malicious text'], 'report.pdf', { type: 'application/pdf' }),
      ),
    ).rejects.toThrow('contents')
    await expect(
      validateDocument(
        new File(['%PDF-1.4'], 'report.exe', { type: 'application/pdf' }),
      ),
    ).rejects.toThrow('Only PDF')
  })
  it('enforces the exact 10 MB maximum and rejects empty files', async () => {
    const bytes = new Uint8Array(MAX_FILE_SIZE)
    bytes.set([255, 216, 255])
    await expect(
      validateDocument(new File([bytes], 'image.jpg', { type: 'image/jpeg' })),
    ).resolves.toBeUndefined()
    await expect(
      validateDocument(
        new File([new Uint8Array(MAX_FILE_SIZE + 1)], 'image.jpg', {
          type: 'image/jpeg',
        }),
      ),
    ).rejects.toThrow('10 MB')
    await expect(
      validateDocument(new File([], 'empty.pdf', { type: 'application/pdf' })),
    ).rejects.toThrow('non-empty')
  })
})
