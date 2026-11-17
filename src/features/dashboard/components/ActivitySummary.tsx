import { useEffect, useRef, useState } from 'react'
import { subDays } from 'date-fns'
import { Printer } from 'lucide-react'
import { api, errorMessage } from '@/lib/api'
import {
  activitySnapshot,
  summaryRangeSchema,
  type ActivitySnapshot,
} from '../lib/summary'
import { categories, displayDate, frequencies, localDate } from '@/lib/utils'
import { medicationForms } from '@shared/database.types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ErrorState, Field } from '@/components/common'

type SummaryState = { ownerId: string; key: string } & (
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready'
      snapshot: ActivitySnapshot
      printing: boolean
      printError?: string
    }
)

export default function ActivitySummary({
  ownerId,
  familyMemberId,
  onClose,
}: {
  ownerId: string
  familyMemberId: string
  onClose: () => void
}) {
  const [from, setFrom] = useState(() => localDate(subDays(new Date(), 29)))
  const [to, setTo] = useState(() => localDate())
  const [includeProfile, setIncludeProfile] = useState(false)
  const [state, setState] = useState<SummaryState | null>(null)
  const generation = useRef(0)
  const key = `${familyMemberId}|${from}|${to}|${includeProfile}`
  const current = state?.ownerId === ownerId && state.key === key ? state : null
  const range = summaryRangeSchema.safeParse({ from, to })
  const ready = current?.kind === 'ready' ? current : null
  useEffect(
    () => () => {
      generation.current++
    },
    [ownerId, familyMemberId],
  )
  function invalidate() {
    generation.current++
    setState(null)
  }
  function preset(days: 7 | 30) {
    invalidate()
    setFrom(localDate(subDays(new Date(), days - 1)))
    setTo(localDate())
  }
  function close() {
    invalidate()
    onClose()
  }
  async function generate() {
    if (!range.success) return
    const request = ++generation.current
    setState({ kind: 'loading', ownerId, key })
    try {
      const data = await api.vault()
      if (request !== generation.current) return
      setState({
        kind: 'ready',
        ownerId,
        key,
        printing: false,
        snapshot: activitySnapshot(
          data,
          ownerId,
          familyMemberId,
          range.data,
          includeProfile,
        ),
      })
    } catch (error) {
      if (request === generation.current)
        setState({ kind: 'error', ownerId, key, message: errorMessage(error) })
    }
  }
  async function print() {
    if (!ready || ready.printing) return
    const request = generation.current
    setState({ ...ready, printing: true, printError: undefined })
    try {
      const session = await api.auth.session()
      if (request !== generation.current) return
      if (!session || session.user.id !== ownerId) {
        invalidate()
        window.dispatchEvent(new Event('medivault:session-expired'))
        return
      }
      window.print()
      if (request === generation.current)
        setState({ ...ready, printing: false })
    } catch (error) {
      if (request === generation.current)
        setState({
          ...ready,
          printing: false,
          printError: `Unable to print. ${errorMessage(error)}`,
        })
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent className="activity-summary-dialog max-h-[90dvh] grid-cols-1 overflow-y-auto rounded-2xl p-5 sm:max-w-3xl sm:p-7">
        <DialogHeader className="activity-summary-controls pr-12">
          <DialogTitle className="text-xl font-semibold">
            Activity summary
          </DialogTitle>
          <DialogDescription>
            A fresh, private snapshot for review and browser printing.
            Informational record keeping, not medical advice.
          </DialogDescription>
        </DialogHeader>
        <div className="activity-summary-controls space-y-4">
          <div
            className="flex flex-wrap gap-2"
            aria-label="Summary date presets"
          >
            <Button variant="outline" onClick={() => preset(7)}>
              Last 7 days
            </Button>
            <Button variant="outline" onClick={() => preset(30)}>
              Last 30 days
            </Button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void generate()
            }}
            noValidate
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Summary start date"
                type="date"
                value={from}
                max={localDate()}
                onChange={(event) => {
                  invalidate()
                  setFrom(event.target.value)
                }}
              />
              <Field
                label="Summary end date"
                type="date"
                value={to}
                max={localDate()}
                onChange={(event) => {
                  invalidate()
                  setTo(event.target.value)
                }}
              />
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={includeProfile}
                onChange={(event) => {
                  invalidate()
                  setIncludeProfile(event.target.checked)
                }}
              />
              Include this person's profile details (optional)
            </label>
            {!range.success && (
              <ErrorState
                message={range.error.issues
                  .map((issue) => issue.message)
                  .join(' ')}
              />
            )}
            {current?.kind === 'error' && (
              <ErrorState
                message={`Unable to generate your summary. ${current.message}`}
              />
            )}
            <Button
              type="submit"
              disabled={!range.success || current?.kind === 'loading'}
            >
              {current?.kind === 'loading'
                ? 'Generating summary...'
                : 'Generate summary'}
            </Button>
          </form>
          <p className="rounded-xl border p-3 text-sm leading-6">
            Printed or saved copies contain sensitive information. Keep them
            securely. Browser Print / Save as PDF controls the destination and
            cancellation; MediVault cannot confirm whether you saved a copy.
          </p>
          <Button
            variant="outline"
            disabled={!ready || ready.printing}
            onClick={() => void print()}
          >
            <Printer />
            {ready?.printing ? 'Checking session...' : 'Print / Save as PDF'}
          </Button>
          {ready?.printError && <ErrorState message={ready.printError} />}
          {current?.kind === 'loading' && (
            <p role="status">Fetching a fresh snapshot...</p>
          )}
        </div>
        {ready && <SummaryPaper snapshot={ready.snapshot} />}
      </DialogContent>
    </Dialog>
  )
}

function SummaryPaper({ snapshot }: { snapshot: ActivitySnapshot }) {
  return (
    <article
      aria-label="Generated activity summary"
      className="activity-summary-paper space-y-6 rounded-xl border p-4 sm:p-6"
    >
      <header>
        <h2 className="text-xl font-semibold">MediVault activity summary</h2>
        <p className="mt-2">
          Inclusive local dates: {snapshot.from} to {snapshot.to}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Snapshot generated:{' '}
          {new Date(snapshot.generatedAt).toLocaleString(undefined, {
            timeZoneName: 'short',
          })}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Frozen at generation; later background refreshes do not change this
          copy. Sensitive personal record, not a diagnosis or treatment
          recommendation.
        </p>
      </header>
      {snapshot.profile && (
        <section aria-label="Selected profile details">
          <h3 className="font-semibold">Selected current profile details</h3>
          <dl className="mt-3 space-y-2">
            {snapshot.profile.map(([label, value]) => (
              <div key={label} className="break-words">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="whitespace-pre-wrap">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section>
        <h3 className="font-semibold">Recorded outcomes in this range</h3>
        <p className="mt-2">
          Taken: {snapshot.taken} · Skipped: {snapshot.skipped} · Logged:{' '}
          {snapshot.logs.length}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {snapshot.logs.length
            ? `Recorded adherence: ${Math.round((snapshot.taken / snapshot.logs.length) * 100)}% (${snapshot.taken} taken / ${snapshot.logs.length} logged). Unlogged projections are excluded.`
            : 'Recorded adherence unavailable: no logged outcomes in this range.'}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Dates and times below are original saved coordinates. Medication names
          refer to current saved details, not a historical prescription.
        </p>
        {snapshot.logs.length ? (
          <ol
            aria-label="Original recorded outcomes"
            className="mt-3 space-y-3"
          >
            {snapshot.logs.map((log) => (
              <li
                key={log.id}
                className="summary-entry break-words border-t pt-3"
              >
                <p className="font-medium">{log.currentName}</p>
                <p>
                  {log.date} at {log.time} ·{' '}
                  {log.status === 'taken' ? 'Taken' : 'Skipped'}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3">No recorded outcomes in this date range.</p>
        )}
      </section>
      <section>
        <h3 className="font-semibold">Current saved medication details</h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          These are current details at snapshot time, including medications
          outside the selected dates. They do not reconstruct past prescriptions
          or recommend changes.
        </p>
        {snapshot.medications.length ? (
          <ul aria-label="Current saved medications" className="mt-3 space-y-4">
            {snapshot.medications.map((medication) => (
              <li
                key={medication.id}
                className="summary-entry break-words border-t pt-3"
              >
                <p className="font-medium">{medication.name}</p>
                <p>
                  {medicationForms[medication.form]}
                  {medication.strength ? ` · ${medication.strength}` : ''}
                </p>
                <p className="whitespace-pre-wrap">
                  Saved dosage: {medication.dosage}
                </p>
                <p>
                  {frequencies[medication.frequency]} ·{' '}
                  {medication.times.join(', ')}
                </p>
                <p>
                  Current dates: {displayDate(medication.start_date)} to{' '}
                  {medication.end_date
                    ? displayDate(medication.end_date)
                    : 'no end date saved'}
                </p>
                {medication.instructions && (
                  <p className="mt-1 whitespace-pre-wrap">
                    Saved instructions: {medication.instructions}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3">No saved medications.</p>
        )}
      </section>
      <section>
        <h3 className="font-semibold">Medical record metadata in this range</h3>
        {snapshot.records.length ? (
          <ul
            aria-label="Dated medical record metadata"
            className="mt-3 space-y-3"
          >
            {snapshot.records.map((record) => (
              <li
                key={record.id}
                className="summary-entry break-words border-t pt-3"
              >
                <p className="font-medium">{record.title}</p>
                <p>
                  {record.date} · {categories[record.category]}
                </p>
                {record.provider && <p>{record.provider}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3">No medical record metadata in this date range.</p>
        )}
      </section>
      <footer className="border-t pt-3 text-xs leading-5 text-muted-foreground">
        Original document bytes, OCR excerpts and legacy measurements are not
        included. For the broader structured dataset, use Settings' JSON export.
        Keep this sensitive copy securely.
      </footer>
    </article>
  )
}
