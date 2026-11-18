import { useState, type FormEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { visitFollowUpSchema, type VisitFollowUpValues } from '@shared/schemas'
import type { CareVisit, VisitFollowUp } from '@shared/database.types'
import { useVault } from '@/contexts/DataContext'
import { useMutation } from '@/hooks/useMutation'
import { api } from '@/lib/api'
import {
  ErrorState,
  Field,
  FormDialog,
  SelectField,
  SubmitButton,
  TextField,
} from '@/components/common'
import { Button } from '@/components/ui/button'
import { calculateFollowUpDate } from '../lib/follow-ups'

export function FollowUpDialog({
  visit,
  followUp,
  onClose,
}: {
  visit: CareVisit
  followUp?: VisitFollowUp
  onClose: () => void
}) {
  const { records, visits, reload } = useVault()
  const mutation = useMutation()
  const [mode, setMode] = useState('exact')
  const [interval, setInterval] = useState('')
  const [confirmed, setConfirmed] = useState('')
  const [dateError, setDateError] = useState('')
  const form = useForm<VisitFollowUpValues>({
    resolver: zodResolver(
      visitFollowUpSchema.refine(
        (value) => value.due_date >= visit.visit_date,
        { path: ['due_date'], message: 'Due date cannot precede this visit.' },
      ),
    ),
    defaultValues: {
      due_date: followUp?.due_date ?? '',
      instruction: followUp?.instruction ?? '',
      source_record_id: followUp?.source_record_id ?? '',
      status: followUp?.status ?? 'pending',
      completed_visit_id: followUp?.completed_visit_id ?? '',
    },
  })
  const values = useWatch({ control: form.control })
  const calculated = calculateFollowUpDate(visit.visit_date, interval)
  const confirmationKey = `${visit.visit_date}:${interval}`

  async function save(values: VisitFollowUpValues) {
    if (
      await mutation.run(async () => {
        await api.care.saveFollowUp(visit.id, values)
        await reload()
      }, 'Follow-up saved.')
    )
      onClose()
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === 'days') {
      if (!calculated.date || confirmed !== confirmationKey) {
        setDateError(
          calculated.error ?? 'Confirm the calculated due date before saving.',
        )
        return
      }
      form.setValue('due_date', calculated.date)
    }
    setDateError('')
    void form.handleSubmit(save)(event)
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      busy={mutation.pending}
      title="Follow-up due"
      description={`For ${visit.title} on ${visit.visit_date}. Not a booked appointment.`}
    >
      <form onSubmit={submit} noValidate>
        <fieldset disabled={mutation.pending} className="space-y-5">
          <SelectField
            label="Set due date"
            value={mode}
            onValueChange={(value) => {
              setMode(value)
              setConfirmed('')
              setDateError('')
            }}
            options={[
              { value: 'exact', label: 'Choose an exact date' },
              { value: 'days', label: 'Days after this visit' },
            ]}
          />
          {mode === 'exact' ? (
            <Field
              label="Follow-up due date"
              type="date"
              min={visit.visit_date}
              registration={form.register('due_date')}
              error={form.formState.errors.due_date?.message}
            />
          ) : (
            <div className="space-y-3">
              <Field
                label="Days after this visit"
                type="number"
                min="1"
                step="1"
                value={interval}
                onChange={(event) => {
                  setInterval(event.target.value)
                  setConfirmed('')
                  setDateError('')
                }}
                error={interval ? calculated.error : undefined}
              />
              {calculated.date && (
                <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border bg-muted/40 p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-primary"
                    checked={confirmed === confirmationKey}
                    onChange={(event) => {
                      setConfirmed(event.target.checked ? confirmationKey : '')
                      setDateError('')
                    }}
                  />
                  <span>
                    I confirm the follow-up due date:{' '}
                    <strong>{calculated.date}</strong>, calculated from the
                    visit on {visit.visit_date}.
                  </span>
                </label>
              )}
            </div>
          )}
          {dateError && (
            <p role="alert" className="text-sm text-destructive">
              {dateError}
            </p>
          )}
          <TextField
            label="Original follow-up instruction"
            rows={3}
            placeholder="Optional wording from your visit or document"
            registration={form.register('instruction')}
            error={form.formState.errors.instruction?.message}
          />
          <SelectField
            label="Source document"
            value={values.source_record_id ?? ''}
            onValueChange={(value) => form.setValue('source_record_id', value)}
            options={[
              { value: '', label: 'No source document' },
              ...records
                .filter((record) => record.visit_id === visit.id)
                .map((record) => ({ value: record.id, label: record.title })),
            ]}
            error={form.formState.errors.source_record_id?.message}
          />
          <SelectField
            label="Follow-up status"
            value={values.status ?? 'pending'}
            onValueChange={(value) => {
              const parsed = visitFollowUpSchema.shape.status.safeParse(value)
              if (parsed.success) {
                form.setValue('status', parsed.data)
                if (parsed.data !== 'completed')
                  form.setValue('completed_visit_id', '')
              }
            }}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          {values.status === 'completed' && (
            <SelectField
              label="Actual return visit (optional)"
              value={values.completed_visit_id ?? ''}
              onValueChange={(value) =>
                form.setValue('completed_visit_id', value)
              }
              options={[
                { value: '', label: 'No linked return visit' },
                ...visits
                  .filter(
                    (item) =>
                      item.id !== visit.id &&
                      item.family_member_id === visit.family_member_id &&
                      item.visit_date >= visit.visit_date,
                  )
                  .map((item) => ({
                    value: item.id,
                    label: `${item.visit_date} · ${item.title}`,
                  })),
              ]}
            />
          )}
          {mutation.error && <ErrorState message={mutation.error} />}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton busy={mutation.pending}>Save follow-up</SubmitButton>
          </div>
        </fieldset>
      </form>
    </FormDialog>
  )
}
