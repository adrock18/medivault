import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseSettings } from './config.ts'
import type { Database } from './supabase.types.ts'

type UserClientSettings = Pick<
  SupabaseSettings,
  'url' | 'publishableKey' | 'secureCookies'
>
type AdminClientSettings = Pick<SupabaseSettings, 'url' | 'secretKey'>

const boundedFetch: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    signal: AbortSignal.any([
      ...(init?.signal ? [init.signal] : []),
      AbortSignal.timeout(15_000),
    ]),
  })

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
