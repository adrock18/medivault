import { resolve } from 'node:path'

export const DEV_WEB_HOST = '127.0.0.1'
export const DEV_WEB_PORT = 5187
export const DEV_STARTUP_HEADER = 'X-MediVault-Dev-Startup'

export type S3Settings = {
  endpoint: string
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
}
export type ReminderEmailSettings = {
  resendApiKey: string
  from: string
  cronSecret: string
}

function trustProxyHops(value: string | undefined) {
  if (value === undefined || value === '') return undefined
  const hops = Number(value)
  if (!Number.isInteger(hops) || hops < 1 || hops > 10)
    throw new Error('TRUST_PROXY must be an integer between 1 and 10.')
  return hops
}

function s3Settings(env: NodeJS.ProcessEnv): S3Settings {
  const required = (name: string) => {
    const value = env[name]?.trim()
    if (!value)
      throw new Error(`Set ${name} when DOCUMENT_STORAGE=s3 is selected.`)
    return value
  }
  const endpoint = required('S3_ENDPOINT')
  let url: URL | undefined
  try {
    url = new URL(endpoint)
  } catch {
    url = undefined
  }
  if (url?.protocol !== 'https:')
    throw new Error('S3_ENDPOINT must be an https:// URL.')
  return {
    endpoint,
    bucket: required('S3_BUCKET'),
    region: required('S3_REGION'),
    accessKeyId: required('S3_ACCESS_KEY_ID'),
    secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
  }
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
  const storage = env.DOCUMENT_STORAGE || 'local'
  if (storage !== 'local' && storage !== 's3')
    throw new Error('DOCUMENT_STORAGE must be "local" or "s3".')
  const reminderValues = [
    env.RESEND_API_KEY?.trim(),
    env.EMAIL_FROM?.trim(),
    env.REMINDER_CRON_SECRET?.trim(),
  ]
  const reminderConfigured = reminderValues.some(Boolean)
  if (reminderConfigured && reminderValues.some((value) => !value))
    throw new Error(
      'Set RESEND_API_KEY, EMAIL_FROM, and REMINDER_CRON_SECRET together to enable email reminders.',
    )
  const reminderEmail = reminderConfigured
    ? {
        resendApiKey: reminderValues[0]!,
        from: reminderValues[1]!,
        cronSecret: reminderValues[2]!,
      }
    : undefined
  if (reminderEmail && reminderEmail.cronSecret.length < 32)
    throw new Error('REMINDER_CRON_SECRET must be at least 32 characters.')
  return {
    port,
    host: env.HOST ?? '127.0.0.1',
    dataDir: resolve(env.DATA_DIR ?? 'data'),
    secureCookies: env.COOKIE_SECURE === 'true',
    appOrigin: env.APP_ORIGIN,
    production,
    trustProxy: trustProxyHops(env.TRUST_PROXY),
    ocrSpaceApiKey: env.OCR_SPACE_API_KEY?.trim() || undefined,
    reminderEmail,
    s3: storage === 's3' ? s3Settings(env) : undefined,
  }
}
