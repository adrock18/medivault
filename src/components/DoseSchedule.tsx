import { useState } from 'react'
import { Check, Clock3, Pill, RotateCcw, LoaderCircle } from 'lucide-react'
import { useVault } from '../contexts/DataContext'
import { useMutation } from '../hooks/useMutation'
import { api } from '../lib/api'
import { cn, doseTiming, type ScheduledDose } from '../lib/utils'
import { EmptyState } from './common'
import { Button } from './ui/button'

function DoseRow({ dose }: { dose: ScheduledDose }) {
  const { now } = useVault()
  const mutation = useMutation()
  const timing = doseTiming(dose, now)
  const labels = {
    scheduled: 'Scheduled',
    due: 'Due now',
    past_time: 'Past scheduled time',
    taken: 'Taken',
    skipped: 'Skipped',
  }
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
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-4 last:border-0">
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-full',
          dose.log?.status === 'taken'
            ? 'bg-teal-50 text-primary'
            : 'bg-slate-50 text-slate-400',
        )}
      >
        {dose.log?.status === 'taken' ? (
          <Check size={19} />
        ) : (
          <Pill size={18} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold text-slate-800">
          {dose.medication.name}{' '}
          <span className="font-normal text-muted-foreground">
            &middot; {dose.medication.dosage}
          </span>
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 size={12} />
          {dose.time} &middot;{' '}
          <span
            className={cn(
              'font-medium',
              dose.log?.status === 'taken' && 'text-primary',
              (timing === 'due' || timing === 'past_time') && 'text-amber-700',
            )}
          >
            {labels[timing]}
          </span>
        </p>
      </div>
      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
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
  )
}
export function DoseSchedule({ doses }: { doses: ScheduledDose[] }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'logged'>('all')
  const pending = doses.filter((dose) => !dose.log)
  const logged = doses.filter((dose) => dose.log)
  const visible =
    filter === 'pending' ? pending : filter === 'logged' ? logged : doses
  return doses.length ? (
    <div>
      <div
        className="mb-2 flex flex-wrap gap-1"
        aria-label="Filter dose schedule"
      >
        {(
          [
            { value: 'all', label: 'All doses', count: doses.length },
            { value: 'pending', label: 'To log', count: pending.length },
            { value: 'logged', label: 'Logged', count: logged.length },
          ] as const
        ).map((tab) => (
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
      </div>
      {!visible.length && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {filter === 'pending'
            ? 'No doses left to log today.'
            : 'No doses logged yet today.'}
        </p>
      )}
      {visible.map((dose) => (
        <DoseRow
          key={`${dose.medication.id}-${dose.date}-${dose.time}`}
          dose={dose}
        />
      ))}
    </div>
  ) : (
    <EmptyState
      icon={Pill}
      title="No doses scheduled"
      description="Add a medication with your prescribed dose times to see your daily schedule here."
    />
  )
}
