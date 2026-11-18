/**
 * Prescription-to-editable-draft workflow. Defaults to local OCR; external
 * processing requires consent, and every suggestion needs user review.
 */

import { useEffect, useRef, useState } from 'react'
import { ScanLine, Upload, Eye, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useVault } from '@/contexts/DataContext'
import { api, errorMessage } from '@/lib/api'
import { viewRecord } from '@/features/records/lib/records'
import {
  prescriptionSuggestions,
  type PrescriptionSuggestion,
} from '../lib/prescription'
import { medicationForms } from '@shared/database.types'
import type { MedicationValues } from '@shared/schemas'
import {
  FormDialog,
  SelectField,
  TextField,
  ErrorState,
} from '@/components/common'
import { Button } from '@/components/ui/button'
import { UploadDialog } from '@/features/records/components/UploadDialog'
import { MedicationForm } from './MedicationForm'

/**
 * Coordinate document selection, cancellable scanning and reviewed medication
 * drafts without auto-saving OCR output.
 */
export function PrescriptionScanner({
  recordId = '',
  onClose,
}: {
  recordId?: string
  onClose: () => void
}) {
  const { records, selectedFamilyMemberId, features } = useVault()
  const prescriptions = records.filter(
    (item) => item.document_kind === 'prescription',
  )
  const [selected, setSelected] = useState(recordId)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [remoteConsent, setRemoteConsent] = useState(false)
  const [draft, setDraft] = useState<Partial<MedicationValues> | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const controller = useRef<AbortController | null>(null)
  const record = prescriptions.find((item) => item.id === selected)
  const nonPrescription = records.some(
    (item) => item.id === selected && item.document_kind !== 'prescription',
  )
  const suggestions = prescriptionSuggestions(text)
  useEffect(() => () => controller.current?.abort(), [])
  /** Cancel active scanning before dismissing the workflow. */
  function close() {
    controller.current?.abort()
    onClose()
  }
  /**
   * Read the selected private document locally or through the explicitly
   * consented remote path; ignore cancelled results.
   */
  async function scan() {
    if (busy) return
    if (!record) {
      setError('Choose a saved prescription or upload one first.')
      return
    }
    const abort = new AbortController()
    controller.current = abort
    setBusy(true)
    setError(null)
    setProgress('Opening your private document...')
    try {
      setRemoteConsent(false)
      let result: { text: string }
      if (remoteConsent) {
        setProgress('Sending this document to OCR.Space...')
        result = await api.ocr.remote(record.id, abort.signal)
      } else {
        const blob = await api.records.file(record.id)
        abort.signal.throwIfAborted()
        const { scanPrescription } = await import('@/features/records/lib/ocr')
        result = {
          text: await scanPrescription(blob, setProgress, abort.signal),
        }
      }
      if (!abort.signal.aborted) {
        if (!result.text.trim()) {
          setError(
            'No readable text was found. Try a clearer PDF or image, or add the medication manually from your prescription.',
          )
          return
        }
        setText(result.text)
        setAdded(new Set())
      }
    } catch (err) {
      setRemoteConsent(false)
      if (!abort.signal.aborted) setError(errorMessage(err))
    } finally {
      if (!abort.signal.aborted) setBusy(false)
    }
  }
  /**
   * Prepare a source-linked editable draft from explicit text; do not infer
   * missing dates or a regimen.
   */
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
      frequency: 'custom',
      ...suggestion,
      source_record_id: record.id,
      family_member_id: selectedFamilyMemberId,
      prescription_text: excerpt,
      start_date: '',
      times: '',
    })
  }
  return (
    <>
      <FormDialog
        open={!uploading && !draft}
        onClose={close}
        title="Add medications from a prescription"
        description="Upload or choose a prescription, read its text, then review each medication before saving. Lab reports and other records are not scanned for medications."
        className="sm:max-w-[calc(100vw-2rem)] xl:max-w-6xl"
      >
        <ol
          aria-label="Prescription steps"
          className="grid gap-2 text-xs font-medium sm:grid-cols-3"
        >
          {['1. Choose document', '2. Read text', '3. Review & save'].map(
            (step) => (
              <li
                key={step}
                className="rounded-xl border bg-muted/40 px-3 py-2"
              >
                {step}
              </li>
            ),
          )}
        </ol>
        <p className="text-sm leading-6 text-muted-foreground">
          Works best with clear, printed English. Handwriting and OCR can be
          wrong. Missing doses, dates, and times must be entered from your
          prescription, not guessed.
        </p>
        <div className="space-y-4">
          <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
            <section
              aria-label="Prescription text"
              className="min-w-0 space-y-4 rounded-2xl border bg-muted/20 p-4"
            >
              <h3 className="text-sm font-semibold">Read the prescription</h3>
              {features.remoteOcrAvailable && (
                <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-amber-700"
                    checked={remoteConsent}
                    disabled={busy}
                    onChange={(event) => setRemoteConsent(event.target.checked)}
                  />
                  <span>
                    For this scan only, I consent to send the full document to
                    OCR.Space. Its free service has a 1 MB limit and supports up
                    to 3-page PDFs; it is not covered by a signed free-tier DPA.
                    Do not use this option for real or sensitive medical
                    records.
                  </span>
                </label>
              )}
              {nonPrescription && (
                <p role="alert" className="text-sm text-destructive">
                  This document is not a prescription. Use Medical Records →
                  Review results for lab values, or choose a prescription below.
                </p>
              )}
              {prescriptions.length > 0 && (
                <SelectField
                  label="Choose a saved prescription"
                  value={record ? selected : ''}
                  disabled={busy}
                  onValueChange={(value) => {
                    setSelected(value)
                    setText('')
                    setRemoteConsent(false)
                    setError(null)
                    setAdded(new Set())
                  }}
                  options={[
                    { value: '', label: 'Choose a saved prescription' },
                    ...prescriptions.map((item) => ({
                      value: item.id,
                      label: item.title,
                    })),
                  ]}
                />
              )}
              {!record && (
                <p className="text-sm text-muted-foreground">
                  {prescriptions.length
                    ? 'Choose a saved prescription above, or upload a new prescription below.'
                    : 'Start by uploading a PDF, JPG, or PNG prescription. It will be saved in your private vault.'}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={record ? 'outline' : 'default'}
                  disabled={busy}
                  onClick={() => setUploading(true)}
                >
                  <Upload />
                  Upload prescription
                </Button>
                <Button disabled={!record || busy} onClick={() => void scan()}>
                  <ScanLine />
                  {busy
                    ? 'Reading text...'
                    : text
                      ? 'Read again'
                      : 'Read prescription text'}
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
              {record && !text && !busy && (
                <p className="text-xs text-muted-foreground">
                  Selected: {record.title}. Select &quot;Read prescription
                  text&quot; to continue. Medications are not saved
                  automatically.
                </p>
              )}
              {busy && (
                <p role="status" className="rounded-xl bg-accent p-4 text-sm">
                  {progress} You may close this dialog to cancel.
                </p>
              )}
              {text && (
                <TextField
                  label="Scanned prescription text"
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value)
                    setAdded(new Set())
                  }}
                  rows={8}
                  className="field-sizing-fixed h-64 min-h-48 resize-y lg:h-96"
                  hint="Correct OCR mistakes against the original. Suggestions support form-first entries (such as Tablet or Cream) and name-first sprays followed directly by a dose. Other formats may need manual entry. Dates and dose times are never inferred."
                />
              )}
            </section>
            <section
              aria-label="Medication review"
              className="min-w-0 space-y-4"
            >
              <h3 className="font-semibold">Review medications</h3>
              {text ? (
                <div className="space-y-3">
                  {!suggestions.length && (
                    <p className="text-sm leading-6 text-muted-foreground">
                      No medication suggestions were recognized. Compare the
                      extracted text with the original and enter details
                      manually if needed. Do not guess missing instructions.
                    </p>
                  )}
                  {suggestions.map((suggestion, index) => {
                    const done = added.has(suggestion.prescription_text ?? '')
                    return (
                      <div key={index} className="rounded-xl border p-4">
                        <p className="break-words font-medium">
                          {suggestion.name || 'Name needs review'}{' '}
                          <span className="text-xs text-muted-foreground">
                            ({medicationForms[suggestion.form ?? 'unspecified']}
                            )
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
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Read the selected prescription to review its text and any
                  medication suggestions. Nothing is saved automatically.
                </p>
              )}
            </section>
          </div>
          {error && <ErrorState message={error} />}
          <div className="flex justify-end border-t pt-4">
            <Button variant="outline" onClick={close}>
              {busy ? 'Cancel scan' : 'Close'}
            </Button>
          </div>
        </div>
      </FormDialog>
      {uploading && (
        <UploadDialog
          defaultKind="prescription"
          onClose={() => setUploading(false)}
          onUploaded={(item) => {
            setSelected(item.id)
            setText('')
            setError(null)
            setRemoteConsent(false)
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
