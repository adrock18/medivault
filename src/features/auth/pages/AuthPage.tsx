import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, Pill } from 'lucide-react'
import {
  Logo,
  Field,
  SubmitButton,
  ErrorState,
  DemoNotice,
} from '@/components/common'
import { loginSchema, registerSchema } from '@shared/schemas'
import { ApiError, errorMessage } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeSelect } from '@/components/ThemeSelect'
import { MedicationShowcase } from '../components/MedicationShowcase'
import { ConfirmationResend } from '../components/ConfirmationResend'

type ConfirmationHandler = (email: string | null) => void

function LoginForm({
  onConfirmationRequired,
}: {
  onConfirmationRequired: ConfirmationHandler
}) {
  const { signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  })
  async function submit(values: z.infer<typeof loginSchema>) {
    setError(null)
    onConfirmationRequired(null)
    try {
      await signIn(values)
    } catch (err) {
      setError(errorMessage(err))
      if (err instanceof ApiError && err.code === 'email_not_confirmed')
        onConfirmationRequired(values.email)
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      <Field
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        registration={register('email')}
        error={errors.email?.message}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        registration={register('password')}
        error={errors.password?.message}
      />
      {error && <ErrorState message={error} />}
      <div className="[&_button]:w-full">
        <SubmitButton busy={isSubmitting}>Sign in</SubmitButton>
      </div>
    </form>
  )
}
function RegisterForm({
  onConfirmationRequired,
}: {
  onConfirmationRequired: ConfirmationHandler
}) {
  const { signUp } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  })
  async function submit(values: z.infer<typeof registerSchema>) {
    setError(null)
    setNotice(null)
    onConfirmationRequired(null)
    try {
      const result = await signUp(values)
      if ('confirmation_required' in result) {
        setNotice(
          'Check your inbox and spam folder for a confirmation email. Open the newest link in this browser. If no email arrives, use Resend confirmation email below. Already confirmed? Sign in.',
        )
        onConfirmationRequired(values.email)
      }
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Field
        label="Full name"
        autoComplete="name"
        placeholder="Alex Morgan"
        registration={register('full_name')}
        error={errors.full_name?.message}
      />
      <Field
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        registration={register('email')}
        error={errors.email?.message}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        registration={register('password')}
        error={errors.password?.message}
      />
      <Field
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        registration={register('confirm_password')}
        error={errors.confirm_password?.message}
      />
      {error && <ErrorState message={error} />}
      {notice && (
        <div
          role="status"
          className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground"
        >
          {notice}
        </div>
      )}
      <div className="[&_button]:w-full">
        <SubmitButton busy={isSubmitting}>Create account</SubmitButton>
      </div>
    </form>
  )
}
export default function AuthPage({
  registration = false,
}: {
  registration?: boolean
}) {
  const { session } = useAuth()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [confirmation, setConfirmation] = useState<{
    email: string
    registration: boolean
  } | null>(null)
  const confirmationEmail =
    confirmation?.registration === registration ? confirmation.email : ''
  function onConfirmationRequired(email: string | null) {
    setConfirmation(email ? { email, registration } : null)
  }
  const [motionPaused, setMotionPaused] = useState(false)
  const hashParams = new URLSearchParams(location.hash.slice(1))
  const providerError =
    searchParams.get('error_code') ||
    searchParams.get('error') ||
    hashParams.get('error_code') ||
    hashParams.get('error')
  const authStatus = providerError
    ? providerError === 'otp_expired'
      ? 'confirmation-expired'
      : 'confirmation-failed'
    : searchParams.get('auth')
  const callbackMessage = {
    'confirmation-missing-code':
      'The confirmation link did not include a sign-in code. Try signing in if you already confirmed your email; otherwise request a new confirmation email below.',
    'confirmation-missing-verifier':
      'Automatic sign-in could not finish in this browser. Your email may already be confirmed; try signing in. Otherwise request a new confirmation email below and open it in this browser.',
    'confirmation-expired':
      'This confirmation link is invalid, expired or has already been used. If you already confirmed your email, sign in. Otherwise request a new confirmation email below.',
    'confirmation-failed':
      'Email confirmation could not be completed. If you already confirmed your email, sign in. Otherwise request a new confirmation email below.',
    'confirmation-unavailable':
      'The authentication service is temporarily unavailable. Retry the confirmation link shortly.',
  }[authStatus ?? '']
  if (session) return <Navigate to="/dashboard" replace />
  return (
    <div className="auth-shell flex min-h-screen flex-col bg-workspace">
      <div className="ambient-backdrop" aria-hidden="true" />
      <DemoNotice />
      <div className="grid flex-1 lg:grid-cols-2">
        <section className="auth-art relative hidden flex-col justify-between overflow-hidden p-12 xl:p-16 lg:flex">
          <div className="[&_span]:text-white">
            <Logo />
          </div>
          <div className="relative z-10 max-w-lg py-12">
            <h1 className="text-6xl font-medium leading-[1.05] tracking-[-0.06em] xl:text-7xl">
              A little order.
              <br />A clearer day.
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[#acb7ce]">
              Your medications, medical records, and important details.
              Together, at your pace.
            </p>
            <div className="my-10">
              <MedicationShowcase
                paused={motionPaused}
                onPausedChange={setMotionPaused}
              />
            </div>
            <p className="flex items-center gap-3 text-sm text-[#acb7ce]">
              <Pill size={18} />
              Built around your prescribed routine.
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs text-[#acb7ce]">
            <ShieldCheck size={16} />
            Private records. Personal space.
          </p>
        </section>
        <section className="flex flex-col gap-6 px-6 py-8 sm:px-12">
          <div className="flex justify-end">
            <ThemeSelect />
          </div>
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <Logo />
            <MedicationShowcase
              compact
              paused={motionPaused}
              onPausedChange={setMotionPaused}
            />
          </div>
          <div className="auth-form glass-surface tint-lavender mx-auto my-auto w-full max-w-md rounded-[32px] p-5 sm:p-8">
            <h1 className="text-4xl font-medium tracking-[-0.055em] text-slate-900">
              {registration
                ? 'Start your health journey'
                : 'Good to have you back'}
            </h1>
            <p className="mb-8 mt-3 text-sm leading-6 text-muted-foreground">
              {registration
                ? 'Create your personal healthcare workspace.'
                : 'Sign in to your personal health workspace.'}
            </p>
            {callbackMessage && (
              <div
                role="status"
                className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground"
              >
                {callbackMessage}
              </div>
            )}
            {registration ? (
              <RegisterForm onConfirmationRequired={onConfirmationRequired} />
            ) : (
              <LoginForm onConfirmationRequired={onConfirmationRequired} />
            )}
            {(confirmationEmail || callbackMessage) && (
              <ConfirmationResend
                key={`${registration}-${confirmationEmail}`}
                initialEmail={confirmationEmail}
              />
            )}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {registration ? 'Already have an account?' : 'New to MediVault?'}{' '}
              <Link
                className="font-semibold text-primary hover:underline"
                to={registration ? '/login' : '/register'}
              >
                {registration ? 'Sign in' : 'Create an account'}
              </Link>
            </p>
            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} />
              Your medical documents remain private.
            </p>
          </div>
          <p className="text-center text-[11px] text-slate-400">
            For personal record keeping. Not a substitute for medical care.
          </p>
        </section>
      </div>
    </div>
  )
}
