/**
 * Vite integration for self-hosted scanning assets. Makes PDF and OCR workers,
 * language data and licenses available locally.
 */

import { createReadStream, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import type { Plugin } from 'vite'
import { localScanningAssets } from '../server/frontend-build.ts'

const require = createRequire(import.meta.url)
const assets = localScanningAssets.map(([name, dependency]) => ({
  name,
  path: require.resolve(dependency),
}))

/**
 * Provide local scanning assets during development and emit the same assets into
 * production output.
 */
export function localOcrAssets(): Plugin {
  return {
    name: 'medivault-local-ocr',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const asset = assets.find(
          ({ name }) => `/${name}` === req.url?.split('?')[0],
        )
        if (!asset) return next()
        res.setHeader(
          'Content-Type',
          asset.name.endsWith('.js')
            ? 'text/javascript'
            : asset.name.endsWith('.wasm')
              ? 'application/wasm'
              : 'application/gzip',
        )
        createReadStream(asset.path).on('error', next).pipe(res)
      })
    },
    generateBundle() {
      for (const asset of assets)
        this.emitFile({
          type: 'asset',
          fileName: asset.name,
          source: readFileSync(asset.path),
        })
    },
  }
}
