import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  checkFrontendBuild,
  ENTRY_BYTE_LIMIT,
  FrontendBuildError,
  localScanningAssets,
} from '../server/frontend-build.ts'

const directories: string[] = []
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true })),
  )
})

async function put(dist: string, file: string, content: string | Buffer) {
  await mkdir(dirname(join(dist, file)), { recursive: true })
  await writeFile(join(dist, file), content)
}

async function build({ entryBytes = 100 } = {}) {
  const dist = await mkdtemp(join(tmpdir(), 'medivault-build-'))
  directories.push(dist)
  await put(dist, 'index.html', '<div id="root"></div>')
  await put(dist, 'assets/index.js', Buffer.alloc(entryBytes, 97))
  await put(dist, 'assets/index.css', 'body{}')
  await put(dist, 'assets/page.js', 'export {}')
  for (const [file] of localScanningAssets) await put(dist, file, 'x')
  await manifest(dist, {
    'index.html': {
      file: 'assets/index.js',
      isEntry: true,
      css: ['assets/index.css'],
      dynamicImports: ['src/page.tsx'],
    },
    'src/page.tsx': { file: 'assets/page.js' },
  })
  return dist
}

const manifest = (dist: string, value: unknown) =>
  put(dist, '.vite/manifest.json', JSON.stringify(value))

function problems(dist: string, limit?: number) {
  try {
    checkFrontendBuild(dist, { entryByteLimit: limit })
  } catch (error) {
    expect(error).toBeInstanceOf(FrontendBuildError)
    return (error as Error).message
  }
  throw new Error('Expected the build check to fail.')
}

describe('frontend build artifacts', () => {
  it('accepts an entry of exactly the byte limit and rejects one byte more', async () => {
    const exact = await build({ entryBytes: ENTRY_BYTE_LIMIT })
    expect(
      checkFrontendBuild(exact, { entryByteLimit: ENTRY_BYTE_LIMIT }),
    ).toMatchObject({
      entries: [{ file: 'assets/index.js', size: ENTRY_BYTE_LIMIT }],
    })
    const over = await build({ entryBytes: ENTRY_BYTE_LIMIT + 1 })
    expect(problems(over, ENTRY_BYTE_LIMIT)).toContain(
      `Entry assets/index.js is ${ENTRY_BYTE_LIMIT + 1} bytes, above the ${ENTRY_BYTE_LIMIT}-byte limit.`,
    )
    expect(() => checkFrontendBuild(over)).not.toThrow()
  })

  it('rejects missing, invalid and entry-less manifests', async () => {
    const dist = await build()
    await rm(join(dist, '.vite'), { recursive: true })
    expect(problems(dist)).toContain('Missing .vite/manifest.json.')
    await put(dist, '.vite/manifest.json', '{not json')
    expect(problems(dist)).toContain('.vite/manifest.json is not valid JSON.')
    await manifest(dist, [])
    expect(problems(dist)).toContain('must be an object of chunks')
    await manifest(dist, { 'index.html': { file: 7, isEntry: true } })
    expect(problems(dist)).toContain(
      'Manifest chunk "index.html" has invalid metadata.',
    )
    await manifest(dist, { 'src/page.tsx': { file: 'assets/page.js' } })
    expect(problems(dist)).toContain('The manifest has no entry chunk.')
    await manifest(dist, {
      'index.html': {
        file: 'assets/index.js',
        isEntry: true,
        imports: ['missing.ts'],
      },
      'escape.ts': { file: '../outside.js' },
    })
    const message = problems(dist)
    expect(message).toContain('references "missing.ts"')
    expect(message).toContain('points outside the build: ../outside.js')
    expect(message).toContain('Run `npm run build`')
  })

  it('rejects missing or empty HTML, chunks, styles and scanning assets', async () => {
    const dist = await build()
    await rm(join(dist, 'index.html'))
    await rm(join(dist, 'assets/page.js'))
    await put(dist, 'assets/index.css', '')
    await rm(join(dist, 'ocr/eng.traineddata.gz'))
    await put(dist, 'ocr/pdf/openjpeg.wasm', '')
    const message = problems(dist)
    for (const expected of [
      'Missing HTML shell: index.html',
      'Missing chunk for "src/page.tsx": assets/page.js',
      'asset for "index.html" is empty: assets/index.css',
      'Missing local scanning asset: ocr/eng.traineddata.gz',
      'local scanning asset is empty: ocr/pdf/openjpeg.wasm',
    ])
      expect(message).toContain(expected)
  })
})
