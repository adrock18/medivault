import { useId, useState, type ReactNode } from 'react'
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
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { cn } from '../lib/utils'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Activity size={24} strokeWidth={2.4} />
      </div>
      {!compact && (
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Medi<span className="text-primary">Vault</span>
        </span>
      )}
    </div>
  )
}
export function Panel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Card
      className={cn(
        'min-w-0 gap-0 rounded-2xl border border-slate-200/80 bg-card p-5 shadow-[0_4px_24px_rgba(24,59,53,0.045)] sm:p-6',
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
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
}: {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
}) {
  return (
    <Panel className="relative">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className="rounded-xl bg-teal-50 p-2.5 text-primary">
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
export function Field({
  label,
  error,
  hint,
  registration,
  ...props
}: FieldCommon & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className="space-y-2">
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
export function TextField({
  label,
  error,
  hint,
  registration,
  ...props
}: FieldCommon & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div className="space-y-2">
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
export function SelectField({
  label,
  error,
  registration,
  children,
  ...props
}: FieldCommon & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="form-select"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...registration}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
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
        className="max-h-[90dvh] grid-cols-1 overflow-y-auto rounded-2xl p-5 shadow-xl sm:max-w-lg sm:p-7"
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
export function ConfirmationDialog({
  open,
  onClose,
  title,
  description,
  busy,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  busy: boolean
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
  children,
}: {
  busy: boolean
  children: ReactNode
}) {
  return (
    <Button type="submit" disabled={busy}>
      {busy && <LoaderCircle className="animate-spin" />}
      {busy ? 'Saving...' : children}
    </Button>
  )
}
