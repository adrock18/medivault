import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Download, ShieldCheck, FlaskConical, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { useVault } from '../contexts/DataContext'
import { useMutation } from '../hooks/useMutation'
import { api, errorMessage } from '../lib/api'
import { passwordSchema } from '../lib/schemas'
import { addSampleData } from '../lib/sampleData'
import {
  PageTitle,
  Panel,
  SectionTitle,
  Field,
  SubmitButton,
  ErrorState,
  FormDialog,
} from '../components/common'
import { Button } from '../components/ui/button'
import { ThemeSelect } from '../components/ThemeSelect'

export default function SettingsPage() {
  const { session } = useAuth()
  const data = useVault()
  const [error, setError] = useState<string | null>(null)
  const [sampleOpen, setSampleOpen] = useState(false)
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
  function exportData() {
    const content = {
      exported_at: new Date().toISOString(),
      profile: data.profile,
      health_profile: data.healthProfile,
      medical_records: data.records,
      medications: data.medications,
      medication_logs: data.logs,
      health_metrics: data.metrics,
    }
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
          <Panel>
            <SectionTitle
              title="Appearance"
              description="Choose Light, Dark, or follow your system. Saved on this browser only."
            />
            <ThemeSelect />
          </Panel>
          <Panel>
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
          <Panel>
            <SectionTitle
              title="Your data, your control"
              description="Download a copy of your structured health information."
            />
            <p className="mb-5 text-sm leading-6 text-muted-foreground">
              The JSON export includes your profile, document details,
              medications, dose logs, and measurements. Original document files
              are downloaded individually from your vault. Exports contain
              sensitive data; store them securely.
            </p>
            <Button
              variant="outline"
              disabled={!!data.error || data.refreshing}
              onClick={exportData}
            >
              <Download />
              Export my health data
            </Button>
          </Panel>
          <Panel>
            <SectionTitle
              title="Explore with sample data"
              description="Optional, fictional entries to try the complete workflow."
            />
            <p className="mb-5 text-sm leading-6 text-muted-foreground">
              Add a clearly labeled sample medication, dose logs, and a
              scannable fictional prescription to your actual account. They are
              not medical advice and can be removed using the normal delete
              controls.
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
              Medication schedules use the local clock. Device timezone changes
              do not move saved dose times. No email, push, or background
              reminders are sent.
            </p>
          </div>
        </div>
      </div>
      <FormDialog
        open={sampleOpen}
        onClose={() => setSampleOpen(false)}
        busy={sample.pending}
        title="Add fictional sample data?"
        description="This writes sample entries to your real account. No existing personal records are overwritten."
      >
        {sample.error && <ErrorState message={sample.error} />}
        <p className="text-sm leading-6 text-muted-foreground">
          Use a test account for exploration. The sample medication, dose logs,
          and prescription PDF are explicitly fictional, not a prescription or a
          diagnosis. No health measurements are added, and existing ones are
          kept. If an upload fails partway through, successful sample entries
          remain visible and can be deleted.
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
            {sample.pending ? 'Adding sample data...' : 'Add sample data'}
          </Button>
        </div>
      </FormDialog>
    </>
  )
}
