import { useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  X,
} from 'lucide-react'
import { useVault } from '../contexts/DataContext'
import {
  calendarAgenda,
  calendarDays,
  shiftCalendarMonth,
} from '../lib/calendar'
import { doseTiming, localDate } from '../lib/utils'
import { Panel, SectionTitle, SelectField } from './common'
import { Button } from './ui/button'

export function MedicationCalendar({
  recordId,
  onToday,
}: {
  recordId: string | null
  onToday: () => void
}) {
  const { medications, logs, now } = useVault()
  const today = localDate(now)
  const [selected, setSelected] = useState(today)
  const [medicationId, setMedicationId] = useState('')
  const [view, setView] = useState<'week' | 'month'>('week')
  const scoped = medications.filter(
    (medication) => !recordId || medication.source_record_id === recordId,
  )
  const filtered = scoped.filter(
    (medication) => !medicationId || medication.id === medicationId,
  )
  const entries = calendarAgenda(filtered, logs, selected)
  const weekStart = startOfWeek(new Date(`${selected}T12:00:00`), {
    weekStartsOn: 1,
  })
  const week = Array.from({ length: 7 }, (_, index) =>
    localDate(addDays(weekStart, index)),
  )
  const days = calendarDays(selected)
  function dateButton(day: string, compact = false) {
    const agenda = calendarAgenda(filtered, logs, day)
    const taken = agenda.filter((dose) => dose.log?.status === 'taken').length
    const skipped = agenda.filter(
      (dose) => dose.log?.status === 'skipped',
    ).length
    const projected = agenda.length - taken - skipped
    return (
      <button
        key={day}
        type="button"
        className="calendar-date"
        data-outside={day.slice(0, 7) !== selected.slice(0, 7) || undefined}
        aria-pressed={selected === day}
        aria-current={day === today ? 'date' : undefined}
        aria-label={`${format(new Date(`${day}T12:00:00`), 'EEEE, MMMM d, yyyy')}: ${taken} taken, ${skipped} skipped, ${projected} projections`}
        onFocus={(event) =>
          event.currentTarget.scrollIntoView?.({
            block: 'nearest',
            inline: 'nearest',
          })
        }
        onClick={() => setSelected(day)}
      >
        {compact && (
          <span className="text-xs text-muted-foreground">
            {format(new Date(`${day}T12:00:00`), 'EEE')}
          </span>
        )}
        <span className="font-medium tabular-nums">
          {Number(day.slice(-2))}
        </span>
        <span className="flex min-h-3 items-center gap-1" aria-hidden="true">
          {taken > 0 && <Check className="size-3 text-success" />}
          {skipped > 0 && <X className="size-3 text-muted-foreground" />}
          {projected > 0 && <Clock3 className="size-3 text-primary" />}
        </span>
      </button>
    )
  }
  return (
    <Panel className="mb-7">
      <section aria-label="Medication calendar">
        <SectionTitle
          title="Medication calendar"
          description="A longer view of your routine."
          action={<CalendarDays className="text-primary" />}
        />
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous month"
              onClick={() => setSelected(shiftCalendarMonth(selected, -1))}
            >
              <ChevronLeft />
            </Button>
            <p className="min-w-36 text-center font-medium" aria-live="polite">
              {format(new Date(`${selected}T12:00:00`), 'MMMM yyyy')}
            </p>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next month"
              onClick={() => setSelected(shiftCalendarMonth(selected, 1))}
            >
              <ChevronRight />
            </Button>
            <Button variant="outline" onClick={() => setSelected(today)}>
              Today
            </Button>
          </div>
          <div className="w-full sm:w-64">
            <SelectField
              label="Calendar medication"
              value={medicationId}
              onValueChange={setMedicationId}
              options={[
                {
                  value: '',
                  label: recordId
                    ? 'All linked medications'
                    : 'All medications',
                },
                ...scoped.map((medication) => ({
                  value: medication.id,
                  label: medication.name,
                })),
              ]}
            />
          </div>
        </div>
        <div
          className="mb-4 flex gap-1 md:hidden"
          role="group"
          aria-label="Calendar view"
        >
          <Button
            variant="ghost"
            aria-pressed={view === 'week'}
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button
            variant="ghost"
            aria-pressed={view === 'month'}
            onClick={() => setView('month')}
          >
            Month
          </Button>
        </div>
        <div className="calendar-layout">
          <div className="min-w-0">
            {view === 'week' && (
              <div className="md:hidden">
                <div className="mb-2 flex justify-between">
                  <Button
                    variant="ghost"
                    aria-label="Previous week"
                    onClick={() =>
                      setSelected(
                        localDate(
                          addDays(new Date(`${selected}T12:00:00`), -7),
                        ),
                      )
                    }
                  >
                    <ChevronLeft />
                    Week
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label="Next week"
                    onClick={() =>
                      setSelected(
                        localDate(addDays(new Date(`${selected}T12:00:00`), 7)),
                      )
                    }
                  >
                    Week
                    <ChevronRight />
                  </Button>
                </div>
                <div
                  className="calendar-rail"
                  role="region"
                  aria-label="Week dates"
                >
                  {week.map((day) => dateButton(day, true))}
                </div>
              </div>
            )}
            <div
              className="calendar-month"
              data-mobile-view={view}
              role="region"
              aria-label="Month dates"
              tabIndex={0}
            >
              <div className="calendar-grid">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                  (day) => (
                    <span
                      key={day}
                      className="py-2 text-center text-xs text-muted-foreground"
                    >
                      {day}
                    </span>
                  ),
                )}
                {days.map((day) => dateButton(day))}
              </div>
            </div>
            <p className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Check size={14} />
                Taken
              </span>
              <span className="inline-flex items-center gap-1">
                <X size={14} />
                Skipped
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={14} />
                Current-schedule projection
              </span>
            </p>
          </div>
          <div className="min-w-0 border-t pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-5">
            <h3 className="font-medium" aria-live="polite">
              {format(new Date(`${selected}T12:00:00`), 'EEEE, MMMM d')}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {entries.filter((dose) => dose.log).length} recorded outcomes,{' '}
              {entries.filter((dose) => !dose.log).length} projections
            </p>
            {entries.length ? (
              <ol className="mt-4 divide-y">
                {entries.map((dose) => {
                  const label =
                    dose.log?.status === 'taken'
                      ? 'Taken'
                      : dose.log
                        ? 'Skipped'
                        : ['scheduled', 'due'].includes(doseTiming(dose, now))
                          ? 'Upcoming'
                          : 'Not logged'
                  const Icon =
                    dose.log?.status === 'taken' ? Check : dose.log ? X : Clock3
                  return (
                    <li
                      key={`${dose.medication.id}|${dose.time}`}
                      className="py-3"
                    >
                      <div className="flex items-start gap-3">
                        <time className="text-sm font-medium tabular-nums">
                          {dose.time}
                        </time>
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium">
                            {dose.medication.name}
                          </p>
                          <p className="mt-1 break-words text-xs text-muted-foreground">
                            {dose.medication.dosage}
                          </p>
                          <p className="mt-2 flex items-center gap-1 text-xs">
                            <Icon size={14} />
                            {label}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {dose.log
                              ? 'Recorded outcome'
                              : 'Current-schedule projection'}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <div className="py-6 text-sm text-muted-foreground">
                <p>
                  {!medications.length
                    ? 'Add an existing prescription to explore its schedule.'
                    : medicationId
                      ? 'No entries match this medication on this date.'
                      : 'No entries on this date.'}
                </p>
                {medicationId && (
                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() => setMedicationId('')}
                  >
                    Clear calendar filter
                  </Button>
                )}
              </div>
            )}
            {selected === today && (
              <Button className="mt-4" variant="outline" onClick={onToday}>
                Go to today's schedule
              </Button>
            )}
          </div>
        </div>
        <p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">
          Schedule projections use your current prescription. Past schedule
          changes may not be reflected. Names and dosages show current
          medication details, not historical snapshots. Calendar inspection is
          read-only; it does not mark unlogged doses missed or recommend late or
          extra doses.
        </p>
      </section>
    </Panel>
  )
}
