/**
 * Authentication context contract and consumer hook. Shares public session state
 * and auth actions, never provider session tokens.
 */

import { createContext, useContext } from 'react'
import { z } from 'zod'
import type { Session } from '@shared/contracts'
import type { RegistrationResult } from '@shared/contracts'
import {
  confirmationEmailSchema,
  loginSchema,
  registerSchema,
} from '@shared/schemas'

export type AuthState = {
  session: Session | null
  loading: boolean
  error: string | null
  retry: () => void
  signIn: (values: z.infer<typeof loginSchema>) => Promise<void>
  signUp: (
    values: z.infer<typeof registerSchema>,
  ) => Promise<RegistrationResult>
  signOut: () => Promise<void>
  resendConfirmation: (
    values: z.infer<typeof confirmationEmailSchema>,
  ) => Promise<void>
}
export const AuthContext = createContext<AuthState | null>(null)
/**
 * Read the authentication context and fail immediately if used outside its
 * provider.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
