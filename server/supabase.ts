/**
 * Supabase client factories. Separate cookie-bound user access, privileged server
 * operations and isolated password verification.
 */

import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseSettings } from './config.ts'
import type { Database } from './supabase.types.ts'

type UserClientSettings = Pick<
  SupabaseSettings,
  'url' | 'publishableKey' | 'secureCookies'
>
type AdminClientSettings = Pick<SupabaseSettings, 'url' | 'secretKey'>

/**
 * Apply a provider-request deadline while respecting cancellation from the
 * original caller.
 */
const boundedFetch: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    signal: AbortSignal.any([
      ...(init?.signal ? [init.signal] : []),
      AbortSignal.timeout(15_000),
    ]),
  })

/**
 * Create a cookie-backed authenticated client whose ordinary database access
 * remains subject to user RLS.
 */
export function createRequestSupabaseClient(
  settings: UserClientSettings,
  cookies: CookieMethodsServer,
) {
  return createServerClient<Database>(settings.url, settings.publishableKey, {
    global: { fetch: boundedFetch },
    cookies,
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: settings.secureCookies,
      path: '/api',
    },
  })
}

/**
 * Create the server-only privileged client reserved for explicitly controlled
 * administrative operations.
 */
export function createAdminSupabaseClient(settings: AdminClientSettings) {
  return createClient<Database>(settings.url, settings.secretKey, {
    global: { fetch: boundedFetch },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}

/**
 * Create an isolated nonpersistent client so current-password checks do not
 * replace the browser session.
 */
export function createVerificationSupabaseClient(settings: UserClientSettings) {
  return createClient<Database>(settings.url, settings.publishableKey, {
    global: { fetch: boundedFetch },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}
