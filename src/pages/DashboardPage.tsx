import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Clock3,
  Upload,
  Plus,
  ScanLine,
  ChevronRight,
} from 'lucide-react'
import { addDays, format } from 'date-fns'
import { useVault } from '../contexts/DataContext'
import { localDate, medicationStatus, scheduledDoses } from '../lib/utils'
import {
  adherence30,
  clockTime,
  dailyInsights,
  loggedStreak,
  weekBreakdown,
} from '../lib/dashboard'
import {
  PageTitle,
  Panel,
  SectionTitle,
  EmptyState,
  SafetyNote,
} from '../components/common'
import { DoseTimeline, type DoseFilter } from '../components/DoseSchedule'
import {
  AdherenceRing,
  DailyInsight,
  DayDial,
  VaultCounts,
  WeekActivityChart,
} from '../components/DashboardVisuals'
import { MedicalRecordCard } from '../components/MedicalRecordCard'
import { MedicationReminder } from '../components/MedicationReminder'

export default function DashboardPage() {
  const { profile, healthProfile, records, medications, logs, now } = useVault()
  const [doseFilter, setDoseFilter] = useState<DoseFilter>('all')
  const today = localDate(now)
  const doses = scheduledDoses(medications, logs, today)
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (
    healthProfile?.full_name ||
    profile?.full_name ||
    ''
  ).split(' ')[0]
  const nowTime = clockTime(now)
  const upcoming = Array.from({ length: 7 }, (_, offset) => {
    const day = localDate(addDays(now, offset))
    return scheduledDoses(medications, logs, day).filter(
      (d) => !d.log && (offset > 0 || d.time >= nowTime),
    )
  })
    .flat()
    .slice(0, 4)
  const insights = dailyInsights({
    doses,
    medications,
    records,
    streak: loggedStreak(medications, logs, now),
    now,
  })
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
      complete: medications.length > 0,
      to: '/medications?action=add',
      label: 'Add your first medication',
    },
  ].filter((item) => !item.complete)
  return (
    <>
      <PageTitle
        title={`${greeting}${firstName ? ', ' + firstName : ''}`}
        description="Your medication routine and medical records, together in one place."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/medications?action=scan" className="action-link">
              <ScanLine size={16} />
              Scan prescription
            </Link>
            <Link
              to="/medications?action=add"
              className="small-link rounded-xl border bg-card px-3"
            >
              <Plus size={16} />
              Add medication
            </Link>
            <Link
              to="/medical-records?action=upload"
              className="small-link rounded-xl border bg-card px-3"
            >
              <Upload size={16} />
              Upload record
            </Link>
          </div>
        }
      />
      <MedicationReminder doses={doses} now={now} />
      {setup.length > 0 && (
        <section
          aria-label="Workspace setup"
          className="mb-6 rounded-2xl border border-slate-200 bg-card p-5"
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
      <Panel className="mb-6">
        <section aria-label="Today">
          <SectionTitle
            title="Today"
            description={format(now, 'EEEE, MMMM d')}
            action={
              <Link to="/medications" className="small-link">
                All medications
                <ChevronRight size={14} />
              </Link>
            }
          />
          <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
            <DayDial
              doses={doses}
              now={now}
              filter={doseFilter}
              onFilterChange={setDoseFilter}
            />
            <DoseTimeline
              doses={doses}
              filter={doseFilter}
              onFilterChange={setDoseFilter}
            />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <DailyInsight statements={insights} />
          </div>
        </section>
      </Panel>
      <section
        aria-label="Recent activity"
        className="mb-6 grid gap-6 border-y border-slate-200 py-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10"
      >
        <WeekActivityChart days={weekBreakdown(medications, logs, now)} />
        <div className="space-y-5 lg:border-l lg:border-slate-200 lg:pl-10">
          <AdherenceRing value={adherence30(logs, now)} />
          <VaultCounts
            records={records.length}
            activeMedications={
              medications.filter((m) => medicationStatus(m, today) === 'active')
                .length
            }
          />
        </div>
      </section>
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
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
      <Panel>
        <SectionTitle
          title="Keep prescriptions connected"
          description="From a saved medical record to a medication you have reviewed."
        />
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Scan a printed prescription locally, compare the text with the
          original, and confirm the medication form, strength, dosage, and
          schedule. Missing or unclear details are never filled in
          automatically.
        </p>
        <p className="mt-4 text-sm font-medium">
          {
            medications.filter((medication) => medication.source_record_id)
              .length
          }{' '}
          medication(s) linked to medical records
        </p>
        <Link className="small-link mt-3" to="/medications?action=scan">
          <ScanLine size={16} />
          Scan and review a prescription
        </Link>
      </Panel>
      <SafetyNote />
    </>
  )
}
