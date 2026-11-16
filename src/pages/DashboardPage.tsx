import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Upload,
  Plus,
  ScanLine,
  CalendarDays,
  ShieldCheck,
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
import {
  RecordPreview,
  type PreviewSelection,
} from '../components/RecordPreview'
import { MedicationReminder } from '../components/MedicationReminder'

export default function DashboardPage() {
  const { profile, healthProfile, records, medications, logs, now } = useVault()
  const [doseFilter, setDoseFilter] = useState<DoseFilter>('all')
  const [preview, setPreview] = useState<PreviewSelection | null>(null)
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {greeting}
            {firstName ? `, ${firstName}` : ''}. Here's your day.
          </p>
          <div className="flex items-center gap-5">
            <div className="calendar-tile" aria-hidden="true">
              <span>{format(now, 'MMM')}</span>
              <span>{format(now, 'd')}</span>
            </div>
            <div>
              <h1 className="today-heading">Today</h1>
              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                {format(now, 'EEE, MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
        <Link
          to="/medications?action=add"
          aria-label="Add medication"
          className="action-link size-12 !p-0 sm:h-auto sm:w-auto sm:!px-5 sm:!py-3"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add medication</span>
        </Link>
      </div>
      <section aria-label="Today" className="daybook mb-7">
        <div className="routine-panel tint-sky">
          <SectionTitle
            title="Medications for today"
            action={
              <Link
                to="/medications"
                aria-label="Manage medications"
                className="small-link text-xs"
              >
                <span className="hidden sm:inline">Manage medications</span>
                <CalendarDays size={19} className="sm:hidden" />
              </Link>
            }
          />
          <DoseTimeline
            doses={doses}
            filter={doseFilter}
            onFilterChange={setDoseFilter}
          />
          <div className="mt-7 border-t border-slate-200 pt-5">
            <MedicationReminder doses={doses} now={now} />
          </div>
        </div>
        <nav
          aria-label="Quick actions"
          className="grid min-w-0 gap-3 sm:grid-cols-2"
        >
          <Link
            to="/medications?action=scan"
            className="quick-access tint-lavender"
            aria-label="Scan prescription"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
              <ScanLine size={22} />
            </span>
            <span>
              <span className="block text-sm font-medium">
                Scan prescription
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Read, review, then save
              </span>
            </span>
          </Link>
          <Link
            to="/medical-records?action=upload"
            className="quick-access tint-peach"
            aria-label="Upload record"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
              <Upload size={22} />
            </span>
            <span>
              <span className="block text-sm font-medium">Upload record</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Keep your paperwork together
              </span>
            </span>
          </Link>
          <Link to="/profile" className="quick-access tint-mint">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
              <ShieldCheck size={22} />
            </span>
            <span>
              <span className="block text-sm font-medium">Health profile</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Your important details
              </span>
            </span>
          </Link>
        </nav>
        <div className="daybook-summary grid min-w-0 gap-6 min-[900px]:grid-cols-2 xl:grid-cols-1">
          <Panel className="daybook-secondary tint-lavender overflow-hidden">
            <SectionTitle
              title="Your daily rhythm"
              description="A full day, at a glance."
            />
            <div className="dose-orbit -mx-3">
              <DayDial
                doses={doses}
                now={now}
                filter={doseFilter}
                onFilterChange={setDoseFilter}
              />
            </div>
            <div className="mt-4 border-t pt-4">
              <DailyInsight statements={insights} />
            </div>
          </Panel>
          <Panel className="daybook-secondary tint-mint">
            <WeekActivityChart days={weekBreakdown(medications, logs, now)} />
            <div className="mt-5 border-t pt-5">
              <AdherenceRing value={adherence30(logs, now)} />
            </div>
          </Panel>
        </div>
      </section>
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel className="tint-sky">
          <SectionTitle
            title="Recent medical records"
            description="Your latest uploads, always within reach."
            action={
              <Link to="/medical-records" className="small-link">
                View vault
              </Link>
            }
          />
          {records.length ? (
            records
              .slice(0, 4)
              .map((record) => (
                <MedicalRecordCard
                  key={record.id}
                  record={record}
                  compact
                  onPreview={(record, trigger) =>
                    setPreview({ record, trigger })
                  }
                />
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
        <Panel className="tint-peach">
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
                <span className="rounded-2xl bg-slate-50 p-3 text-muted-foreground">
                  <CalendarDays size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {d.medication.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {d.date === today
                      ? 'Today'
                      : format(
                          new Date(`${d.date}T12:00:00`),
                          'EEE, MMM d',
                        )}{' '}
                    at {d.time}
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
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 px-5 py-3">
        <VaultCounts
          records={records.length}
          activeMedications={
            medications.filter((m) => medicationStatus(m, today) === 'active')
              .length
          }
        />
        <p className="text-xs text-muted-foreground">
          {
            medications.filter((medication) => medication.source_record_id)
              .length
          }{' '}
          medication(s) linked to medical records
        </p>
      </div>
      {setup.length > 0 && (
        <section aria-label="Workspace setup" className="mt-6 px-1">
          <h2 className="text-sm font-medium">Make this workspace yours</h2>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            {setup.map((item) => (
              <Link key={item.to} to={item.to} className="small-link text-xs">
                {item.label}
              </Link>
            ))}
          </div>
          {!medications.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              Medication setup is optional. Only add an existing prescription
              from your clinician.
            </p>
          )}
        </section>
      )}
      <SafetyNote />
      {preview && (
        <RecordPreview
          key={preview.record.id}
          selection={preview}
          available={records.some((record) => record.id === preview.record.id)}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  )
}
