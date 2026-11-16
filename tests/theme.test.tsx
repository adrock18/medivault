// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { toast } from 'sonner'
import { ThemeSelect } from '../src/components/ThemeSelect'
import { initializeTheme, useTheme } from '../src/lib/theme'

let dark = false
let media: EventTarget
beforeEach(() => {
  localStorage.clear()
  dark = false
  media = new EventTarget()
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return dark
    },
    addEventListener: media.addEventListener.bind(media),
    removeEventListener: media.removeEventListener.bind(media),
  }))
  initializeTheme()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
function Appearance() {
  const { resolved } = useTheme()
  return (
    <>
      <ThemeSelect />
      <ThemeSelect />
      <span>{resolved}</span>
    </>
  )
}
it('follows system changes until overridden, synchronizes controls and restores the saved selection', () => {
  render(<Appearance />)
  expect(screen.getByText('light')).toBeInTheDocument()
  act(() => {
    dark = true
    media.dispatchEvent(new Event('change'))
  })
  expect(document.documentElement).toHaveClass('dark')
  fireEvent.change(screen.getAllByLabelText('Appearance')[0], {
    target: { value: 'light' },
  })
  expect(document.documentElement).not.toHaveClass('dark')
  expect(screen.getAllByLabelText('Appearance')[1]).toHaveValue('light')
  expect(localStorage.getItem('medivault-theme')).toBe('light')
  act(() => initializeTheme())
  expect(document.documentElement.style.colorScheme).toBe('light')
  fireEvent.change(screen.getAllByLabelText('Appearance')[1], {
    target: { value: 'system' },
  })
  expect(document.documentElement).toHaveClass('dark')
  act(() => {
    dark = false
    media.dispatchEvent(new Event('change'))
  })
  expect(document.documentElement).not.toHaveClass('dark')
})
it('responds to another tab changing or clearing the saved theme', () => {
  render(<Appearance />)
  act(() => {
    localStorage.setItem('medivault-theme', 'dark')
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'medivault-theme', newValue: 'dark' }),
    )
  })
  expect(document.documentElement).toHaveClass('dark')
  expect(screen.getAllByLabelText('Appearance')[0]).toHaveValue('dark')
  act(() => {
    localStorage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null }))
  })
  expect(document.documentElement).not.toHaveClass('dark')
  expect(screen.getAllByLabelText('Appearance')[0]).toHaveValue('system')
})
it('continues following the system after another appearance control unmounts', () => {
  const first = render(<ThemeSelect />)
  render(<ThemeSelect />)
  first.unmount()
  act(() => {
    dark = true
    media.dispatchEvent(new Event('change'))
  })
  expect(document.documentElement).toHaveClass('dark')
  expect(screen.getByLabelText('Appearance')).toHaveValue('system')
})
it('keeps the selected appearance but reports when browser storage cannot save it', () => {
  const notify = vi.spyOn(toast, 'error')
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage blocked')
  })
  render(<Appearance />)
  fireEvent.change(screen.getAllByLabelText('Appearance')[0], {
    target: { value: 'dark' },
  })
  expect(document.documentElement).toHaveClass('dark')
  expect(screen.getAllByLabelText('Appearance')[1]).toHaveValue('dark')
  expect(log).toHaveBeenCalledWith(
    'Unable to save theme preference.',
    expect.any(Error),
  )
  expect(notify).toHaveBeenCalledWith(
    'Theme changed, but this browser could not save your preference.',
  )
})
