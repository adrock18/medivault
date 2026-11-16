// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { RecordPreview } from '../src/components/RecordPreview'
import type { MedicalRecord } from '../src/lib/database.types'

const mocks = vi.hoisted(() => ({
  file: vi.fn(),
  create: vi.fn(),
  revoke: vi.fn(),
  open: vi.fn(),
  download: vi.fn(),
  error: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: mocks.error } }))
vi.mock('../src/lib/api', () => ({
  api: { records: { file: mocks.file } },
  errorMessage: (error: Error) => error.message,
}))
vi.mock('../src/lib/records', () => ({
  viewRecord: mocks.open,
  downloadRecord: mocks.download,
}))
const record: MedicalRecord = {
  id: 'r1',
  user_id: 'u1',
  title: 'Fictional image',
  category: 'lab_report',
  provider: 'Test clinic',
  record_date: '2026-01-02',
  file_path: 'private/image.png',
  file_name: 'image.png',
  file_type: 'image/png',
  file_size: 100,
  created_at: '',
  updated_at: '',
}
let trigger: HTMLButtonElement
beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  mocks.create.mockReturnValue('blob:fictional')
  mocks.file.mockResolvedValue(new Blob(['image'], { type: 'image/png' }))
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = mocks.create
      static revokeObjectURL = mocks.revoke
    },
  )
  trigger = document.createElement('button')
  document.body.append(trigger)
})
afterEach(() => {
  cleanup()
  trigger.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})
function preview(item = record) {
  return (
    <RecordPreview
      selection={{ record: item, trigger }}
      available
      onClose={vi.fn()}
    />
  )
}
it('displays authorized images and releases their object URLs on close/unmount', async () => {
  const view = render(preview())
  expect(
    await screen.findByRole('img', { name: 'Document: Fictional image' }),
  ).toHaveAttribute('src', 'blob:fictional')
  expect(mocks.file).toHaveBeenCalledWith('r1')
  fireEvent.click(screen.getByRole('button', { name: 'Open in new tab' }))
  await waitFor(() => expect(mocks.open).toHaveBeenCalledWith(record))
  fireEvent.click(screen.getByRole('button', { name: 'Download' }))
  await waitFor(() => expect(mocks.download).toHaveBeenCalledWith(record))
  view.unmount()
  expect(mocks.revoke).toHaveBeenCalledWith('blob:fictional')
})
it('surfaces denied access, retains alternatives, and allows a successful retry', async () => {
  mocks.file.mockRejectedValueOnce(new Error('Access denied'))
  render(preview())
  expect(await screen.findByRole('alert')).toHaveTextContent('Access denied')
  expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Retry preview' }))
  expect(
    await screen.findByRole('img', { name: 'Document: Fictional image' }),
  ).toBeInTheDocument()
})
it('ignores a file response after the preview has been removed', async () => {
  let finish!: (blob: Blob) => void
  mocks.file.mockReturnValueOnce(
    new Promise<Blob>((resolve) => {
      finish = resolve
    }),
  )
  const view = render(preview())
  expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled()
  view.unmount()
  await act(async () => finish(new Blob(['late'])))
  expect(mocks.create).not.toHaveBeenCalled()
})
it('discards an old response when switching records and removes content when unavailable', async () => {
  let finish!: (blob: Blob) => void
  mocks.file.mockReturnValueOnce(
    new Promise<Blob>((resolve) => {
      finish = resolve
    }),
  )
  const view = render(preview())
  const other = { ...record, id: 'r2', title: 'Other image' }
  view.rerender(preview(other))
  expect(
    await screen.findByRole('img', { name: 'Document: Other image' }),
  ).toBeInTheDocument()
  await act(async () => finish(new Blob(['late'])))
  expect(mocks.create).toHaveBeenCalledTimes(1)
  view.rerender(
    <RecordPreview
      selection={{ record: other, trigger }}
      available={false}
      onClose={vi.fn()}
    />,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('no longer available')
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(mocks.revoke).toHaveBeenCalledWith('blob:fictional')
})
it('surfaces a render failure without losing recovery controls', async () => {
  render(preview())
  const image = await screen.findByRole('img', {
    name: 'Document: Fictional image',
  })
  fireEvent.error(image)
  expect(screen.getByRole('alert')).toHaveTextContent('could not be rendered')
  expect(screen.getByRole('button', { name: 'Open in new tab' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Retry preview' }))
  expect(
    await screen.findByRole('img', { name: 'Document: Fictional image' }),
  ).toBeInTheDocument()
})
it.each(['Open in new tab', 'Download'])(
  'reports private-access failures from %s',
  async (name) => {
    mocks.open.mockRejectedValue(new Error('Private access denied'))
    mocks.download.mockRejectedValue(new Error('Private access denied'))
    render(preview())
    await screen.findByRole('img')
    fireEvent.click(screen.getByRole('button', { name }))
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith('Private access denied'),
    )
    expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled()
  },
)
