import { Link, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ShieldCheck,
  FolderHeart,
  Pill,
  ChartNoAxesCombined,
  ArrowRight,
} from 'lucide-react'
import { Logo, Field, SubmitButton, ErrorState } from '../components/common'
import { loginSchema, registerSchema } from '../lib/schemas'
import { errorMessage } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function LoginForm() {
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
    try {
      await signIn(values)
    } catch (err) {
      setError(errorMessage(err))
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
        <SubmitButton busy={isSubmitting}>
          Sign in <ArrowRight />
        </SubmitButton>
      </div>
    </form>
  )
}
function RegisterForm() {
  const { signUp } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  })
  async function submit(values: z.infer<typeof registerSchema>) {
    setError(null)
    try {
      await signUp(values)
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
      <div className="[&_button]:w-full">
        <SubmitButton busy={isSubmitting}>
          Create account <ArrowRight />
        </SubmitButton>
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
  if (session) return <Navigate to="/dashboard" replace />
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#eaf5f1] p-12 lg:flex">
        <Logo />
        <div className="relative z-10 max-w-lg">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/60 px-3 py-1.5 text-xs font-medium text-primary">
            <ShieldCheck size={14} />A little more peace of mind
          </span>
          <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight text-[#153d35]">
            Your health.
            <br />
            One secure place.
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-muted-foreground">
            Less paperwork. More clarity. Bring your records, medications, and
            daily health into one thoughtfully organized space.
          </p>
          <div className="mt-10 space-y-5">
            {[
              {
                icon: FolderHeart,
                title: 'Every record, within reach',
                text: 'Keep your medical documents together.',
              },
              {
                icon: Pill,
                title: 'Stay on top of your routine',
                text: 'Track your prescribed medication schedule.',
              },
              {
                icon: ChartNoAxesCombined,
                title: 'See your health over time',
                text: 'Log measurements and explore your history.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/70 text-primary">
                  <Icon size={21} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#264b40]">
                    {title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Personal healthcare, made simpler.
        </p>
        <div className="pointer-events-none absolute -bottom-28 -right-40 size-[500px] rounded-full border-[70px] border-white/25" />
      </section>
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Welcome to MediVault
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {registration
              ? 'Start your health journey'
              : 'Good to have you back'}
          </h1>
          <p className="mb-8 mt-3 text-sm leading-6 text-muted-foreground">
            {registration
              ? 'Create your personal healthcare workspace.'
              : 'Sign in to your personal health workspace.'}
          </p>
          {registration ? <RegisterForm /> : <LoginForm />}
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
  )
}
