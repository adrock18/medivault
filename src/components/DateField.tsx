/**
 * Shared typed calendar-date control. Keeps day/month/year editing state while
 * emitting an ISO-shaped value for shared form validation.
 */

import { useEffect, useId, useRef, useState, type Ref } from 'react'
import { Field } from '@/components/common'

/**
 * Split a saved ISO date into editable parts without converting it through a
 * timezone-sensitive Date.
 */
function dateParts(value: string) {
  const [year = '', month = '', day = ''] = value.split('-')
  return { day, month, year }
}

/**
 * Keep typed date parts editable and emit an ISO-shaped value; the shared form
 * schema rejects incomplete or impossible dates at validation time.
 */
export function DateField({
  label,
  birthday = false,
  value,
  onChange,
  onBlur,
  inputRef,
  error,
}: {
  label: string
  birthday?: boolean
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: Ref<HTMLInputElement>
  error?: string
}) {
  const [parts, setParts] = useState(() => dateParts(value))
  const emitted = useRef(value)
  const helpId = useId()
  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value
      setParts(dateParts(value))
    }
  }, [value])

  /**
   * Keep partial typing locally and track emitted values so parent updates do not
   * reset the user editing state.
   */
  function change(part: keyof typeof parts, text: string) {
    const next = { ...parts, [part]: text }
    setParts(next)
    const date =
      next.day || next.month || next.year
        ? `${next.year}-${next.month.padStart(2, '0')}-${next.day.padStart(2, '0')}`
        : ''
    emitted.current = date
    onChange(date)
  }

  return (
    <fieldset data-slot="date-field" className="min-w-0" aria-invalid={!!error}>
      <legend className="mb-2 p-0 text-sm leading-5 font-medium">
        {label}
      </legend>
      <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2 [&_label]:sr-only">
        {(['day', 'month', 'year'] as const).map((part) => (
          <Field
            key={part}
            label={part[0].toUpperCase() + part.slice(1)}
            placeholder={
              part === 'year' ? 'YYYY' : part === 'month' ? 'MM' : 'DD'
            }
            inputMode="numeric"
            autoComplete={birthday ? `bday-${part}` : 'off'}
            maxLength={part === 'year' ? 4 : 2}
            value={parts[part]}
            onChange={(event) => change(part, event.target.value)}
            onBlur={onBlur}
            ref={part === 'day' ? inputRef : undefined}
            aria-invalid={!!error}
            aria-describedby={helpId}
          />
        ))}
      </div>
      <p
        id={helpId}
        role={error ? 'alert' : undefined}
        className={
          error
            ? 'mt-2 text-xs leading-5 text-red-700'
            : 'mt-2 text-xs leading-5 text-muted-foreground'
        }
      >
        {error || 'Type the day, month, and four-digit year.'}
      </p>
    </fieldset>
  )
}
