import { createWorker, OEM, type Worker } from 'tesseract.js'
import { pdfjs } from './pdf'
const MAX_PAGES = 10
const MAX_PIXELS = 25_000_000

export async function scanPrescription(
  blob: Blob,
  progress: (message: string) => void,
  signal: AbortSignal,
) {
  let worker: Worker | undefined
  const abort = () => {
    void worker?.terminate()
  }
  signal.addEventListener('abort', abort)
  const check = () => {
    signal.throwIfAborted()
  }
  async function recognize(canvas: HTMLCanvasElement, label: string) {
    check()
    worker ??= await createWorker('eng', OEM.LSTM_ONLY, {
      workerPath: '/ocr/worker.min.js',
      corePath: '/ocr/tesseract-core-lstm.wasm.js',
      langPath: '/ocr',
      workerBlobURL: false,
      cacheMethod: 'none',
      logger: ({ status, progress: value }) => {
        if (!signal.aborted)
          progress(
            `${label}: ${status === 'recognizing text' ? `reading ${Math.round(value * 100)}%` : 'preparing local OCR'}`,
          )
      },
    })
    check()
    let rejectAbort: (() => void) | undefined
    const aborted = new Promise<never>((_resolve, reject) => {
      rejectAbort = () =>
        reject(new DOMException('Scan cancelled.', 'AbortError'))
      signal.addEventListener('abort', rejectAbort, { once: true })
    })
    try {
      const { data } = await Promise.race([worker.recognize(canvas), aborted])
      return data.text
    } finally {
      if (rejectAbort) signal.removeEventListener('abort', rejectAbort)
    }
  }
  function canvasFor(width: number, height: number) {
    if (!width || !height || width * height > MAX_PIXELS)
      throw new Error(
        'This image is too large to scan. Use an image under 25 megapixels.',
      )
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(width)
    canvas.height = Math.ceil(height)
    const context = canvas.getContext('2d')
    if (!context)
      throw new Error(
        'Your browser could not prepare the document for scanning.',
      )
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    return { canvas, context }
  }
  try {
    check()
    let text: string
    if (blob.type === 'application/pdf') {
      const loading = pdfjs.getDocument({
        data: new Uint8Array(await blob.arrayBuffer()),
        useSystemFonts: true,
        wasmUrl: '/ocr/pdf/',
      })
      const cancelPdf = () => {
        void loading.destroy()
      }
      signal.addEventListener('abort', cancelPdf, { once: true })
      try {
        const pdf = await loading.promise
        if (pdf.numPages > MAX_PAGES)
          throw new Error(
            `Scan up to ${MAX_PAGES} pages at a time. Split this PDF before scanning.`,
          )
        const pages: string[] = []
        for (let number = 1; number <= pdf.numPages; number++) {
          check()
          progress(`Reading page ${number} of ${pdf.numPages}`)
          const page = await pdf.getPage(number)
          const content = await page.getTextContent()
          const native = content.items
            .map((item) =>
              'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '',
            )
            .join('')
          const operators = await page.getOperatorList()
          const hasImages = operators.fnArray.some((op) =>
            [
              pdfjs.OPS.paintImageXObject,
              pdfjs.OPS.paintInlineImageXObject,
              pdfjs.OPS.paintImageXObjectRepeat,
              pdfjs.OPS.paintImageMaskXObject,
            ].includes(op),
          )
          if (!hasImages && native.replace(/\s/g, '').length >= 30)
            pages.push(native)
          else {
            const base = page.getViewport({ scale: 1 })
            const viewport = page.getViewport({
              scale: Math.min(2.5, 2400 / Math.max(base.width, base.height)),
            })
            const { canvas, context } = canvasFor(
              viewport.width,
              viewport.height,
            )
            await page.render({ canvas, canvasContext: context, viewport })
              .promise
            pages.push(
              await recognize(canvas, `Page ${number} of ${pdf.numPages}`),
            )
            canvas.width = canvas.height = 0
          }
          page.cleanup()
        }
        text = pages.join('\n\n')
      } finally {
        signal.removeEventListener('abort', cancelPdf)
        await loading.destroy()
      }
    } else if (['image/png', 'image/jpeg'].includes(blob.type)) {
      const image = await createImageBitmap(blob)
      try {
        const { canvas, context } = canvasFor(image.width, image.height)
        context.drawImage(image, 0, 0)
        text = await recognize(canvas, 'Prescription')
        canvas.width = canvas.height = 0
      } finally {
        image.close()
      }
    } else throw new Error('Choose a PDF, JPG, or PNG prescription.')
    check()
    if (!text.trim())
      throw new Error(
        'No readable text was found. Try a sharper printed prescription or enter the medication manually.',
      )
    return text
  } finally {
    signal.removeEventListener('abort', abort)
    await worker?.terminate()
  }
}
