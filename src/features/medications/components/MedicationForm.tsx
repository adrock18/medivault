import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Checkbox } from '@base-ui/react/checkbox'
import { Check } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@/hooks/useMutation'
import { medicationSchema, type MedicationValues } from '@shared/schemas'
import { displayDate, documentKinds, frequencies, localDate } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Medication } from '@shared/database.types'
import {
  Field,
  SelectField,
  TextField,
  FormDialog,
  SubmitButton,
  ErrorState,
} from '@/components/common'
import { Button } from '@/components/ui/button'
import { medicationForms } from '@shared/database.types'
import { useVault } from '@/contexts/DataContext'

export function MedicationForm({
  medication,
  onClose,
  initialValues,
  reviewRequired = false,
  onSaved,
}: {
  medication?: Medication
  onClose: () => void
  initialValues?: Partial<MedicationValues>
  reviewRequired?: boolean
  onSaved?: () => void
}) {
  const mutation = useMutation()
  const { records, familyMembers, selectedFamilyMemberId } = useVault()
  const [reviewed, setReviewed] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicationValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: medication
      ? {
          ...medication,
          times: medication.times.join(', '),
          end_date: medication.end_date ?? '',
          source_record_id: medication.source_record_id ?? '',
        }
      : {
          family_member_id: selectedFamilyMemberId,
          name: '',
          dosage: '',
          form: 'unspecified',
          strength: '',
          source_record_id: '',
          prescription_text: '',
          frequency: 'once_daily',
          times: '',
          start_date: localDate(),
          end_date: '',
          instructions: '',
          ...initialValues,
        },
  })
  async function submit(values: MedicationValues) {
    if (reviewRequired && !reviewed) {
      setReviewError(
        'Compare the details with the original prescription and confirm your review before saving.',
      )
      return
    }
    const saved = await mutation.run(
      async () => {
        await api.medications.save(values, medication?.id)
      },
      medication ? 'Medication updated.' : 'Medication added to your schedule.',
    )
    if (saved) {
      onSaved?.()
      onClose()
    }
  }
  return (
    <FormDialog
      open
      onClose={onClose}
      busy={mutation.pending}
      title={medication ? 'Edit medication' : 'Add a medication'}
      description="Record an existing prescription exactly as instructed by your clinician."
    >
      <form onSubmit={handleSubmit(submit)} noValidate>
        <fieldset disabled={mutation.pending} className="space-y-5">
          <SelectField
            label="For profile"
            value={
              medication?.family_member_id ??
              initialValues?.family_member_id ??
              selectedFamilyMemberId
            }
            disabled
            onValueChange={() => undefined}
            options={familyMembers.map((member) => ({
              value: member.id,
              label: member.full_name,
            }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Medicine name *"
              placeholder="e.g. Metformin"
              registration={register('name')}
              error={errors.name?.message}
            />
            <Field
              label="Prescribed dosage *"
              placeholder="e.g. 500 mg, one tablet"
              registration={register('dosage')}
              error={errors.dosage?.message}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="form"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Medication form"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? 'unspecified'}
                  onValueChange={field.onChange}
                  disabled={mutation.pending}
                  options={Object.entries(medicationForms).map(
                    ([value, label]) => ({ value, label }),
                  )}
                  error={errors.form?.message}
                />
              )}
            />
            <Field
              label="Strength / concentration (optional)"
              placeholder="e.g. 500 mg per tablet or 1% cream"
              registration={register('strength')}
              error={errors.strength?.message}
              hint="Product strength is not the amount to take or apply."
            />
          </div>
          <Controller
            name="frequency"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Frequency *"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value}
                onValueChange={field.onChange}
                disabled={mutation.pending}
                options={Object.entries(frequencies).map(([value, label]) => ({
                  value,
                  label,
                }))}
                error={errors.frequency?.message}
              />
            )}
          />
          <Field
            label="Dose times *"
            placeholder="e.g. 08:00, 20:00"
            registration={register('times')}
            error={errors.times?.message}
            hint="Enter your prescribed times in 24-hour HH:MM format, separated by commas. Times follow the local clock, including when traveling."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Start date *"
              type="date"
              registration={register('start_date')}
              error={errors.start_date?.message}
            />
            <Field
              label="End date (optional)"
              type="date"
              registration={register('end_date')}
              error={errors.end_date?.message}
            />
          </div>
          <TextField
            label="Instructions (optional)"
            placeholder="e.g. Take with food, as prescribed"
            registration={register('instructions')}
            error={errors.instructions?.message}
          />
          <Controller
            name="source_record_id"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Linked medical record (optional)"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                disabled={mutation.pending}
                options={[
                  { value: '', label: 'No linked record' },
                  ...records.map((record) => ({
                    value: record.id,
                    label: record.title,
                    description: `${documentKinds[record.document_kind]} · ${displayDate(record.record_date)}${record.provider ? ` · ${record.provider}` : ''}`,
                  })),
                ]}
                error={errors.source_record_id?.message}
              />
            )}
          />
          <TextField
            label="Prescription wording (optional)"
            registration={register('prescription_text')}
            error={errors.prescription_text?.message}
            hint="Keep the original wording, including abbreviations, without guessing missing amounts or instructions. OCR text may contain errors."
          />
          {reviewRequired && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="mb-3">
                Check the name, form, strength, dosage, and dates against the
                original. Choose the schedule yourself; OCR does not determine
                dose times.
              </p>
              <label className="flex items-start gap-3">
                <Checkbox.Root
                  checked={reviewed}
                  disabled={mutation.pending}
                  className="group grid size-11 shrink-0 place-items-center rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
                  onCheckedChange={(checked) => {
                    setReviewed(checked)
                    setReviewError(null)
                  }}
                >
                  <span className="grid size-6 place-items-center rounded-lg border border-input bg-card text-primary-foreground transition-colors group-data-checked:border-primary group-data-checked:bg-primary">
                    <Checkbox.Indicator>
                      <Check size={17} aria-hidden="true" />
                    </Checkbox.Indicator>
                  </span>
                </Checkbox.Root>
                <span className="py-2">
                  I checked these details against the original prescription.
                </span>
              </label>
            </div>
          )}
          {medication && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Changing times or dates changes the displayed schedule. Existing
              dose logs are retained with their original date and time.
              MediVault does not change or recommend dosages.
            </p>
          )}
          {mutation.error && <ErrorState message={mutation.error} />}
          {reviewError && <ErrorState message={reviewError} />}
          <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton busy={mutation.pending}>
              {medication
                ? 'Save medication'
                : reviewRequired
                  ? 'Confirm and add medication'
                  : 'Add medication'}
            </SubmitButton>
          </div>
        </fieldset>
      </form>
    </FormDialog>
  )
}
