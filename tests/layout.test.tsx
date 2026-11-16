// @vitest-environment jsdom
import { lazy } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from '../src/components/Layout'

const fixture = vi.hoisted(() => ({
  vault: {
    loading: false,
    refreshing: false,
    error: null as string | null,
    reload: () => Promise.resolve(),
    profile: { full_name: 'Asha Rao' },
    now: new Date('2026-01-02T09:00:00'),
  },
}))
vi.mock('../src/contexts/DataContext', () => ({
  useVault: () => fixture.vault,
}))
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { email: 'asha@example.com' } },
    signOut: vi.fn(),
  }),
}))
vi.mock('../src/components/ThemeSelect', () => ({ ThemeSelect: () => null }))
afterEach(() => {
  cleanup()
  fixture.vault.loading = false
})

function renderAt(path: string, page = <p>Page body</p>) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="*" element={page} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

it('marks the current page in both navigations without all-caps labels', () => {
  const { container } = renderAt('/medications')
  for (const name of ['Main navigation', 'Mobile navigation']) {
    const nav = screen.getByRole('navigation', { name })
    expect(
      within(nav).getByRole('link', { name: /Medications/ }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      within(nav).getByRole('link', { name: /Overview/ }),
    ).not.toHaveAttribute('aria-current')
  }
  expect(container.textContent).not.toMatch(/[A-Z]{4,} [A-Z]{4,}/)
  expect(container.textContent).not.toContain('·')
})

it.each([
  ['/dashboard', 'dashboard'],
  ['/medications', 'list'],
  ['/settings', 'form'],
] as const)(
  'shows a numberless %s skeleton while workspace data loads',
  (path, variant) => {
    fixture.vault.loading = true
    renderAt(path)
    const status = screen.getByRole('status', { name: /Loading/ })
    expect(status).toHaveAttribute('data-skeleton', variant)
    expect(status.textContent).not.toMatch(/\d/)
    expect(screen.queryByText('Page body')).not.toBeInTheDocument()
  },
)

it('keeps the header and navigation while a lazy page loads', async () => {
  let resolve!: (value: { default: () => React.JSX.Element }) => void
  const Lazy = lazy(
    () =>
      new Promise<{ default: () => React.JSX.Element }>((r) => (resolve = r)),
  )
  renderAt('/medical-records', <Lazy />)
  expect(screen.getByRole('status', { name: /Loading/ })).toBeInTheDocument()
  expect(
    screen.getByRole('navigation', { name: 'Main navigation' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('banner')).toBeInTheDocument()
  resolve({ default: () => <p>Lazy page</p> })
  expect(await screen.findByText('Lazy page')).toBeInTheDocument()
  expect(
    screen.queryByRole('status', { name: /Loading/ }),
  ).not.toBeInTheDocument()
})
