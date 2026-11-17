import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  FolderHeart,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { useVault } from '@/contexts/DataContext'
import { useMutation } from '@/hooks/useMutation'
import { useQueryParams } from '@/hooks/useQueryParams'
import { documentKinds } from '@/lib/utils'
import { api } from '@/lib/api'
import { deleteRecord } from '../lib/records'
import type {
  CareTrack,
  CareVisit,
  MedicalRecord,
} from '@shared/database.types'
import {
  PageTitle,
  EmptyState,
  Field,
  SelectField,
  ConfirmationDialog,
  SafetyNote,
  Panel,
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

type Removal =
  | { type: 'record'; item: MedicalRecord }
  | { type: 'visit'; item: CareVisit }
  | { type: 'track'; item: CareTrack }

type CareDialogState =
  { kind: 'track'; track?: CareTrack } | { kind: 'visit'; visit?: CareVisit }

export default function MedicalRecordsPage() {
  const navigate = useNavigate()
  const {
    records,
    medications,
    careTracks,
    visits,
    reload,
    selectedFamilyMemberId,
    familyMembers,
  } = useVault()
  const [params, updateParams] = useQueryParams()
  const selected = params.get('record')
  const [edit, setEdit] = useState<MedicalRecord | null>(null)
  const [remove, setRemove] = useState<Removal | null>(null)
  const [preview, setPreview] = useState<PreviewSelection | null>(null)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('')
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest')
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [careDialog, setCareDialog] = useState<CareDialogState | null>(null)
  const [defaultVisitId, setDefaultVisitId] = useState('')
  const results = useRef<HTMLSpanElement>(null)
  const mutation = useMutation()
  const upload = params.get('action') === 'upload'
  const filtered = records
    .filter(
      (record) =>
        (!selected || record.id === selected) &&
        (!favouritesOnly || record.is_favourite) &&
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
  const filteredIds = new Set(filtered.map((record) => record.id))
  const selectedMember =
    familyMembers.find((member) => member.id === selectedFamilyMemberId)
      ?.full_name ?? 'selected profile'

  function closeUpload() {
    setEdit(null)
    setDefaultVisitId('')
    updateParams({ action: null }, { replace: true })
  }

  function openUpload(visitId = '') {
    setDefaultVisitId(visitId)
    updateParams({ action: 'upload' })
  }

  async function confirmDelete() {
    if (!remove) return
    const saved = await mutation.run(
      async () => {
        if (remove.type === 'record') await deleteRecord(remove.item)
        else if (remove.type === 'visit')
          await api.care.removeVisit(remove.item.id)
        else await api.care.removeTrack(remove.item.id)
        await reload()
      },
      `${remove.type === 'record' ? 'Medical record' : remove.type === 'visit' ? 'Visit' : 'Care track'} deleted.`,
    )
    if (saved) setRemove(null)
  }

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
            onUnfavourite={
              favouritesOnly ? () => results.current?.focus() : undefined
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

  function renderVisit(visit: CareVisit) {
    const linkedRecords = filtered.filter(
      (record) => record.visit_id === visit.id,
    )
    return (
      <Panel key={visit.id} className="border border-border/70 bg-card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-medium text-primary">
              <CalendarDays size={15} />
              {visit.visit_date} · {visit.setting.replaceAll('_', ' ')}
            </p>
            <h3 className="mt-2 break-words text-lg font-semibold">
              {visit.title}
            </h3>
            {visit.reason && (
              <p className="mt-1 break-words text-sm text-muted-foreground">
                {visit.reason}
              </p>
            )}
            {visit.provider && (
              <p className="mt-1 text-xs text-muted-foreground">
                {visit.provider}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label={`Edit visit ${visit.title}`}
              onClick={() => setCareDialog({ kind: 'visit', visit })}
            >
              <Pencil />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openUpload(visit.id)}
            >
              <Upload />
              Add document
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
        </div>
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
      </Panel>
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
              onClick={() => setCareDialog({ kind: 'track' })}
            >
              <Plus />
              Care track
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
      {selected && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-4">
          <p className="text-sm">Showing the linked medical record.</p>
          <Button
            variant="outline"
            onClick={() => updateParams({ record: null })}
          >
            Show all records
          </Button>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200/80 bg-card p-5">
        <div className="min-w-0 basis-full sm:min-w-64 sm:flex-1">
          <Field
            label="Search records"
            placeholder="Search by title, provider, or file name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="w-full sm:w-52">
          <SelectField
            label="Record date order"
            value={order}
            options={[
              { value: 'newest', label: 'Newest record date' },
              { value: 'oldest', label: 'Oldest record date' },
            ]}
            onValueChange={(value) => {
              if (value === 'newest' || value === 'oldest') setOrder(value)
            }}
          />
        </div>
        <div className="w-full sm:w-52">
          <SelectField
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
        <Button
          variant="outline"
          aria-pressed={favouritesOnly}
          onClick={() => setFavouritesOnly((value) => !value)}
        >
          Favourites only
        </Button>
        <span
          ref={results}
          tabIndex={-1}
          role="status"
          aria-label="Record results"
          className="pb-3 text-xs text-muted-foreground focus:outline-2 focus:outline-offset-4 focus:outline-ring"
        >
          {filtered.length} record{filtered.length !== 1 && 's'}
        </span>
      </div>

      <div className="space-y-7">
        {careTracks.map((track) => {
          const trackVisits = visits
            .filter((visit) => visit.care_track_id === track.id)
            .sort(
              (a, b) =>
                b.visit_date.localeCompare(a.visit_date) ||
                a.id.localeCompare(b.id),
            )
          return (
            <section key={track.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    {track.kind.replaceAll('_', ' ')} care track
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{track.title}</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit care track ${track.title}`}
                    onClick={() => setCareDialog({ kind: 'track', track })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete care track ${track.title}`}
                    onClick={() => setRemove({ type: 'track', item: track })}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              {trackVisits.length ? (
                <div className="space-y-4">{trackVisits.map(renderVisit)}</div>
              ) : (
                <p className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
                  No visits are linked to this track yet.
                </p>
              )}
            </section>
          )
        })}
        {visits.some((visit) => !visit.care_track_id) && (
          <section className="space-y-4">
            <SectionTitle
              title="Standalone visits"
              description="Visits that are not grouped into a care track."
            />
            <div className="space-y-4">
              {visits
                .filter((visit) => !visit.care_track_id)
                .sort((a, b) => b.visit_date.localeCompare(a.visit_date))
                .map(renderVisit)}
            </div>
          </section>
        )}
        <section className="space-y-4">
          <SectionTitle
            title="Unassigned records"
            description={`Documents for ${selectedMember} that are not attached to a visit.`}
          />
          {filtered.filter((record) => !record.visit_id).length ? (
            renderRecords(filtered.filter((record) => !record.visit_id))
          ) : records.some(
              (record) => !record.visit_id && !filteredIds.has(record.id),
            ) ? (
            <EmptyState
              icon={Search}
              title="No matching unassigned records"
              description="Try a different search, document type, or favourites filter."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setKind('')
                    setOrder('newest')
                    setFavouritesOnly(false)
                    updateParams({ record: null })
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={FolderHeart}
              title={
                records.length ? 'No unassigned records' : 'Your vault is ready'
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
          )}
        </section>
      </div>

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
          key={`${careDialog.kind}:${
            careDialog.kind === 'track'
              ? (careDialog.track?.id ?? 'new')
              : (careDialog.visit?.id ?? 'new')
          }`}
          kind={careDialog.kind}
          track={careDialog.kind === 'track' ? careDialog.track : undefined}
          visit={careDialog.kind === 'visit' ? careDialog.visit : undefined}
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
        description={`"${remove?.type === 'record' ? remove.item.title : ''}" and its uploaded file will be permanently removed. Linked medications and saved prescription wording will remain, without the file link. This cannot be undone.`}
        busy={mutation.pending}
        onConfirm={() => void confirmDelete()}
      />
      <ConfirmationDialog
        open={remove?.type === 'visit' || remove?.type === 'track'}
        onClose={() => setRemove(null)}
        title={`Delete this ${remove?.type === 'track' ? 'care track' : 'visit'}?`}
        description={
          remove?.type === 'track'
            ? `Visits in "${remove.item.title}" will remain as standalone visits.`
            : `Documents attached to "${remove?.type === 'visit' ? remove.item.title : ''}" will remain in Unassigned records.`
        }
        busy={mutation.pending}
        onConfirm={() => void confirmDelete()}
      />
      <SafetyNote />
    </>
  )
}
