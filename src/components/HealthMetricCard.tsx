import { HeartPulse, Droplets, Weight, Activity } from 'lucide-react'
import type { HealthMetric, MetricType } from '../lib/database.types'
import { displayDate, metricInfo, metricValue } from '../lib/utils'
import { Panel } from './common'
const icons = {
  blood_pressure: Activity,
  blood_glucose: Droplets,
  weight: Weight,
  heart_rate: HeartPulse,
}
export function HealthMetricCard({
  type,
  metric,
}: {
  type: MetricType
  metric?: HealthMetric
}) {
  const Icon = icons[type]
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {metricInfo[type].label}
        </p>
        <Icon size={19} className="text-primary" />
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight text-slate-900">
          {metric ? metricValue(metric) : '--'}
        </p>
        <span className="text-xs text-slate-400">{metricInfo[type].unit}</span>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        {metric ? displayDate(metric.measured_at) : 'No measurements yet'}
      </p>
    </Panel>
  )
}
