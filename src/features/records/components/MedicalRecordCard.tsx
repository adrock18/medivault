import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Download,
  Eye,
  Pencil,
  Trash2,
  LockKeyhole,
  LoaderCircle,
  ScanLine,
  Star,
  Pill,
  ArrowUpRight,
} from 'lucide-react'
import { toast } from 'sonner'
import type { MedicalRecord } from '@shared/database.types'
import { documentKinds, displayDate, fileSize } from '@/lib/utils'
import { api, errorMessage } from '@/lib/api'
import { useMutation } from '@/hooks/useMutation'
import { viewRecord, downloadRecord } from '../lib/records'
import { Panel } from '@/components/common'
import { Button } from '@/components/ui/button'

export function MedicalRecordCard({
  record,
  onEdit,
  onDelete,
  compact = false,
  onScan,
  linkedCount = 0,
  onPreview,
  onUnfavourite,
}: {
  record: MedicalRecord
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
  onScan?: () => void
  linkedCount?: number
  onPreview?: (record: MedicalRecord, trigger: HTMLButtonElement) => void
  onUnfavourite?: () => void
}) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null)
  const favourite = useMutation()
  async function toggleFavourite() {
    const wasFavourite = record.is_favourite
    const saved = await favourite.run(
      async () => {
        await api.records.favourite(record.id, !wasFavourite)
      },
      wasFavourite
        ? 'Document removed from favourites.'
        : 'Document added to favourites.',
    )
    if (saved && wasFavourite) onUnfavourite?.()
  }
  async function access(action: 'view' | 'download') {
    setBusy(action)
    try {
      if (action === 'view') await viewRecord(record)
      else {
        await downloadRecord(record)
        toast.success('Document downloaded.')
      }
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }
  if (compact)
    return (
      <div className="record-row tint-sky flex items-center gap-3 border-b border-slate-100 py-4 last:border-0">
        <div className="record-emblem rounded-xl bg-teal-50 p-3 text-primary">
          <FileText size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-slate-800">
            {record.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {documentKinds[record.document_kind]},{' '}
            {displayDate(record.record_date)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`View ${record.title}`}
          disabled={!!busy}
          onClick={(event) =>
            onPreview
              ? onPreview(record, event.currentTarget)
              : void access('view')
          }
        >
          {busy ? <LoaderCircle className="animate-spin" /> : <Eye />}
        </Button>
      </div>
    )
  return (
    <Panel className="record-card tint-sky">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="record-emblem rounded-xl bg-teal-50 p-3 text-primary">
          <FileText size={24} />
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {documentKinds[record.document_kind]}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Favourite ${record.title}`}
            aria-pressed={record.is_favourite}
            aria-busy={favourite.pending}
            disabled={favourite.pending}
            title={
              record.is_favourite
                ? 'Remove from favourites'
                : 'Add to favourites'
            }
            onClick={() => void toggleFavourite()}
          >
            {favourite.pending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Star
                className={
                  record.is_favourite
                    ? 'fill-primary/20 text-primary'
                    : 'text-muted-foreground'
                }
              />
            )}
          </Button>
        </div>
      </div>
      <h2 className="break-words font-semibold text-slate-900">
        {record.title}
      </h2>
      <p className="mt-2 break-words text-sm text-muted-foreground">
        {record.provider || 'No provider specified'}
      </p>
      {favourite.error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {favourite.error}
        </p>
      )}
      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        <div>
          <dt className="sr-only">Record date</dt>
          <dd className="text-slate-600">{displayDate(record.record_date)}</dd>
        </div>
        <div>
          <dt className="sr-only">File</dt>
          <dd className="text-muted-foreground">
            {record.file_type === 'application/pdf' ? 'PDF' : 'Image'},{' '}
            {fileSize(record.file_size)}
          </dd>
        </div>
      </dl>
      <div className="mt-5 flex items-center justify-between gap-2 border-t pt-4">
        <Button
          variant="outline"
          aria-label={`View ${record.title}`}
          disabled={!!busy}
          onClick={(event) =>
            onPreview
              ? onPreview(record, event.currentTarget)
              : void access('view')
          }
        >
          {busy === 'view' ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Eye />
          )}
          View
        </Button>
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Download ${record.title}`}
            disabled={!!busy}
            onClick={() => void access('download')}
          >
            {busy === 'download' ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Download />
            )}
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${record.title}`}
              onClick={onEdit}
            >
              <Pencil />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              aria-label={`Delete ${record.title}`}
              onClick={onDelete}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
        <LockKeyhole size={11} />
        Private document, open only to your signed-in account
      </p>
      {(onScan || linkedCount > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onScan && (
            <Button variant="outline" onClick={onScan}>
              <ScanLine />
              Scan for medications
            </Button>
          )}
          {linkedCount > 0 && (
            <Link
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              to={`/medications?record=${record.id}`}
            >
              <Pill size={14} aria-hidden="true" />
              <span>
                {linkedCount} linked medication{linkedCount === 1 ? '' : 's'}
              </span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </Panel>
  )
}
