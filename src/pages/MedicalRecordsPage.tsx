import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FolderHeart, Search } from 'lucide-react'
import { useVault } from '../contexts/DataContext'
import { useMutation } from '../hooks/useMutation'
import { useQueryParams } from '../hooks/useQueryParams'
import { categories } from '../lib/utils'
import { deleteRecord } from '../lib/records'
import type { MedicalRecord } from '../lib/database.types'
import {
  PageTitle,
  EmptyState,
  Field,
  SelectField,
  ConfirmationDialog,
  SafetyNote,
} from '../components/common'
import { Button } from '../components/ui/button'
import { MedicalRecordCard } from '../components/MedicalRecordCard'
import { UploadDialog } from '../components/UploadDialog'

export default function MedicalRecordsPage() {
  const navigate = useNavigate()
  const { records, medications } = useVault()
  const [params, updateParams] = useQueryParams()
  const selected = params.get('record')
  const [edit, setEdit] = useState<MedicalRecord | null>(null)
  const [remove, setRemove] = useState<MedicalRecord | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest')
  const mutation = useMutation()
  const upload = params.get('action') === 'upload'
  const filtered = records
    .filter(
      (r) =>
        (!selected || r.id === selected) &&
        (!category || r.category === category) &&
        `${r.title} ${r.provider} ${r.file_name}`
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
  function close() {
    setEdit(null)
    updateParams({ action: null }, { replace: true })
  }
  async function confirmDelete() {
    if (
      remove &&
      (await mutation.run(
        () => deleteRecord(remove),
        'Medical record deleted.',
      ))
    )
      setRemove(null)
  }
  return (
    <>
      <PageTitle
        title="Medical records"
        description="All your important documents. Organized, private, and easy to find."
        action={
          <Button onClick={() => updateParams({ action: 'upload' })}>
            <Upload />
            Upload record
          </Button>
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
        <div className="min-w-0 basis-full sm:flex-1">
          <Field
            label="Search records"
            placeholder="Search by title, provider, or file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            label="Category"
            value={category}
            onValueChange={setCategory}
            options={[
              { value: '', label: 'All categories' },
              ...Object.entries(categories).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </div>
        <span className="pb-3 text-xs text-muted-foreground">
          {filtered.length} record{filtered.length !== 1 && 's'}
        </span>
      </div>
      {filtered.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((record) => (
            <MedicalRecordCard
              key={record.id}
              record={record}
              onEdit={() => setEdit(record)}
              onDelete={() => setRemove(record)}
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
      ) : (
        <div className="rounded-2xl border bg-card">
          <EmptyState
            icon={search || category ? Search : FolderHeart}
            title={
              records.length ? 'No matching records' : 'Your vault is ready'
            }
            description={
              records.length
                ? 'Try a different search or category.'
                : 'Upload your first prescription, lab report, or medical document to keep it safely organized.'
            }
            action={
              records.length ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setCategory('')
                    setOrder('newest')
                    updateParams({ record: null })
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => updateParams({ action: 'upload' })}>
                  <Upload />
                  Upload your first record
                </Button>
              )
            }
          />
        </div>
      )}
      {(upload || edit) && (
        <UploadDialog
          key={edit?.id ?? 'new'}
          onClose={close}
          record={edit ?? undefined}
        />
      )}
      <ConfirmationDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        title="Delete this medical record?"
        description={`"${remove?.title}" and its uploaded file will be permanently removed. Linked medications and saved prescription wording will remain, without the file link. This cannot be undone.`}
        busy={mutation.pending}
        onConfirm={() => void confirmDelete()}
      />
      <SafetyNote />
    </>
  )
}
