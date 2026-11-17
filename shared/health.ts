import { format } from 'date-fns'

export const localDate = (date = new Date()) => format(date, 'yyyy-MM-dd')
