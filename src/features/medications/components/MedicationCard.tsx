import {
  Pill,
  Clock3,
  Pencil,
  Trash2,
  FileText,
  ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { medicationForms } from '@shared/database.types'
import type { MedicalRecord, Medication } from '@shared/database.types'
import {
  medicationStatus,
  displayDate,
  documentKinds,
  frequencies,
  cn,
} from '@/lib/utils'
import { Panel } from '@/components/common'
import { Button } from '@/components/ui/button'

export function MedicationCard({
  medication,
  sourceRecord,
  onEdit,
  onDelete,
  day,
}: {
  medication: Medication
  sourceRecord?: MedicalRecord
  onEdit: () => void
  onDelete: () => void
  day?: string
}) {
  const status = medicationStatus(medication, day)
  return (
    <Panel className="medication-card tint-lavender relative overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="medication-emblem shrink-0 rounded-[20px] bg-slate-50 p-4 text-primary">
            <Pill size={23} />
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-xl font-medium tracking-tight text-slate-900">
              {medication.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {medication.dosage}
            </p>
            <p className="mt-2 text-xs text-primary">
              {medicationForms[medication.form]}
              {medication.strength ? `, ${medication.strength}` : ''}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize',
            status === 'active'
              ? 'bg-[var(--success-soft)] text-[var(--success)]'
              : 'bg-slate-100 text-slate-500',
          )}
        >
          {status}
        </span>
      </div>
      <div className="mt-5 space-y-2 text-sm text-slate-600">
        <p className="flex items-start gap-2">
          <Clock3 size={15} className="mt-1 shrink-0 text-primary" />
          {frequencies[medication.frequency]} at {medication.times.join(', ')}
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
        {medication.prescription_text && (
          <details className="rounded-lg bg-slate-50 p-3 text-xs">
            <summary className="cursor-pointer py-2 font-medium">
              Prescription wording
            </summary>
            <p className="mt-2 whitespace-pre-wrap break-words leading-6">
              {medication.prescription_text}
            </p>
            <p className="mt-2 text-muted-foreground">
              User-reviewed transcription; compare with the original if
              uncertain.
            </p>
          </details>
        )}
        {medication.source_record_id && (
          <Link
            className="group flex min-w-0 items-center gap-3 rounded-xl border border-primary/15 bg-background/70 p-3 transition-colors hover:border-primary/35 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            to={`/medical-records?record=${medication.source_record_id}`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileText size={17} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Prescription source
              </span>
              <span className="mt-0.5 block truncate text-sm font-medium text-foreground">
                {sourceRecord?.title ?? 'Open linked medical record'}
              </span>
              {sourceRecord && (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {documentKinds[sourceRecord.document_kind]} ·{' '}
                  {displayDate(sourceRecord.record_date)}
                  {sourceRecord.provider ? ` · ${sourceRecord.provider}` : ''}
                </span>
              )}
            </span>
            <ArrowUpRight
              size={16}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            />
          </Link>
        )}
        {!medication.source_record_id && medication.prescription_text && (
          <p className="text-xs text-muted-foreground">
            No source record is currently linked. The saved wording is retained.
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
