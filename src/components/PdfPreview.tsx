import { useEffect, useRef, useState } from 'react'
import type {
  PDFDocumentProxy,
  PDFDocumentLoadingTask,
  PDFPageProxy,
  RenderTask,
} from 'pdfjs-dist'
import { pdfjs } from '../lib/pdf'
import { errorMessage } from '../lib/api'
import { Button } from './ui/button'
import { LoadingState } from './common'

export default function PdfPreview({ blob }: { blob: Blob }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [rendering, setRendering] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let active = true
    let loading: PDFDocumentLoadingTask | undefined
    async function load() {
      try {
        const bytes = await blob.arrayBuffer()
        if (!active) return
        loading = pdfjs.getDocument({
          data: new Uint8Array(bytes),
          useSystemFonts: true,
          wasmUrl: '/ocr/pdf/',
        })
        const pdf = await loading.promise
        if (active) setDocument(pdf)
      } catch (err) {
        if (active)
          setError(
            `Unable to preview this PDF. ${errorMessage(err)} Open it in a new tab or download it instead.`,
          )
      }
    }
    void load()
    return () => {
      active = false
      void loading?.destroy()
    }
  }, [blob, attempt])
  useEffect(() => {
    if (!document || !canvas.current) return
    const pdf = document
    let active = true
    let task: RenderTask | undefined
    let page: PDFPageProxy | undefined
    const target = canvas.current
    async function renderPage() {
      try {
        page = await pdf.getPage(pageNumber)
        if (!active) {
          page.cleanup()
          return
        }
        const base = page.getViewport({ scale: 1 })
        if (
          !(base.width > 0) ||
          !(base.height > 0) ||
          !Number.isFinite(base.width * base.height)
        )
          throw new Error('The PDF page has invalid dimensions.')
        const scale = Math.min(
          2,
          Math.sqrt(12_000_000 / (base.width * base.height)),
          12_000_000 / base.width,
          12_000_000 / base.height,
        )
        const viewport = page.getViewport({ scale })
        target.width = Math.max(1, Math.floor(viewport.width))
        target.height = Math.max(1, Math.floor(viewport.height))
        const context = target.getContext('2d')
        if (!context)
          throw new Error('Your browser could not prepare a document canvas.')
        task = page.render({ canvas: target, canvasContext: context, viewport })
        await task.promise
        if (active) setRendering(false)
      } catch (err) {
        if (active)
          setError(
            `Unable to render this page. ${errorMessage(err)} Open it in a new tab or download it instead.`,
          )
      }
    }
    void renderPage()
    return () => {
      active = false
      task?.cancel()
      page?.cleanup()
      target.width = target.height = 0
    }
  }, [document, pageNumber])
  function retry() {
    setError(null)
    setDocument(null)
    setPageNumber(1)
    setRendering(true)
    setAttempt((value) => value + 1)
  }
  return (
    <div>
      {error ? (
        <div role="alert" className="rounded-xl border p-4">
          <p className="mb-3 text-sm">{error}</p>
          <Button variant="outline" onClick={retry}>
            Retry PDF preview
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              disabled={!document || rendering || pageNumber <= 1}
              onClick={() => {
                setRendering(true)
                setPageNumber((value) => value - 1)
              }}
            >
              Previous page
            </Button>
            <p className="text-sm tabular-nums" aria-live="polite">
              {document
                ? `Page ${pageNumber} of ${document.numPages}`
                : 'Preparing PDF'}
            </p>
            <Button
              variant="outline"
              disabled={
                !document || rendering || pageNumber >= document.numPages
              }
              onClick={() => {
                setRendering(true)
                setPageNumber((value) => value + 1)
              }}
            >
              Next page
            </Button>
          </div>
          {rendering && <LoadingState message="Rendering document page..." />}
        </>
      )}
      <canvas
        ref={canvas}
        hidden={!!error || rendering}
        role="img"
        aria-label={`Document page ${pageNumber}`}
        className="h-auto w-full rounded-lg bg-white"
      />
    </div>
  )
}
