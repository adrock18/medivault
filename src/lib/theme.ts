/**
 * External appearance store shared with React. Applies semantic theme state,
 * synchronizes system/cross-tab changes and respects reduced motion.
 */

import { useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
const key = 'medivault-theme'
let preference: ThemePreference = 'system'
const listeners = new Set<() => void>()
const isPreference = (value: string | null): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system'
const systemDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches
let glossTimer: ReturnType<typeof setTimeout> | undefined
let themeFrame = 0

/**
 * Cancel the transient theme effect when navigation, authentication or motion
 * preferences require immediate settling.
 */
export function cancelThemeTransition() {
  clearTimeout(glossTimer)
  glossTimer = undefined
  document.documentElement.removeAttribute('data-theme-transition')
}

/**
 * Resolve the effective theme and notify subscribers after synchronizing document
 * classes and native color scheme.
 */
function applyTheme() {
  const root = document.documentElement
  const dark =
    preference === 'dark' || (preference === 'system' && systemDark())
  root.setAttribute('data-theme-applying', '')
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
  // Resolve semantic colors without interpolating individual foregrounds/surfaces.
  void getComputedStyle(root).color
  cancelAnimationFrame(themeFrame)
  themeFrame = requestAnimationFrame(() =>
    root.removeAttribute('data-theme-applying'),
  )
  listeners.forEach((listener) => listener())
}

/**
 * Read a validated saved preference before mounting; report inaccessible storage
 * and explicitly use system appearance.
 */
export function initializeTheme() {
  cancelThemeTransition()
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

/**
 * Apply the requested theme immediately and report persistence failure instead of
 * claiming the preference was saved.
 */
export function setThemePreference(value: ThemePreference) {
  const root = document.documentElement
  const wasDark = root.classList.contains('dark')
  cancelThemeTransition()
  preference = value
  applyTheme()
  if (
    wasDark !== root.classList.contains('dark') &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    typeof CSS !== 'undefined' &&
    CSS.supports('animation-name', 'theme-gloss')
  ) {
    root.setAttribute('data-theme-transition', '')
    glossTimer = setTimeout(cancelThemeTransition, 420)
  }
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

/**
 * Observe system, motion and cross-tab preference changes; return cleanup for
 * every installed listener.
 */
function subscribe(listener: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const systemChanged = () => {
    cancelThemeTransition()
    applyTheme()
  }
  const motionChanged = () => {
    if (reduced.matches) cancelThemeTransition()
  }
  const storage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) initializeTheme()
  }
  listeners.add(listener)
  media.addEventListener('change', systemChanged)
  reduced.addEventListener('change', motionChanged)
  window.addEventListener('storage', storage)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', systemChanged)
    reduced.removeEventListener('change', motionChanged)
    window.removeEventListener('storage', storage)
  }
}

/**
 * Subscribe React to the external preference and resolved document theme without
 * duplicating theme state per component.
 */
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
