import { Pill, Clock3, Pencil, Trash2 } from 'lucide-react'
import type { Medication } from '../lib/database.types'
import { medicationStatus, displayDate, frequencies, cn } from '../lib/utils'
import { Panel } from './common'
import { Button } from './ui/button'

export function MedicationCard({
  medication,
  onEdit,
  onDelete,
  day,
}: {
  medication: Medication
  onEdit: () => void
  onDelete: () => void
  day?: string
}) {
  const status = medicationStatus(medication, day)
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="shrink-0 rounded-xl bg-teal-50 p-3 text-primary">
            <Pill size={23} />
          </span>
          <div className="min-w-0">
            <h3 className="break-words font-semibold text-slate-900">
              {medication.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {medication.dosage}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize',
            status === 'active'
              ? 'bg-teal-50 text-teal-700'
              : 'bg-slate-100 text-slate-500',
          )}
        >
          {status}
        </span>
      </div>
      <div className="mt-5 space-y-2 text-sm text-slate-600">
        <p className="flex items-start gap-2">
          <Clock3 size={15} className="mt-1 shrink-0 text-primary" />
          {frequencies[medication.frequency]} &middot;{' '}
          {medication.times.join(', ')}
        </p>
        <p className="text-xs text-slate-400">
          {displayDate(medication.start_date)} &ndash;{' '}
          {medication.end_date
            ? displayDate(medication.end_date)
            : 'No end date'}
        </p>
        {medication.instructions && (
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-6">
            {medication.instructions}
          </p>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t pt-4">
        <Button
          variant="outline"
          aria-label={`Edit ${medication.name}`}
          onClick={onEdit}
        >
          <Pencil />
          Edit
        </Button>
        <Button
          variant="ghost"
          className="text-destructive"
          aria-label={`Delete ${medication.name}`}
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </Panel>
  )
}
