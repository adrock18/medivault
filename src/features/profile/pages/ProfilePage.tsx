import { Controller, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  UserRound,
  ShieldCheck,
  Phone,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useVault } from '@/contexts/DataContext'
import { useMutation } from '@/hooks/useMutation'
import {
  familyMemberSchema,
  profileSchema,
  type FamilyMemberValues,
  type ProfileValues,
} from '@shared/schemas'
import { api } from '@/lib/api'
import { localDate } from '@/lib/utils'
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
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
    },
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
      <fieldset
        disabled={mutation.pending}
        className="grid min-w-0 gap-5 min-[90rem]:grid-cols-2"
      >
        <Panel className="tint-sky min-[90rem]:col-span-2">
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
                <Field
                  label="Date of birth"
                  type="date"
                  max={localDate()}
                  registration={register('date_of_birth')}
                  error={errors.date_of_birth?.message}
                />
              </>
            )}
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <SelectField
                  label="Gender (optional)"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={mutation.pending}
                  options={[
                    { value: '', label: 'Not specified' },
                    { value: 'female', label: 'Female' },
                    { value: 'male', label: 'Male' },
                    { value: 'non_binary', label: 'Non-binary' },
                    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
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
            description="Record known information from your healthcare providers."
          />
          <div className="grid gap-5 sm:grid-cols-2 min-[90rem]:grid-cols-1">
            <TextField
              label="Known allergies"
              placeholder="e.g. Penicillin, peanuts"
              registration={register('allergies')}
              error={errors.allergies?.message}
              hint="Leave blank if unknown. Write 'None known' if confirmed."
            />
            <TextField
              label="Existing medical conditions"
              placeholder="e.g. Conditions confirmed by your clinician"
              registration={register('conditions')}
              error={errors.conditions?.message}
            />
          </div>
        </Panel>
        <Panel className="tint-peach">
          <SectionTitle
            title="Emergency contact"
            description="Someone to contact when it matters most."
          />
          <div className="grid gap-5 sm:grid-cols-2 min-[90rem]:grid-cols-1">
            <Field
              label="Contact name"
              registration={register('emergency_contact_name')}
              error={errors.emergency_contact_name?.message}
            />
            <Field
              label="Phone number"
              type="tel"
              autoComplete="tel"
              placeholder="+1 555 010 0200"
              registration={register('emergency_contact_phone')}
              error={errors.emergency_contact_phone?.message}
            />
          </div>
        </Panel>
        {mutation.error && (
          <div className="min-[90rem]:col-span-2">
            <ErrorState message={mutation.error} />
          </div>
        )}
        <div className="flex justify-end min-[90rem]:col-span-2">
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
              <Field
                label="Date of birth"
                type="date"
                max={localDate()}
                registration={register('date_of_birth')}
                error={errors.date_of_birth?.message}
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
  const {
    healthProfile,
    familyHealthProfiles,
    familyMembers,
    profile,
    selectedFamilyMemberId,
  } = useVault()
  const member = familyMembers.find(
    (familyMember) => familyMember.id === selectedFamilyMemberId,
  )
  const isSelf = member?.relationship === 'self'
  const hasSavedHealthProfile = isSelf
    ? Boolean(healthProfile)
    : familyHealthProfiles.some(
        (familyProfile) => familyProfile.family_member_id === member?.id,
      )
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
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_280px]">
        <ProfileForm />
        <div className="space-y-5">
          <Panel>
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-teal-50 text-primary">
              <UserRound size={30} />
            </div>
            <h2 className="text-center text-lg font-semibold">
              {isSelf
                ? healthProfile?.full_name ||
                  profile?.full_name ||
                  'Your profile'
                : member?.full_name || 'Family profile'}
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {hasSavedHealthProfile
                ? isSelf
                  ? 'Personal health information'
                  : 'Family health details'
                : 'Health details have not been added yet'}
            </p>
            <div className="mt-6 space-y-4 border-t pt-5">
              <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                Only your account can access these private details.
              </p>
              <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
                <Phone className="size-4 shrink-0 text-primary" />
                Keep{' '}
                {isSelf
                  ? 'your'
                  : `${member?.full_name ?? 'this family member'}'s`}{' '}
                emergency contact up to date.
              </p>
            </div>
            <p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">
              Review your profile after appointments so your records reflect the
              information shared by your care team.
            </p>
          </Panel>
        </div>
      </div>
      <FamilyProfiles />
      <SafetyNote />
    </>
  )
}
