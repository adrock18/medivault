import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, Activity } from 'lucide-react'
import { subDays, format } from 'date-fns'
import { useVault } from '../contexts/DataContext'
import { useMutation } from '../hooks/useMutation'
import type { HealthMetric, MetricType } from '../lib/database.types'
import { metricInfo, metricValue, localDate, displayDate } from '../lib/utils'
import { api } from '../lib/api'
import {
  PageTitle,
  Panel,
  SectionTitle,
  EmptyState,
  Field,
  SelectField,
  ErrorState,
  ConfirmationDialog,
  SafetyNote,
} from '../components/common'
import { Button } from '../components/ui/button'
import { HealthMetricForm } from '../components/HealthMetricForm'
import { HealthMetricCard } from '../components/HealthMetricCard'
import { HealthChart } from '../components/HealthChart'

export default function HealthTrackerPage() {
  const { metrics, now } = useVault()
  const [params, setParams] = useSearchParams()
  const [edit, setEdit] = useState<HealthMetric | null>(null)
  const [remove, setRemove] = useState<HealthMetric | null>(null)
  const [type, setType] = useState<MetricType>('blood_pressure')
  const [from, setFrom] = useState(() => localDate(subDays(now, 29)))
  const [to, setTo] = useState(() => localDate(now))
  const mutation = useMutation()
  const validRange = !from || !to || from <= to
  const filtered = validRange
    ? metrics.filter((m) => {
        const day = localDate(new Date(m.measured_at))
        return m.type === type && (!from || day >= from) && (!to || day <= to)
      })
    : []
  function close() {
    setEdit(null)
    setParams({}, { replace: true })
  }
  async function confirmDelete() {
    if (!remove) return
    if (
      await mutation.run(async () => {
        await api.metrics.remove(remove.id)
      }, 'Measurement deleted.')
    )
      setRemove(null)
  }
  return (
    <>
      <PageTitle
        title="Health tracker"
        description="Small check-ins. A clearer view of your personal health over time."
        action={
          <Button onClick={() => setParams({ action: 'add' })}>
            <Plus />
            Record measurement
          </Button>
        }
      />
      <p className="mb-3 text-xs font-medium text-muted-foreground">
        Latest measurements &middot; All time
      </p>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(metricInfo) as MetricType[]).map((t) => (
          <HealthMetricCard
            key={t}
            type={t}
            metric={metrics.find((m) => m.type === t)}
          />
        ))}
      </div>
      <Panel>
        <SectionTitle
          title="Measurement trends"
          description="Your recorded values, without diagnoses or treatment recommendations."
        />
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Measurement"
            value={type}
            onChange={(e) => {
              const value = e.target.value
              if (value in metricInfo) setType(value as MetricType)
            }}
          >
            {Object.entries(metricInfo).map(([v, info]) => (
              <option key={v} value={v}>
                {info.label}
              </option>
            ))}
          </SelectField>
          <Field
            label="From date"
            type="date"
            value={from}
            max={to || localDate()}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Field
            label="To date"
            type="date"
            value={to}
            min={from}
            max={localDate()}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        {!validRange ? (
          <ErrorState message="The end date must be on or after the start date." />
        ) : (
          <HealthChart type={type} metrics={filtered} />
        )}
      </Panel>
      <Panel className="mt-6">
        <SectionTitle
          title="Measurement history"
          description={`${filtered.length} ${metricInfo[type].label.toLowerCase()} measurement(s) in the selected period.`}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrom('')
                setTo('')
              }}
            >
              Show all dates
            </Button>
          }
        />
        {filtered.length ? (
          <div
            className="max-h-[420px] max-w-full overflow-auto"
            tabIndex={0}
            role="region"
            aria-label="Measurement history table"
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date &amp; time</th>
                  <th>Measurement</th>
                  <th>Notes</th>
                  <th className="relative">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((metric) => (
                  <tr key={metric.id}>
                    <td className="whitespace-nowrap">
                      {displayDate(metric.measured_at)}
                      <p className="mt-1 text-xs text-slate-400">
                        {format(new Date(metric.measured_at), 'h:mm a')}
                      </p>
                    </td>
                    <td className="whitespace-nowrap font-medium">
                      {metricValue(metric)}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        {metricInfo[metric.type].unit}
                      </span>
                    </td>
                    <td className="max-w-64 break-words text-xs">
                      {metric.notes || '--'}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit measurement from ${displayDate(metric.measured_at)}`}
                          onClick={() => setEdit(metric)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          aria-label={`Delete measurement from ${displayDate(metric.measured_at)}`}
                          onClick={() => setRemove(metric)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="No measurements to show"
            description="Record your first measurement or change the selected date range."
          />
        )}
      </Panel>
      {(params.get('action') === 'add' || edit) && (
        <HealthMetricForm
          key={edit?.id ?? 'new'}
          metric={edit ?? undefined}
          onClose={close}
        />
      )}
      <ConfirmationDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        title="Delete this measurement?"
        description="This measurement will be permanently removed from your health history."
        busy={mutation.pending}
        onConfirm={() => void confirmDelete()}
      />
      <SafetyNote />
    </>
  )
}
