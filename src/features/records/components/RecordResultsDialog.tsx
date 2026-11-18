/**
 * Human-reviewed report-result capture. Keeps local OCR suggestions editable and
 * requires review before saving an immutable source-linked snapshot.
 */

import { useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, ScanLine, Trash2 } from 'lucide-react'
import { useVault } from '@/contexts/DataContext'
import { useMutation } from '@/hooks/useMutation'
import { api, errorMessage } from '@/lib/api'
import { localDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ErrorState,
  Field,
  FormDialog,
  SelectField,
  SubmitButton,
  TextField,
} from '@/components/common'
import type { MedicalRecord } from '@shared/database.types'
import {
  currentResultReviews,
  reviewResultsSchema,
  type ReviewResultsValues,
} from '@shared/record-results'
import { extractResultSuggestions } from '../lib/result-extraction'

/**
 * Choose a report belonging to the selected profile and remount its editor when
 * the source changes.
 */
export function RecordResultsDialog({
  recordId = '',
  onClose,
}: {
  recordId?: string
  onClose: () => void
}) {
  const { records } = useVault()
  const [selected, setSelected] = useState(recordId)
  const record = records.find((item) => item.id === selected)
  if (record)
    return (
      <ResultEditor
        key={record.id}
        record={record}
        onClose={onClose}
        onChoose={() => setSelected('')}
      />
    )
  return (
    <FormDialog
      open
      onClose={onClose}
      title="Review checkup or test results"
      description="Choose a report belonging to the selected family profile."
    >
      {records.length ? (
        <SelectField
          label="Source medical document"
          value={selected}
          onValueChange={setSelected}
          options={[
            { value: '', label: 'Choose a saved report' },
            ...records.map((item) => ({ value: item.id, label: item.title })),
          ]}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Upload a medical report first, then return here to review its results.
        </p>
      )}
      <div className="mt-5 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </FormDialog>
  )
}

/**
 * Edit a report review with explicit provenance, measurement date and blood-group
 * conflict confirmation.
 */
function ResultEditor({
  record,
  onClose,
  onChoose,
}: {
  record: MedicalRecord
  onClose: () => void
  onChoose: () => void
}) {
  const { resultReviews, healthProfile, familyHealthProfiles, familyMembers } =
    useVault()
  const existing = currentResultReviews(resultReviews).find(
    (review) => review.source_record_key === record.id,
  )
  const member = familyMembers.find(
    (item) => item.id === record.family_member_id,
  )
  const health =
    member?.relationship === 'self'
      ? healthProfile
      : familyHealthProfiles.find(
          (item) => item.family_member_id === record.family_member_id,
        )
  const mutation = useMutation()
  const [text, setText] = useState('')
  const [scanBusy, setScanBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [reviewed, setReviewed] = useState(false)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewResultsValues>({
    resolver: zodResolver(reviewResultsSchema),
    defaultValues: {
      measured_on: existing?.measured_on ?? record.record_date,
      results: existing?.results ?? [],
      confirm_blood_group_change: false,
    },
  })
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'results',
  })
  const values = useWatch({ control, name: 'results' })
  const incomingBlood = values.find(
    (row) => row.name.toLowerCase() === 'blood group',
  )?.value
  const bloodConflict =
    !!health?.blood_group &&
    !!incomingBlood &&
    incomingBlood !== health.blood_group
  const busy = mutation.pending || scanBusy

  /**
   * Extract report text locally with cancellation and visible progress/errors; do
   * not persist suggestions automatically.
   */
  async function scan() {
    const abort = new AbortController()
    controller.current = abort
    setScanBusy(true)
    setScanError(null)
    setProgress('Opening your private document...')
    try {
      const blob = await api.records.file(record.id)
      abort.signal.throwIfAborted()
      const { scanPrescription } = await import('../lib/ocr')
      const extracted = await scanPrescription(blob, setProgress, abort.signal)
      if (!abort.signal.aborted) {
        if (!extracted.trim())
          throw new Error(
            'No readable text was found. Enter the reported results manually or use a clearer document.',
          )
        setText(extracted)
      }
    } catch (error) {
      if (!abort.signal.aborted) setScanError(errorMessage(error))
    } finally {
      if (!abort.signal.aborted) setScanBusy(false)
    }
  }

  /**
   * Replace draft rows only with recognized explicit results from the editable
   * scan text.
   */
  function fillDraft() {
    const suggestions = extractResultSuggestions(text)
    if (!suggestions.length) {
      setScanError(
        'No supported values with explicit labels and units were recognized. Add results manually from the report; no values have been changed.',
      )
      return
    }
    setScanError(null)
    setReviewed(false)
    replace(suggestions)
  }

  /**
   * Require user review before saving validated results and close only after
   * successful persistence.
   */
  async function save(input: ReviewResultsValues) {
    if (!reviewed) {
      setScanError(
        'Review the values, units, context and measurement date against the original before saving.',
      )
      return
    }
    const saved = await mutation.run(async () => {
      await api.records.saveResults(record.id, input)
    }, 'Reviewed results saved. Eligible latest height, weight and blood group synced to the health profile.')
    if (saved) onClose()
  }

  return (
    <FormDialog
      open
      onClose={() => {
        controller.current?.abort()
        onClose()
      }}
      busy={mutation.pending}
      title="Review report results"
      description={`${record.title} · ${member?.full_name ?? 'Selected profile'}. Nothing is saved until you review and confirm.`}
      className="sm:max-w-[calc(100vw-2rem)] xl:max-w-6xl"
    >
      <form
        noValidate
        onSubmit={handleSubmit(save)}
        onChange={(event) => {
          if (event.target instanceof HTMLInputElement && event.target.name)
            setReviewed(false)
        }}
      >
        <fieldset disabled={busy} className="space-y-6">
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <section
              aria-label="Report text"
              className="min-w-0 space-y-4 rounded-2xl border bg-muted/20 p-4"
            >
              <h3 className="text-sm font-semibold">Read the report</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void scan()}
                >
                  <ScanLine /> Read text locally
                </Button>
                <a
                  className="small-link"
                  href={`/api/records/${encodeURIComponent(record.id)}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open original report
                </a>
              </div>
              {scanBusy && (
                <p role="status" className="rounded-xl bg-muted p-3 text-sm">
                  {progress}
                </p>
              )}
              {text && (
                <>
                  <TextField
                    label="Extracted report text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    rows={6}
                    className="field-sizing-fixed h-64 min-h-48 resize-y lg:h-96"
                    hint="OCR can mix up table columns. Correct the text and check values against the original. No external OCR or AI service is used."
                  />
                  <Button type="button" variant="outline" onClick={fillDraft}>
                    {fields.length
                      ? 'Replace draft from this text'
                      : 'Suggest results from this text'}
                  </Button>
                </>
              )}
              {!text && !scanBusy && (
                <p className="text-sm leading-6 text-muted-foreground">
                  Read the document to extract its text, or enter results
                  manually. Compare all suggested values with the original
                  before confirming.
                </p>
              )}
            </section>
            <section
              aria-label="Reviewed results"
              className="min-w-0 space-y-5"
            >
              <h3 className="text-sm font-semibold">Check the results</h3>
              <Field
                label="Measurement date *"
                type="date"
                max={localDate()}
                readOnly={!!existing}
                registration={register('measured_on')}
                error={errors.measured_on?.message}
                hint={
                  existing
                    ? 'Confirmed measurement dates are fixed. Upload a corrected report separately if its measurement date was wrong.'
                    : 'Use the actual checkup/specimen date from the report, not today or its upload date.'
                }
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Keep different specimens or conditions separate using Context,
                such as fasting, random, blood or urine. Copy only reference
                ranges actually printed on the report. Leave unknown fields
                blank.
              </p>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-3 rounded-2xl border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">
                      Result {index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove result ${index + 1}`}
                      onClick={() => {
                        remove(index)
                        setReviewed(false)
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="aligned-fields grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Test or measurement *"
                      placeholder="e.g. Weight or Hemoglobin"
                      registration={register(`results.${index}.name`)}
                      error={errors.results?.[index]?.name?.message}
                    />
                    <Field
                      label="Reported result *"
                      placeholder="e.g. 72, Negative, or <5"
                      registration={register(`results.${index}.value`)}
                      error={errors.results?.[index]?.value?.message}
                    />
                    <Field
                      label="Unit"
                      placeholder="e.g. kg or g/dL"
                      registration={register(`results.${index}.unit`)}
                      error={errors.results?.[index]?.unit?.message}
                    />
                    <Field
                      label="Context / specimen"
                      placeholder="As stated on the report"
                      registration={register(`results.${index}.context`)}
                      error={errors.results?.[index]?.context?.message}
                    />
                    <Field
                      label="Printed reference range"
                      registration={register(
                        `results.${index}.reference_range`,
                      )}
                      error={errors.results?.[index]?.reference_range?.message}
                    />
                  </div>
                </div>
              ))}
              {errors.results?.message && (
                <ErrorState message={errors.results.message} />
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  append({
                    name: '',
                    value: '',
                    unit: '',
                    context: '',
                    reference_range: '',
                  })
                  setReviewed(false)
                }}
                disabled={fields.length >= 100}
              >
                <Plus /> Add result manually
              </Button>
            </section>
          </div>
          <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
            Height (cm), Weight (kg) and Blood group update existing profile
            fields only when they are the latest reviewed measurements. Other
            tests remain in Test results. Blood pressure (mmHg), Heart rate
            (bpm) and Oxygen saturation (%) also appear in the profile's latest
            measurements.
          </p>
          {bloodConflict && (
            <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0"
                {...register('confirm_blood_group_change')}
              />
              <span>
                This report conflicts with the saved blood group (
                {health?.blood_group}). I have checked the original and
                explicitly confirm this change if it becomes the latest result.
              </span>
            </label>
          )}
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0"
              checked={reviewed}
              onChange={(event) => setReviewed(event.target.checked)}
            />
            <span>
              I checked every result, unit, context and measurement date against
              the original document.
            </span>
          </label>
          {scanError && <ErrorState message={scanError} />}
          {mutation.error && <ErrorState message={mutation.error} />}
          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={onChoose}>
              Choose another report
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton
              busy={mutation.pending}
              disabled={!reviewed || !fields.length}
            >
              Confirm and sync results
            </SubmitButton>
          </div>
        </fieldset>
      </form>
    </FormDialog>
  )
}
