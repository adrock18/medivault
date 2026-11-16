// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from '../src/pages/DashboardPage'
import { localDate } from '../src/lib/utils'
import type {
  Medication,
  DoseLog,
  MedicalRecord,
} from '../src/lib/database.types'
const fixture = vi.hoisted(() => ({ vault: {} }))
vi.mock('../src/contexts/DataContext', () => ({
  useVault: () => fixture.vault,
}))
afterEach(cleanup)
it('derives dashboard totals from persisted records, active schedules and exact dose outcomes', () => {
  const today = localDate()
  const base: Medication = {
    id: 'm1',
    user_id: 'u1',
    name: 'Example A',
    dosage: 'Example only',
    form: 'tablet',
    strength: '',
    source_record_id: null,
    prescription_text: '',
    frequency: 'twice_daily',
    times: ['08:00', '20:00'],
    start_date: today,
    end_date: null,
    instructions: '',
    created_at: '',
    updated_at: '',
  }
  const medications: Medication[] = [
    base,
    { ...base, id: 'm2', name: 'Example B' },
    {
      ...base,
      id: 'm3',
      name: 'Completed',
      start_date: '2020-01-01',
      end_date: '2020-01-02',
    },
  ]
  const log: DoseLog = {
    id: 'l1',
    user_id: 'u1',
    medication_id: 'm1',
    scheduled_date: today,
    scheduled_time: '08:00',
    status: 'taken',
    logged_at: '',
    created_at: '',
    updated_at: '',
  }
  const record: MedicalRecord = {
    id: 'r1',
    user_id: 'u1',
    title: 'Persisted report',
    category: 'lab_report',
    provider: 'Example provider',
    record_date: today,
    file_path: 'u1/report.pdf',
    file_name: 'report.pdf',
    file_type: 'application/pdf',
    file_size: 50,
    created_at: '',
    updated_at: '',
  }
  fixture.vault = {
    now: new Date(),
    profile: { full_name: 'Alex Morgan' },
    healthProfile: null,
    records: [record],
    medications,
    logs: [log, { ...log, id: 'l2', medication_id: 'm2', status: 'skipped' }],
    metrics: [],
    userId: 'u1',
    reload: vi.fn(),
  }
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
  const todayRegion = within(screen.getByRole('region', { name: 'Today' }))
  expect(
    screen
      .getByRole('navigation', { name: 'Quick actions' })
      .compareDocumentPosition(
        screen.getByRole('heading', { name: 'Last 7 days' }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(
    todayRegion.getByRole('img', {
      name: /^4 doses today: 1 taken, 1 skipped, 2 not yet logged\./,
    }),
  ).toBeInTheDocument()
  expect(
    todayRegion.getByRole('button', { name: 'Show 1 taken dose' }),
  ).toBeInTheDocument()
  expect(
    todayRegion.getByRole('button', { name: 'Show 1 skipped dose' }),
  ).toBeInTheDocument()
  const unlogged = todayRegion.getByRole('button', {
    name: 'Show 2 not yet logged doses',
  })
  const undo = { name: 'Undo Example A dose at 08:00' }
  expect(todayRegion.getByRole('button', undo)).toBeInTheDocument()
  fireEvent.click(unlogged)
  expect(unlogged).toHaveAttribute('aria-pressed', 'true')
  expect(todayRegion.queryByRole('button', undo)).not.toBeInTheDocument()
  expect(
    todayRegion.getAllByRole('button', { name: /^Mark .* as taken$/ }),
  ).toHaveLength(2)
  fireEvent.click(unlogged)
  expect(todayRegion.getByRole('button', undo)).toBeInTheDocument()
  fireEvent.click(
    todayRegion.getByRole('button', { name: 'Show 1 taken dose' }),
  )
  fireEvent.click(
    todayRegion.getByRole('button', {
      name: 'Showing taken doses. Clear filter',
    }),
  )
  expect(
    todayRegion.getAllByRole('button', { name: /^Mark .* as taken$/ }),
  ).toHaveLength(2)
  expect(
    todayRegion.getByRole('list', { name: 'Daily insight' }),
  ).toHaveTextContent('2 of 4 doses logged today.')
  const week = within(
    screen.getByRole('group', { name: 'Dose activity for the last 7 days' }),
  )
  expect(week.getAllByRole('button')).toHaveLength(7)
  expect(week.getByRole('button', { pressed: true })).toHaveAccessibleName(
    /1 taken, 1 skipped, 2 not yet logged$/,
  )
  expect(
    screen.getByText('1 taken of 2 logged doses in the last 30 days'),
  ).toBeInTheDocument()
  expect(screen.getByText('50%')).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: '1 medical record' }),
  ).toHaveAttribute('href', '/medical-records')
  expect(
    screen.getByRole('link', { name: '2 active medications' }),
  ).toHaveAttribute('href', '/medications')
  expect(screen.queryByText(/\b(missed|should)\b/i)).not.toBeInTheDocument()
  expect(screen.getByText('Persisted report')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Upload record' })).toHaveAttribute(
    'href',
    '/medical-records?action=upload',
  )
  expect(screen.getByRole('link', { name: 'Add medication' })).toHaveAttribute(
    'href',
    '/medications?action=add',
  )
  expect(
    screen.getByRole('link', { name: 'Scan prescription' }),
  ).toHaveAttribute('href', '/medications?action=scan')
  expect(
    screen.queryByRole('link', { name: 'Record measurement' }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByText('A healthier routine starts with clarity.'),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('link', { name: 'Upload your first record' }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Complete your health profile' }),
  ).toBeInTheDocument()
})
it('offers optional setup from real data and removes completed items', () => {
  const empty = {
    now: new Date(),
    profile: { full_name: 'Alex' },
    healthProfile: null,
    records: [],
    medications: [],
    logs: [],
    metrics: [],
    reload: vi.fn(),
  }
  fixture.vault = empty
  const { rerender } = render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
  const setup = screen.getByRole('region', { name: 'Workspace setup' })
  expect(within(setup).getAllByRole('link')).toHaveLength(3)
  expect(
    within(setup).getByText(/Medication setup is optional/),
  ).toBeInTheDocument()
  fixture.vault = { ...empty, healthProfile: { full_name: 'Alex' } }
  rerender(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
  expect(
    screen.queryByRole('link', { name: 'Complete your health profile' }),
  ).not.toBeInTheDocument()
  expect(
    within(
      screen.getByRole('region', { name: 'Workspace setup' }),
    ).getAllByRole('link'),
  ).toHaveLength(2)
})
