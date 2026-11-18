/**
 * Browser bootstrap. Initialize appearance before mounting React so the
 * application starts in the saved or system theme.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeTheme } from './lib/theme'

initializeTheme()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
