import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserRound, ShieldCheck, Phone } from 'lucide-react'
import { useVault } from '../contexts/DataContext'
import { useMutation } from '../hooks/useMutation'
import { profileSchema, type ProfileValues } from '../lib/schemas'
import { api } from '../lib/api'
import { localDate } from '../lib/utils'
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
} from '../components/common'

function ProfileForm() {
  const { healthProfile: profile, profile: account } = useVault()
  const mutation = useMutation()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? account?.full_name ?? '',
      date_of_birth: profile?.date_of_birth ?? '',
      gender: profile?.gender ?? '',
      blood_group: profile?.blood_group ?? '',
      height_cm: profile?.height_cm?.toString() ?? '',
      weight_kg: profile?.weight_kg?.toString() ?? '',
      allergies: profile?.allergies ?? '',
      conditions: profile?.conditions ?? '',
      emergency_contact_name: profile?.emergency_contact_name ?? '',
      emergency_contact_phone: profile?.emergency_contact_phone ?? '',
    },
  })
  async function submit(values: ProfileValues) {
    await mutation.run(async () => {
      await api.profile.save(values)
    }, 'Your health profile has been saved.')
  }
  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <fieldset disabled={mutation.pending} className="space-y-6">
        <Panel className="tint-sky">
          <SectionTitle
            title="Personal information"
            description="The essentials that make your care more personal."
          />
          <div className="grid gap-5 sm:grid-cols-2">
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
          <div className="grid gap-5 sm:grid-cols-2">
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
          <div className="grid gap-5 sm:grid-cols-2">
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
        {mutation.error && <ErrorState message={mutation.error} />}
        <div className="flex justify-end">
          <SubmitButton busy={mutation.pending}>
            Save health profile
          </SubmitButton>
        </div>
      </fieldset>
    </form>
  )
}
export default function ProfilePage() {
  const { healthProfile, profile } = useVault()
  return (
    <>
      <PageTitle
        title="Your health profile"
        description="A clearer picture of you, ready whenever you need it."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_280px]">
        <ProfileForm />
        <div className="space-y-5">
          <Panel>
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-teal-50 text-primary">
              <UserRound size={30} />
            </div>
            <h2 className="text-center text-lg font-semibold">
              {healthProfile?.full_name || profile?.full_name || 'Your profile'}
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {healthProfile
                ? 'Personal health information'
                : 'Complete your profile to get started'}
            </p>
            <div className="mt-6 space-y-4 border-t pt-5">
              <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                Only your account can access this profile.
              </p>
              <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
                <Phone className="size-4 shrink-0 text-primary" />
                Keep your emergency contact up to date.
              </p>
            </div>
          </Panel>
          <div className="rounded-2xl bg-teal-50 p-5">
            <p className="text-sm font-semibold text-teal-900">
              A helpful habit
            </p>
            <p className="mt-2 text-sm leading-6 text-teal-800">
              Review your profile after appointments so your records reflect the
              information shared by your care team.
            </p>
          </div>
        </div>
      </div>
      <SafetyNote />
    </>
  )
}
