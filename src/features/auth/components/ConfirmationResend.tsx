/**
 * Contextual signup-confirmation recovery form. Validates an email and requests a
 * new link without implying that an account exists.
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { confirmationEmailSchema } from '@shared/schemas'
import { ErrorState, Field, SubmitButton } from '@/components/common'
import { useAuth } from '@/contexts/AuthContext'
import { errorMessage } from '@/lib/api'

/**
 * Show resend input and request feedback only where a confirmation-recovery
 * workflow is relevant.
 */
export function ConfirmationResend({ initialEmail = '' }) {
  const { resendConfirmation } = useAuth()
  const [open, setOpen] = useState(Boolean(initialEmail))
  const [remaining, setRemaining] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [requested, setRequested] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof confirmationEmailSchema>>({
    resolver: zodResolver(confirmationEmailSchema),
    defaultValues: { email: initialEmail },
  })

  useEffect(() => {
    if (!remaining) return
    const timer = window.setTimeout(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000,
    )
    return () => window.clearTimeout(timer)
  }, [remaining])

  /**
   * Submit the validated email and present generic delivery guidance or an
   * actionable request error.
   */
  async function submit(values: z.infer<typeof confirmationEmailSchema>) {
    if (remaining) return
    setError(null)
    setRequested(false)
    setRemaining(60)
    try {
      await resendConfirmation(values)
      setRequested(true)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="mt-5 border-t border-border pt-5">
      {!open ? (
        <button
          type="button"
          className="action-link text-sm"
          onClick={() => setOpen(true)}
        >
          Resend confirmation email
        </button>
      ) : (
        <form
          aria-label="Resend email confirmation"
          onSubmit={handleSubmit(submit)}
          className="space-y-4"
          noValidate
        >
          <h2 className="text-sm font-semibold">Resend confirmation email</h2>
          <p className="text-sm text-muted-foreground">
            Open the newest confirmation link in this browser. If you already
            confirmed your email, sign in instead.
          </p>
          <Field
            label="Email to confirm"
            type="email"
            autoComplete="email"
            registration={register('email')}
            error={errors.email?.message}
          />
          {error && <ErrorState message={error} />}
          {requested && (
            <p role="status" className="text-sm text-foreground">
              If this address has an account awaiting confirmation, a new
              confirmation email has been requested. Check your inbox and spam
              folder. Delivery is subject to the email service limits.
            </p>
          )}
          <SubmitButton busy={isSubmitting} disabled={remaining > 0}>
            {remaining
              ? `Request another link in ${remaining}s`
              : 'Send confirmation link'}
          </SubmitButton>
        </form>
      )}
    </div>
  )
}
