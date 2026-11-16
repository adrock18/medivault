import { addDays, addMonths, startOfMonth, startOfWeek } from 'date-fns'
import type { DoseLog, Medication } from './database.types'
import { localDate, scheduledDoses, type ScheduledDose } from './utils'

export function shiftCalendarMonth(day: string, offset: number) {
  return localDate(addMonths(new Date(`${day}T12:00:00`), offset))
}

export function calendarDays(day: string) {
  const first = startOfWeek(startOfMonth(new Date(`${day}T12:00:00`)), {
    weekStartsOn: 1,
  })
  return Array.from({ length: 42 }, (_, index) =>
    localDate(addDays(first, index)),
  )
}

export function calendarAgenda(
  medications: Medication[],
  logs: DoseLog[],
  day: string,
): ScheduledDose[] {
  const entries = new Map(
    scheduledDoses(medications, logs, day).map((dose) => [
      `${dose.medication.id}|${dose.time}`,
      dose,
    ]),
  )
  const owned = new Map(
    medications.map((medication) => [medication.id, medication]),
  )
  for (const log of logs) {
    const medication = owned.get(log.medication_id)
    if (medication && log.scheduled_date === day) {
      entries.set(`${medication.id}|${log.scheduled_time}`, {
        medication,
        date: day,
        time: log.scheduled_time,
        log,
      })
    }
  }
  return [...entries.values()].sort(
    (a, b) =>
      a.time.localeCompare(b.time) ||
      a.medication.name.localeCompare(b.medication.name) ||
      a.medication.id.localeCompare(b.medication.id),
  )
}
