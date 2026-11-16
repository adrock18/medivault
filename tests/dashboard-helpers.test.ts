import { describe, expect, it } from 'vitest'
import {
  adherence30,
  dailyInsights,
  dayBreakdown,
  loggedStreak,
  weekBreakdown,
} from '../src/lib/dashboard'
import { scheduledDoses } from '../src/lib/utils'
import type {
  DoseLog,
  MedicalRecord,
  Medication,
} from '../src/lib/database.types'

const now = new Date('2026-03-10T14:00:00')
const med: Medication = {
  id: 'm1',
  user_id: 'u1',
  name: 'Example A',
  dosage: 'Example only',
  form: 'tablet',
  strength: '',
  source_record_id: null,
  prescription_text: '',
  frequency: 'twice_daily',
  times: ['08:00', '20:00'],
  start_date: '2026-03-01',
  end_date: null,
  instructions: '',
  created_at: '',
  updated_at: '',
}
const log = (
  date: string,
  time: string,
  status: 'taken' | 'skipped' = 'taken',
  id = `${date}-${time}`,
): DoseLog => ({
  id,
  user_id: 'u1',
  medication_id: 'm1',
  scheduled_date: date,
  scheduled_time: time,
  status,
  logged_at: '',
  created_at: '',
  updated_at: '',
})
const record = { title: 'Lab panel' } as MedicalRecord

describe('dashboard derivations', () => {
  it('excludes days outside a medication range and keeps logs for removed times', () => {
    const later = { ...med, start_date: '2026-03-09', end_date: '2026-03-09' }
    const week = weekBreakdown([later], [], now)
    expect(week).toHaveLength(7)
    expect(week.map((day) => day.total)).toEqual([0, 0, 0, 0, 0, 2, 0])
    expect(
      dayBreakdown([med], [log('2026-03-10', '12:00')], '2026-03-10'),
    ).toEqual({
      date: '2026-03-10',
      taken: 1,
      skipped: 0,
      unlogged: 2,
      total: 3,
    })
  })

  it('computes recorded adherence from outcomes only', () => {
    expect(adherence30([], now)).toBeNull()
    const logs = [
      ...Array.from({ length: 8 }, (_, i) =>
        log(`2026-03-0${(i % 8) + 1}`, '08:00', 'taken', `t${i}`),
      ),
      log('2026-03-09', '20:00', 'skipped'),
      log('2026-03-08', '20:00', 'skipped'),
      log('2026-01-01', '08:00', 'skipped'),
    ]
    expect(adherence30(logs, now)).toEqual({
      taken: 8,
      logged: 10,
      percent: 80,
    })
  })

  it('counts consecutive fully logged days before today', () => {
    const logs = ['2026-03-07', '2026-03-08', '2026-03-09'].flatMap((date) => [
      log(date, '08:00'),
      log(date, '20:00', 'skipped'),
    ])
    expect(loggedStreak([med], logs, now)).toBe(3)
    expect(loggedStreak([med], logs.slice(2), now)).toBe(2)
  })

  it('states facts only, at most three, without advice or judgments', () => {
    const logs = [log('2026-03-10', '08:00')]
    const meds = [
      med,
      { ...med, id: 'm2', name: 'Example B', times: ['09:00'] },
    ]
    const insights = dailyInsights({
      doses: scheduledDoses(meds, logs, '2026-03-10'),
      medications: meds,
      records: [record],
      streak: 3,
      now,
    })
    expect(insights).toEqual([
      '1 of 3 doses logged today. Next scheduled: Example A at 20:00.',
      '1 earlier dose has no log yet today.',
      'Every scheduled dose was logged on each of the last 3 days.',
    ])
    for (const text of insights)
      expect(text).not.toMatch(/\b(missed|should|must|take|late)\b/i)
    expect(
      dailyInsights({
        doses: [],
        medications: [],
        records: [],
        streak: 0,
        now,
      }),
    ).toEqual([
      'Add a medication or upload a record, and a summary of your day will appear here.',
    ])
  })
})
