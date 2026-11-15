import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '../hooks/useMutation'
import { metricSchema, type MetricValues } from '../lib/schemas'
import { localDateTime, metricInfo } from '../lib/utils'
import { api } from '../lib/api'
import type { HealthMetric } from '../lib/database.types'
import {
  FormDialog,
  Field,
  SelectField,
  TextField,
  SubmitButton,
  ErrorState,
} from './common'
import { Button } from './ui/button'

export function HealthMetricForm({
  metric,
  onClose,
}: {
  metric?: HealthMetric
  onClose: () => void
}) {
  const mutation = useMutation()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MetricValues>({
    resolver: zodResolver(metricSchema),
    defaultValues: metric
      ? {
          type: metric.type,
          value: String(metric.value),
          secondary_value: metric.secondary_value?.toString() ?? '',
          measured_at: localDateTime(new Date(metric.measured_at)),
          notes: metric.notes,
        }
      : {
          type: 'blood_pressure',
          value: '',
          secondary_value: '',
          measured_at: localDateTime(),
          notes: '',
        },
  })
  const type = watch('type')
  async function submit(values: MetricValues) {
    const saved = await mutation.run(
      async () => {
        await api.metrics.save(values, metric?.id)
      },
      metric ? 'Measurement updated.' : 'Health measurement recorded.',
    )
    if (saved) onClose()
  }
  return (
    <FormDialog
      open
      onClose={onClose}
      busy={mutation.pending}
      title={metric ? 'Edit measurement' : 'Record a measurement'}
      description="Log a measurement from your device or healthcare provider."
    >
      <form onSubmit={handleSubmit(submit)} noValidate>
        <fieldset disabled={mutation.pending} className="space-y-5">
          <SelectField
            label="Measurement type *"
            registration={register('type')}
            error={errors.type?.message}
          >
            {Object.entries(metricInfo).map(([v, info]) => (
              <option key={v} value={v}>
                {info.label} ({info.unit})
              </option>
            ))}
          </SelectField>
          <div
            className={
              type === 'blood_pressure' ? 'grid gap-4 sm:grid-cols-2' : ''
            }
          >
            <Field
              label={
                type === 'blood_pressure'
                  ? 'Systolic (mmHg) *'
                  : `Value (${metricInfo[type].unit}) *`
              }
              type="number"
              step="any"
              min={metricInfo[type].min}
              max={metricInfo[type].max}
              registration={register('value')}
              error={errors.value?.message}
            />
            {type === 'blood_pressure' && (
              <Field
                label="Diastolic (mmHg) *"
                type="number"
                step="any"
                min="20"
                max="200"
                registration={register('secondary_value')}
                error={errors.secondary_value?.message}
              />
            )}
          </div>
          <Field
            label="Date and time *"
            type="datetime-local"
            max={localDateTime()}
            registration={register('measured_at')}
            error={errors.measured_at?.message}
            hint="Your local date and time; stored with timezone information."
          />
          <TextField
            label="Notes (optional)"
            placeholder="e.g. Measured before breakfast"
            registration={register('notes')}
            error={errors.notes?.message}
          />
          {mutation.error && <ErrorState message={mutation.error} />}
          <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton busy={mutation.pending}>
              {metric ? 'Save measurement' : 'Record measurement'}
            </SubmitButton>
          </div>
        </fieldset>
      </form>
    </FormDialog>
  )
}
