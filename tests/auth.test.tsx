// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import type { Session } from '../src/lib/contracts'
const mocks = vi.hoisted(() => ({ session: vi.fn(), login: vi.fn() }))
vi.mock('../src/lib/api', () => ({
  api: { auth: mocks },
  errorMessage: (error: Error) => error.message,
}))
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})
function Consumer() {
  const { session, loading, signIn } = useAuth()
  return (
    <>
      <span>{loading ? 'loading' : (session?.user.email ?? 'anonymous')}</span>
      <button
        onClick={() =>
          void signIn({
            email: 'alex@example.com',
            password: 'Test-password-123',
          })
        }
      >
        Login
      </button>
    </>
  )
}
it('does not let focus-based session refresh overwrite an in-flight login, and clears an expired session', async () => {
  mocks.session.mockResolvedValue(null)
  let resolveLogin: (session: Session) => void = () => {
    throw new Error('Login promise not initialized')
  }
  mocks.login.mockReturnValue(
    new Promise<Session>((resolve) => {
      resolveLogin = resolve
    }),
  )
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  )
  await screen.findByText('anonymous')
  fireEvent.click(screen.getByText('Login'))
  fireEvent(window, new Event('focus'))
  expect(mocks.session).toHaveBeenCalledTimes(1)
  await act(async () =>
    resolveLogin({
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'alex@example.com',
        full_name: 'Alex',
      },
    }),
  )
  await waitFor(() =>
    expect(screen.getByText('alex@example.com')).toBeInTheDocument(),
  )
  act(() => window.dispatchEvent(new Event('medivault:session-expired')))
  expect(screen.getByText('anonymous')).toBeInTheDocument()
})
