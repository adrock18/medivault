import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { cn, displayDate, type ScheduledDose } from '@/lib/utils'
import {
  clockTime,
  loggingMilestones,
  type loggingProgress,
  markState,
  nextDose,
  type DayCounts,
  type MarkState,
} from '@/features/dashboard/lib/dashboard'
import type { DoseFilter } from '@/features/medications/components/DoseSchedule'

/** Status shape shared by the dial legend and the timeline rail. */
export function StatusMark({
  state,
  size = 20,
}: {
  state: MarkState
  size?: number
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className="shrink-0"
    >
      <MarkShape state={state} x={10} y={10} />
    </svg>
  )
}

function MarkShape({
  state,
  x,
  y,
}: {
  state: MarkState
  x: number
  y: number
}) {
  if (state === 'taken')
    return (
      <g>
        <circle cx={x} cy={y} r={7} className="fill-[var(--success)]" />
        <path
          d={`M${x - 3.2} ${y + 0.2} l2.2 2.2 l4.2 -4.6`}
          className="stroke-card"
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    )
  if (state === 'skipped')
    return (
      <g>
        <circle
          cx={x}
          cy={y}
          r={6.5}
          className="fill-card stroke-slate-500"
          strokeWidth={1.6}
        />
        <path
          d={`M${x - 4} ${y + 4} L${x + 4} ${y - 4}`}
          className="stroke-slate-500"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </g>
    )
  return (
    <circle
      cx={x}
      cy={y}
      r={state === 'next' ? 6.5 : 6}
      className={cn(
        'fill-card',
        state === 'next'
          ? 'stroke-primary'
          : state === 'earlier'
            ? 'stroke-amber-700'
            : 'stroke-slate-400',
      )}
      strokeWidth={state === 'next' ? 3 : 1.6}
    />
  )
}

const C = 100
const R = 78
function point(minutes: number, radius: number) {
  const angle = (minutes / 1440) * 2 * Math.PI
  return {
    x: C + radius * Math.sin(angle),
    y: C - radius * Math.cos(angle),
  }
}
const minutesOf = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

export function DayDial({
  doses,
  now,
  filter,
  onFilterChange,
}: {
  doses: ScheduledDose[]
  now: Date
  filter: DoseFilter
  onFilterChange: (filter: DoseFilter) => void
}) {
  const taken = doses.filter((d) => d.log?.status === 'taken').length
  const skipped = doses.filter((d) => d.log?.status === 'skipped').length
  const unlogged = doses.length - taken - skipped
  const next = nextDose(doses, now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const end = point(nowMinutes, R)
  const elapsed = `M${C} ${C - R} A${R} ${R} 0 ${nowMinutes > 720 ? 1 : 0} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
  const hand = point(nowMinutes, R + 12)
  const stacked = new Map<string, number>()
  const marks = doses.map((dose) => {
    const level = stacked.get(dose.time) ?? 0
    stacked.set(dose.time, level + 1)
    return {
      dose,
      ...point(minutesOf(dose.time), R - level * 15),
      state: markState(dose, now, next),
    }
  })
  const legend = [
    { value: 'taken', label: 'Taken', count: taken, mark: 'taken' },
    { value: 'skipped', label: 'Skipped', count: skipped, mark: 'skipped' },
    {
      value: 'unlogged',
      label: 'Not yet logged',
      count: unlogged,
      mark: 'later',
    },
  ] as const
  const summary = doses.length
    ? `${doses.length} ${doses.length === 1 ? 'dose' : 'doses'} today: ${taken} taken, ${skipped} skipped, ${unlogged} not yet logged. Current time ${clockTime(now)}.`
    : `No doses scheduled today. Current time ${clockTime(now)}.`
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[15rem]">
        <svg viewBox="0 0 200 200" role="img" aria-label={summary}>
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            className="stroke-slate-200"
            strokeWidth={2}
          />
          {Array.from({ length: 48 }, (_, index) => {
            const outer = point(index * 30, R + 12)
            const inner = point(index * 30, R + (index % 4 === 0 ? 8 : 10))
            return (
              <line
                key={index}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                className="stroke-slate-300"
                strokeWidth={0.8}
              />
            )
          })}
          {[0, 360, 720, 1080].map((minutes) => {
            const outer = point(minutes, R + 6)
            const inner = point(minutes, R - 6)
            const label = point(minutes, R - 18)
            return (
              <g key={minutes}>
                <line
                  x1={outer.x}
                  y1={outer.y}
                  x2={inner.x}
                  y2={inner.y}
                  className="stroke-slate-300"
                  strokeWidth={1.5}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-slate-400 text-[9px] tabular-nums"
                >
                  {String(minutes / 60).padStart(2, '0')}
                </text>
              </g>
            )
          })}
          {nowMinutes > 0 && (
            <path
              d={elapsed}
              pathLength={1}
              fill="none"
              className="stroke-primary/20 motion-safe:animate-[dial-draw_200ms_ease-out]"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray="1 1"
            />
          )}
          <line
            x1={C}
            y1={C}
            x2={hand.x}
            y2={hand.y}
            pathLength={1}
            strokeDasharray="1 1"
            className="stroke-primary motion-safe:animate-[dial-draw_200ms_ease-out]"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.5}
          />
          <circle cx={hand.x} cy={hand.y} r={3} className="fill-primary" />
          {marks.map(({ dose, x, y, state }) => (
            <MarkShape
              key={`${dose.medication.id}-${dose.time}`}
              state={state}
              x={x}
              y={y}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-[30%] flex flex-col items-center justify-center rounded-full bg-card text-center">
          {doses.length ? (
            <>
              <span className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {taken}
                <span className="text-base font-normal text-muted-foreground">
                  {' '}
                  of {doses.length}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">taken</span>
            </>
          ) : (
            <span className="px-1 text-xs leading-4 text-muted-foreground">
              No doses today
            </span>
          )}
        </div>
      </div>
      {doses.length > 0 && (
        <div
          role="group"
          aria-label="Filter today's doses by outcome"
          className="mt-2 flex w-full flex-wrap justify-center gap-0"
        >
          {legend.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              aria-label={`Show ${item.count} ${item.label.toLowerCase()} ${item.count === 1 ? 'dose' : 'doses'}`}
              onClick={() =>
                onFilterChange(filter === item.value ? 'all' : item.value)
              }
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-xs text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                filter === item.value &&
                  'bg-teal-50 font-medium text-primary hover:bg-teal-50',
              )}
            >
              <StatusMark state={item.mark} size={16} />
              {item.label}
              <span className="tabular-nums text-muted-foreground">
                {item.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdherenceRing({
  value,
}: {
  value: { taken: number; logged: number; percent: number } | null
}) {
  const r = 26
  const length = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox="0 0 64 64"
        className="size-16 shrink-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={32}
          cy={32}
          r={r}
          fill="none"
          className="stroke-slate-100"
          strokeWidth={6}
        />
        {value && (
          <circle
            cx={32}
            cy={32}
            r={r}
            fill="none"
            className="stroke-primary"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={`${(value.percent / 100) * length} ${length}`}
          />
        )}
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">Recorded adherence</p>
        {value ? (
          <>
            <p className="text-xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {value.percent}%
            </p>
            <p className="text-xs text-muted-foreground">
              {value.taken} taken of {value.logged} logged doses in the last 30
              days
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Unavailable: no logged doses in the last 30 days
          </p>
        )}
      </div>
    </div>
  )
}

export function LoggingMilestones({
  value,
}: {
  value: ReturnType<typeof loggingProgress>
}) {
  return (
    <section aria-label="Recorded days" className="mt-5 border-t pt-5">
      <p className="text-sm font-medium">Lifetime logged days</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {value.loggedDays} logged {value.loggedDays === 1 ? 'day' : 'days'}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Each original scheduled date with a taken or skipped outcome counts
        once. This is not a completeness or health score.
      </p>
      <ul
        aria-label="Logged-day milestones"
        className="mt-3 flex flex-wrap gap-2 text-xs"
      >
        {loggingMilestones.map((day) => (
          <li
            key={day}
            className={cn(
              'rounded-full border px-3 py-2',
              value.reached.includes(day)
                ? 'border-primary/40 bg-accent text-accent-foreground'
                : 'text-muted-foreground',
            )}
          >
            {day} days · {value.reached.includes(day) ? 'recorded' : 'not yet'}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {value.runEnding
          ? `${value.currentRun}-day current run, ending ${displayDate(value.runEnding)}.`
          : 'No current run ending today or yesterday.'}
      </p>
    </section>
  )
}

const dayText = (day: DayCounts) =>
  `${day.taken} taken, ${day.skipped} skipped, ${day.unlogged} not yet logged`

export function WeekActivityChart({ days }: { days: DayCounts[] }) {
  const [selected, setSelected] = useState(days.length - 1)
  const max = Math.max(1, ...days.map((day) => day.total))
  const current = days[selected] ?? days[days.length - 1]
  const label = (day: DayCounts) =>
    format(new Date(`${day.date}T12:00:00`), 'EEE, MMM d')
  return (
    <div className="week-activity">
      <h2 className="text-base font-semibold text-slate-900">Last 7 days</h2>
      <div
        role="group"
        aria-label="Dose activity for the last 7 days"
        className="week-bars mt-3 grid grid-cols-7"
      >
        {days.map((day, index) => (
          <button
            key={day.date}
            type="button"
            aria-pressed={index === selected}
            aria-label={`${label(day)}: ${day.total ? dayText(day) : 'no doses scheduled'}`}
            onClick={() => setSelected(index)}
            className={cn(
              'flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-0.5 pt-2 pb-1.5 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              index === selected && 'bg-teal-50 hover:bg-teal-50',
            )}
          >
            <span className="flex h-24 w-full max-w-7 flex-col-reverse overflow-hidden rounded-md">
              {day.total ? (
                <>
                  <span
                    className="bg-primary"
                    style={{ height: `${(day.taken / max) * 100}%` }}
                  />
                  <span
                    className="bg-[repeating-linear-gradient(135deg,var(--slate-400)_0_2px,transparent_2px_5px)]"
                    style={{ height: `${(day.skipped / max) * 100}%` }}
                  />
                  <span
                    className="rounded-t-md border border-dashed border-amber-700"
                    style={{ height: `${(day.unlogged / max) * 100}%` }}
                  />
                </>
              ) : (
                <span className="h-0.5 rounded bg-slate-200" />
              )}
            </span>
            <span
              className={cn(
                'text-xs text-muted-foreground',
                index === selected && 'font-medium text-primary',
              )}
            >
              {format(new Date(`${day.date}T12:00:00`), 'EEEEE')}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-700" aria-live="polite">
        <span className="font-medium">{label(current)}:</span>{' '}
        {current.total ? dayText(current) : 'no doses scheduled'}
      </p>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary" />
          Taken
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[repeating-linear-gradient(135deg,var(--slate-400)_0_2px,transparent_2px_4px)]" />
          Skipped
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm border border-dashed border-amber-700" />
          Not yet logged
        </span>
      </p>
    </div>
  )
}

export function DailyInsight({ statements }: { statements: string[] }) {
  return (
    <ul aria-label="Daily insight" className="space-y-1.5">
      {statements.map((statement) => (
        <li key={statement} className="text-sm leading-6 text-slate-700">
          {statement}
        </li>
      ))}
    </ul>
  )
}

export function VaultCounts({
  records,
  activeMedications,
}: {
  records: number
  activeMedications: number
}) {
  return (
    <p className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <Link
        to="/medical-records"
        className="inline-flex min-h-11 items-center gap-1 text-slate-700 underline-offset-4 hover:underline"
      >
        <span className="font-semibold text-slate-900 tabular-nums">
          {records}
        </span>{' '}
        {records === 1 ? 'medical record' : 'medical records'}
      </Link>
      <Link
        to="/medications"
        className="inline-flex min-h-11 items-center gap-1 text-slate-700 underline-offset-4 hover:underline"
      >
        <span className="font-semibold text-slate-900 tabular-nums">
          {activeMedications}
        </span>{' '}
        {activeMedications === 1 ? 'active medication' : 'active medications'}
      </Link>
    </p>
  )
}
