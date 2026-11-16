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
async function chooseAppearance(index: number, name: string) {
  fireEvent.click(
    screen.getAllByRole('combobox', { name: 'Appearance' })[index],
  )
  const option = await screen.findByRole('option', { name })
  fireEvent.pointerDown(option)
  fireEvent.click(option)
}
it('follows system changes until overridden, synchronizes controls and restores the saved selection', async () => {
  render(<Appearance />)
  expect(screen.getByText('light')).toBeInTheDocument()
  act(() => {
    dark = true
    media.dispatchEvent(new Event('change'))
  })
  expect(document.documentElement).toHaveClass('dark')
  await chooseAppearance(0, 'Light')
  expect(document.documentElement).not.toHaveClass('dark')
  expect(screen.getAllByLabelText('Appearance')[1]).toHaveTextContent('Light')
  expect(localStorage.getItem('medivault-theme')).toBe('light')
  act(() => initializeTheme())
  expect(document.documentElement.style.colorScheme).toBe('light')
  await chooseAppearance(1, 'System')
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
  expect(screen.getAllByLabelText('Appearance')[0]).toHaveTextContent('Dark')
  act(() => {
    localStorage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null }))
  })
  expect(document.documentElement).not.toHaveClass('dark')
  expect(screen.getAllByLabelText('Appearance')[0]).toHaveTextContent('System')
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
  expect(screen.getByLabelText('Appearance')).toHaveTextContent('System')
})
it('keeps the selected appearance but reports when browser storage cannot save it', async () => {
  const notify = vi.spyOn(toast, 'error')
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage blocked')
  })
  render(<Appearance />)
  await chooseAppearance(0, 'Dark')
  expect(document.documentElement).toHaveClass('dark')
  expect(screen.getAllByLabelText('Appearance')[1]).toHaveTextContent('Dark')
  expect(log).toHaveBeenCalledWith(
    'Unable to save theme preference.',
    expect.any(Error),
  )
  expect(notify).toHaveBeenCalledWith(
    'Theme changed, but this browser could not save your preference.',
  )
})
