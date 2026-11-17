import { lazy, Suspense, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Download,
  ShieldCheck,
  FlaskConical,
  CheckCircle2,
  Printer,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useVault } from '@/contexts/DataContext'
import { useMutation } from '@/hooks/useMutation'
import { api, errorMessage } from '@/lib/api'
import { notificationPreferencesSchema, passwordSchema } from '@shared/schemas'
import { addSampleData } from '@/features/demo/sampleData'
import {
  PageTitle,
  Panel,
  SectionTitle,
  Field,
  SubmitButton,
  ErrorState,
  FormDialog,
  LoadingState,
} from '@/components/common'
import { Button } from '@/components/ui/button'
import { ThemeSelect } from '@/components/ThemeSelect'
const ActivitySummary = lazy(
  () => import('@/features/dashboard/components/ActivitySummary'),
)

function ReminderSettings() {
  const data = useVault()
  const { session } = useAuth()
  const mutation = useMutation()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof notificationPreferencesSchema>>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      email_reminders_enabled:
        data.notificationPreferences?.email_reminders_enabled ?? false,
      timezone:
        data.notificationPreferences?.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone ??
        'UTC',
    },
  })
  const enabled = useWatch({
    control,
    name: 'email_reminders_enabled',
  })

  async function save(values: z.infer<typeof notificationPreferencesSchema>) {
    await mutation.run(async () => {
      await api.notifications.save(values)
      await data.reload()
    }, 'Reminder preferences saved.')
  }

  return (
    <Panel className="tint-peach">
      <SectionTitle
        title="Medication email reminders"
        description="Optional, generic email nudges for scheduled doses."
      />
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        Messages go to your sign-in email and do not include medicine or family
        member names. Email is best-effort, not an emergency service; never use
        it as proof that a dose was taken or missed.
      </p>
      <form onSubmit={handleSubmit(save)} noValidate>
        <fieldset disabled={mutation.pending} className="space-y-4">
          <label className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-primary"
              {...register('email_reminders_enabled')}
              disabled={
                mutation.pending ||
                (!data.features.emailRemindersConfigured && !enabled)
              }
            />
            <span>
              I consent to receive generic medication reminder emails at{' '}
              <span className="font-medium">{session?.user.email}</span>.
            </span>
          </label>
          <Field
            label="Time zone"
            placeholder="e.g. America/New_York"
            registration={register('timezone')}
            error={errors.timezone?.message}
            hint="Use an IANA time zone. Scheduled times follow this zone, including daylight-saving changes."
          />
          {!data.features.emailRemindersConfigured && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Email delivery is not configured on this server. Set
              RESEND_API_KEY, EMAIL_FROM, and REMINDER_CRON_SECRET, then call
              the documented scheduler endpoint every minute. You can save the
              time zone or turn reminders off now.
            </p>
          )}
          {data.features.emailRemindersConfigured && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Delivery depends on an external scheduler and the host remaining
              available. Free or sleeping hosts may delay or miss messages.
              Review your schedule in MediVault and follow your clinician's
              directions.
            </p>
          )}
          {mutation.error && <ErrorState message={mutation.error} />}
          <div className="flex justify-end">
            <SubmitButton busy={mutation.pending}>
              Save reminder settings
            </SubmitButton>
          </div>
        </fieldset>
      </form>
    </Panel>
  )
}

export default function SettingsPage() {
  const { session } = useAuth()
  const data = useVault()
  const [error, setError] = useState<string | null>(null)
  const [sampleOpen, setSampleOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const sample = useMutation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  })
  async function password(values: z.infer<typeof passwordSchema>) {
    setError(null)
    try {
      await api.auth.password(values)
      reset()
      toast.success('Password updated.')
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  async function exportData() {
    try {
      const content = await api.exportData()
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(content, null, 2)], {
          type: 'application/json',
        }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = 'medivault-export.json'
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
      toast.success(
        'Health data export downloaded. Keep it in a secure location.',
      )
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  async function seed() {
    if (
      await sample.run(
        () => addSampleData(),
        'Clearly labeled sample data added to your account.',
      )
    )
      setSampleOpen(false)
  }
  return (
    <>
      <PageTitle
        title="Settings"
        description="Manage your account and keep control of your health information."
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <Panel className="tint-lavender">
            <SectionTitle
              title="Appearance"
              description="Choose Light, Dark, or follow your system. Saved on this browser only."
            />
            <ThemeSelect />
          </Panel>
          <ReminderSettings />
          <Panel className="tint-sky">
            <SectionTitle
              title="Account"
              description="Your MediVault sign-in details."
            />
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-muted-foreground">Email address</p>
              <p className="mt-1 break-words text-sm font-medium">
                {session?.user.email}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 size={13} />
                Signed in with a private session
              </p>
            </div>
          </Panel>
          <Panel>
            <SectionTitle
              title="Change password"
              description="Use a strong, unique password for your account."
            />
            <form onSubmit={handleSubmit(password)} noValidate>
              <fieldset disabled={isSubmitting} className="space-y-5">
                <Field
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  registration={register('current_password')}
                  error={errors.current_password?.message}
                />
                <Field
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  registration={register('password')}
                  error={errors.password?.message}
                />
                <Field
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  registration={register('confirm_password')}
                  error={errors.confirm_password?.message}
                />
                {error && <ErrorState message={error} />}
                <SubmitButton busy={isSubmitting}>Update password</SubmitButton>
              </fieldset>
            </form>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel className="tint-mint">
            <SectionTitle
              title="Your data, your control"
              description="Export the full account or preview a summary for the selected family profile."
            />
            <p className="mb-5 text-sm leading-6 text-muted-foreground">
              The JSON export includes every family profile and all account
              records, medications, dose logs, and measurements. Original
              document files are downloaded individually from your vault.
              Exports contain sensitive data; store them securely.
            </p>
            <Button
              variant="outline"
              disabled={!!data.error || data.refreshing}
              onClick={() => void exportData()}
            >
              <Download />
              Export all account data
            </Button>
            <Button
              className="mt-3 sm:ml-3"
              variant="outline"
              onClick={() => setSummaryOpen(true)}
            >
              <Printer />
              Preview activity summary
            </Button>
          </Panel>
          <Panel className="tint-peach">
            <SectionTitle
              title="Explore with sample data"
              description="Source-attributed, fictional examples for manual upload and OCR review."
            />
            <p className="mb-5 text-sm leading-6 text-muted-foreground">
              Add two clearly labeled family profiles, care visits, and
              source-attributed FHIR example reports to your account. The
              prescription example is for OCR review only; its multi-stage
              dosage is not copied into a medication schedule.
            </p>
            <Button variant="outline" onClick={() => setSampleOpen(true)}>
              <FlaskConical />
              Add sample data
            </Button>
          </Panel>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
            <ShieldCheck className="mb-3 text-primary" size={25} />
            <h2 className="text-sm font-semibold text-teal-900">
              Privacy essentials
            </h2>
            <p className="mt-2 text-sm leading-6 text-teal-800">
              Documents are stored outside the public website folder. Every file
              request checks your session and ownership. Downloads and exports
              are sensitive; keep local copies secure.
            </p>
            <p className="mt-3 text-xs leading-5 text-teal-800">
              Email reminders are optional, generic, and best-effort. The
              scheduler and provider must be configured by the server operator.
            </p>
          </div>
        </div>
      </div>
      <FormDialog
        open={sampleOpen}
        onClose={() => setSampleOpen(false)}
        busy={sample.pending}
        title="Add fictional FHIR examples?"
        description="This adds two demo profiles, visits, and source-attributed example documents. No existing personal records are overwritten."
      >
        {sample.error && <ErrorState message={sample.error} />}
        <p className="text-sm leading-6 text-muted-foreground">
          Use a test account for exploration. The examples reproduce fictional,
          informative HL7 FHIR R4 data and are watermarked as test material.
          They are not real records, valid prescriptions, or medical advice. OCR
          only creates a review draft; no medication schedule or dose logs are
          inferred. If a request fails partway through, successful entries
          remain visible; retrying resumes without duplicating matching demo
          profiles, visits, or documents.
        </p>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            disabled={sample.pending}
            onClick={() => setSampleOpen(false)}
          >
            Cancel
          </Button>
          <Button disabled={sample.pending} onClick={() => void seed()}>
            {sample.pending ? 'Adding FHIR examples...' : 'Add FHIR examples'}
          </Button>
        </div>
      </FormDialog>
      {summaryOpen && session && (
        <Suspense
          fallback={<LoadingState message="Opening activity summary..." />}
        >
          <ActivitySummary
            key={`${session.user.id}:${data.selectedFamilyMemberId}`}
            ownerId={session.user.id}
            familyMemberId={data.selectedFamilyMemberId}
            onClose={() => setSummaryOpen(false)}
          />
        </Suspense>
      )}
    </>
  )
}
