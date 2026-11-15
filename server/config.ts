import { resolve } from 'node:path'

export const DEV_WEB_HOST = '127.0.0.1'
export const DEV_WEB_PORT = 5187
export const DEV_STARTUP_HEADER = 'X-MediVault-Dev-Startup'

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
    dataDir: resolve(env.DATA_DIR ?? 'data'),
    secureCookies: env.COOKIE_SECURE === 'true',
    appOrigin: env.APP_ORIGIN,
    production,
  }
}
