import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '../hooks/useMutation'
import { medicationSchema, type MedicationValues } from '../lib/schemas'
import { frequencies, localDate } from '../lib/utils'
import { api } from '../lib/api'
import type { Medication } from '../lib/database.types'
import {
  Field,
  SelectField,
  TextField,
  FormDialog,
  SubmitButton,
  ErrorState,
} from './common'
import { Button } from './ui/button'

export function MedicationForm({
  medication,
  onClose,
}: {
  medication?: Medication
  onClose: () => void
}) {
  const mutation = useMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicationValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: medication
      ? {
          ...medication,
          times: medication.times.join(', '),
          end_date: medication.end_date ?? '',
        }
      : {
          name: '',
          dosage: '',
          frequency: 'once_daily',
          times: '',
          start_date: localDate(),
          end_date: '',
          instructions: '',
        },
  })
  async function submit(values: MedicationValues) {
    const saved = await mutation.run(
      async () => {
        await api.medications.save(values, medication?.id)
      },
      medication ? 'Medication updated.' : 'Medication added to your schedule.',
    )
    if (saved) onClose()
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
          <SelectField
            label="Frequency *"
            registration={register('frequency')}
            error={errors.frequency?.message}
          >
            {Object.entries(frequencies).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </SelectField>
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
          {medication && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Changing times or dates changes the displayed schedule. Existing
              dose logs are retained with their original date and time.
              MediVault does not change or recommend dosages.
            </p>
          )}
          {mutation.error && <ErrorState message={mutation.error} />}
          <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton busy={mutation.pending}>
              {medication ? 'Save medication' : 'Add medication'}
            </SubmitButton>
          </div>
        </fieldset>
      </form>
    </FormDialog>
  )
}
