import { CheckCheck, Clock3 } from 'lucide-react'
import { cn, doseTiming, type ScheduledDose } from '../lib/utils'

export function MedicationReminder({
  doses,
  now,
}: {
  doses: ScheduledDose[]
  now: Date
}) {
  const pending = doses.filter((dose) => !dose.log)
  const due = pending.filter((dose) =>
    ['due', 'past_time'].includes(doseTiming(dose, now)),
  )
  const next = pending.find((dose) => doseTiming(dose, now) === 'scheduled')
  if (!doses.length) return null
  const complete = !pending.length
  const Icon = complete ? CheckCheck : Clock3
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'mb-6 flex items-start gap-4 rounded-2xl border p-5',
        due.length
          ? 'border-amber-100 bg-amber-50/60'
          : 'border-teal-100 bg-teal-50/60',
      )}
    >
      <span
        className={cn(
          'rounded-xl bg-card p-2.5',
          due.length ? 'text-amber-700' : 'text-primary',
        )}
      >
        <Icon size={21} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          In-app schedule check-in
        </p>
        <h2 className="mt-1 text-sm font-semibold text-slate-800">
          {due.length
            ? `${due.length} dose${due.length === 1 ? '' : 's'} awaiting a log`
            : complete
              ? "Today's doses are all logged"
              : `Next scheduled dose at ${next?.time}`}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {due.length
            ? 'These scheduled times have arrived. Record what happened using Taken or Skip below.'
            : complete
              ? `${doses.filter((dose) => dose.log?.status === 'taken').length} taken · ${doses.filter((dose) => dose.log?.status === 'skipped').length} skipped`
              : `${next?.medication.name} · ${next?.medication.dosage}`}
        </p>
        {!!due.length && (
          <p className="mt-2 text-xs leading-5 text-amber-800">
            Timing labels are not instructions to take a late or extra dose.
            Follow your clinician's directions.
          </p>
        )}
      </div>
    </div>
  )
}
