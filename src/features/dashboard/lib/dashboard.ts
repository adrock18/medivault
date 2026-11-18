/**
 * Pure dashboard calculations. Derive scheduling and record-keeping summaries
 * from persisted medications/logs without inferring clinical outcomes.
 */

import { subDays } from 'date-fns'
import type { DoseLog, MedicalRecord, Medication } from '@shared/database.types'
import {
  doseTiming,
  displayDate,
  localDate,
  scheduledDoses,
  type ScheduledDose,
} from '@/lib/utils'

export type DayCounts = {
  date: string
  taken: number
  skipped: number
  unlogged: number
  total: number
}

export const clockTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

export type PartOfDay = 'Morning' | 'Afternoon' | 'Evening'
export const partsOfDay: PartOfDay[] = ['Morning', 'Afternoon', 'Evening']

/**
 * Group an explicit schedule time into the display periods used by the daily
 * timeline.
 */
export function partOfDay(time: string): PartOfDay {
  const hour = Number(time.slice(0, 2))
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

/**
 * Count recorded outcomes and current unlogged doses while retaining logs whose
 * schedule times were later removed.
 */
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

/**
 * Build seven local-calendar daily breakdowns ending on the supplied current
 * date.
 */
export function weekBreakdown(
  meds: Medication[],
  logs: DoseLog[],
  now: Date,
): DayCounts[] {
  return Array.from({ length: 7 }, (_, index) =>
    dayBreakdown(meds, logs, localDate(subDays(now, 6 - index))),
  )
}

/**
 * Calculate taken outcomes among logs in the last 30 calendar days; return null
 * when no outcomes were logged.
 */
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

export const loggingMilestones = [3, 7, 30] as const

/**
 * Count distinct logged days and the current run ending today or yesterday,
 * independent of clinical adherence.
 */
export function loggingProgress(logs: DoseLog[], now: Date) {
  const today = localDate(now)
  const dates = new Set(
    logs
      .filter((log) => log.scheduled_date <= today)
      .map((log) => log.scheduled_date),
  )
  let cursor = dates.has(today) ? now : subDays(now, 1)
  const runEnding = dates.has(localDate(cursor)) ? localDate(cursor) : null
  let currentRun = 0
  while (dates.has(localDate(cursor))) {
    currentRun++
    cursor = subDays(cursor, 1)
  }
  return {
    loggedDays: dates.size,
    currentRun,
    runEnding,
    reached: loggingMilestones.filter((threshold) => threshold <= dates.size),
  }
}

/**
 * Describe a saved outcome and announce a distinct-day milestone only when this
 * addition crosses it.
 */
export function loggingConfirmation(
  logs: DoseLog[],
  added: DoseLog,
  now: Date,
) {
  const before = loggingProgress(logs, now).loggedDays
  const after = loggingProgress([...logs, added], now).loggedDays
  const crossed = loggingMilestones.find((day) => before < day && after >= day)
  return `Dose marked as ${added.status}.${crossed ? ` ${crossed} distinct logged days recorded.` : ''}`
}

/**
 * Find the first unlogged dose that is upcoming or currently due; callers supply
 * schedule-sorted doses.
 */
export function nextDose(doses: ScheduledDose[], now: Date) {
  return doses.find(
    (dose) => !dose.log && ['scheduled', 'due'].includes(doseTiming(dose, now)),
  )
}

/**
 * Build short factual statements about the supplied records and schedule without
 * diagnosing or prescribing.
 */
export function dailyInsights({
  doses,
  medications,
  records,
  logging,
  now,
}: {
  doses: ScheduledDose[]
  medications: Medication[]
  records: MedicalRecord[]
  logging: ReturnType<typeof loggingProgress>
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
  if (logging.currentRun >= 2 && logging.runEnding)
    statements.push(
      `${logging.currentRun} consecutive days with recorded outcomes, ending ${displayDate(logging.runEnding)}.`,
    )
  if (records.length)
    statements.push(
      `${records.length} ${records.length === 1 ? 'record' : 'records'} in your vault. Latest: ${records[0].title}.`,
    )
  return statements.slice(0, 3)
}

export type MarkState = 'taken' | 'skipped' | 'earlier' | 'later' | 'next'

/**
 * Choose visual dose state, preferring a saved outcome over schedule timing and
 * next-dose emphasis.
 */
export function markState(
  dose: ScheduledDose,
  now: Date,
  next?: ScheduledDose,
): MarkState {
  if (dose.log) return dose.log.status
  if (dose === next) return 'next'
  return doseTiming(dose, now) === 'past_time' ? 'earlier' : 'later'
}
