/**
 * Browser authentication coordinator. Loads server-validated sessions and
 * serializes auth actions so stale responses cannot restore an obsolete identity.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { z } from 'zod'
import type { Session } from '@shared/contracts'
import type { RegistrationResult } from '@shared/contracts'
import { api, errorMessage } from '../lib/api'
import {
  confirmationEmailSchema,
  loginSchema,
  registerSchema,
} from '@shared/schemas'
import { AuthContext } from './AuthContext'
import { cancelThemeTransition } from '../lib/theme'

/**
 * Distinguish a signed-in registration result from one that still requires email
 * confirmation.
 */
function isSession(result: RegistrationResult): result is Session {
  return 'user' in result
}

/**
 * Own session loading, retry and expiry state; expose auth actions to forms
 * without placing tokens in JavaScript storage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const sequence = useRef(0)
  const authenticating = useRef(false)
  useLayoutEffect(() => {
    cancelThemeTransition()
  }, [session?.user.id])
  useEffect(() => {
    let mounted = true
    /**
     * Refresh on mount/focus and accept only the latest still-mounted session
     * response.
     */
    async function refresh() {
      if (authenticating.current) return
      const current = ++sequence.current
      try {
        const next = await api.auth.session()
        if (mounted && current === sequence.current) {
          setSession(next)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (mounted && current === sequence.current) {
          setError(errorMessage(err))
          setLoading(false)
        }
      }
    }
    /**
     * Invalidate pending session responses before clearing a server-expired
     * session.
     */
    function expired() {
      sequence.current++
      setSession(null)
      setError(null)
      setLoading(false)
    }
    void refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('medivault:session-expired', expired)
    return () => {
      mounted = false
      window.removeEventListener('focus', refresh)
      window.removeEventListener('medivault:session-expired', expired)
    }
  }, [attempt])
  /**
   * Serialize sign-in/signup and prevent overlapping refresh results from
   * overwriting the action outcome.
   */
  async function authenticate<T extends Session | RegistrationResult>(
    action: () => Promise<T>,
  ) {
    if (authenticating.current)
      throw new Error('An authentication request is already running.')
    authenticating.current = true
    const current = ++sequence.current
    try {
      const result = await action()
      const next = isSession(result) ? result : null
      if (current === sequence.current) {
        setSession(next)
        setError(null)
        setLoading(false)
      }
      return result
    } finally {
      authenticating.current = false
    }
  }
  async function signIn(values: z.infer<typeof loginSchema>) {
    await authenticate(() => api.auth.login(values))
  }
  async function signUp(values: z.infer<typeof registerSchema>) {
    return authenticate(() => api.auth.register(values))
  }
  /**
   * Serialize confirmation resend with other auth actions and invalidate earlier
   * session refreshes.
   */
  async function resendConfirmation(
    values: z.infer<typeof confirmationEmailSchema>,
  ) {
    if (authenticating.current)
      throw new Error('An authentication request is already running.')
    authenticating.current = true
    sequence.current++
    try {
      await api.auth.resendConfirmation(values)
    } finally {
      authenticating.current = false
    }
  }
  /**
   * Clear local identity only after server logout succeeds so provider failure
   * remains visible to the caller.
   */
  async function signOut() {
    if (authenticating.current)
      throw new Error('An authentication request is already running.')
    authenticating.current = true
    try {
      await api.auth.logout()
      sequence.current++
      setSession(null)
      setError(null)
    } finally {
      authenticating.current = false
    }
  }
  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        error,
        retry: () => {
          setLoading(true)
          setError(null)
          setAttempt((a) => a + 1)
        },
        signIn,
        signUp,
        resendConfirmation,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
