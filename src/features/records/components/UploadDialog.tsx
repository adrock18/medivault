/**
 * Medical-record upload and metadata-edit form. Keeps new-file validation
 * distinct from editing metadata for an already stored private document.
 */

import { useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UploadCloud } from 'lucide-react'
import { useMutation } from '@/hooks/useMutation'
import { useVault } from '@/contexts/DataContext'
import { recordSchema, type RecordValues } from '@shared/schemas'
import { documentKinds, localDate } from '@/lib/utils'
import { uploadRecord } from '../lib/records'
import { api } from '@/lib/api'
import type { DocumentKind, MedicalRecord } from '@shared/database.types'
import {
  Field,
  SelectField,
  FormDialog,
  ErrorState,
  SubmitButton,
} from '@/components/common'
import { Button } from '@/components/ui/button'
import { DateField } from '@/components/DateField'

/**
 * Initialize record/profile/visit fields and coordinate a validated upload or
 * metadata edit.
 */
export function UploadDialog({
  onClose,
  record,
  defaultKind = 'lab_report',
  defaultVisitId = '',
  onUploaded,
}: {
  onClose: () => void
  record?: MedicalRecord
  defaultKind?: DocumentKind
  defaultVisitId?: string
  onUploaded?: (record: MedicalRecord) => void
}) {
  const { familyMembers, selectedFamilyMemberId, visits } = useVault()
  const mutation = useMutation()
  const fileId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const defaultVisit = visits.find((visit) => visit.id === defaultVisitId)
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<RecordValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: record
      ? {
          family_member_id: record.family_member_id,
          visit_id: record.visit_id ?? '',
          title: record.title,
          document_kind: record.document_kind,
          hospital_name: record.hospital_name,
          doctor_name: record.doctor_name,
          record_date: record.record_date,
        }
      : {
          family_member_id: selectedFamilyMemberId,
          visit_id: defaultVisitId,
          title: '',
          document_kind: defaultKind,
          hospital_name: defaultVisit?.hospital_name ?? '',
          doctor_name: defaultVisit?.doctor_name ?? '',
          record_date: localDate(),
        },
  })
  /**
   * Require a file only for new records, persist through the normal API and
   * notify callers only after success.
   */
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
          <SelectField
            label="For profile"
            value={record?.family_member_id ?? selectedFamilyMemberId}
            disabled
            onValueChange={() => undefined}
            options={familyMembers.map((member) => ({
              value: member.id,
              label: member.full_name,
            }))}
          />
          {!record && (
            <div>
              <input
                id={fileId}
                type="file"
                className="peer sr-only"
                aria-label="Choose document *"
                aria-invalid={!!fileError}
                aria-describedby={`${fileId}-help`}
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setFileError(null)
                }}
              />
              <label
                htmlFor={fileId}
                className="upload-chooser flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-input bg-slate-50 p-6 text-center transition-colors hover:border-primary hover:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring peer-disabled:pointer-events-none peer-disabled:opacity-50"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-card text-primary">
                  <UploadCloud size={24} />
                </span>
                <span className="max-w-full break-words text-sm font-medium">
                  {file ? file.name : 'Choose a document'}
                </span>
                <span className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                  {file ? 'Replace document' : 'Browse files'}
                </span>
              </label>
              <p
                id={`${fileId}-help`}
                className={
                  fileError
                    ? 'mt-2 text-xs text-red-700'
                    : 'mt-2 text-xs text-muted-foreground'
                }
              >
                {fileError || 'PDF, JPG, or PNG. Maximum 10 MB.'}
              </p>
            </div>
          )}
          <Field
            label="Document title *"
            placeholder="e.g. Annual blood test"
            registration={register('title')}
            error={errors.title?.message}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="document_kind"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Document type *"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={mutation.pending}
                  options={Object.entries(documentKinds).map(
                    ([value, label]) => ({
                      value,
                      label,
                    }),
                  )}
                  error={errors.document_kind?.message}
                />
              )}
            />
            <Controller
              name="record_date"
              control={control}
              render={({ field }) => (
                <DateField
                  label="Record date *"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={errors.record_date?.message}
                />
              )}
            />
            <Controller
              name="visit_id"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Visit"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onValueChange={(value) => {
                    const previousVisit = visits.find(
                      (visit) => visit.id === field.value,
                    )
                    const nextVisit = visits.find((visit) => visit.id === value)
                    // Preserve document-specific overrides independently for each name.
                    for (const name of [
                      'hospital_name',
                      'doctor_name',
                    ] as const) {
                      const current = getValues(name)
                      if (!current || current === previousVisit?.[name])
                        setValue(name, nextVisit?.[name] ?? '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                    }
                    field.onChange(value)
                  }}
                  disabled={mutation.pending}
                  options={[
                    { value: '', label: 'Keep in unassigned records' },
                    ...visits.map((visit) => ({
                      value: visit.id,
                      label: `${visit.title} · ${visit.visit_date}`,
                    })),
                  ]}
                  error={errors.visit_id?.message}
                  hint="Visits belong to the selected family profile."
                />
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Hospital"
              placeholder="Hospital, clinic or laboratory"
              registration={register('hospital_name')}
              error={errors.hospital_name?.message}
            />
            <Field
              label="Doctor"
              placeholder="Doctor's name"
              registration={register('doctor_name')}
              error={errors.doctor_name?.message}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Filled from the selected visit. You can change either name for this
            document.
          </p>
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
