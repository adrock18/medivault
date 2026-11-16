import { useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
const key = 'medivault-theme'
let preference: ThemePreference = 'system'
const listeners = new Set<() => void>()
const isPreference = (value: string | null): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system'
const systemDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

function applyTheme() {
  const dark =
    preference === 'dark' || (preference === 'system' && systemDark())
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  listeners.forEach((listener) => listener())
}

export function initializeTheme() {
  try {
    const saved = localStorage.getItem(key)
    preference = isPreference(saved) ? saved : 'system'
  } catch (error) {
    console.error(
      'Unable to read theme preference; using system appearance.',
      error,
    )
    preference = 'system'
  }
  applyTheme()
}

export function setThemePreference(value: ThemePreference) {
  preference = value
  applyTheme()
  // Apply the selection even when storage is unavailable, but report persistence failure.
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.error('Unable to save theme preference.', error)
    throw new Error(
      'Theme changed, but this browser could not save your preference.',
    )
  }
}

function subscribe(listener: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const systemChanged = () => applyTheme()
  const storage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) initializeTheme()
  }
  listeners.add(listener)
  media.addEventListener('change', systemChanged)
  window.addEventListener('storage', storage)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', systemChanged)
    window.removeEventListener('storage', storage)
  }
}

export function useTheme() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () =>
      `${preference}:${document.documentElement.classList.contains('dark')}`,
  )
  return {
    preference,
    resolved: snapshot.endsWith(':true')
      ? ('dark' as const)
      : ('light' as const),
  }
}
