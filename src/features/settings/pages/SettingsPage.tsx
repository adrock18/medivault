import { lazy, Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { passwordSchema } from '@shared/schemas'
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
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel className="tint-sky xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Account</h2>
              <p className="text-xs text-muted-foreground">Email address</p>
              <p className="mt-1 break-words text-sm font-medium">
                {session?.user.email}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 size={13} />
                Signed in with a private session
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <h3 className="text-sm font-medium">Appearance</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Saved on this browser
                </p>
              </div>
              <ThemeSelect />
            </div>
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
        <Panel className="tint-mint">
          <SectionTitle
            title="Your data, your control"
            description="Export the full account or preview a summary for the selected family profile."
          />
          <p className="mb-5 text-sm leading-6 text-muted-foreground">
            The JSON export includes every family profile and all account
            records, medications, dose logs, and measurements. Original document
            files are downloaded individually from your vault. Exports contain
            sensitive data; store them securely.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!!data.error || data.refreshing}
              onClick={() => void exportData()}
            >
              <Download />
              Export all account data
            </Button>
            <Button variant="outline" onClick={() => setSummaryOpen(true)}>
              <Printer />
              Preview activity summary
            </Button>
          </div>
        </Panel>
        <Panel className="tint-peach">
          <SectionTitle
            title="Explore with sample data"
            description="Source-attributed, fictional examples for manual upload and OCR review."
          />
          <p className="mb-5 text-sm leading-6 text-muted-foreground">
            Add two clearly labeled family profiles, care visits, and
            source-attributed FHIR example reports to your account. The
            prescription example is for OCR review only; its multi-stage dosage
            is not copied into a medication schedule.
          </p>
          <Button variant="outline" onClick={() => setSampleOpen(true)}>
            <FlaskConical />
            Add sample data
          </Button>
        </Panel>
        <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5 xl:col-span-2">
          <ShieldCheck className="mb-3 text-primary" size={25} />
          <h2 className="text-sm font-semibold text-teal-900">
            Privacy essentials
          </h2>
          <p className="mt-2 text-sm leading-6 text-teal-800">
            Documents stay in private storage. Every file request checks your
            session and ownership. Downloads and exports are sensitive; keep
            local copies secure.
          </p>
          <p className="mt-3 text-xs leading-5 text-teal-800">
            Medication status updates while the website is open. No medication
            reminder emails are sent. Follow your prescribed schedule.
          </p>
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
