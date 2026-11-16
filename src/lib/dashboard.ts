import { subDays } from 'date-fns'
import type { DoseLog, MedicalRecord, Medication } from './database.types.ts'
import {
  doseTiming,
  localDate,
  scheduledDoses,
  type ScheduledDose,
} from './utils.ts'

export type DayCounts = {
  date: string
  taken: number
  skipped: number
  unlogged: number
  total: number
}

export const clockTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

export function dayBreakdown(
  meds: Medication[],
  logs: DoseLog[],
  day: string,
): DayCounts {
  const doses = scheduledDoses(meds, logs, day)
  const matched = new Set(doses.flatMap((dose) => dose.log?.id ?? []))
  // Unlogged counts follow the current schedule; logs always count on their own
  // date, including times that were later removed from a medication.
  const dayLogs = logs.filter((log) => log.scheduled_date === day)
  const taken = dayLogs.filter((log) => log.status === 'taken').length
  const skipped = dayLogs.filter((log) => log.status === 'skipped').length
  const unlogged = doses.filter((dose) => !dose.log).length
  const orphaned = dayLogs.filter((log) => !matched.has(log.id)).length
  return {
    date: day,
    taken,
    skipped,
    unlogged,
    total: doses.length + orphaned,
  }
}

export function weekBreakdown(
  meds: Medication[],
  logs: DoseLog[],
  now: Date,
): DayCounts[] {
  return Array.from({ length: 7 }, (_, index) =>
    dayBreakdown(meds, logs, localDate(subDays(now, 6 - index))),
  )
}

export function adherence30(logs: DoseLog[], now: Date) {
  const from = localDate(subDays(now, 29))
  const today = localDate(now)
  const recent = logs.filter(
    (log) => log.scheduled_date >= from && log.scheduled_date <= today,
  )
  const taken = recent.filter((log) => log.status === 'taken').length
  return recent.length
    ? {
        taken,
        logged: recent.length,
        percent: Math.round((taken / recent.length) * 100),
      }
    : null
}

/** Consecutive days before today where every scheduled dose has an outcome. */
export function loggedStreak(meds: Medication[], logs: DoseLog[], now: Date) {
  let streak = 0
  for (let offset = 1; offset <= 60; offset++) {
    const day = dayBreakdown(meds, logs, localDate(subDays(now, offset)))
    if (!day.total || day.unlogged) break
    streak++
  }
  return streak
}

export function nextDose(doses: ScheduledDose[], now: Date) {
  return doses.find(
    (dose) => !dose.log && ['scheduled', 'due'].includes(doseTiming(dose, now)),
  )
}

export function dailyInsights({
  doses,
  medications,
  records,
  streak,
  now,
}: {
  doses: ScheduledDose[]
  medications: Medication[]
  records: MedicalRecord[]
  streak: number
  now: Date
}): string[] {
  if (!medications.length && !records.length)
    return [
      'Add a medication or upload a record, and a summary of your day will appear here.',
    ]
  const statements: string[] = []
  const logged = doses.filter((dose) => dose.log).length
  const next = nextDose(doses, now)
  if (!doses.length) statements.push('No doses are scheduled for today.')
  else if (logged === doses.length)
    statements.push(
      `All ${doses.length} of today's scheduled ${doses.length === 1 ? 'dose is' : 'doses are'} logged.`,
    )
  else
    statements.push(
      `${logged} of ${doses.length} doses logged today.${next ? ` Next scheduled: ${next.medication.name} at ${next.time}.` : ''}`,
    )
  const earlier = doses.filter(
    (dose) => doseTiming(dose, now) === 'past_time',
  ).length
  if (earlier)
    statements.push(
      `${earlier} earlier ${earlier === 1 ? 'dose has' : 'doses have'} no log yet today.`,
    )
  if (streak >= 2)
    statements.push(
      `Every scheduled dose was logged on each of the last ${streak} days.`,
    )
  if (records.length)
    statements.push(
      `${records.length} ${records.length === 1 ? 'record' : 'records'} in your vault. Latest: ${records[0].title}.`,
    )
  return statements.slice(0, 3)
}

export type MarkState = 'taken' | 'skipped' | 'earlier' | 'later' | 'next'

export function markState(
  dose: ScheduledDose,
  now: Date,
  next?: ScheduledDose,
): MarkState {
  if (dose.log) return dose.log.status
  if (dose === next) return 'next'
  return doseTiming(dose, now) === 'past_time' ? 'earlier' : 'later'
}
