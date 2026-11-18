/**
 * Validated care-track and visit dialogs. Associate each saved visit/track with
 * the selected managed profile and expose mutation failures.
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { api } from '@/lib/api'
import { useMutation } from '@/hooks/useMutation'
import { useVault } from '@/contexts/DataContext'
import {
  careTrackSchema,
  careVisitSchema,
  type CareTrackValues,
  type CareVisitValues,
} from '@shared/schemas'
import { localDate } from '@/lib/utils'
import type { CareTrack, CareVisit } from '@shared/database.types'
import {
  ErrorState,
  Field,
  FormDialog,
  SelectField,
  SubmitButton,
  TextField,
} from '@/components/common'
import { Button } from '@/components/ui/button'
import { DateField } from '@/components/DateField'

/**
 * Choose the track or visit form while keeping their validation and persistence
 * paths separate.
 */
export function CareDialog({
  kind,
  track,
  visit,
  onClose,
}: {
  kind: 'track' | 'visit'
  track?: CareTrack
  visit?: CareVisit
  onClose: () => void
}) {
  const { selectedFamilyMemberId, careTracks, reload } = useVault()
  const mutation = useMutation()
  const trackForm = useForm<CareTrackValues>({
    resolver: zodResolver(careTrackSchema),
    defaultValues: {
      family_member_id: track?.family_member_id ?? selectedFamilyMemberId,
      title: track?.title ?? '',
      kind: track?.kind ?? 'follow_up',
    },
  })
  const visitForm = useForm<CareVisitValues>({
    resolver: zodResolver(careVisitSchema),
    defaultValues: {
      family_member_id: visit?.family_member_id ?? selectedFamilyMemberId,
      care_track_id: visit?.care_track_id ?? '',
      title: visit?.title ?? '',
      reason: visit?.reason ?? '',
      setting: visit?.setting ?? 'primary_care',
      hospital_name: visit?.hospital_name ?? '',
      doctor_name: visit?.doctor_name ?? '',
      visit_date: visit?.visit_date ?? localDate(),
      notes: visit?.notes ?? '',
    },
  })
  const trackKind = useWatch({ control: trackForm.control, name: 'kind' })
  const visitSetting = useWatch({ control: visitForm.control, name: 'setting' })
  const visitCareTrack = useWatch({
    control: visitForm.control,
    name: 'care_track_id',
  })

  /**
   * Create or update a care track and close only after a successful authenticated
   * mutation.
   */
  async function saveTrack(values: CareTrackValues) {
    if (
      await mutation.run(
        async () => {
          if (track) await api.care.updateTrack(track.id, values)
          else await api.care.createTrack(values)
          await reload()
        },
        track ? 'Care track updated.' : 'Care track created.',
      )
    )
      onClose()
  }

  /**
   * Create or update a visit with explicit profile/track links and keep failed
   * submissions editable.
   */
  async function saveVisit(values: CareVisitValues) {
    if (
      await mutation.run(
        async () => {
          if (visit) await api.care.updateVisit(visit.id, values)
          else await api.care.createVisit(values)
          await reload()
        },
        visit ? 'Visit updated.' : 'Visit added to the timeline.',
      )
    )
      onClose()
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      busy={mutation.pending}
      title={
        kind === 'track'
          ? track
            ? 'Edit care track'
            : 'Create a care track'
          : visit
            ? 'Edit visit'
            : 'Add a visit'
      }
      description={
        kind === 'track'
          ? 'Use a care track to group related visits. It does not infer a medical relationship.'
          : 'Record the visit context and choose whether it belongs to a care track.'
      }
    >
      {kind === 'track' ? (
        <form onSubmit={trackForm.handleSubmit(saveTrack)} noValidate>
          <fieldset disabled={mutation.pending} className="space-y-5">
            <Field
              label="Care track name"
              placeholder="e.g. Annual preventive care"
              registration={trackForm.register('title')}
              error={trackForm.formState.errors.title?.message}
            />
            <SelectField
              label="Track type"
              value={trackKind}
              onValueChange={(value) =>
                trackForm.setValue('kind', value as CareTrackValues['kind'], {
                  shouldValidate: true,
                })
              }
              options={[
                { value: 'follow_up', label: 'Follow-up' },
                { value: 'preventive', label: 'Preventive care' },
                { value: 'dental', label: 'Dental care' },
                { value: 'ongoing', label: 'Ongoing care' },
                { value: 'other', label: 'Other' },
              ]}
            />
            {mutation.error && <ErrorState message={mutation.error} />}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton busy={mutation.pending}>
                {track ? 'Save track' : 'Create track'}
              </SubmitButton>
            </div>
          </fieldset>
        </form>
      ) : (
        <form onSubmit={visitForm.handleSubmit(saveVisit)} noValidate>
          <fieldset disabled={mutation.pending} className="space-y-5">
            <Field
              label="Visit title"
              placeholder="e.g. Dental check-up"
              registration={visitForm.register('title')}
              error={visitForm.formState.errors.title?.message}
            />
            <Field
              label="Reason for visit"
              placeholder="Optional context"
              registration={visitForm.register('reason')}
              error={visitForm.formState.errors.reason?.message}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Care setting"
                value={visitSetting}
                onValueChange={(value) =>
                  visitForm.setValue(
                    'setting',
                    value as CareVisitValues['setting'],
                    { shouldValidate: true },
                  )
                }
                options={[
                  { value: 'primary_care', label: 'Primary care' },
                  { value: 'specialist', label: 'Specialist' },
                  { value: 'dental', label: 'Dental' },
                  { value: 'hospital', label: 'Hospital' },
                  { value: 'diagnostic', label: 'Diagnostic' },
                  { value: 'preventive', label: 'Preventive' },
                  { value: 'telehealth', label: 'Telehealth' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Controller
                name="visit_date"
                control={visitForm.control}
                render={({ field }) => (
                  <DateField
                    label="Visit date"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={visitForm.formState.errors.visit_date?.message}
                  />
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Hospital"
                placeholder="Hospital, clinic or laboratory"
                registration={visitForm.register('hospital_name')}
                error={visitForm.formState.errors.hospital_name?.message}
              />
              <Field
                label="Doctor"
                placeholder="Doctor's name"
                registration={visitForm.register('doctor_name')}
                error={visitForm.formState.errors.doctor_name?.message}
              />
            </div>
            <SelectField
              label="Care track"
              value={visitCareTrack}
              onValueChange={(value) =>
                visitForm.setValue('care_track_id', value, {
                  shouldValidate: true,
                })
              }
              options={[
                { value: '', label: 'Standalone visit' },
                ...careTracks.map((track) => ({
                  value: track.id,
                  label: track.title,
                })),
              ]}
            />
            <TextField
              label="Private notes"
              rows={3}
              placeholder="Optional notes for your records"
              registration={visitForm.register('notes')}
              error={visitForm.formState.errors.notes?.message}
            />
            {mutation.error && <ErrorState message={mutation.error} />}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton busy={mutation.pending}>
                {visit ? 'Save visit' : 'Add visit'}
              </SubmitButton>
            </div>
          </fieldset>
        </form>
      )}
    </FormDialog>
  )
}
