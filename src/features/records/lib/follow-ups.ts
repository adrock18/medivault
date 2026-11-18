import { addDays, format, parseISO } from 'date-fns'
import { calendarDateSchema } from '@shared/schemas'

export function calculateFollowUpDate(
  visitDate: string,
  interval: string,
): { date: string; error?: never } | { date?: never; error: string } {
  if (!calendarDateSchema.safeParse(visitDate).success)
    return { error: 'The originating visit needs a valid calendar date.' }
  const days = Number(interval)
  if (!/^\d+$/.test(interval) || !Number.isSafeInteger(days) || days < 1)
    return { error: 'Enter a positive whole number of days.' }
  const result = addDays(parseISO(visitDate), days)
  if (Number.isNaN(result.getTime()) || result.getFullYear() > 9999)
    return { error: 'This interval exceeds the supported calendar range.' }
  return { date: format(result, 'yyyy-MM-dd') }
}
