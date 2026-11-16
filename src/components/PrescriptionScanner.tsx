import { useEffect, useRef, useState } from 'react'
import { ScanLine, Upload, Eye, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useVault } from '../contexts/DataContext'
import { api, errorMessage } from '../lib/api'
import { viewRecord } from '../lib/records'
import {
  prescriptionSuggestions,
  type PrescriptionSuggestion,
} from '../lib/prescription'
import { medicationForms } from '../lib/database.types'
import type { MedicationValues } from '../lib/schemas'
import { FormDialog, SelectField, TextField, ErrorState } from './common'
import { Button } from './ui/button'
import { UploadDialog } from './UploadDialog'
import { MedicationForm } from './MedicationForm'

export function PrescriptionScanner({
  recordId = '',
  onClose,
}: {
  recordId?: string
  onClose: () => void
}) {
  const { records } = useVault()
  const [selected, setSelected] = useState(recordId)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<Partial<MedicationValues> | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const controller = useRef<AbortController | null>(null)
  const record = records.find((item) => item.id === selected)
  const suggestions = prescriptionSuggestions(text)
  useEffect(() => () => controller.current?.abort(), [])
  function close() {
    controller.current?.abort()
    onClose()
  }
  async function scan() {
    if (busy) return
    if (!record) {
      setError('Choose a saved document or upload a prescription first.')
      return
    }
    const abort = new AbortController()
    controller.current = abort
    setBusy(true)
    setError(null)
    setProgress('Opening your private document...')
    try {
      const blob = await api.records.file(record.id)
      abort.signal.throwIfAborted()
      const { scanPrescription } = await import('../lib/ocr')
      const result = await scanPrescription(blob, setProgress, abort.signal)
      if (!abort.signal.aborted) {
        setText(result)
        setAdded(new Set())
      }
    } catch (err) {
      if (!abort.signal.aborted) setError(errorMessage(err))
    } finally {
      if (!abort.signal.aborted) setBusy(false)
    }
  }
  function review(suggestion?: PrescriptionSuggestion) {
    if (!record) {
      setError('Select a medical record before adding a medication.')
      return
    }
    const excerpt = suggestion?.prescription_text ?? text
    if (excerpt.length > 4000) {
      setError(
        'Keep only the relevant medication wording in the scanned text (up to 4,000 characters), then try again.',
      )
      return
    }
    setError(null)
    setDraft({
      name: '',
      dosage: '',
      form: 'unspecified',
      strength: '',
      ...suggestion,
      source_record_id: record.id,
      prescription_text: excerpt,
      start_date: '',
      frequency: 'custom',
      times: '',
    })
  }
  return (
    <>
      <FormDialog
        open={!uploading && !draft}
        onClose={close}
        title="Scan a prescription"
        description="Read text locally, review it against the original, then add medications. No document is sent to an external AI service."
      >
        <p className="text-sm leading-6 text-muted-foreground">
          Works best with clear, printed English. Handwriting and OCR can be
          wrong. Missing doses, dates, and times must be entered from your
          prescription, not guessed.
        </p>
        <div className="space-y-4">
          <SelectField
            label="Prescription or medical record"
            value={selected}
            disabled={busy}
            onValueChange={(value) => {
              setSelected(value)
              setText('')
              setError(null)
              setAdded(new Set())
            }}
            options={[
              { value: '', label: 'Choose a saved document' },
              ...records.map((item) => ({ value: item.id, label: item.title })),
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setUploading(true)}
            >
              <Upload />
              Upload prescription
            </Button>
            <Button disabled={!record || busy} onClick={() => void scan()}>
              <ScanLine />
              {busy ? 'Scanning...' : text ? 'Scan again' : 'Scan document'}
            </Button>
            {record && (
              <Button
                variant="ghost"
                onClick={() => {
                  void viewRecord(record).catch((err: unknown) =>
                    toast.error(errorMessage(err)),
                  )
                }}
              >
                <Eye />
                View original
              </Button>
            )}
          </div>
          {busy && (
            <p role="status" className="rounded-xl bg-accent p-4 text-sm">
              {progress} You may close this dialog to cancel.
            </p>
          )}
          {text && (
            <>
              <TextField
                label="Scanned prescription text"
                value={text}
                onChange={(event) => {
                  setText(event.target.value)
                  setAdded(new Set())
                }}
                rows={8}
                hint="Correct OCR mistakes against the original. Suggestions recognize lines beginning with forms such as Tablet, Cream, or Injection; other formats can be entered manually."
              />
              <div className="space-y-3">
                <h3 className="font-semibold">Review medications</h3>
                {suggestions.map((suggestion, index) => {
                  const done = added.has(suggestion.prescription_text ?? '')
                  return (
                    <div key={index} className="rounded-xl border p-4">
                      <p className="break-words font-medium">
                        {suggestion.name || 'Name needs review'}{' '}
                        <span className="text-xs text-muted-foreground">
                          ({medicationForms[suggestion.form ?? 'unspecified']})
                        </span>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                        {suggestion.prescription_text}
                      </p>
                      <Button
                        className="mt-3"
                        variant="outline"
                        disabled={done || busy}
                        onClick={() => review(suggestion)}
                      >
                        {done
                          ? 'Added in this scan'
                          : `Review ${suggestion.name || 'medication'}`}
                      </Button>
                    </div>
                  )
                })}
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => review()}
                >
                  <Plus />
                  Enter medication from this text
                </Button>
              </div>
            </>
          )}
          {error && <ErrorState message={error} />}
          <div className="flex justify-end border-t pt-4">
            <Button variant="outline" onClick={close}>
              {busy ? 'Cancel scan' : 'Done'}
            </Button>
          </div>
        </div>
      </FormDialog>
      {uploading && (
        <UploadDialog
          defaultCategory="prescription"
          onClose={() => setUploading(false)}
          onUploaded={(item) => {
            setSelected(item.id)
            setText('')
            setAdded(new Set())
          }}
        />
      )}
      {draft && (
        <MedicationForm
          initialValues={draft}
          reviewRequired
          onSaved={() =>
            setAdded(
              (current) => new Set([...current, draft.prescription_text ?? '']),
            )
          }
          onClose={() => setDraft(null)}
        />
      )}
    </>
  )
}
