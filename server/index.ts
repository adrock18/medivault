import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { createApp } from './app.ts'
import { apiConfig } from './config.ts'
import { checkFrontendBuild, FrontendBuildError } from './frontend-build.ts'

export function startApi(env: NodeJS.ProcessEnv = process.env) {
  const config = apiConfig(env)
  if (config.production) checkFrontendBuild(resolve('dist'))
  const { app, db } = createApp({
    dataDir: config.dataDir,
    secureCookies: config.secureCookies,
    appOrigin: config.appOrigin,
    serveFrontend: config.production,
    devStartupId: config.production ? undefined : env.MEDIVAULT_DEV_STARTUP_ID,
  })
  const server = createServer(app)
  server.once('listening', () => {
    console.log(
      `MediVault Express API listening on port ${config.port}. SQLite data: ${config.dataDir}`,
    )
  })
  let shutdownPromise: Promise<void> | undefined
  function shutdown() {
    shutdownPromise ??= new Promise<void>((resolve, reject) => {
      server.close((error) => {
        process.off('SIGINT', onSignal)
        process.off('SIGTERM', onSignal)
        try {
          db.close()
        } catch (closeError) {
          reject(closeError)
          return
        }
        if (
          error &&
          !('code' in error && error.code === 'ERR_SERVER_NOT_RUNNING')
        )
          reject(error)
        else resolve()
      })
    })
    return shutdownPromise
  }
  function onSignal() {
    void shutdown().catch((error: unknown) => {
      console.error('Unable to shut down MediVault API:', error)
      process.exitCode = 1
    })
  }
  server.on('error', (error: NodeJS.ErrnoException) => {
    console.error(
      'Unable to start MediVault API:',
      error.code === 'EADDRINUSE'
        ? `API address ${config.host}:${config.port} is already in use. Use the existing instance or stop it with Ctrl+C in its owning terminal. Do not stop unrelated processes or delete saved data.`
        : error,
    )
    process.exitCode = 1
    onSignal()
  })
  process.on('SIGINT', onSignal)
  process.on('SIGTERM', onSignal)
  server.listen(config.port, config.host)
  return { server, db, shutdown }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    startApi()
  } catch (error) {
    console.error(
      'Unable to start MediVault API:',
      error instanceof FrontendBuildError ? error.message : error,
    )
    process.exitCode = 1
  }
}
