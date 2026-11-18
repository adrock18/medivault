/**
 * Frontend build and development configuration. Connects React/Tailwind, shared
 * source aliases, local scanning assets and the same-origin API proxy.
 */

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { localOcrAssets } from './scripts/ocr-assets.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = {
    '/api': {
      target: `http://127.0.0.1:${env.PORT || 3001}`,
      changeOrigin: false,
    },
  }
  return {
    plugins: [react(), tailwindcss(), localOcrAssets()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      },
    },
    server: { proxy },
    preview: { proxy },
    build: {
      manifest: true,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react-vendor',
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              },
            ],
          },
        },
      },
    },
  }
})
