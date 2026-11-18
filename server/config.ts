export const DEV_WEB_HOST = '127.0.0.1'
export const DEV_WEB_PORT = 5187
export const DEV_STARTUP_HEADER = 'X-MediVault-Dev-Startup'

export type ReminderEmailSettings = {
  resendApiKey: string
  from: string
  cronSecret: string
}

export type SupabaseSettings = {
  url: string
  publishableKey: string
  secretKey: string
  documentBucket: string
  secureCookies: boolean
  appOrigin?: string
}

function isLoopback(hostname: string) {
  return (
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  )
}

function parseServiceUrl(name: string, value: string, production: boolean) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${name} must be a valid service URL.`)
  }
  const localHttp =
    !production && url.protocol === 'http:' && isLoopback(url.hostname)
  if ((url.protocol !== 'https:' && !localHttp) || !url.hostname)
    throw new Error(`${name} must be an HTTPS project URL.`)
  if (
    url.username ||
    url.password ||
    (url.pathname !== '/' && url.pathname !== '') ||
    url.search ||
    url.hash
  )
    throw new Error(`${name} must be the project root URL without a path.`)
  return url.origin
}

function appOrigin(env: NodeJS.ProcessEnv, production: boolean) {
  const value = env.APP_ORIGIN?.trim()
  if (!value) {
    if (production)
      throw new Error('Set APP_ORIGIN to the production HTTPS origin.')
    return undefined
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('APP_ORIGIN must be a valid application origin.')
  }

  const isOrigin =
    !url.username &&
    !url.password &&
    (url.pathname === '/' || url.pathname === '') &&
    !url.search &&
    !url.hash &&
    url.origin === value.replace(/\/$/, '')
  if (!isOrigin)
    throw new Error('APP_ORIGIN must contain only an origin, without a path.')
  if (production && url.protocol !== 'https:')
    throw new Error('APP_ORIGIN must use HTTPS in production.')
  if (!production && (url.protocol !== 'http:' || !isLoopback(url.hostname)))
    throw new Error(
      'APP_ORIGIN must use an HTTP loopback origin in development.',
    )
  return url.origin
}

export function supabaseSettings(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseSettings {
  const required = (name: string) => {
    const value = env[name]?.trim()
    if (!value) throw new Error(`Set ${name} to configure Supabase.`)
    return value
  }
  const production = env.NODE_ENV === 'production'
  const secureCookies = env.COOKIE_SECURE === 'true'
  if (production && !secureCookies)
    throw new Error(
      'Set COOKIE_SECURE=true when serving production over HTTPS.',
    )

  const url = parseServiceUrl(
    'SUPABASE_URL',
    required('SUPABASE_URL'),
    production,
  )
  const publishableKey = required('SUPABASE_PUBLISHABLE_KEY')
  if (
    !publishableKey.startsWith('sb_publishable_') ||
    publishableKey.length === 'sb_publishable_'.length
  )
    throw new Error(
      'SUPABASE_PUBLISHABLE_KEY must be a Supabase publishable key.',
    )
  const secretKey = required('SUPABASE_SECRET_KEY')
  if (
    !secretKey.startsWith('sb_secret_') ||
    secretKey.length === 'sb_secret_'.length ||
    secretKey === publishableKey
  )
    throw new Error(
      'SUPABASE_SECRET_KEY must be a distinct Supabase secret key.',
    )
  const documentBucket = required('SUPABASE_DOCUMENT_BUCKET')
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(documentBucket))
    throw new Error('SUPABASE_DOCUMENT_BUCKET must be a valid bucket name.')

  return {
    url,
    publishableKey,
    secretKey,
    documentBucket,
    secureCookies,
    appOrigin: appOrigin(env, production),
  }
}

function trustProxyHops(value: string | undefined) {
  if (value === undefined || value === '') return undefined
  const hops = Number(value)
  if (!Number.isInteger(hops) || hops < 1 || hops > 10)
    throw new Error('TRUST_PROXY must be an integer between 1 and 10.')
  return hops
}

export function apiConfig(env: NodeJS.ProcessEnv = process.env) {
  const port = Number(env.PORT ?? 3001)
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be an integer between 1 and 65535.')
  const production = env.NODE_ENV === 'production'
  if (production && env.COOKIE_SECURE !== 'true')
    throw new Error(
      'Set COOKIE_SECURE=true when serving a production application over HTTPS.',
    )
  return {
    port,
    host: env.HOST ?? '127.0.0.1',
    secureCookies: env.COOKIE_SECURE === 'true',
    appOrigin: env.APP_ORIGIN,
    production,
    trustProxy: trustProxyHops(env.TRUST_PROXY),
    ocrSpaceApiKey: env.OCR_SPACE_API_KEY?.trim() || undefined,
  }
}
