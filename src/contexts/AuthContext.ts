import { createContext, useContext } from 'react'
import { z } from 'zod'
import type { Session } from '@shared/contracts'
import { loginSchema, registerSchema } from '@shared/schemas'

export type AuthState = {
  session: Session | null
  loading: boolean
  error: string | null
  retry: () => void
  signIn: (values: z.infer<typeof loginSchema>) => Promise<void>
  signUp: (values: z.infer<typeof registerSchema>) => Promise<void>
  signOut: () => Promise<void>
}
export const AuthContext = createContext<AuthState | null>(null)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
