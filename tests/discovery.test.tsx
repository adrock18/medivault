// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import {
  MemoryRouter,
  RouterProvider,
  createMemoryRouter,
} from 'react-router-dom'
import MedicationsPage from '../src/pages/MedicationsPage'
import MedicalRecordsPage from '../src/pages/MedicalRecordsPage'
import { MedicationForm } from '../src/components/MedicationForm'
import type { Medication, MedicalRecord } from '../src/lib/database.types'

const fixture = vi.hoisted(() => ({ vault: {} }))
const mocks = vi.hoisted(() => ({ save: vi.fn(), update: vi.fn() }))
vi.mock('../src/contexts/DataContext', () => ({
  useVault: () => fixture.vault,
}))
vi.mock('../src/lib/api', () => ({
  errorMessage: (error: Error) => error.message,
  api: {
    medications: { save: mocks.save },
    records: { update: mocks.update },
  },
}))
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})
const sourceId = '5b6f9a0e-3c1d-4e2f-8a7b-9c0d1e2f3a4b'
const statusButton = (name: string) => screen.getByRole('button', { name })
const medicationNames = () =>
  screen
    .queryAllByRole('heading', { level: 3 })
    .map((e) => e.textContent ?? '')
    .filter((name) => /^(Linked|Unrelated) /.test(name))
const medication: Medication = {
  id: 'm1',
  user_id: 'u1',
  name: 'Alpha medicine',
  dosage: 'As prescribed',
  form: 'tablet',
  strength: '',
  source_record_id: null,
  prescription_text: '',
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
it('saves custom dropdown values, clears a linked record, and locks dropdowns while saving', async () => {
  let finish!: () => void
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  const close = vi.fn()
  mocks.save.mockReturnValue(pending)
  vault([], [{ ...record, id: sourceId }])
  render(
    <MedicationForm
      medication={{ ...medication, source_record_id: sourceId }}
      onClose={close}
    />,
  )
  expect(
    screen.getByLabelText('Linked medical record (optional)'),
  ).toHaveTextContent('Older report')
  fireEvent.click(
    screen.getByRole('combobox', {
      name: 'Linked medical record (optional)',
    }),
  )
  const unlinked = await screen.findByRole('option', {
    name: 'No linked record',
  })
  fireEvent.pointerDown(unlinked)
  fireEvent.click(unlinked)
  fireEvent.click(screen.getByRole('combobox', { name: 'Medication form' }))
  const form = await screen.findByRole('option', { name: 'Capsule' })
  fireEvent.pointerDown(form)
  fireEvent.click(form)
  fireEvent.click(screen.getByRole('button', { name: 'Save medication' }))
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        form: 'capsule',
        source_record_id: '',
        frequency: 'once_daily',
      }),
      medication.id,
    ),
  )
  for (const control of screen.getAllByRole('combobox'))
    expect(control).toBeDisabled()
  expect(close).not.toHaveBeenCalled()
  await act(async () => finish())
  expect(close).toHaveBeenCalledOnce()
})
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
  fireEvent.click(statusButton('upcoming'))
  expect(
    screen.getByRole('heading', { name: 'Alpha future' }),
  ).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Search medications'), {
    target: { value: 'not present' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  expect(screen.getByLabelText('Search medications')).toHaveValue('')
  expect(statusButton('active')).toHaveAttribute('aria-pressed', 'true')
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
it('combines normalized record search and category with deterministic date sorting and reset', async () => {
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
  fireEvent.click(screen.getByRole('combobox', { name: 'Category' }))
  const category = await screen.findByRole('option', { name: 'Lab report' })
  fireEvent.pointerDown(category)
  fireEvent.click(category)
  expect(titles()).toEqual([
    'Recently uploaded tie',
    'Tie A',
    'Tie Z',
    'Older report',
  ])
  fireEvent.click(screen.getByRole('combobox', { name: 'Record date order' }))
  const order = await screen.findByRole('option', {
    name: 'Oldest record date',
  })
  fireEvent.pointerDown(order)
  fireEvent.click(order)
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
  expect(screen.getByLabelText('Record date order')).toHaveTextContent(
    'Newest record date',
  )
  expect(screen.getByLabelText('Category')).toHaveTextContent('All categories')
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
it('shows every linked medication status from a record link, including on an already-mounted page', async () => {
  const linked = { ...medication, source_record_id: sourceId }
  vault(
    [
      { ...linked, id: 'a', name: 'Linked active' },
      { ...linked, id: 'u', name: 'Linked upcoming', start_date: '2026-02-01' },
      {
        ...linked,
        id: 'c',
        name: 'Linked completed',
        start_date: '2025-12-01',
        end_date: '2025-12-31',
      },
      { ...medication, id: 'x', name: 'Unrelated active' },
    ],
    [],
  )
  const router = createMemoryRouter(
    [{ path: '/medications', element: <MedicationsPage /> }],
    { initialEntries: ['/medications'] },
  )
  render(<RouterProvider router={router} />)
  expect(medicationNames()).toEqual(['Linked active', 'Unrelated active'])
  expect(statusButton('active')).toHaveAttribute('aria-pressed', 'true')

  await act(() => router.navigate(`/medications?record=${sourceId}`))
  expect(statusButton('all')).toHaveAttribute('aria-pressed', 'true')
  expect(medicationNames()).toEqual([
    'Linked active',
    'Linked upcoming',
    'Linked completed',
  ])
  fireEvent.click(statusButton('completed'))
  expect(medicationNames()).toEqual(['Linked completed'])

  fireEvent.click(screen.getByRole('button', { name: 'Show all medications' }))
  expect(router.state.location.search).toBe('')
  expect(statusButton('completed')).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(statusButton('active'))
  expect(medicationNames()).toEqual(['Linked active', 'Unrelated active'])
})
it('keeps medication source scope and discovery controls when an edit is cancelled or saved', async () => {
  mocks.save.mockResolvedValue(undefined)
  const linked = { ...medication, source_record_id: sourceId }
  vault(
    [
      { ...linked, id: 'a', name: 'Linked active' },
      { ...linked, id: 'b', name: 'Linked second' },
      { ...medication, id: 'x', name: 'Unrelated active' },
    ],
    [{ ...record, id: sourceId }],
  )
  const router = createMemoryRouter(
    [{ path: '/medications', element: <MedicationsPage /> }],
    { initialEntries: [`/medications?record=${sourceId}`] },
  )
  render(<RouterProvider router={router} />)
  fireEvent.change(screen.getByLabelText('Search medications'), {
    target: { value: 'second' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Edit Linked second' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
  expect(router.state.location.search).toBe(`?record=${sourceId}`)
  expect(screen.getByLabelText('Search medications')).toHaveValue('second')
  expect(mocks.save).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Edit Linked second' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save medication' }))
  await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce())
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
  expect(router.state.location.search).toBe(`?record=${sourceId}`)
  expect(statusButton('all')).toHaveAttribute('aria-pressed', 'true')
  expect(medicationNames()).toEqual(['Linked second'])
})
it('keeps the selected source record when its metadata edit is cancelled or saved', async () => {
  mocks.update.mockResolvedValue(undefined)
  vault(
    [],
    [
      { ...record, id: sourceId },
      { ...record, id: 'other', title: 'Unrelated report' },
    ],
  )
  const router = createMemoryRouter(
    [{ path: '/medical-records', element: <MedicalRecordsPage /> }],
    { initialEntries: [`/medical-records?record=${sourceId}`] },
  )
  render(<RouterProvider router={router} />)
  fireEvent.click(screen.getByRole('combobox', { name: 'Category' }))
  const category = await screen.findByRole('option', { name: 'Lab report' })
  fireEvent.pointerDown(category)
  fireEvent.click(category)
  const titles = () =>
    screen.getAllByRole('heading', { level: 2 }).map((e) => e.textContent)
  expect(titles()).toEqual(['Older report'])

  fireEvent.click(screen.getByRole('button', { name: 'Edit Older report' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
  expect(mocks.update).not.toHaveBeenCalled()
  expect(router.state.location.search).toBe(`?record=${sourceId}`)
  expect(screen.getByLabelText('Category')).toHaveTextContent('Lab report')
  expect(titles()).toEqual(['Older report'])

  fireEvent.click(screen.getByRole('button', { name: 'Edit Older report' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save details' }))
  await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce())
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
  expect(router.state.location.search).toBe(`?record=${sourceId}`)
  expect(titles()).toEqual(['Older report'])

  fireEvent.click(screen.getByRole('button', { name: 'Show all records' }))
  expect(router.state.location.search).toBe('')
  expect(titles()).toContain('Unrelated report')
})
