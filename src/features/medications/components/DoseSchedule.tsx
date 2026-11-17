import { useState } from 'react'
import {
  Check,
  Pill,
  RotateCcw,
  LoaderCircle,
  X,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react'
import { useVault } from '@/contexts/DataContext'
import { useMutation } from '@/hooks/useMutation'
import { api } from '@/lib/api'
import {
  clockTime,
  loggingConfirmation,
  markState,
  nextDose,
  partOfDay,
  partsOfDay,
} from '@/features/dashboard/lib/dashboard'
import { cn, doseTiming, type ScheduledDose } from '@/lib/utils'
import { EmptyState } from '@/components/common'
import { StatusMark } from '@/features/dashboard/components/DashboardVisuals'
import { Button } from '@/components/ui/button'

export type DoseFilter = 'all' | 'unlogged' | 'logged' | 'taken' | 'skipped'

const labels = {
  scheduled: 'Scheduled',
  due: 'Due now',
  past_time: 'Not logged',
  taken: 'Taken',
  skipped: 'Skipped',
}

function DoseRow({ dose, isNext }: { dose: ScheduledDose; isNext: boolean }) {
  const { now, logs } = useVault()
  const mutation = useMutation()
  const timing = doseTiming(dose, now)
  const period = partOfDay(dose.time)
  const PeriodIcon =
    period === 'Morning' ? Sun : period === 'Afternoon' ? Sunset : Moon
  const [changes, setChanges] = useState(0)
  async function mark(status: 'taken' | 'skipped') {
    let confirmation = `Dose marked as ${status}.`
    const ok = await mutation.run(
      async () => {
        const added = await api.doses.add({
          medication_id: dose.medication.id,
          scheduled_date: dose.date,
          scheduled_time: dose.time,
          status,
        })
        confirmation = loggingConfirmation(logs, added, now)
      },
      () => confirmation,
    )
    if (ok) setChanges((count) => count + 1)
  }
  async function undo() {
    const log = dose.log
    if (!log) return
    const ok = await mutation.run(async () => {
      await api.doses.remove(log.id)
    }, 'Dose log removed. This dose is scheduled again.')
    if (ok) setChanges((count) => count + 1)
  }
  return (
    <li className="dose-card" data-next={isNext} data-status={timing}>
      <div className="dose-time">
        <p className="text-lg font-medium tracking-tight tabular-nums sm:text-xl">
          {dose.time}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isNext ? 'Up next' : dose.log ? 'Logged' : 'Local time'}
        </p>
        <PeriodIcon
          className="mt-3 size-5 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0">
        <p className="break-words text-base leading-snug font-medium tracking-tight sm:text-lg">
          {dose.medication.name}
        </p>
        <p className="mt-1 break-words text-sm text-muted-foreground">
          {dose.medication.dosage}
        </p>
      </div>
      <div className="dose-actions">
        <span
          key={changes}
          data-state-change={changes > 0 || undefined}
          data-status={timing}
          className={cn(
            'dose-status mr-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground',
            changes > 0 && 'mark-pop',
          )}
        >
          <StatusMark
            state={markState(dose, now, isNext ? dose : undefined)}
            size={16}
          />
          {labels[timing]}
        </span>
        {mutation.pending ? (
          <span
            role="status"
            aria-label="Saving dose"
            className="grid size-11 place-items-center"
          >
            <LoaderCircle className="size-5 animate-spin text-primary" />
          </span>
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
              className="take-dose"
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
    </li>
  )
}

function NowMarker({ now }: { now: Date }) {
  return (
    <li className="now-marker">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
      Now, {clockTime(now)}
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
  const groups = partsOfDay
    .map((period) => ({
      period,
      doses: visible.filter((dose) => partOfDay(dose.time) === period),
    }))
    .filter((group) => group.doses.length)
  const nowPeriod = partOfDay(nowTime)
  const markerGroup =
    groups.find((group) => group.period === nowPeriod) ??
    groups.find(
      (group) =>
        partsOfDay.indexOf(group.period) > partsOfDay.indexOf(nowPeriod),
    ) ??
    groups.at(-1)
  const tabs = [
    { value: 'all', label: 'All doses', count: doses.length },
    { value: 'unlogged', label: 'To log', count: pending },
    { value: 'logged', label: 'Logged', count: doses.length - pending },
  ] as const
  return (
    <div className="min-w-0">
      <div role="group" className="dose-tabs" aria-label="Filter dose schedule">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant="ghost"
            size="sm"
            aria-pressed={filter === tab.value}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
            <span className="ml-1 text-[10px] tabular-nums">{tab.count}</span>
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
        <div
          role="region"
          aria-label="Today's doses in time order"
          className="space-y-7"
        >
          {groups.map((group) => {
            const items = group.doses.map((dose) => (
              <DoseRow
                key={`${dose.medication.id}-${dose.date}-${dose.time}`}
                dose={dose}
                isNext={dose === next}
              />
            ))
            if (group === markerGroup) {
              const at = group.doses.findIndex((dose) => dose.time > nowTime)
              items.splice(
                at === -1 ? items.length : at,
                0,
                <NowMarker key="now" now={now} />,
              )
            }
            const id = `dose-period-${group.period.toLowerCase()}`
            return (
              <section
                key={group.period}
                aria-labelledby={id}
                className="dose-period"
              >
                <h3
                  id={id}
                  className="mb-3 pl-1 text-xs font-medium text-muted-foreground"
                >
                  {group.period}
                </h3>
                <ol>{items}</ol>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Today's schedule, presented as a time-ordered timeline. */
export const DoseSchedule = DoseTimeline
