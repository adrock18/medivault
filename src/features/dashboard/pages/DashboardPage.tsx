/**
 * Database-backed daily workspace overview. Combines the selected profile
 * schedule, recent records, follow-ups and reviewed-result summaries.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload, Plus, CalendarDays, ShieldCheck } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { useVault } from '@/contexts/DataContext'
import {
  displayDate,
  localDate,
  medicationStatus,
  scheduledDoses,
} from '@/lib/utils'
import {
  adherence30,
  clockTime,
  dailyInsights,
  loggingProgress,
  weekBreakdown,
} from '@/features/dashboard/lib/dashboard'
import {
  Panel,
  SectionTitle,
  EmptyState,
  SafetyNote,
} from '@/components/common'
import {
  DoseTimeline,
  type DoseFilter,
} from '@/features/medications/components/DoseSchedule'
import {
  AdherenceRing,
  DailyInsight,
  DayDial,
  LoggingMilestones,
  VaultCounts,
  WeekActivityChart,
} from '@/features/dashboard/components/DashboardVisuals'
import { MedicalRecordCard } from '@/features/records/components/MedicalRecordCard'
import {
  RecordPreview,
  type PreviewSelection,
} from '@/features/records/components/RecordPreview'
import { MedicationReminder } from '@/features/medications/components/MedicationReminder'

/**
 * Derive today and recent activity from vault context and connect quick actions
 * to working feature routes/dialogs.
 */
export default function DashboardPage() {
  const {
    profile,
    healthProfile,
    familyHealthProfiles,
    familyMembers,
    selectedFamilyMemberId,
    records,
    medications,
    logs,
    visits,
    followUps,
    now,
  } = useVault()
  const selectedMember = familyMembers.find(
    (member) => member.id === selectedFamilyMemberId,
  )
  const selectedHealthProfile =
    selectedMember?.relationship === 'self'
      ? healthProfile
      : familyHealthProfiles.find(
          (item) => item.family_member_id === selectedMember?.id,
        )
  const selectedProfileName =
    selectedMember?.relationship === 'self'
      ? healthProfile?.full_name || profile?.full_name
      : selectedMember?.full_name || profile?.full_name
  const [doseFilter, setDoseFilter] = useState<DoseFilter>('all')
  const [preview, setPreview] = useState<PreviewSelection | null>(null)
  const today = localDate(now)
  const doses = scheduledDoses(medications, logs, today)
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (selectedProfileName || '').split(' ')[0]
  const nowTime = clockTime(now)
  const upcoming = Array.from({ length: 7 }, (_, offset) => {
    const day = localDate(addDays(now, offset))
    return scheduledDoses(medications, logs, day).filter(
      (d) => !d.log && (offset > 0 || d.time >= nowTime),
    )
  })
    .flat()
    .slice(0, 4)
  const logging = loggingProgress(logs, now)
  const pendingFollowUps = followUps
    .filter((item) => item.status === 'pending')
    .sort(
      (a, b) =>
        a.due_date.localeCompare(b.due_date) || a.id.localeCompare(b.id),
    )
    .slice(0, 4)
  const insights = dailyInsights({
    doses,
    medications,
    records,
    logging,
    now,
  })
  const setup = [
    {
      complete: !!selectedHealthProfile,
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
        <div className="grid min-w-0 gap-5">
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
              aria-label="Upload prescription"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                <Upload size={22} />
              </span>
              <span>
                <span className="block text-sm font-medium">
                  Upload prescription
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Upload, read text, then review
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
            <Link
              to="/profile"
              className="quick-access tint-mint sm:col-span-2"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                <ShieldCheck size={22} />
              </span>
              <span>
                <span className="block text-sm font-medium">
                  Health profile
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Your important details
                </span>
              </span>
            </Link>
          </nav>
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
        </div>
        <div className="daybook-summary grid min-w-0 gap-5">
          {pendingFollowUps.length > 0 && (
            <Panel className="daybook-secondary">
              <SectionTitle
                title="Pending follow-ups"
                description="Saved return dates, not booked appointments."
              />
              <ul className="divide-y">
                {pendingFollowUps.map((followUp) => (
                  <li key={followUp.id}>
                    <Link
                      to={`/medical-records?visit=${encodeURIComponent(followUp.visit_id)}`}
                      className="flex min-h-11 items-center justify-between gap-3 py-3 text-sm hover:text-primary"
                    >
                      <span className="min-w-0">
                        <span className="block break-words font-medium">
                          {visits.find(
                            (visit) => visit.id === followUp.visit_id,
                          )?.title ?? 'View visit'}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {displayDate(followUp.due_date)}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs">
                        {followUp.due_date < today
                          ? 'Past due'
                          : followUp.due_date === today
                            ? 'Today'
                            : 'Upcoming'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
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
        <div className="daybook-activity min-w-0">
          <Panel className="daybook-secondary tint-mint grid min-w-0 gap-6 min-[900px]:grid-cols-2">
            <WeekActivityChart days={weekBreakdown(medications, logs, now)} />
            <div className="min-w-0 border-t pt-5 min-[900px]:border-t-0 min-[900px]:border-l min-[900px]:pt-0 min-[900px]:pl-6">
              <AdherenceRing value={adherence30(logs, now)} />
              <LoggingMilestones value={logging} />
            </div>
          </Panel>
        </div>
      </section>
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
