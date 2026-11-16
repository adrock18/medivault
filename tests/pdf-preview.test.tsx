// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import PdfPreview from '../src/components/PdfPreview'

const mocks = vi.hoisted(() => ({
  getDocument: vi.fn(),
  getPage: vi.fn(),
  render: vi.fn(),
  cleanup: vi.fn(),
  destroy: vi.fn(),
  cancel: vi.fn(),
}))
vi.mock('../src/lib/pdf', () => ({ pdfjs: { getDocument: mocks.getDocument } }))
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    {} as CanvasRenderingContext2D,
  )
  mocks.render.mockImplementation(() => ({
    promise: Promise.resolve(),
    cancel: mocks.cancel,
  }))
  mocks.getPage.mockImplementation(async () => ({
    getViewport: ({ scale }: { scale: number }) => ({
      width: 10_000 * scale,
      height: 10_000 * scale,
    }),
    render: mocks.render,
    cleanup: mocks.cleanup,
  }))
  mocks.getDocument.mockReturnValue({
    promise: Promise.resolve({ numPages: 11, getPage: mocks.getPage }),
    destroy: mocks.destroy,
  })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})
function fixture() {
  const blob = new Blob(['%PDF-fixture'])
  Object.defineProperty(blob, 'arrayBuffer', {
    value: async () => new ArrayBuffer(8),
  })
  return blob
}
it('caps rendering pixels, supports more than ten pages, and disposes PDF work', async () => {
  const view = render(<PdfPreview blob={fixture()} />)
  await waitFor(() => expect(screen.getByRole('img')).toBeVisible())
  const canvas = screen.getByRole('img')
  expect(canvas).toBeInstanceOf(HTMLCanvasElement)
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error('Expected PDF canvas')
  expect(canvas.width * canvas.height).toBeLessThanOrEqual(12_000_000)
  expect(mocks.getDocument).toHaveBeenCalledWith(
    expect.objectContaining({ wasmUrl: '/ocr/pdf/' }),
  )
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  for (let page = 2; page <= 11; page++) {
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() =>
      expect(screen.getByRole('img')).toHaveAccessibleName(
        `Document page ${page}`,
      ),
    )
  }
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled(),
  )
  expect(screen.getByText('Page 11 of 11')).toBeInTheDocument()
  view.unmount()
  expect(mocks.destroy).toHaveBeenCalledTimes(1)
  expect(mocks.cancel).toHaveBeenCalled()
  expect(mocks.cleanup).toHaveBeenCalled()
})
it('reports protected or corrupt PDF access and retries explicitly', async () => {
  mocks.getDocument.mockReturnValueOnce({
    promise: Promise.reject(new Error('Protected PDF')),
    destroy: mocks.destroy,
  })
  render(<PdfPreview blob={fixture()} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Protected PDF')
  fireEvent.click(screen.getByRole('button', { name: 'Retry PDF preview' }))
  await waitFor(() => expect(screen.getByRole('img')).toBeVisible())
})
it('preserves the pixel cap for extremely narrow pages', async () => {
  mocks.getPage.mockResolvedValueOnce({
    getViewport: ({ scale }: { scale: number }) => ({
      width: 20_000_000 * scale,
      height: 0.000001 * scale,
    }),
    render: mocks.render,
    cleanup: mocks.cleanup,
  })
  render(<PdfPreview blob={fixture()} />)
  await waitFor(() => expect(screen.getByRole('img')).toBeVisible())
  const canvas = screen.getByRole('img')
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error('Expected PDF canvas')
  expect(canvas.width * canvas.height).toBeLessThanOrEqual(12_000_000)
})
