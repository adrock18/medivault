import { readFileSync, statSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

export const ENTRY_BYTE_LIMIT = 500_000

const pdfAssets = [
  'openjpeg.wasm',
  'jbig2.wasm',
  'qcms_bg.wasm',
  'openjpeg_nowasm_fallback.js',
  'jbig2_nowasm_fallback.js',
  'LICENSE_OPENJPEG',
  'LICENSE_JBIG2',
  'LICENSE_QCMS',
  'LICENSE_PDFJS_OPENJPEG',
  'LICENSE_PDFJS_JBIG2',
  'LICENSE_PDFJS_QCMS',
]

/** Files emitted for local prescription scanning: [output path in dist, npm source]. */
export const localScanningAssets: readonly (readonly [string, string])[] = [
  ['ocr/worker.min.js', 'tesseract.js/dist/worker.min.js'],
  [
    'ocr/tesseract-core-lstm.wasm.js',
    'tesseract.js-core/tesseract-core-lstm.wasm.js',
  ],
  [
    'ocr/tesseract-core-lstm.wasm',
    'tesseract.js-core/tesseract-core-lstm.wasm',
  ],
  [
    'ocr/eng.traineddata.gz',
    '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
  ],
  ...pdfAssets.map(
    (name) => [`ocr/pdf/${name}`, `pdfjs-dist/wasm/${name}`] as const,
  ),
]

type ManifestChunk = {
  file: string
  isEntry?: boolean
  imports?: string[]
  dynamicImports?: string[]
  css?: string[]
  assets?: string[]
}

export class FrontendBuildError extends Error {
  constructor(distDir: string, problems: string[]) {
    super(
      `The production frontend build in ${distDir} is missing or incomplete:\n` +
        problems.map((problem) => `  - ${problem}`).join('\n') +
        '\nRun `npm run build` and start again.',
    )
    this.name = 'FrontendBuildError'
  }
}

function isStringList(value: unknown): value is string[] {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((item) => typeof item === 'string'))
  )
}

function parseManifest(distDir: string, problems: string[]) {
  let raw: unknown
  try {
    raw = JSON.parse(
      readFileSync(join(distDir, '.vite', 'manifest.json'), 'utf8'),
    )
  } catch (error) {
    problems.push(
      (error as NodeJS.ErrnoException).code === 'ENOENT'
        ? 'Missing .vite/manifest.json.'
        : '.vite/manifest.json is not valid JSON.',
    )
    return null
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    problems.push('.vite/manifest.json must be an object of chunks.')
    return null
  }
  const manifest: Record<string, ManifestChunk> = {}
  for (const [key, chunk] of Object.entries(raw)) {
    const valid =
      chunk &&
      typeof chunk === 'object' &&
      typeof chunk.file === 'string' &&
      chunk.file.length > 0 &&
      (chunk.isEntry === undefined || typeof chunk.isEntry === 'boolean') &&
      isStringList(chunk.imports) &&
      isStringList(chunk.dynamicImports) &&
      isStringList(chunk.css) &&
      isStringList(chunk.assets)
    if (!valid) problems.push(`Manifest chunk "${key}" has invalid metadata.`)
    else manifest[key] = chunk as ManifestChunk
  }
  return manifest
}

/**
 * Checks the emitted frontend: index.html, every file referenced by the Vite
 * manifest, and the local scanning assets. Throws FrontendBuildError listing
 * every problem. Pass entryByteLimit to also bound each entry file's size.
 */
export function checkFrontendBuild(
  distDir = resolve('dist'),
  { entryByteLimit }: { entryByteLimit?: number } = {},
) {
  const root = resolve(distDir)
  const problems: string[] = []
  const sizes = new Map<string, number>()
  function requireFile(file: string, label: string) {
    const path = resolve(root, file)
    const inside = relative(root, path)
    if (!inside || inside.startsWith('..') || isAbsolute(inside)) {
      problems.push(`${label} points outside the build: ${file}`)
      return null
    }
    if (sizes.has(file)) return sizes.get(file) ?? null
    let size: number | null = null
    try {
      const stats = statSync(path)
      if (!stats.isFile()) problems.push(`${label} is not a file: ${file}`)
      else if (stats.size === 0) problems.push(`${label} is empty: ${file}`)
      else size = stats.size
    } catch {
      problems.push(`Missing ${label}: ${file}`)
    }
    if (size !== null) sizes.set(file, size)
    return size
  }

  requireFile('index.html', 'HTML shell')
  const manifest = parseManifest(root, problems)
  const entries: { file: string; size: number }[] = []
  if (manifest) {
    const chunks = Object.entries(manifest)
    if (!chunks.some(([, chunk]) => chunk.isEntry))
      problems.push('The manifest has no entry chunk.')
    for (const [key, chunk] of chunks) {
      const size = requireFile(chunk.file, `chunk for "${key}"`)
      if (chunk.isEntry && size !== null) {
        entries.push({ file: chunk.file, size })
        if (entryByteLimit !== undefined && size > entryByteLimit)
          problems.push(
            `Entry ${chunk.file} is ${size} bytes, above the ${entryByteLimit}-byte limit.`,
          )
      }
      for (const file of [...(chunk.css ?? []), ...(chunk.assets ?? [])])
        requireFile(file, `asset for "${key}"`)
      for (const reference of [
        ...(chunk.imports ?? []),
        ...(chunk.dynamicImports ?? []),
      ])
        if (!(reference in manifest))
          problems.push(
            `Chunk "${key}" references "${reference}", which is not in the manifest.`,
          )
    }
  }
  for (const [file] of localScanningAssets)
    requireFile(file, 'local scanning asset')

  if (problems.length) throw new FrontendBuildError(root, problems)
  return { entries, files: sizes.size }
}
