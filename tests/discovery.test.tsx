// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import MedicationsPage from '../src/pages/MedicationsPage'
import MedicalRecordsPage from '../src/pages/MedicalRecordsPage'
import type { Medication, MedicalRecord } from '../src/lib/database.types'

const fixture = vi.hoisted(() => ({ vault: {} }))
vi.mock('../src/contexts/DataContext', () => ({
  useVault: () => fixture.vault,
}))
afterEach(cleanup)
const medication: Medication = {
  id: 'm1',
  user_id: 'u1',
  name: 'Alpha medicine',
  dosage: 'As prescribed',
  frequency: 'once_daily',
  times: ['20:00'],
  start_date: '2026-01-01',
  end_date: null,
  instructions: '',
  created_at: '',
  updated_at: '',
}
const record: MedicalRecord = {
  id: 'r1',
  user_id: 'u1',
  title: 'Older report',
  category: 'lab_report',
  provider: 'Test clinic',
  record_date: '2026-01-01',
  file_path: 'u1/test.pdf',
  file_name: 'report.pdf',
  file_type: 'application/pdf',
  file_size: 50,
  created_at: '2026-01-04T08:00:00Z',
  updated_at: '',
}
function vault(medications: Medication[], records: MedicalRecord[]) {
  fixture.vault = {
    medications,
    records,
    logs: [],
    now: new Date('2026-01-02T08:00:00'),
    reload: vi.fn(),
  }
}
it('combines normalized medication search with status and resets without changing saved entries', () => {
  const entries = [
    medication,
    { ...medication, id: 'm2', name: 'Alpha future', start_date: '2026-02-01' },
    { ...medication, id: 'm3', name: 'Beta medicine' },
  ]
  vault(entries, [])
  render(
    <MemoryRouter>
      <MedicationsPage />
    </MemoryRouter>,
  )
  fireEvent.change(screen.getByLabelText('Search medications'), {
    target: { value: ' ALPHA ' },
  })
  expect(
    screen.getByRole('heading', { name: 'Alpha medicine' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: 'Alpha future' }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: 'Beta medicine' }),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'upcoming', exact: true }))
  expect(
    screen.getByRole('heading', { name: 'Alpha future' }),
  ).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Search medications'), {
    target: { value: 'not present' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  expect(screen.getByLabelText('Search medications')).toHaveValue('')
  expect(
    screen.getByRole('button', { name: 'active', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  expect(
    screen.getByRole('heading', { name: 'Beta medicine' }),
  ).toBeInTheDocument()
  expect(entries.map((entry) => entry.name)).toEqual([
    'Alpha medicine',
    'Alpha future',
    'Beta medicine',
  ])
})
it('keeps medication setup distinct from an unmatched populated list', () => {
  vault([], [])
  render(
    <MemoryRouter>
      <MedicationsPage />
    </MemoryRouter>,
  )
  expect(
    screen.getByRole('heading', { name: 'Your medication space is ready' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Clear filters' }),
  ).not.toBeInTheDocument()
})
it('combines normalized record search and category with deterministic date sorting and reset', () => {
  const entries: MedicalRecord[] = [
    { ...record, id: 'z', title: 'Tie Z', record_date: '2026-01-02' },
    record,
    { ...record, id: 'a', title: 'Tie A', record_date: '2026-01-02' },
    {
      ...record,
      id: 'recent',
      title: 'Recently uploaded tie',
      record_date: '2026-01-02',
      created_at: '2026-01-05T08:00:00Z',
    },
    {
      ...record,
      id: 'scan',
      title: 'Scan',
      category: 'scan',
      record_date: '2026-01-03',
    },
  ]
  vault([], entries)
  render(
    <MemoryRouter>
      <MedicalRecordsPage />
    </MemoryRouter>,
  )
  const titles = () =>
    screen.getAllByRole('heading', { level: 2 }).map((e) => e.textContent)
  fireEvent.change(screen.getByLabelText('Search records'), {
    target: { value: ' TEST CLINIC ' },
  })
  fireEvent.change(screen.getByLabelText('Category'), {
    target: { value: 'lab_report' },
  })
  expect(titles()).toEqual([
    'Recently uploaded tie',
    'Tie A',
    'Tie Z',
    'Older report',
  ])
  fireEvent.change(screen.getByLabelText('Record date order'), {
    target: { value: 'oldest' },
  })
  expect(titles()).toEqual([
    'Older report',
    'Recently uploaded tie',
    'Tie A',
    'Tie Z',
  ])
  fireEvent.change(screen.getByLabelText('Search records'), {
    target: { value: 'not present' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  expect(screen.getByLabelText('Record date order')).toHaveValue('newest')
  expect(screen.getByLabelText('Category')).toHaveValue('')
  expect(titles()[0]).toBe('Scan')
  expect(entries.map((entry) => entry.id)).toEqual([
    'z',
    'r1',
    'a',
    'recent',
    'scan',
  ])
  expect(screen.getAllByText(/50 bytes/)).toHaveLength(5)
})
