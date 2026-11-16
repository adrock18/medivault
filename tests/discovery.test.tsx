// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import {
  MemoryRouter,
  RouterProvider,
  createMemoryRouter,
  Outlet,
} from 'react-router-dom'
import MedicationsPage from '../src/pages/MedicationsPage'
import MedicalRecordsPage from '../src/pages/MedicalRecordsPage'
import { MedicationForm } from '../src/components/MedicationForm'
import { CommandPalette } from '../src/components/CommandPalette'
import type { Medication, MedicalRecord } from '../src/lib/database.types'

const fixture = vi.hoisted(() => ({ vault: {} }))
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  update: vi.fn(),
  file: vi.fn(),
}))
vi.mock('../src/contexts/DataContext', () => ({
  useVault: () => fixture.vault,
}))
vi.mock('../src/lib/api', () => ({
  errorMessage: (error: Error) => error.message,
  api: {
    medications: { save: mocks.save },
    records: { update: mocks.update, file: mocks.file },
  },
}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
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

it('browses a read-only calendar independently of list filters and returns focus to today', async () => {
  vault([medication], [])
  render(
    <MemoryRouter>
      <MedicationsPage />
    </MemoryRouter>,
  )
  const calendar = screen.getByRole('region', { name: 'Medication calendar' })
  const controls = within(calendar)
  fireEvent.change(screen.getByLabelText('Search medications'), {
    target: { value: 'no matching medicine' },
  })
  expect(controls.getByText('Alpha medicine')).toBeInTheDocument()
  fireEvent.click(controls.getByRole('button', { name: 'Next month' }))
  expect(controls.getByText('February 2026')).toBeInTheDocument()
  expect(controls.getByText('Upcoming')).toBeInTheDocument()
  fireEvent.click(
    within(controls.getByRole('region', { name: 'Month dates' })).getByRole(
      'button',
      { name: /^Thursday, February 5, 2026:/ },
    ),
  )
  expect(
    controls.getByRole('heading', { name: 'Thursday, February 5' }),
  ).toBeInTheDocument()
  expect(
    controls.queryByRole('button', { name: /^Mark |^Skip |^Undo / }),
  ).not.toBeInTheDocument()
  fireEvent.click(controls.getByRole('button', { name: 'Today' }))
  expect(controls.getByText('January 2026')).toBeInTheDocument()
  fireEvent.click(
    controls.getByRole('button', { name: "Go to today's schedule" }),
  )
  expect(screen.getByLabelText("Today's actionable schedule")).toHaveFocus()
  expect(mocks.save).not.toHaveBeenCalled()
})

it('resets the calendar medication filter when its source-record scope changes', async () => {
  vault(
    [
      { ...medication, source_record_id: 'r1' },
      {
        ...medication,
        id: 'm2',
        name: 'Other medicine',
        source_record_id: 'r2',
      },
    ],
    [],
  )
  const router = createMemoryRouter(
    [{ path: '*', element: <MedicationsPage /> }],
    { initialEntries: ['/medications?record=r1'] },
  )
  render(<RouterProvider router={router} />)
  fireEvent.click(screen.getByRole('combobox', { name: 'Calendar medication' }))
  const option = await screen.findByRole('option', { name: 'Alpha medicine' })
  fireEvent.pointerDown(option)
  fireEvent.click(option)
  expect(
    screen.getByRole('combobox', { name: 'Calendar medication' }),
  ).toHaveTextContent('Alpha medicine')
  await act(async () => router.navigate('/medications?record=r2'))
  expect(
    screen.getByRole('combobox', { name: 'Calendar medication' }),
  ).toHaveTextContent('All linked medications')
  const calendar = screen.getByRole('region', { name: 'Medication calendar' })
  expect(calendar).toHaveTextContent('Other medicine')
  expect(calendar).not.toHaveTextContent('Alpha medicine')
})
it('offers a clear calendar filter when a selected prescription has no entries', async () => {
  vault([{ ...medication, end_date: '2026-01-03' }], [])
  render(
    <MemoryRouter>
      <MedicationsPage />
    </MemoryRouter>,
  )
  const calendar = within(
    screen.getByRole('region', { name: 'Medication calendar' }),
  )
  fireEvent.click(
    calendar.getByRole('combobox', { name: 'Calendar medication' }),
  )
  const option = await screen.findByRole('option', { name: 'Alpha medicine' })
  fireEvent.pointerDown(option)
  fireEvent.click(option)
  fireEvent.click(calendar.getByRole('button', { name: 'Next month' }))
  expect(
    calendar.getByText('No entries match this medication on this date.'),
  ).toBeInTheDocument()
  fireEvent.click(
    calendar.getByRole('button', { name: 'Clear calendar filter' }),
  )
  expect(
    calendar.getByRole('combobox', { name: 'Calendar medication' }),
  ).toHaveTextContent('All medications')
  expect(calendar.getByText('No entries on this date.')).toBeInTheDocument()
})
it.each(['Add medication', 'Scan prescription', 'Upload record'])(
  'cancels the %s workflow launched through the palette',
  async (name) => {
    vault([], [])
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <>
              <CommandPalette />
              <Outlet />
            </>
          ),
          children: [
            { path: 'medications', element: <MedicationsPage /> },
            { path: 'medical-records', element: <MedicalRecordsPage /> },
          ],
        },
      ],
      { initialEntries: ['/medications'] },
    )
    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('button', { name: 'Search actions' }))
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name }),
    )
    await waitFor(() =>
      expect(router.state.location.search).toContain('action='),
    )
    await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(1))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(router.state.location.search).not.toContain('action=')
    expect(mocks.save).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  },
)
it('retains a source-linked record, search, category, order, and trigger focus after preview dismissal', async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vault(
    [{ ...medication, source_record_id: 'r1' }],
    [record, { ...record, id: 'r2', title: 'Unrelated report' }],
  )
  mocks.file.mockRejectedValue(new Error('Fixture preview denied'))
  render(
    <MemoryRouter initialEntries={['/medical-records?record=r1']}>
      <MedicalRecordsPage />
    </MemoryRouter>,
  )
  fireEvent.change(screen.getByLabelText('Search records'), {
    target: { value: ' OLDER ' },
  })
  for (const [label, value] of [
    ['Category', 'Lab report'],
    ['Record date order', 'Oldest record date'],
  ]) {
    fireEvent.click(screen.getByRole('combobox', { name: label }))
    const option = await screen.findByRole('option', { name: value })
    fireEvent.pointerDown(option)
    fireEvent.click(option)
  }
  const trigger = screen.getByRole('button', { name: 'View Older report' })
  fireEvent.click(trigger)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Fixture preview denied',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  await waitFor(() => expect(trigger).toHaveFocus())
  expect(screen.getByLabelText('Search records')).toHaveValue(' OLDER ')
  expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent(
    'Lab report',
  )
  expect(
    screen.getByRole('combobox', { name: 'Record date order' }),
  ).toHaveTextContent('Oldest record date')
  expect(
    screen.getByText('Showing the linked medical record.'),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: 'Unrelated report' }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Scan for medications' }),
  ).toBeEnabled()
  expect(
    screen.getByRole('button', { name: 'Edit Older report' }),
  ).toBeEnabled()
  expect(
    screen.getByRole('link', { name: '1 linked medication' }),
  ).toHaveAttribute('href', '/medications?record=r1')
})
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
