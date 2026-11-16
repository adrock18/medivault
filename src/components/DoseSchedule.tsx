import { useState } from 'react'
import { Check, Pill, RotateCcw, LoaderCircle, X } from 'lucide-react'
import { useVault } from '../contexts/DataContext'
import { useMutation } from '../hooks/useMutation'
import { api } from '../lib/api'
import { clockTime, markState, nextDose } from '../lib/dashboard'
import { cn, doseTiming, type ScheduledDose } from '../lib/utils'
import { EmptyState } from './common'
import { StatusMark } from './DashboardVisuals'
import { Button } from './ui/button'

export type DoseFilter = 'all' | 'unlogged' | 'logged' | 'taken' | 'skipped'

const labels = {
  scheduled: 'Scheduled',
  due: 'Due now',
  past_time: 'Past scheduled time',
  taken: 'Taken',
  skipped: 'Skipped',
}

function DoseRow({ dose, isNext }: { dose: ScheduledDose; isNext: boolean }) {
  const { now } = useVault()
  const mutation = useMutation()
  const timing = doseTiming(dose, now)
  async function mark(status: 'taken' | 'skipped') {
    await mutation.run(async () => {
      await api.doses.add({
        medication_id: dose.medication.id,
        scheduled_date: dose.date,
        scheduled_time: dose.time,
        status,
      })
    }, `Dose marked as ${status}.`)
  }
  async function undo() {
    const log = dose.log
    if (!log) return
    await mutation.run(async () => {
      await api.doses.remove(log.id)
    }, 'Dose log removed. This dose is scheduled again.')
  }
  return (
    <li
      className={cn(
        'relative grid grid-cols-[2.75rem_1.5rem_minmax(0,1fr)] items-start gap-x-2 rounded-xl py-3 pr-2',
        isNext && 'bg-teal-50',
      )}
    >
      <span
        className={cn(
          'pt-0.5 text-right text-sm tabular-nums text-muted-foreground',
          isNext && 'font-semibold text-primary',
        )}
      >
        {dose.time}
      </span>
      <span className="relative z-10 flex justify-center pt-0.5">
        <span className="rounded-full bg-card">
          <StatusMark state={markState(dose, now, isNext ? dose : undefined)} />
        </span>
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-40">
          <p className="break-words text-sm">
            <span className="font-semibold text-slate-800">
              {dose.medication.name}
            </span>{' '}
            <span className="inline-block text-muted-foreground">
              {dose.medication.dosage}
            </span>
          </p>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs">
            {isNext && (
              <span className="font-semibold text-primary">Up next</span>
            )}
            <span
              className={cn(
                'font-medium text-muted-foreground',
                dose.log?.status === 'taken' && 'text-primary',
                (timing === 'due' || timing === 'past_time') &&
                  'text-amber-700',
              )}
            >
              {labels[timing]}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mutation.pending ? (
            <LoaderCircle className="size-4 animate-spin text-primary" />
          ) : dose.log ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void undo()}
              aria-label={`Undo ${dose.medication.name} dose at ${dose.time}`}
            >
              <RotateCcw />
              Undo
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void mark('taken')}
                aria-label={`Mark ${dose.medication.name} dose at ${dose.time} as taken`}
              >
                <Check />
                Taken
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-500"
                onClick={() => void mark('skipped')}
                aria-label={`Skip ${dose.medication.name} dose at ${dose.time}`}
              >
                Skip
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}

function NowMarker({ now }: { now: Date }) {
  return (
    <li className="grid grid-cols-[2.75rem_1.5rem_minmax(0,1fr)] items-center gap-x-2 py-1">
      <span />
      <span className="relative z-10 flex justify-center">
        <span className="size-2.5 rounded-full bg-primary ring-4 ring-card" />
      </span>
      <span className="flex items-center gap-2 text-xs font-semibold text-primary">
        Now, {clockTime(now)}
        <span aria-hidden="true" className="h-px flex-1 bg-primary/40" />
      </span>
    </li>
  )
}

const matches = (dose: ScheduledDose, filter: DoseFilter) =>
  filter === 'all' ||
  (filter === 'unlogged' && !dose.log) ||
  (filter === 'logged' && !!dose.log) ||
  dose.log?.status === filter

export function DoseTimeline({
  doses,
  filter: controlled,
  onFilterChange,
}: {
  doses: ScheduledDose[]
  filter?: DoseFilter
  onFilterChange?: (filter: DoseFilter) => void
}) {
  const { now } = useVault()
  const [internal, setInternal] = useState<DoseFilter>('all')
  const filter = controlled ?? internal
  const setFilter = onFilterChange ?? setInternal
  if (!doses.length)
    return (
      <EmptyState
        icon={Pill}
        title="No doses scheduled"
        description="Add a medication with your prescribed dose times to see your daily schedule here."
      />
    )
  const pending = doses.filter((dose) => !dose.log).length
  const visible = doses.filter((dose) => matches(dose, filter))
  const next = nextDose(doses, now)
  const nowTime = clockTime(now)
  const markerAt = visible.findIndex((dose) => dose.time > nowTime)
  const items = visible.map((dose) => (
    <DoseRow
      key={`${dose.medication.id}-${dose.date}-${dose.time}`}
      dose={dose}
      isNext={dose === next}
    />
  ))
  items.splice(
    markerAt === -1 ? items.length : markerAt,
    0,
    <NowMarker key="now" now={now} />,
  )
  const tabs = [
    { value: 'all', label: 'All doses', count: doses.length },
    { value: 'unlogged', label: 'To log', count: pending },
    { value: 'logged', label: 'Logged', count: doses.length - pending },
  ] as const
  return (
    <div className="min-w-0">
      <div
        role="group"
        className="mb-2 flex flex-wrap items-center gap-1"
        aria-label="Filter dose schedule"
      >
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant="ghost"
            size="sm"
            aria-pressed={filter === tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(filter === tab.value && 'bg-teal-50 text-primary')}
          >
            {tab.label}
            <span className="ml-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
              {tab.count}
            </span>
          </Button>
        ))}
        {(filter === 'taken' || filter === 'skipped') && (
          <Button
            variant="ghost"
            size="sm"
            className="bg-teal-50 text-primary"
            onClick={() => setFilter('all')}
            aria-label={`Showing ${filter} doses. Clear filter`}
          >
            Showing {filter}
            <X />
          </Button>
        )}
      </div>
      {!visible.length && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {filter === 'unlogged'
            ? 'No doses left to log today.'
            : filter === 'all'
              ? 'No doses scheduled today.'
              : `No ${filter === 'logged' ? 'logged' : filter} doses yet today.`}
        </p>
      )}
      {visible.length > 0 && (
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute top-4 bottom-4 left-[calc(2.75rem+0.5rem+0.75rem-0.5px)] w-px bg-slate-200"
          />
          <ol aria-label="Today's doses in time order" className="relative">
            {items}
          </ol>
        </div>
      )}
    </div>
  )
}

/** Today's schedule, presented as a time-ordered timeline. */
export const DoseSchedule = DoseTimeline
