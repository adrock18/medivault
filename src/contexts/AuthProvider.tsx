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
import { loginSchema, registerSchema } from '@shared/schemas'
import { AuthContext } from './AuthContext'
import { cancelThemeTransition } from '../lib/theme'

function isSession(result: RegistrationResult): result is Session {
  return 'user' in result
}

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
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
