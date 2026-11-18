/**
 * Shared PDF.js setup. Points the parser at its bundled local worker so preview
 * and OCR use the same self-hosted runtime.
 */

import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

export { pdfjs }
