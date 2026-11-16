// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MedicationReminder } from '../src/components/MedicationReminder'
import { DoseSchedule } from '../src/components/DoseSchedule'
import { doseTiming, type ScheduledDose } from '../src/lib/utils'
const now = new Date('2026-01-02T09:00:00')
vi.mock('../src/contexts/DataContext', () => ({
  useVault: () => ({
    userId: 'user-1',
    now: new Date('2026-01-02T09:00:00'),
    reload: vi.fn(),
  }),
}))
const dose: ScheduledDose = {
  medication: {
    id: 'med-1',
    user_id: 'user-1',
    name: 'Sample medication',
    dosage: 'Demo only',
    form: 'tablet',
    strength: '',
    frequency: 'once_daily',
    times: ['08:00'],
    start_date: '2026-01-01',
    end_date: null,
    instructions: '',
    source_record_id: null,
    prescription_text: '',
    created_at: '',
    updated_at: '',
  },
  date: '2026-01-02',
  time: '08:00',
  log: undefined,
}
const skipped: ScheduledDose = {
  ...dose,
  medication: { ...dose.medication, id: 'med-2', name: 'Logged medication' },
  log: {
    id: 'log-1',
    user_id: 'user-1',
    medication_id: 'med-2',
    scheduled_date: '2026-01-02',
    scheduled_time: '08:00',
    status: 'skipped',
    logged_at: '',
    created_at: '',
    updated_at: '',
  },
}
afterEach(cleanup)
describe('website medication check-ins', () => {
  it('distinguishes future, due-minute and past-time boundaries in local time, and preserves logged outcomes', () => {
    expect(doseTiming(dose, new Date('2026-01-02T07:59:59'))).toBe('scheduled')
    expect(doseTiming(dose, new Date('2026-01-02T08:00:00'))).toBe('due')
    expect(doseTiming(dose, new Date('2026-01-02T08:00:59'))).toBe('due')
    expect(doseTiming(dose, new Date('2026-01-02T08:01:00'))).toBe('past_time')
    expect(doseTiming(skipped, now)).toBe('skipped')
  })
  it('shows a safe in-app check-in only for unlogged due doses', () => {
    render(<MedicationReminder doses={[dose, skipped]} now={now} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 dose awaiting a log',
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'not instructions to take a late or extra dose',
    )
  })
  it('shows the next future time and recognizes all logged outcomes, including skipped doses', () => {
    const { rerender } = render(
      <MedicationReminder doses={[{ ...dose, time: '20:00' }]} now={now} />,
    )
    expect(screen.getByText('Next scheduled dose at 20:00')).toBeInTheDocument()
    rerender(<MedicationReminder doses={[skipped]} now={now} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      "Today's doses are all logged",
    )
    expect(screen.getByRole('status')).toHaveTextContent('0 taken · 1 skipped')
  })
  it('filters pending and logged doses without losing access to undo', () => {
    render(<DoseSchedule doses={[dose, skipped]} />)
    fireEvent.click(screen.getByRole('button', { name: /To log/ }))
    expect(screen.getByText('Past scheduled time')).toBeInTheDocument()
    expect(screen.queryByText('Logged medication')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Logged/ }))
    expect(screen.getByText('Logged medication')).toBeInTheDocument()
    expect(screen.queryByText('Sample medication')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Undo Logged medication/ }),
    ).toBeInTheDocument()
  })
})
