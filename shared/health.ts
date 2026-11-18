/**
 * Calendar-date utility shared across runtime boundaries. Local health dates must
 * not shift when UTC conversion crosses midnight.
 */

import { format } from 'date-fns'

/**
 * Format a Date using its local calendar fields rather than converting it to a
 * UTC date.
 */
export const localDate = (date = new Date()) => format(date, 'yyyy-MM-dd')
