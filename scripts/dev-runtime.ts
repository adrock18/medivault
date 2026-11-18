/**
 * Owns the local API/frontend process lifecycle. Checks ports and
 * invocation-specific readiness without stopping unrelated processes.
 */

import { randomUUID } from 'node:crypto'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import type { Writable } from 'node:stream'
import concurrently, { type ConcurrentlyCommandInput } from 'concurrently'
import {
  apiConfig,
  DEV_STARTUP_HEADER,
  DEV_WEB_HOST,
  DEV_WEB_PORT,
} from '../server/config.ts'

type Address = { name: string; host: string; port: number }
type DevelopmentOptions = {
  env?: NodeJS.ProcessEnv
  cwd?: string
  webPort?: number
  commands?: ConcurrentlyCommandInput[]
  timeoutMs?: number
  signal?: AbortSignal
  output?: Writable
}

/**
 * Probe and release every required address; report conflicts without killing the
 * process using a port.
 */
export async function checkAddresses(addresses: Address[]) {
  const failures = await Promise.all(
    addresses.map(
      ({ name, host, port }) =>
        new Promise<string | undefined>((resolve) => {
          const probe = createServer()
          probe.once('error', (error: NodeJS.ErrnoException) => {
            resolve(
              error.code === 'EADDRINUSE'
                ? `${name} address ${host}:${port} is already in use. Use the existing MediVault instance or stop it with Ctrl+C in its owning terminal. Do not stop unrelated processes or delete saved data.`
                : `Cannot check ${name} address ${host}:${port}: ${error.code ?? error.name}: ${error.message}`,
            )
          })
          probe.listen({ host, port, exclusive: true }, () =>
            probe.close((error) =>
              resolve(
                error
                  ? `Cannot release ${name} address ${host}:${port}: ${error.message}`
                  : undefined,
              ),
            ),
          )
        }),
    ),
  )
  const errors = failures.filter((failure) => failure !== undefined)
  if (errors.length) throw new Error(errors.join('\n'))
}

/**
 * Poll API and frontend-proxy health within a deadline; require both responses to
 * belong to this startup.
 */
async function waitForReadiness(
  urls: string[],
  startupId: string,
  timeoutMs: number,
  signal: AbortSignal,
) {
  const deadline = performance.now() + timeoutMs
  let failures: (string | undefined)[] = []
  while (performance.now() < deadline) {
    signal.throwIfAborted()
    const remaining = deadline - performance.now()
    if (remaining < 100 && failures.length) {
      await delay(Math.ceil(remaining), undefined, { signal })
      break
    }
    failures = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url, {
            signal: AbortSignal.any([
              signal,
              AbortSignal.timeout(
                Math.max(
                  1,
                  Math.min(1000, Math.ceil(deadline - performance.now())),
                ),
              ),
            ]),
          })
          if (response.status !== 200) return `HTTP ${response.status}`
          if (response.headers.get(DEV_STARTUP_HEADER) !== startupId)
            return 'health response belongs to a different development invocation'
          const body: unknown = await response.json()
          if (
            !body ||
            typeof body !== 'object' ||
            !('status' in body) ||
            body.status !== 'ok'
          )
            return 'invalid API health response'
          return undefined
        } catch (error) {
          signal.throwIfAborted()
          return error instanceof Error ? error.message : String(error)
        }
      }),
    )
    signal.throwIfAborted()
    if (failures.every((failure) => failure === undefined)) return
    await delay(
      Math.max(1, Math.min(150, deadline - performance.now())),
      undefined,
      { signal },
    )
  }
  throw new Error(
    `Startup readiness timed out after ${timeoutMs / 1000}s. ${urls
      .map(
        (url, index) =>
          `${index === 0 ? 'API' : 'Frontend proxy'} ${url}: ${failures[index] ?? 'healthy'}`,
      )
      .join('; ')}`,
  )
}

/**
 * Start and supervise the paired development services, then clean up owned
 * children and signal listeners.
 */
export async function runDevelopment(options: DevelopmentOptions = {}) {
  const env = options.env ?? process.env
  const config = apiConfig(env)
  const webPort = options.webPort ?? DEV_WEB_PORT
  if (config.port === webPort)
    throw new Error(
      `API PORT and frontend port cannot both be ${webPort}. Set PORT to a different API port; the frontend remains on its strict port.`,
    )
  const output = options.output ?? process.stdout
  const log = (message: string) => output.write(`[dev] ${message}\n`)
  await checkAddresses([
    { name: 'API', host: config.host, port: config.port },
    { name: 'Frontend', host: DEV_WEB_HOST, port: webPort },
  ])
  if (options.signal?.aborted) return 0

  const startupId = randomUUID()
  const abort = new AbortController()
  let interrupted = false
  let stopping = false
  /**
   * Mark an intentional shutdown so cancellation does not become an
   * unexpected-exit failure.
   */
  const interrupt = () => {
    interrupted = true
    abort.abort()
  }
  process.on('SIGINT', interrupt)
  process.on('SIGTERM', interrupt)
  process.on('SIGHUP', interrupt)
  let supervisor: ReturnType<typeof concurrently>
  try {
    supervisor = concurrently(
      (
        options.commands ?? [
          { name: 'api', command: 'npm:dev:server' },
          { name: 'web', command: 'npm:dev:client' },
        ]
      ).map((command) => ({
        ...(typeof command === 'string' ? { command } : command),
        env: {
          ...env,
          ...(typeof command === 'string' ? {} : command.env),
          PORT: String(config.port),
          MEDIVAULT_DEV_STARTUP_ID: startupId,
        },
      })),
      {
        cwd: options.cwd,
        prefix: 'name',
        prefixColors: false,
        outputStream: output,
        killOthersOn: ['success', 'failure'],
        killTimeout: 2000,
      },
    )
  } catch (error) {
    process.off('SIGINT', interrupt)
    process.off('SIGTERM', interrupt)
    process.off('SIGHUP', interrupt)
    throw error
  }
  /**
   * Terminate only supervised children, escalating if those children do not exit
   * promptly.
   */
  const stop = () => {
    if (stopping) return
    stopping = true
    supervisor.commands.forEach((command) => command.kill('SIGTERM'))
    setTimeout(() => {
      const remaining = supervisor.commands.filter((command) => command.process)
      if (remaining.length) {
        log('Forcing shutdown of remaining owned development processes.')
        remaining.forEach((command) => command.kill('SIGKILL'))
      }
    }, 2000).unref()
  }
  const externalInterrupt = () => {
    interrupt()
    stop()
  }
  options.signal?.addEventListener('abort', externalInterrupt, { once: true })
  /**
   * Translate child completion into the supervisor exit status and cancel pending
   * readiness checks.
   */
  const finish = () => {
    abort.abort()
    if (!interrupted)
      log(
        'A development service exited unexpectedly. See service output above.',
      )
    return interrupted ? 0 : 1
  }
  // Attach both outcomes immediately: a service can exit before readiness finishes.
  const finished = supervisor.result.then(finish, finish)
  try {
    if (options.signal?.aborted) externalInterrupt()
    await waitForReadiness(
      [
        `http://127.0.0.1:${config.port}/api/health`,
        `http://${DEV_WEB_HOST}:${webPort}/api/health`,
      ],
      startupId,
      options.timeoutMs ?? 30_000,
      abort.signal,
    )
    log(
      `MediVault ready. Website: http://${DEV_WEB_HOST}:${webPort} API: http://127.0.0.1:${config.port}`,
    )
  } catch (error) {
    if (!interrupted && !abort.signal.aborted)
      log(
        `Unable to start MediVault: ${error instanceof Error ? error.message : String(error)}`,
      )
    stop()
  } finally {
    abort.abort()
  }
  try {
    return await finished
  } finally {
    options.signal?.removeEventListener('abort', externalInterrupt)
    process.off('SIGINT', interrupt)
    process.off('SIGTERM', interrupt)
    process.off('SIGHUP', interrupt)
  }
}
