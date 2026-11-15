import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Pill,
  CheckCheck,
  Clock3,
  Upload,
  Plus,
  Activity,
  ChevronRight,
} from 'lucide-react'
import { addDays, subDays } from 'date-fns'
import { useVault } from '../contexts/DataContext'
import {
  localDate,
  medicationStatus,
  scheduledDoses,
  metricInfo,
} from '../lib/utils'
import type { MetricType } from '../lib/database.types'
import {
  PageTitle,
  Panel,
  SectionTitle,
  StatCard,
  EmptyState,
  SafetyNote,
  SelectField,
} from '../components/common'
import { DoseSchedule } from '../components/DoseSchedule'
import { MedicalRecordCard } from '../components/MedicalRecordCard'
import { HealthMetricCard } from '../components/HealthMetricCard'
import { HealthChart } from '../components/HealthChart'
import { MedicationReminder } from '../components/MedicationReminder'

export default function DashboardPage() {
  const { profile, healthProfile, records, medications, metrics, logs, now } =
    useVault()
  const [chartType, setChartType] = useState<MetricType>('blood_pressure')
  const today = localDate(now)
  const doses = scheduledDoses(medications, logs, today)
  const taken = doses.filter((d) => d.log?.status === 'taken').length
  const skipped = doses.filter((d) => d.log?.status === 'skipped').length
  const pending = doses.filter((d) => !d.log).length
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (
    healthProfile?.full_name ||
    profile?.full_name ||
    ''
  ).split(' ')[0]
  const nowTime = `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const upcoming = Array.from({ length: 7 }, (_, offset) => {
    const day = localDate(addDays(now, offset))
    return scheduledDoses(medications, logs, day).filter(
      (d) => !d.log && (offset > 0 || d.time >= nowTime),
    )
  })
    .flat()
    .slice(0, 4)
  const recentMetrics = metrics.filter(
    (m) => localDate(new Date(m.measured_at)) >= localDate(subDays(now, 29)),
  )
  const setup = [
    {
      complete: !!healthProfile,
      to: '/profile',
      label: 'Complete your health profile',
    },
    {
      complete: records.length > 0,
      to: '/medical-records?action=upload',
      label: 'Upload your first record',
    },
    {
      complete: metrics.length > 0,
      to: '/health-tracker?action=add',
      label: 'Record your first measurement',
    },
  ].filter((item) => !item.complete)
  return (
    <>
      <PageTitle
        title={`${greeting}${firstName ? ', ' + firstName : ''}`}
        description="Your daily routine and health information, together in one place."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/medical-records?action=upload" className="action-link">
              <Upload size={16} />
              Upload record
            </Link>
            <Link
              to="/medications?action=add"
              className="small-link rounded-xl border bg-white px-3"
            >
              <Plus size={16} />
              Add medication
            </Link>
            <Link
              to="/health-tracker?action=add"
              className="small-link rounded-xl border bg-white px-3"
            >
              <Activity size={16} />
              Record measurement
            </Link>
          </div>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Medical records"
          value={records.length}
          subtitle="Documents in your private vault"
          icon={FileText}
        />
        <StatCard
          title="Active medications"
          value={
            medications.filter((m) => medicationStatus(m, today) === 'active')
              .length
          }
          subtitle="Within their treatment dates"
          icon={Pill}
        />
        <StatCard
          title="Today's doses"
          value={doses.length}
          subtitle={`${pending} pending · ${skipped} skipped`}
          icon={Clock3}
        />
        <StatCard
          title="Doses taken today"
          value={taken}
          subtitle={
            doses.length
              ? `${Math.round((taken / doses.length) * 100)}% of scheduled doses`
              : 'No doses scheduled today'
          }
          icon={CheckCheck}
        />
      </div>
      <MedicationReminder doses={doses} now={now} />
      {setup.length > 0 && (
        <section
          aria-label="Workspace setup"
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-base font-semibold text-slate-900">
            Make this workspace yours
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start wherever you need. You can use MediVault without completing
            every step.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {setup.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="small-link rounded-xl bg-teal-50 px-3"
              >
                {item.label}
                <ChevronRight size={16} />
              </Link>
            ))}
          </div>
          {!medications.length && (
            <p className="mt-3 text-xs text-muted-foreground">
              Medication setup is optional. Only add an existing prescription
              from your clinician.
            </p>
          )}
        </section>
      )}
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel>
          <SectionTitle
            title="Today's medication schedule"
            description="Track doses from your prescribed routine."
            action={
              <Link to="/medications" className="small-link">
                View all
                <ChevronRight size={14} />
              </Link>
            }
          />
          <DoseSchedule doses={doses} />
        </Panel>
        <Panel>
          <SectionTitle
            title="Recent medical records"
            description="Your latest uploads, always within reach."
            action={
              <Link to="/medical-records" className="small-link">
                View vault
                <ChevronRight size={14} />
              </Link>
            }
          />
          {records.length ? (
            records
              .slice(0, 4)
              .map((record) => (
                <MedicalRecordCard key={record.id} record={record} compact />
              ))
          ) : (
            <EmptyState
              icon={FileText}
              title="Your vault is waiting"
              description="Upload a report or prescription to start organizing your medical history."
              action={
                <Link
                  className="action-link"
                  to="/medical-records?action=upload"
                >
                  <Upload size={15} />
                  Upload a record
                </Link>
              }
            />
          )}
        </Panel>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">
          Latest health measurements
        </h2>
        <Link to="/health-tracker" className="small-link">
          View health tracker
          <ChevronRight size={14} />
        </Link>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(metricInfo) as MetricType[]).map((type) => (
          <HealthMetricCard
            key={type}
            type={type}
            metric={metrics.find((m) => m.type === type)}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel>
          <SectionTitle
            title="Your health at a glance"
            description="Measurements from the last 30 days."
          />
          <div className="mb-3 max-w-52">
            <SelectField
              label="Chart measurement"
              value={chartType}
              onChange={(e) => {
                const value = e.target.value
                if (value in metricInfo) setChartType(value as MetricType)
              }}
            >
              {Object.entries(metricInfo).map(([v, info]) => (
                <option key={v} value={v}>
                  {info.label}
                </option>
              ))}
            </SelectField>
          </div>
          <HealthChart type={chartType} metrics={recentMetrics} />
        </Panel>
        <div className="space-y-6">
          <Panel>
            <SectionTitle
              title="Upcoming schedule"
              description="Next unlogged doses in the next 7 days."
            />
            {upcoming.length ? (
              upcoming.map((d) => (
                <div
                  key={`${d.medication.id}-${d.date}-${d.time}`}
                  className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"
                >
                  <span className="rounded-lg bg-teal-50 p-2 text-primary">
                    <Clock3 size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {d.medication.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {d.date === today ? 'Today' : d.date} &middot; {d.time}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    Scheduled
                  </span>
                </div>
              ))
            ) : (
              <p className="py-5 text-sm text-muted-foreground">
                No upcoming doses in this period.
              </p>
            )}
          </Panel>
        </div>
      </div>
      <SafetyNote />
    </>
  )
}
