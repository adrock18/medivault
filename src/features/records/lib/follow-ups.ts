/**
 * Follow-up date arithmetic. Computes explicit day intervals from a visit date
 * without treating the result as an appointment or recommendation.
 */

import { addDays, format, parseISO } from 'date-fns'
import { calendarDateSchema } from '@shared/schemas'

/**
 * Validate the interval and compute its calendar date, returning a user-facing
 * error for invalid input.
 */
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
