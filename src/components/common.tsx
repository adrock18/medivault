/**
 * Reusable application presentation and form patterns. Centralize accessible
 * field feedback, async states and busy-safe dialogs; domain actions stay in
 * callers.
 */

import { useId, useState, type ReactNode, type Ref } from 'react'
import {
  Activity,
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
  Inbox,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, type SelectProps } from './ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { cn } from '../lib/utils'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="brand-symbol flex size-10 items-center justify-center rounded-[14px] bg-[#405dff] text-white">
        <Activity size={24} strokeWidth={2.4} />
      </div>
      {!compact && (
        <span className="text-xl font-bold tracking-tight text-slate-900">
          MediVault
        </span>
      )}
    </div>
  )
}
export function Panel({
  children,
  className,
  tone = 'section',
}: {
  children: ReactNode
  className?: string
  tone?: 'raised' | 'section'
}) {
  return (
    <Card
      data-tone={tone}
      className={cn(
        'min-w-0 gap-0 rounded-[28px] border p-5 shadow-none ring-0 sm:p-6',
        tone === 'raised'
          ? 'border-slate-200 bg-surface-raised'
          : 'border-transparent bg-card',
        className,
      )}
    >
      {children}
    </Card>
  )
}
export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-[2.4rem] leading-tight font-semibold tracking-[-0.055em] text-slate-900 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-lg bg-slate-100 motion-safe:animate-pulse',
        className,
      )}
    />
  )
}
export type PageSkeletonVariant = 'dashboard' | 'list' | 'form'
/**
 * Reserve page-shaped space during loading and announce a single accessible
 * loading status.
 */
export function PageSkeleton({ variant }: { variant: PageSkeletonVariant }) {
  return (
    <div
      role="status"
      aria-label="Loading page"
      data-skeleton={variant}
      className="min-w-0"
    >
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-8 w-56 max-w-full" />
      <Skeleton className="mt-3 mb-7 h-4 w-80 max-w-full" />
      {variant === 'dashboard' && (
        <>
          <div className="daybook mb-6">
            <div className="grid min-w-0 gap-5">
              <Panel>
                <Skeleton className="mb-6 h-5 w-40" />
                <Skeleton className="mb-7 h-12 w-60 max-w-full rounded-full" />
                <div className="space-y-6">
                  {[0, 1, 2].map((row) => (
                    <div key={row}>
                      <Skeleton className="mb-3 h-3 w-20" />
                      <div className="grid grid-cols-[76px_1fr] gap-4 border-b pb-5">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            <Panel className="daybook-summary">
              <Skeleton className="mb-5 h-5 w-40" />
              <Skeleton className="mx-auto aspect-square w-full max-w-60 rounded-full" />
              <Skeleton className="mt-5 h-12 w-full" />
            </Panel>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <Skeleton className="mb-5 h-5 w-40" />
              <Skeleton className="h-36 w-full" />
            </Panel>
            <Panel>
              <Skeleton className="mb-5 h-5 w-40" />
              <Skeleton className="h-36 w-full" />
            </Panel>
          </div>
        </>
      )}
      {variant === 'list' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((card) => (
            <Panel key={card}>
              <Skeleton className="mb-4 size-11 rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-6 h-11 w-full" />
            </Panel>
          ))}
        </div>
      )}
      {variant === 'form' && (
        <Panel className="max-w-3xl">
          <div className="grid gap-5 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((field) => (
              <div key={field} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
export function LoadingState({
  message = 'Loading your health information...',
}: {
  message?: string
}) {
  return (
    <div
      role="status"
      className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
    >
      <LoaderCircle className="size-7 animate-spin text-primary" />
      {message}
    </div>
  )
}
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-4 rounded-2xl bg-teal-50 p-4 text-primary">
        <Icon size={25} />
      </div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
/**
 * Announce a recoverable failure and offer a retry only when the caller provides
 * one.
 */
export function ErrorState({
  message,
  retry,
}: {
  message: string
  retry?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <AlertCircle className="size-5 shrink-0" />
      <p className="min-w-0 flex-1 break-words">{message}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  )
}
/**
 * Display the fictional-data warning only when the public-demo build flag is
 * enabled.
 */
export function DemoNotice() {
  if (import.meta.env.VITE_PUBLIC_DEMO !== 'true') return null
  return (
    <p
      role="note"
      className="flex items-start justify-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-center text-xs leading-5 text-amber-800"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <span>
        Public demo: use fictional data only. Not medical advice. Data may be
        reset at any time.
      </span>
    </p>
  )
}
export function SafetyNote() {
  return (
    <p className="mt-7 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
      MediVault is a personal record-keeping tool, not medical advice. Follow
      your clinician's instructions. In an emergency, contact local emergency
      services.
    </p>
  )
}
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  className?: string
}) {
  return (
    <Panel className={cn('relative !p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className="color-emblem rounded-full bg-card p-2.5 text-primary">
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
    </Panel>
  )
}
type FieldCommon = {
  label: string
  error?: string
  hint?: string
  registration?: UseFormRegisterReturn
}
/**
 * Associate an input with its label, validation/help text and optional React Hook
 * Form registration.
 */
export function Field({
  label,
  error,
  hint,
  registration,
  ...props
}: FieldCommon &
  InputHTMLAttributes<HTMLInputElement> & {
    ref?: Ref<HTMLInputElement>
  }) {
  const id = useId()
  return (
    <div data-slot="field" className="grid min-w-0 content-start gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-help` : undefined}
        {...registration}
        {...props}
      />
      {(error || hint) && (
        <p
          id={`${id}-help`}
          className={cn(
            'text-xs leading-5',
            error ? 'text-red-700' : 'text-muted-foreground',
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}
/**
 * Provide the multiline equivalent of Field with the same accessible error and
 * hint contract.
 */
export function TextField({
  label,
  error,
  hint,
  registration,
  ...props
}: FieldCommon & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div data-slot="field" className="grid min-w-0 content-start gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-help` : undefined}
        {...registration}
        {...props}
      />
      {(error || hint) && (
        <p
          id={`${id}-help`}
          className={cn(
            'text-xs leading-5',
            error ? 'text-red-700' : 'text-muted-foreground',
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}
/**
 * Connect the controlled select primitive to a stable label and validation/help
 * description.
 */
export function SelectField({
  label,
  error,
  hint,
  ...props
}: Omit<FieldCommon, 'registration'> & SelectProps) {
  const id = useId()
  return (
    <div data-slot="field" className="grid min-w-0 content-start gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-help` : undefined}
        {...props}
      />
      {(error || hint) && (
        <p
          id={`${id}-help`}
          className={cn(
            'text-xs leading-5',
            error ? 'text-red-700' : 'text-muted-foreground',
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}
/**
 * Host form content in a scrollable accessible dialog and prevent dismissal
 * during a pending mutation.
 */
export function FormDialog({
  open,
  onClose,
  title,
  description,
  busy = false,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  busy?: boolean
  children: ReactNode
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose()
      }}
    >
      <DialogContent
        aria-busy={busy}
        className="medical-form-dialog max-h-[90dvh] grid-cols-1 overflow-y-auto rounded-2xl p-5 shadow-xl sm:max-w-lg sm:p-7"
        showCloseButton={!busy}
      >
        <DialogHeader className="mb-2 pr-12">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="leading-6">
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
/**
 * Require explicit destructive confirmation, retain close-animation text and show
 * retryable mutation errors.
 */
export function ConfirmationDialog({
  open,
  onClose,
  title,
  description,
  busy,
  error,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  busy: boolean
  error?: string | null
  onConfirm: () => void
}) {
  // Keep the last open description so the close animation never shows a cleared value.
  const [shownDescription, setShownDescription] = useState(description)
  if (open && description !== shownDescription) setShownDescription(description)
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose()
      }}
    >
      <AlertDialogContent
        aria-busy={busy}
        className="data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{shownDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={busy} onClick={onConfirm}>
            {busy && <LoaderCircle className="animate-spin" />}Delete
            permanently
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
export function SubmitButton({
  busy,
  disabled = false,
  children,
}: {
  busy: boolean
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Button type="submit" disabled={busy || disabled}>
      {busy && <LoaderCircle className="animate-spin" />}
      {busy ? 'Saving...' : children}
    </Button>
  )
}
