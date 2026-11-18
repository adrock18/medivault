/**
 * Account settings and explicit data tools. Handles password change, appearance,
 * private JSON export and printable summaries.
 */

import { lazy, Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Download, CheckCircle2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useVault } from '@/contexts/DataContext'
import { api, errorMessage } from '@/lib/api'
import { passwordSchema } from '@shared/schemas'
import {
  PageTitle,
  Panel,
  SectionTitle,
  Field,
  SubmitButton,
  ErrorState,
  LoadingState,
} from '@/components/common'
import { Button } from '@/components/ui/button'
import { ThemeSelect } from '@/components/ThemeSelect'
const ActivitySummary = lazy(
  () => import('@/features/dashboard/components/ActivitySummary'),
)

/** Keep account-wide actions separate from the selected-profile browsing context. */
export default function SettingsPage() {
  const { session } = useAuth()
  const data = useVault()
  const [error, setError] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  })
  /**
   * Submit a current-password-verified change and preserve an actionable error
   * when it cannot complete.
   */
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
  /**
   * Download the server-validated account-wide JSON export and warn the user to
   * store the private file securely.
   */
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
      </div>
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
