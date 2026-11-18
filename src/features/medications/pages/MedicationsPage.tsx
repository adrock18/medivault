/**
 * Medication workspace controller. Connects list/calendar views, route-driven
 * add/scan workflows and confirmed medication deletion.
 */

import { useRef, useState } from 'react'
import { Plus, Pill, CheckCheck, Clock3, Upload } from 'lucide-react'
import { subDays } from 'date-fns'
import { useVault } from '@/contexts/DataContext'
import { useMutation } from '@/hooks/useMutation'
import { useQueryParams } from '@/hooks/useQueryParams'
import type { Medication } from '@shared/database.types'
import {
  medicationStatus,
  scheduledDoses,
  localDate,
  displayDate,
  cn,
} from '@/lib/utils'
import { api } from '@/lib/api'
import {
  PageTitle,
  Panel,
  SectionTitle,
  StatCard,
  EmptyState,
  ConfirmationDialog,
  SafetyNote,
  Field,
} from '@/components/common'
import { Button } from '@/components/ui/button'
import { MedicationForm } from '../components/MedicationForm'
import { MedicationCard } from '../components/MedicationCard'
import { DoseSchedule } from '../components/DoseSchedule'
import { MedicationReminder } from '../components/MedicationReminder'
import { PrescriptionScanner } from '../components/PrescriptionScanner'
import { MedicationCalendar } from '../components/MedicationCalendar'

/**
 * Coordinate selected-profile medications and functional create/edit/scan/delete
 * dialogs.
 */
export default function MedicationsPage() {
  const { medications, logs, now, records } = useVault()
  const todaySchedule = useRef<HTMLDivElement>(null)
  const [params, updateParams] = useQueryParams()
  const record = params.get('record')
  const [edit, setEdit] = useState<Medication | null>(null)
  const [remove, setRemove] = useState<Medication | null>(null)
  const [filter, setFilter] = useState(record ? 'all' : 'active')
  const [scopedRecord, setScopedRecord] = useState(record)
  const [search, setSearch] = useState('')
  // Entering a record's linked view (including on an already-mounted page)
  // starts with every status so upcoming/completed links are not hidden.
  if (record !== scopedRecord) {
    setScopedRecord(record)
    if (record) setFilter('all')
  }
  const mutation = useMutation()
  const today = localDate(now)
  const doses = scheduledDoses(medications, logs, today)
  const history = logs.filter(
    (log) =>
      log.scheduled_date >= localDate(subDays(now, 29)) &&
      log.scheduled_date <= today,
  )
  const taken = history.filter((log) => log.status === 'taken').length
  const visible = medications.filter(
    (med) =>
      (!record || med.source_record_id === record) &&
      (filter === 'all' || medicationStatus(med, today) === filter) &&
      med.name.toLowerCase().includes(search.trim().toLowerCase()),
  )
  function close() {
    setEdit(null)
    updateParams({ action: null, source: null }, { replace: true })
  }
  /**
   * Delete only the explicitly selected medication and close confirmation after
   * server success.
   */
  async function confirmDelete() {
    if (!remove) return
    if (
      await mutation.run(async () => {
        await api.medications.remove(remove.id)
      }, 'Medication and its dose logs deleted.')
    )
      setRemove(null)
  }
  return (
    <>
      <PageTitle
        title="Medications"
        description="A little structure for your daily routine. Always follow your prescription."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => updateParams({ action: 'scan' })}
            >
              <Upload />
              Upload prescription
            </Button>
            <Button onClick={() => updateParams({ action: 'add' })}>
              <Plus />
              Add medication
            </Button>
          </div>
        }
      />
      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Active medications"
          className="tint-lavender"
          value={
            medications.filter((m) => medicationStatus(m, today) === 'active')
              .length
          }
          subtitle="Within their scheduled treatment dates"
          icon={Pill}
        />
        <StatCard
          title="Today's doses"
          className="tint-sky"
          value={`${doses.filter((d) => d.log?.status === 'taken').length} / ${doses.length}`}
          subtitle="Taken / scheduled today"
          icon={Clock3}
        />
        <StatCard
          title="Recorded adherence"
          className="tint-mint"
          value={
            history.length
              ? `${Math.round((taken / history.length) * 100)}%`
              : '--'
          }
          subtitle="Taken / logged doses, last 30 days (not unlogged doses)"
          icon={CheckCheck}
        />
      </div>
      {record && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-4">
          <p className="text-sm">
            Showing medications linked to the selected record.
          </p>
          <Button
            variant="outline"
            onClick={() => updateParams({ record: null })}
          >
            Show all medications
          </Button>
        </div>
      )}
      <div
        ref={todaySchedule}
        tabIndex={-1}
        aria-label="Today's actionable schedule"
        className="routine-panel tint-sky mb-7"
      >
        <SectionTitle
          title="Today's schedule"
          description={`${displayDate(today)}, in your local time. Updates while this page is open.`}
        />
        <DoseSchedule doses={doses} />
        <div className="mt-7 border-t pt-5">
          <MedicationReminder doses={doses} now={now} />
        </div>
      </div>
      <MedicationCalendar
        key={record ?? 'all'}
        recordId={record}
        onToday={() => todaySchedule.current?.focus()}
      />
      <section aria-label="Medication collection" className="mt-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Your medications</h2>
          <p role="status" className="text-xs text-muted-foreground">
            {visible.length} medication{visible.length === 1 ? '' : 's'} shown
          </p>
        </div>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div
            role="group"
            aria-label="Medication status"
            className="flex max-w-full flex-wrap gap-1 rounded-2xl border bg-card p-1"
          >
            {['active', 'upcoming', 'completed', 'all'].map((value) => (
              <Button
                key={value}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  'min-h-11 capitalize',
                  filter === value && 'bg-primary/10 text-primary',
                )}
              >
                {value}
              </Button>
            ))}
          </div>
          <div className="min-w-0 basis-full sm:max-w-sm sm:flex-1 sm:basis-64">
            <Field
              label="Search medications"
              placeholder="Search by medicine name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        {visible.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {visible.map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                sourceRecord={records.find(
                  (record) => record.id === med.source_record_id,
                )}
                day={today}
                onEdit={() => setEdit(med)}
                onDelete={() => setRemove(med)}
              />
            ))}
          </div>
        ) : (
          <Panel>
            <EmptyState
              icon={Pill}
              title={
                medications.length
                  ? 'No matching medications'
                  : 'Your medication space is ready'
              }
              description={
                medications.length
                  ? 'Try a different medicine name or status filter.'
                  : 'Add an existing prescription to organize its schedule and keep track of your doses.'
              }
              action={
                medications.length ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('')
                      setFilter('active')
                      updateParams({ record: null })
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={() => updateParams({ action: 'add' })}>
                    <Plus />
                    Add medication
                  </Button>
                )
              }
            />
          </Panel>
        )}
      </section>
      <Panel className="mt-6">
        <SectionTitle
          title="Dose history"
          description="Recorded outcomes from the last 30 days. Unlogged doses are not counted as taken or skipped."
        />
        {history.length ? (
          <div
            className="max-h-80 max-w-full overflow-auto"
            tabIndex={0}
            role="region"
            aria-label="Dose history table"
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Scheduled date</th>
                  <th>Time</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id}>
                    <td className="min-w-36 max-w-64 break-words">
                      {medications.find((m) => m.id === log.medication_id)
                        ?.name ?? 'Removed medication'}
                    </td>
                    <td>{displayDate(log.scheduled_date)}</td>
                    <td>{log.scheduled_time}</td>
                    <td>
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-xs capitalize',
                          log.status === 'taken'
                            ? 'bg-teal-50 text-primary'
                            : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No dose logs yet"
            description="Mark today's doses as taken or skipped to start building your history."
          />
        )}
      </Panel>
      {(params.get('action') === 'add' || edit) && (
        <MedicationForm
          key={edit?.id ?? 'new'}
          medication={edit ?? undefined}
          onClose={close}
        />
      )}
      {params.get('action') === 'scan' && (
        <PrescriptionScanner
          recordId={params.get('source') ?? ''}
          onClose={close}
        />
      )}
      <ConfirmationDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        title="Delete this medication?"
        description={`"${remove?.name}" and all its dose logs will be permanently deleted. This does not change your clinician's prescription.`}
        busy={mutation.pending}
        onConfirm={() => void confirmDelete()}
      />
      <SafetyNote />
    </>
  )
}
