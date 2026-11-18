/**
 * Medical-record workspace. Coordinates local metadata search, important marks, visit
 * grouping, route-driven dialogs and confirmed deletion for one profile.
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  FolderHeart,
  ChevronDown,
  ChevronRight,
  Star,
  Pencil,
  Search,
  Trash2,
  Upload,
  ClipboardList,
} from 'lucide-react'
import { useVault } from '@/contexts/DataContext'
import { useMutation } from '@/hooks/useMutation'
import { useQueryParams } from '@/hooks/useQueryParams'
import { documentKinds, localDate } from '@/lib/utils'
import { api } from '@/lib/api'
import { deleteRecord } from '../lib/records'
import type { CareVisit, MedicalRecord } from '@shared/database.types'
import {
  PageTitle,
  EmptyState,
  Field,
  SelectField,
  ConfirmationDialog,
  SafetyNote,
  SectionTitle,
} from '@/components/common'
import { Button } from '@/components/ui/button'
import { MedicalRecordCard } from '../components/MedicalRecordCard'
import { UploadDialog } from '../components/UploadDialog'
import { CareDialog } from '../components/CareDialog'
import {
  RecordPreview,
  type PreviewSelection,
} from '../components/RecordPreview'
import { FollowUpDialog } from '../components/FollowUpDialog'
import { ReviewedResults } from '../components/ReviewedResults'
import { RecordResultsDialog } from '../components/RecordResultsDialog'

type Removal =
  { type: 'record'; item: MedicalRecord } | { type: 'visit'; item: CareVisit }

type CareDialogState = { kind: 'visit'; visit?: CareVisit }

/** Reset record-workspace selections when the selected managed profile changes. */
export default function MedicalRecordsPage() {
  const { selectedFamilyMemberId } = useVault()
  return <RecordsWorkspace key={selectedFamilyMemberId} />
}

/**
 * Filter already loaded record metadata and connect discovery views to upload,
 * preview, care and result workflows.
 */
function RecordsWorkspace() {
  const navigate = useNavigate()
  const {
    records,
    medications,
    careTracks,
    visits,
    reload,
    selectedFamilyMemberId,
    familyMembers,
    followUps,
    now,
  } = useVault()
  const [params, updateParams] = useQueryParams()
  const selected = params.get('record')
  const selectedVisit = params.get('visit')
  const [edit, setEdit] = useState<MedicalRecord | null>(null)
  const [remove, setRemove] = useState<Removal | null>(null)
  const [preview, setPreview] = useState<PreviewSelection | null>(null)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('')
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest')
  const [importantOnly, setImportantOnly] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [followUpVisit, setFollowUpVisit] = useState<CareVisit | null>(null)
  const [careDialog, setCareDialog] = useState<CareDialogState | null>(null)
  const [defaultVisitId, setDefaultVisitId] = useState('')
  const results = useRef<HTMLSpanElement>(null)
  const mutation = useMutation()
  const upload = params.get('action') === 'upload'
  const showResults = params.get('view') === 'results'
  const filtered = records
    .filter(
      (record) =>
        (!selected || record.id === selected) &&
        (!selectedVisit || record.visit_id === selectedVisit) &&
        (!importantOnly || record.is_favourite) &&
        (!kind || record.document_kind === kind) &&
        `${record.title} ${record.provider} ${record.file_name}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        (order === 'newest'
          ? b.record_date.localeCompare(a.record_date)
          : a.record_date.localeCompare(b.record_date)) ||
        b.created_at.localeCompare(a.created_at) ||
        a.id.localeCompare(b.id),
    )
  const hasDocumentConstraints = Boolean(
    selected || search.trim() || kind || importantOnly,
  )
  const visibleVisits = visits
    .filter(
      (visit) =>
        (!selectedVisit || visit.id === selectedVisit) &&
        (!hasDocumentConstraints ||
          filtered.some((record) => record.visit_id === visit.id)),
    )
    .sort(
      (a, b) =>
        (order === 'newest'
          ? b.visit_date.localeCompare(a.visit_date)
          : a.visit_date.localeCompare(b.visit_date)) ||
        a.id.localeCompare(b.id),
    )
  const unassigned = filtered.filter((record) => !record.visit_id)
  const pendingFollowUps = followUps
    .filter((item) => item.status === 'pending')
    .sort(
      (a, b) =>
        a.due_date.localeCompare(b.due_date) || a.id.localeCompare(b.id),
    )
  const linkedVisitId = selected
    ? records.find((record) => record.id === selected)?.visit_id
    : selectedVisit
  useEffect(() => {
    // Reveal externally selected visit/record links without resetting discovery controls.
    if (linkedVisitId) {
      // oxlint-disable-next-line react/set-state-in-effect
      setExpanded((current) => new Set(current).add(linkedVisitId))
    }
  }, [linkedVisitId, selected, selectedVisit])
  const selectedMember =
    familyMembers.find((member) => member.id === selectedFamilyMemberId)
      ?.full_name ?? 'selected profile'
  const currentFollowUpVisit = visits.find(
    (visit) => visit.id === followUpVisit?.id,
  )

  /**
   * Clear upload-only defaults and the URL action without removing unrelated
   * discovery state.
   */
  function closeUpload() {
    setEdit(null)
    setDefaultVisitId('')
    updateParams({ action: null }, { replace: true })
  }

  /** Reset document discovery controls and record/visit deep links together. */
  function clearFilters() {
    setSearch('')
    setKind('')
    setOrder('newest')
    setImportantOnly(false)
    updateParams({ record: null, visit: null })
  }

  /** Open the route-driven upload form, optionally preselecting a visit. */
  function openUpload(visitId = '') {
    setDefaultVisitId(visitId)
    updateParams({ action: 'upload' })
  }

  /**
   * Apply the selected record/visit deletion and leave confirmation available if
   * persistence fails.
   */
  async function confirmDelete() {
    if (!remove) return
    const saved = await mutation.run(
      async () => {
        if (remove.type === 'record') await deleteRecord(remove.item)
        else await api.care.removeVisit(remove.item.id)
        await reload()
      },
      `${remove.type === 'record' ? 'Medical record' : 'Visit'} deleted.`,
    )
    if (saved) setRemove(null)
  }

  /**
   * Wire each record card to workspace-owned preview, edit, deletion and
   * prescription-scanning actions.
   */
  function renderRecords(items: MedicalRecord[]) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((record) => (
          <MedicalRecordCard
            key={record.id}
            record={record}
            onPreview={(item, trigger) => setPreview({ record: item, trigger })}
            onEdit={() => setEdit(record)}
            onDelete={() => setRemove({ type: 'record', item: record })}
            onUnmarkImportant={
              importantOnly ? () => results.current?.focus() : undefined
            }
            linkedCount={
              medications.filter(
                (medication) => medication.source_record_id === record.id,
              ).length
            }
            onScan={() =>
              navigate(`/medications?action=scan&source=${record.id}`)
            }
          />
        ))}
      </div>
    )
  }

  /**
   * Compose a visit group from currently filtered records while retaining its
   * care/follow-up actions.
   */
  function renderVisit(visit: CareVisit) {
    const linkedRecords = filtered.filter(
      (record) => record.visit_id === visit.id,
    )
    const totalRecords = records.filter(
      (record) => record.visit_id === visit.id,
    )
    const medicationCount = medications.filter((item) =>
      totalRecords.some((record) => record.id === item.source_record_id),
    ).length
    const followUp = followUps.find((item) => item.visit_id === visit.id)
    const track = careTracks.find((item) => item.id === visit.care_track_id)
    const isExpanded = expanded.has(visit.id)
    return (
      <article
        key={visit.id}
        className="min-w-0 overflow-hidden rounded-2xl border bg-card"
      >
        <button
          type="button"
          className="flex w-full min-w-0 items-start gap-3 p-4 text-left hover:bg-muted/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:p-5"
          aria-expanded={isExpanded}
          aria-controls={`visit-${visit.id}`}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} visit ${visit.title}`}
          onClick={() =>
            setExpanded((current) => {
              const next = new Set(current)
              if (next.has(visit.id)) next.delete(visit.id)
              else next.add(visit.id)
              return next
            })
          }
        >
          <span
            className="mt-1 shrink-0 text-muted-foreground"
            aria-hidden="true"
          >
            {isExpanded ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <time
              dateTime={visit.visit_date}
              className="text-xs font-medium text-primary"
            >
              {visit.visit_date}
            </time>
            <span className="mt-1 block break-words font-semibold">
              {visit.title}
            </span>
            <span className="mt-1 block break-words text-xs text-muted-foreground">
              {visit.provider || 'Hospital / Doctor not recorded'}
              {track ? ` · ${track.title}` : ' · Standalone visit'}
            </span>
            <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                {hasDocumentConstraints
                  ? `${linkedRecords.length} of ${totalRecords.length}`
                  : totalRecords.length}{' '}
                document{totalRecords.length !== 1 ? 's' : ''}
              </span>
              <span>
                {medicationCount} linked medication
                {medicationCount !== 1 ? 's' : ''}
              </span>
              {followUp && (
                <span className="font-medium text-primary">
                  Follow-up {followUp.status} · {followUp.due_date}
                </span>
              )}
            </span>
          </span>
        </button>
        {isExpanded && (
          <div
            id={`visit-${visit.id}`}
            role="region"
            aria-label={`${visit.title} details`}
            className="min-w-0 border-t p-4 sm:p-5"
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                aria-label={`Edit visit ${visit.title}`}
                onClick={() => setCareDialog({ kind: 'visit', visit })}
              >
                <Pencil />
                Edit
              </Button>
              <Button variant="outline" onClick={() => openUpload(visit.id)}>
                <Upload />
                Add document
              </Button>
              <Button variant="outline" onClick={() => setFollowUpVisit(visit)}>
                <CalendarDays />
                {followUp ? 'Edit follow-up' : 'Add follow-up'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete visit ${visit.title}`}
                onClick={() => setRemove({ type: 'visit', item: visit })}
              >
                <Trash2 />
              </Button>
            </div>
            {visit.reason && (
              <p className="mb-3 break-words text-sm text-muted-foreground">
                {visit.reason}
              </p>
            )}
            {followUp && (
              <div className="mb-4 space-y-1 rounded-xl bg-muted/50 p-3 text-sm">
                <p className="font-medium">
                  Follow-up due {followUp.due_date} · {followUp.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  Not a booked appointment.
                </p>
                {followUp.instruction && (
                  <p className="whitespace-pre-wrap break-words">
                    {followUp.instruction}
                  </p>
                )}
                {followUp.completed_visit_id && (
                  <Button
                    variant="link"
                    className="max-w-full whitespace-normal px-0 text-left"
                    onClick={() =>
                      updateParams({
                        record: null,
                        visit: followUp.completed_visit_id,
                      })
                    }
                  >
                    View actual return visit
                  </Button>
                )}
              </div>
            )}
            {visit.notes && (
              <p className="mb-4 whitespace-pre-wrap rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                {visit.notes}
              </p>
            )}
            {linkedRecords.length ? (
              renderRecords(linkedRecords)
            ) : (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No documents are attached to this visit yet.
              </p>
            )}
          </div>
        )}
      </article>
    )
  }

  return (
    <>
      <PageTitle
        title="Medical records"
        description="Build a private, profile-based timeline of visits and the documents that belong to them."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => updateParams({ action: 'results' })}
            >
              <ClipboardList /> Review results
            </Button>
            <Button
              variant="outline"
              onClick={() => setCareDialog({ kind: 'visit' })}
            >
              <CalendarDays />
              Add visit
            </Button>
            <Button onClick={() => openUpload()}>
              <Upload />
              Upload record
            </Button>
          </div>
        }
      />
      <div
        className="mb-5 flex w-fit max-w-full gap-1 rounded-2xl border bg-card p-1"
        role="group"
        aria-label="Medical record views"
      >
        <Button
          variant={showResults ? 'ghost' : 'secondary'}
          aria-pressed={!showResults}
          onClick={() => updateParams({ view: null })}
        >
          Documents
        </Button>
        <Button
          variant={showResults ? 'secondary' : 'ghost'}
          aria-pressed={showResults}
          onClick={() => updateParams({ view: 'results' })}
        >
          Test results
        </Button>
      </div>
      {showResults ? (
        <ReviewedResults
          recordId={selected ?? undefined}
          onReview={() => updateParams({ action: 'results' })}
        />
      ) : (
        <>
          {(selected || selectedVisit) && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-4">
              <p className="text-sm">
                {selected
                  ? 'Showing the linked medical record.'
                  : 'Showing the selected visit.'}
              </p>
              <Button
                variant="outline"
                onClick={() => updateParams({ record: null, visit: null })}
              >
                Show all records
              </Button>
            </div>
          )}
          <div className="mb-6 rounded-2xl border bg-card p-4 sm:p-5">
            <div className="grid min-w-0 items-end gap-4 sm:grid-cols-2 min-[90rem]:grid-cols-[minmax(0,1fr)_190px_175px_auto]">
              <div className="min-w-0">
                <Field
                  label="Search records"
                  className="h-12 min-h-12"
                  placeholder="Search by title, hospital, doctor, or file name..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="min-w-0">
                <SelectField
                  className="h-12 min-h-12"
                  label="Document type"
                  value={kind}
                  onValueChange={setKind}
                  options={[
                    { value: '', label: 'All document types' },
                    ...Object.entries(documentKinds).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                />
              </div>
              <div className="min-w-0">
                <SelectField
                  label="Date order"
                  className="h-12 min-h-12"
                  value={order}
                  options={[
                    { value: 'newest', label: 'Newest first' },
                    { value: 'oldest', label: 'Oldest first' },
                  ]}
                  onValueChange={(value) => {
                    if (value === 'newest' || value === 'oldest')
                      setOrder(value)
                  }}
                />
              </div>
              <div className="min-w-0">
                <p
                  id="records-important-label"
                  className="text-sm leading-5 font-medium"
                >
                  Marked records
                </p>
                <Button
                  variant="outline"
                  className="mt-2 h-12 min-h-12 w-full rounded-xl"
                  aria-describedby="records-important-label"
                  aria-pressed={importantOnly}
                  onClick={() => setImportantOnly((value) => !value)}
                >
                  <Star aria-hidden="true" />
                  Important!
                </Button>
              </div>
            </div>
            <span
              ref={results}
              tabIndex={-1}
              role="status"
              aria-label="Record results"
              className="mt-4 block text-xs text-muted-foreground focus:outline-2 focus:outline-offset-4 focus:outline-ring"
            >
              {filtered.length} record{filtered.length !== 1 && 's'}
            </span>
          </div>

          {pendingFollowUps.length > 0 && (
            <section
              aria-label="Pending follow-ups"
              className="mb-6 rounded-2xl border bg-card p-4 sm:p-5"
            >
              <SectionTitle
                title="Follow-ups due"
                description="Manually recorded return dates, not booked appointments. Shown independently of document filters."
              />
              <ul className="divide-y">
                {pendingFollowUps.map((item) => {
                  const visit = visits.find(
                    (visit) => visit.id === item.visit_id,
                  )
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium">
                          {visit?.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.due_date} ·{' '}
                          {item.due_date < localDate(now)
                            ? 'Past due date'
                            : item.due_date === localDate(now)
                              ? 'Due today'
                              : 'Upcoming'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        aria-label={`Open follow-up for ${visit?.title}`}
                        onClick={() => {
                          setSearch('')
                          setKind('')
                          setImportantOnly(false)
                          updateParams({ record: null, visit: item.visit_id })
                        }}
                      >
                        Open visit
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
          <div className="space-y-7">
            {!visibleVisits.length &&
            !filtered.length &&
            (hasDocumentConstraints || selectedVisit) ? (
              <EmptyState
                icon={Search}
                title="No matching records or visits"
                description="The linked item may no longer be available for this profile, or the current filters hide it."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                {visibleVisits.length > 0 && (
                  <section aria-label="Visit timeline" className="space-y-3">
                    <SectionTitle
                      title="Visit timeline"
                      description="Visits are ordered by visit date; documents within each visit use their own record dates. Expand a visit for details."
                    />
                    {visibleVisits.map(renderVisit)}
                  </section>
                )}
                {unassigned.length > 0 ? (
                  <section className="space-y-4">
                    <SectionTitle
                      title="Unassigned records"
                      description={`Documents for ${selectedMember} that are not attached to a visit.`}
                    />
                    {renderRecords(unassigned)}
                  </section>
                ) : (
                  !visits.length &&
                  !records.length && (
                    <EmptyState
                      icon={FolderHeart}
                      title={
                        records.length
                          ? 'No unassigned records'
                          : 'Your vault is ready'
                      }
                      description={
                        records.length
                          ? 'Attach documents to a visit or upload a new record.'
                          : 'Add a visit or upload your first prescription, lab report, or medical document.'
                      }
                      action={
                        <Button onClick={() => openUpload()}>
                          <Upload />
                          Upload record
                        </Button>
                      }
                    />
                  )
                )}
              </>
            )}
          </div>
        </>
      )}

      {params.get('action') === 'results' && (
        <RecordResultsDialog
          recordId={selected ?? undefined}
          onClose={() => updateParams({ action: null }, { replace: true })}
        />
      )}

      {currentFollowUpVisit && (
        <FollowUpDialog
          key={`${currentFollowUpVisit.id}:${currentFollowUpVisit.visit_date}`}
          visit={currentFollowUpVisit}
          followUp={followUps.find(
            (item) => item.visit_id === currentFollowUpVisit.id,
          )}
          onClose={() => setFollowUpVisit(null)}
        />
      )}
      {(upload || edit) && (
        <UploadDialog
          key={edit?.id ?? `${defaultVisitId || 'new'}`}
          onClose={closeUpload}
          record={edit ?? undefined}
          defaultVisitId={defaultVisitId}
        />
      )}
      {careDialog && (
        <CareDialog
          key={careDialog.visit?.id ?? 'new'}
          kind={careDialog.kind}
          visit={careDialog.visit}
          onClose={() => setCareDialog(null)}
        />
      )}
      {preview && (
        <RecordPreview
          key={preview.record.id}
          selection={preview}
          available={records.some((record) => record.id === preview.record.id)}
          onClose={() => setPreview(null)}
        />
      )}
      <ConfirmationDialog
        open={remove?.type === 'record'}
        onClose={() => setRemove(null)}
        title="Delete this medical record?"
        description={`"${remove?.type === 'record' ? remove.item.title : ''}" and its uploaded file will be permanently removed. Reviewed result history, synced profile values, linked medications and saved prescription wording will remain, without the file link. This cannot be undone.`}
        busy={mutation.pending}
        onConfirm={() => void confirmDelete()}
      />
      <ConfirmationDialog
        open={remove?.type === 'visit'}
        onClose={() => setRemove(null)}
        title="Delete this visit?"
        description={`Documents attached to "${remove?.type === 'visit' ? remove.item.title : ''}" will remain in Unassigned records. Its follow-up will be removed; other follow-ups linked to this return visit keep their status without that link.`}
        busy={mutation.pending}
        onConfirm={() => void confirmDelete()}
      />
      <SafetyNote />
    </>
  )
}
