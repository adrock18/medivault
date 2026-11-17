import { lazy, Suspense, useEffect, useState } from 'react'
import { Download, ExternalLink, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import type { MedicalRecord } from '@shared/database.types'
import { api, errorMessage } from '@/lib/api'
import { documentKinds, displayDate, fileSize } from '@/lib/utils'
import { downloadRecord, viewRecord } from '../lib/records'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingState } from '@/components/common'

const PdfPreview = lazy(() => import('./PdfPreview'))
type FileState = { key: string } & (
  | { kind: 'ready'; blob: Blob; url?: string }
  | { kind: 'error'; message: string }
)
export type PreviewSelection = {
  record: MedicalRecord
  trigger: HTMLButtonElement
}

export function RecordPreview({
  selection,
  available,
  onClose,
}: {
  selection: PreviewSelection
  available: boolean
  onClose: () => void
}) {
  const { record, trigger } = selection
  const [file, setFile] = useState<FileState | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [origin] = useState(() => ({ x: window.scrollX, y: window.scrollY }))
  const key = `${record.id}|${attempt}|${available}`
  const current = file?.key === key ? file : null
  useEffect(() => {
    if (!available) return
    let active = true
    let url: string | undefined
    void api.records
      .file(record.id)
      .then((blob) => {
        if (!active) return
        if (record.file_type.startsWith('image/'))
          url = URL.createObjectURL(blob)
        setFile({ key, kind: 'ready', blob, url })
      })
      .catch((err: unknown) => {
        if (active) setFile({ key, kind: 'error', message: errorMessage(err) })
      })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [record.id, record.file_type, key, available])
  async function access(action: 'download' | 'open') {
    setBusy(true)
    try {
      if (action === 'open') await viewRecord(record)
      else {
        await downloadRecord(record)
        toast.success('Document downloaded.')
      }
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="record-preview"
        style={{ translate: 'none' }}
        finalFocus={() => {
          if (trigger.isConnected) {
            trigger.focus({ preventScroll: true })
            window.scrollTo(origin.x, origin.y)
            return false
          }
          const heading =
            document.querySelector<HTMLElement>('#main-content h1')
          if (heading) heading.tabIndex = -1
          return heading
        }}
      >
        <div className="border-b pb-5 pr-12">
          <DialogTitle className="break-words text-xl font-semibold">
            {record.title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-muted-foreground">
            {documentKinds[record.document_kind]},{' '}
            {displayDate(record.record_date)}
          </DialogDescription>
          <p className="mt-2 break-words text-sm text-muted-foreground">
            {record.provider || 'No provider specified'}
          </p>
          <p className="mt-1 break-words text-xs text-muted-foreground">
            {record.file_name}, {fileSize(record.file_size)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={busy || !available}
            onClick={() => void access('download')}
          >
            <Download />
            Download
          </Button>
          <Button
            variant="outline"
            disabled={busy || !available}
            onClick={() => void access('open')}
          >
            <ExternalLink />
            Open in new tab
          </Button>
        </div>
        {!available ? (
          <p role="alert">
            This record is no longer available. Close the preview to return to
            your vault.
          </p>
        ) : current?.kind === 'error' ? (
          <div role="alert" className="rounded-xl border p-4">
            <p className="mb-3">
              Unable to load this document. {current.message}
            </p>
            <Button
              variant="outline"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Retry preview
            </Button>
          </div>
        ) : current?.kind === 'ready' ? (
          record.file_type === 'application/pdf' ? (
            <Suspense
              fallback={<LoadingState message="Opening PDF preview..." />}
            >
              <PdfPreview key={key} blob={current.blob} />
            </Suspense>
          ) : (
            <img
              src={current.url}
              alt={`Document: ${record.title}`}
              className="h-auto max-w-full rounded-lg bg-white"
              onError={() =>
                setFile({
                  key,
                  kind: 'error',
                  message:
                    'The image could not be rendered. Try opening it in a new tab or downloading it.',
                })
              }
            />
          )
        ) : (
          <LoadingState message="Loading private document..." />
        )}
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole size={14} />
          Private document. Access is checked for your signed-in account.
        </p>
      </DialogContent>
    </Dialog>
  )
}
