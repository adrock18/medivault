import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useVault } from '@/contexts/DataContext'
import { useMutation } from '@/hooks/useMutation'
import {
  familyMemberSchema,
  profileSchema,
  type FamilyMemberValues,
  type ProfileValues,
} from '@shared/schemas'
import { api } from '@/lib/api'
import {
  medicalBackgroundEntries,
  medicalBackgroundSchema,
} from '@shared/medical-background'
import { DateOfBirthField } from '../components/DateOfBirthField'
import { Button } from '@/components/ui/button'
import { ReviewedResults } from '@/features/records/components/ReviewedResults'
import {
  PageTitle,
  Panel,
  SectionTitle,
  Field,
  SelectField,
  TextField,
  SubmitButton,
  ErrorState,
  SafetyNote,
  ConfirmationDialog,
} from '@/components/common'

function ProfileForm() {
  const {
    healthProfile,
    familyHealthProfiles,
    familyMembers,
    profile: account,
    selectedFamilyMemberId,
    reload,
  } = useVault()
  const member = familyMembers.find(
    (familyMember) => familyMember.id === selectedFamilyMemberId,
  )
  const isSelf = member?.relationship === 'self'
  const memberProfile = familyHealthProfiles.find(
    (familyProfile) => familyProfile.family_member_id === member?.id,
  )
  const savedProfile = isSelf ? healthProfile : memberProfile
  const fullName = isSelf
    ? (healthProfile?.full_name ?? account?.full_name ?? '')
    : (member?.full_name ?? '')
  const dateOfBirth = isSelf
    ? (healthProfile?.date_of_birth ?? member?.date_of_birth ?? '')
    : (member?.date_of_birth ?? '')
  const gender = savedProfile?.gender ?? ''
  const bloodGroup = savedProfile?.blood_group ?? ''
  const height = savedProfile?.height_cm?.toString() ?? ''
  const weight = savedProfile?.weight_kg?.toString() ?? ''
  const allergies = savedProfile?.allergies ?? ''
  const conditions = savedProfile?.conditions ?? ''
  const backgroundJson = JSON.stringify(medicalBackgroundEntries(savedProfile))
  // Identical refresh responses must not reset unsaved rows just because the array reference changed.
  const background = useMemo(
    () => medicalBackgroundSchema.parse(JSON.parse(backgroundJson)),
    [backgroundJson],
  )
  const emergencyContactName = savedProfile?.emergency_contact_name ?? ''
  const emergencyContactPhone = savedProfile?.emergency_contact_phone ?? ''
  const mutation = useMutation()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: fullName,
      date_of_birth: dateOfBirth,
      gender,
      blood_group: bloodGroup,
      height_cm: height,
      weight_kg: weight,
      allergies,
      conditions,
      medical_background: background,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
    },
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medical_background',
  })
  useEffect(() => {
    reset({
      full_name: fullName,
      date_of_birth: dateOfBirth,
      gender,
      blood_group: bloodGroup,
      height_cm: height,
      weight_kg: weight,
      allergies,
      conditions,
      medical_background: background,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
    })
  }, [
    reset,
    selectedFamilyMemberId,
    fullName,
    dateOfBirth,
    gender,
    bloodGroup,
    height,
    weight,
    allergies,
    conditions,
    background,
    emergencyContactName,
    emergencyContactPhone,
  ])
  async function submit(values: ProfileValues) {
    await mutation.run(
      async () => {
        if (!member) throw new Error('Select a family profile first.')
        if (isSelf) await api.profile.save(values)
        else await api.family.saveHealthProfile(member.id, values)
        await reload()
      },
      isSelf
        ? 'Your health profile has been saved.'
        : `${member?.full_name ?? 'Family member'}'s health profile has been saved.`,
    )
  }
  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <fieldset disabled={mutation.pending} className="grid min-w-0 gap-5">
        <Panel className="tint-sky">
          <SectionTitle
            title={isSelf ? 'Personal information' : 'Health details'}
            description={
              isSelf
                ? 'The essentials that make your care more personal.'
                : `Keep ${member?.full_name ?? 'this family member'}'s health details organized with their care history.`
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 min-[90rem]:grid-cols-3">
            {isSelf && (
              <>
                <Field
                  label="Full name *"
                  autoComplete="name"
                  registration={register('full_name')}
                  error={errors.full_name?.message}
                />
                <Controller
                  name="date_of_birth"
                  control={control}
                  render={({ field }) => (
                    <DateOfBirthField
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      error={errors.date_of_birth?.message}
                    />
                  )}
                />
              </>
            )}
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Gender"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={mutation.pending}
                  options={[
                    {
                      value: ['', 'male', 'female'].includes(field.value)
                        ? ''
                        : field.value,
                      label: ['', 'male', 'female'].includes(field.value)
                        ? 'Select gender'
                        : 'Saved value (unchanged)',
                      disabled: true,
                    },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                  error={errors.gender?.message}
                />
              )}
            />
            <Controller
              name="blood_group"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Blood group"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={mutation.pending}
                  options={[
                    { value: '', label: 'Unknown / not specified' },
                    ...['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
                      (value) => ({ value, label: value }),
                    ),
                  ]}
                  error={errors.blood_group?.message}
                />
              )}
            />
            <Field
              label="Height (cm)"
              type="number"
              min="1"
              max="300"
              step="0.1"
              registration={register('height_cm')}
              error={errors.height_cm?.message}
            />
            <Field
              label="Weight (kg)"
              type="number"
              min="0.1"
              max="700"
              step="0.1"
              registration={register('weight_kg')}
              error={errors.weight_kg?.message}
            />
          </div>
        </Panel>
        <Panel className="tint-mint">
          <SectionTitle
            title="Medical background"
            description="Add allergies and conditions separately. Copy instructions from your doctor only; leave them blank if none were provided."
            action={
              <Button
                type="button"
                variant="outline"
                disabled={mutation.pending || fields.length >= 20}
                onClick={() =>
                  append({ type: 'allergy', name: '', instructions: '' })
                }
              >
                <Plus /> Add row
              </Button>
            }
          />
          {fields.length ? (
            <table className="block w-full table-fixed md:table">
              <caption className="sr-only">
                Allergies and medical conditions
              </caption>
              <thead className="hidden text-left text-xs text-muted-foreground md:table-header-group">
                <tr>
                  <th scope="col" className="w-[20%] p-3">
                    Type
                  </th>
                  <th scope="col" className="w-[30%] p-3">
                    Name
                  </th>
                  <th scope="col" className="p-3">
                    Doctor&apos;s instructions (optional)
                  </th>
                  <th scope="col" className="w-16 p-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="grid gap-3 md:table-row-group">
                {fields.map((row, index) => (
                  <tr
                    key={row.id}
                    className="grid min-w-0 gap-3 rounded-xl border bg-card p-3 sm:grid-cols-2 md:table-row md:p-0"
                  >
                    <td className="min-w-0 align-top md:p-3 [&_label]:md:sr-only">
                      <Controller
                        name={`medical_background.${index}.type`}
                        control={control}
                        render={({ field }) => (
                          <SelectField
                            label={`Type ${index + 1}`}
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            disabled={mutation.pending}
                            options={[
                              { value: 'allergy', label: 'Allergy' },
                              { value: 'condition', label: 'Condition' },
                            ]}
                            error={
                              errors.medical_background?.[index]?.type?.message
                            }
                          />
                        )}
                      />
                    </td>
                    <td className="min-w-0 align-top md:p-3 [&_label]:md:sr-only">
                      <TextField
                        label={`Name ${index + 1}`}
                        placeholder="Allergy or condition"
                        rows={2}
                        maxLength={2000}
                        registration={register(
                          `medical_background.${index}.name`,
                        )}
                        error={
                          errors.medical_background?.[index]?.name?.message
                        }
                      />
                    </td>
                    <td className="min-w-0 align-top sm:col-span-2 md:p-3 [&_label]:md:sr-only">
                      <TextField
                        label={`Doctor's instructions ${index + 1}`}
                        placeholder="Only instructions provided by your doctor"
                        rows={2}
                        maxLength={2000}
                        registration={register(
                          `medical_background.${index}.instructions`,
                        )}
                        error={
                          errors.medical_background?.[index]?.instructions
                            ?.message
                        }
                      />
                    </td>
                    <td className="align-top md:p-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Remove medical background row ${index + 1}`}
                        onClick={() => remove(index)}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              No medical background added. Use Add row for each known allergy or
              condition.
            </p>
          )}
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Up to 20 entries. Leave unknown information blank by not adding a
            row.
            {savedProfile?.medical_background == null &&
            (allergies || conditions)
              ? ' Your previous text is kept together; separate it into rows if needed.'
              : ''}
          </p>
          {(errors.medical_background?.root?.message ||
            errors.medical_background?.message) && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {errors.medical_background.root?.message ||
                errors.medical_background.message}
            </p>
          )}
        </Panel>
        {mutation.error && (
          <div>
            <ErrorState message={mutation.error} />
          </div>
        )}
        <div className="flex justify-end">
          <SubmitButton busy={mutation.pending}>
            Save health profile
          </SubmitButton>
        </div>
      </fieldset>
    </form>
  )
}

function FamilyProfiles() {
  const { familyMembers, reload, selectedFamilyMemberId, selectFamilyMember } =
    useVault()
  const mutation = useMutation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<
    (typeof familyMembers)[number] | null
  >(null)
  const editingMember = familyMembers.find((member) => member.id === editingId)
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FamilyMemberValues>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      full_name: '',
      relationship: 'other',
      date_of_birth: '',
    },
  })

  useEffect(() => {
    if (editingId === null) return
    reset({
      full_name: editingMember?.full_name ?? '',
      relationship: editingMember?.relationship ?? 'other',
      date_of_birth: editingMember?.date_of_birth ?? '',
    })
  }, [editingId, editingMember, reset])

  async function submit(values: FamilyMemberValues) {
    const saved = await mutation.run(
      async () => {
        if (editingMember) await api.family.update(editingMember.id, values)
        else await api.family.create(values)
        await reload()
      },
      editingMember ? 'Family profile updated.' : 'Family profile added.',
    )
    if (saved) setEditingId(null)
  }

  async function removeMember() {
    if (!removingMember) return
    const saved = await mutation.run(async () => {
      await api.family.remove(removingMember.id)
      await reload()
    }, 'Family profile deleted.')
    if (saved) setRemovingMember(null)
  }

  return (
    <Panel className="mt-6">
      <SectionTitle
        title="Family profiles"
        description="Manage health details, records, and medication schedules for people you organize under this account."
      />
      <p className="mb-5 text-sm leading-6 text-muted-foreground">
        Each person uses this account's private workspace; they do not get a
        separate login. Use the profile selector in the header to view one
        person's records and medication schedule at a time.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {familyMembers.map((member) => (
          <article
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
          >
            <div className="min-w-0 flex-1 basis-32">
              <h3 className="truncate text-sm font-semibold">
                {member.full_name}
              </h3>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {member.relationship.replaceAll('_', ' ')}
                {member.date_of_birth ? ` · Born ${member.date_of_birth}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={selectedFamilyMemberId === member.id}
                onClick={() => selectFamilyMember(member.id)}
              >
                {selectedFamilyMemberId === member.id
                  ? 'Selected'
                  : 'View profile'}
              </Button>
              {member.relationship !== 'self' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(member.id)}
                  >
                    <Pencil />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Delete family profile ${member.full_name}`}
                    onClick={() => setRemovingMember(member)}
                  >
                    <Trash2 />
                  </Button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {editingId !== null ? (
        <form onSubmit={handleSubmit(submit)} noValidate className="mt-6">
          <fieldset disabled={mutation.pending} className="space-y-4">
            <h3 className="font-semibold">
              {editingMember ? 'Edit family profile' : 'Add family profile'}
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Full name *"
                registration={register('full_name')}
                error={errors.full_name?.message}
              />
              <Controller
                name="relationship"
                control={control}
                render={({ field }) => (
                  <SelectField
                    label="Relationship *"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mutation.pending}
                    options={[
                      { value: 'spouse', label: 'Spouse / partner' },
                      { value: 'child', label: 'Child' },
                      { value: 'parent', label: 'Parent' },
                      { value: 'grandparent', label: 'Grandparent' },
                      { value: 'other', label: 'Other' },
                    ]}
                    error={errors.relationship?.message}
                  />
                )}
              />
              <Controller
                name="date_of_birth"
                control={control}
                render={({ field }) => (
                  <DateOfBirthField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    error={errors.date_of_birth?.message}
                  />
                )}
              />
            </div>
            {mutation.error && <ErrorState message={mutation.error} />}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
              <SubmitButton busy={mutation.pending}>
                {editingMember ? 'Save profile' : 'Add profile'}
              </SubmitButton>
            </div>
          </fieldset>
        </form>
      ) : (
        <Button
          type="button"
          className="mt-5"
          variant="outline"
          onClick={() => setEditingId('new')}
        >
          <Plus />
          Add family profile
        </Button>
      )}
      <ConfirmationDialog
        open={removingMember !== null}
        onClose={() => setRemovingMember(null)}
        title={`Delete ${removingMember?.full_name ?? 'this family profile'}?`}
        description="A profile can be deleted only when it has no records, medications, measurements, care tracks, or visits. Deleting it also removes the person's health-profile details."
        busy={mutation.pending}
        error={mutation.error}
        onConfirm={() => void removeMember()}
      />
    </Panel>
  )
}

export default function ProfilePage() {
  const { familyMembers, selectedFamilyMemberId } = useVault()
  const member = familyMembers.find(
    (familyMember) => familyMember.id === selectedFamilyMemberId,
  )
  const isSelf = member?.relationship === 'self'
  return (
    <>
      <PageTitle
        title={isSelf ? 'Your health profile' : 'Family health profile'}
        description={
          isSelf
            ? 'A clearer picture of you, ready whenever you need it.'
            : `Health details for ${member?.full_name ?? 'the selected family member'}.`
        }
      />
      <ReviewedResults vitalsOnly />
      <ProfileForm />
      <FamilyProfiles />
      <SafetyNote />
    </>
  )
}
