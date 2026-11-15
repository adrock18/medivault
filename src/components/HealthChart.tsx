import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import type { HealthMetric, MetricType } from '../lib/database.types'
import { metricInfo } from '../lib/utils'
import { EmptyState } from './common'

export function HealthChart({
  metrics,
  type,
}: {
  metrics: HealthMetric[]
  type: MetricType
}) {
  const series = metrics
    .filter((m) => m.type === type)
    .map((m) => ({
      time: new Date(m.measured_at).getTime(),
      value: m.value,
      secondary: m.secondary_value,
    }))
    .sort((a, b) => a.time - b.time)
  if (!series.length)
    return (
      <EmptyState
        title="No measurements in this period"
        description="Record a measurement or adjust your date filters to see your health history."
      />
    )
  return (
    <div
      className="h-72 min-w-0"
      role="img"
      aria-label={`${metricInfo[type].label} measurement history in ${metricInfo[type].unit}. Exact values are available in the measurement table.`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart
          data={series}
          margin={{ top: 12, right: 18, left: -15, bottom: 8 }}
          accessibilityLayer
        >
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#e8efeb"
          />
          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => format(new Date(Number(value)), 'MMM d')}
            tick={{ fontSize: 12, fill: '#53675f' }}
            axisLine={false}
            tickLine={false}
            minTickGap={35}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#53675f' }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            labelFormatter={(value) =>
              format(new Date(Number(value)), 'MMM d, yyyy h:mm a')
            }
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e2e8e4',
              fontSize: 12,
            }}
            formatter={(value, name) => [
              `${value} ${metricInfo[type].unit}`,
              name,
            ]}
          />
          <Line
            type="linear"
            dataKey="value"
            name={
              type === 'blood_pressure' ? 'Systolic' : metricInfo[type].label
            }
            stroke="#116b60"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
          {type === 'blood_pressure' && (
            <Line
              type="linear"
              dataKey="secondary"
              name="Diastolic"
              stroke="#586973"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          )}
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
