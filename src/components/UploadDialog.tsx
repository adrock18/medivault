import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UploadCloud } from 'lucide-react'
import { useMutation } from '../hooks/useMutation'
import { recordSchema, type RecordValues } from '../lib/schemas'
import { categories, localDate } from '../lib/utils'
import { uploadRecord } from '../lib/records'
import { api } from '../lib/api'
import type { Category, MedicalRecord } from '../lib/database.types'
import {
  Field,
  SelectField,
  FormDialog,
  ErrorState,
  SubmitButton,
} from './common'
import { Button } from './ui/button'

export function UploadDialog({
  onClose,
  record,
  defaultCategory = 'lab_report',
  onUploaded,
}: {
  onClose: () => void
  record?: MedicalRecord
  defaultCategory?: Category
  onUploaded?: (record: MedicalRecord) => void
}) {
  const mutation = useMutation()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecordValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: record
      ? {
          title: record.title,
          category: record.category,
          provider: record.provider,
          record_date: record.record_date,
        }
      : {
          title: '',
          category: defaultCategory,
          provider: '',
          record_date: localDate(),
        },
  })
  async function submit(values: RecordValues) {
    if (!record && !file) {
      setFileError('Choose a PDF, JPG, or PNG document.')
      return
    }
    setFileError(null)
    let uploaded: MedicalRecord | undefined
    const saved = await mutation.run(
      async () => {
        if (record) {
          await api.records.update(record.id, values)
        } else {
          uploaded = await uploadRecord(values, file!)
        }
      },
      record
        ? 'Record details updated.'
        : 'Document uploaded to your private vault.',
    )
    if (saved) {
      if (uploaded) onUploaded?.(uploaded)
      onClose()
    }
  }
  return (
    <FormDialog
      open
      onClose={onClose}
      busy={mutation.pending}
      title={record ? 'Edit record details' : 'Upload a medical record'}
      description="Keep important documents together in your private vault."
    >
      <form onSubmit={handleSubmit(submit)} noValidate>
        <fieldset disabled={mutation.pending} className="space-y-5">
          {!record && (
            <div className="rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 p-5">
              <UploadCloud className="mx-auto mb-3 text-primary" size={28} />
              <Field
                label="Choose document *"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setFileError(null)
                }}
                error={fileError ?? undefined}
                hint="PDF, JPG, or PNG. Maximum 10 MB."
                className="h-auto bg-card py-2"
              />
            </div>
          )}
          <Field
            label="Document title *"
            placeholder="e.g. Annual blood test"
            registration={register('title')}
            error={errors.title?.message}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Category *"
              registration={register('category')}
              error={errors.category?.message}
            >
              {Object.entries(categories).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <Field
              label="Record date *"
              type="date"
              max={localDate()}
              registration={register('record_date')}
              error={errors.record_date?.message}
            />
          </div>
          <Field
            label="Hospital or doctor"
            placeholder="e.g. Riverside Medical Center"
            registration={register('provider')}
            error={errors.provider?.message}
          />
          {mutation.error && <ErrorState message={mutation.error} />}
          <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton busy={mutation.pending}>
              {record ? 'Save details' : 'Upload document'}
            </SubmitButton>
          </div>
        </fieldset>
      </form>
    </FormDialog>
  )
}
