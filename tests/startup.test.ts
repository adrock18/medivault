import { afterEach, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:net'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { once } from 'node:events'
import { createServer as createHttpServer } from 'node:http'
import { Writable } from 'node:stream'
import { setTimeout as delay } from 'node:timers/promises'
import supertest from 'supertest'
import { apiConfig, DEV_STARTUP_HEADER } from '../server/config.ts'
import { createApp } from '../server/app.ts'
import { startApi } from '../server/index.ts'
import { checkAddresses, runDevelopment } from '../scripts/dev-runtime.ts'
import { vaultSchema, recordRow, metricRow } from '../src/lib/contracts.ts'
import { localDate } from '../src/lib/utils.ts'

const execute = promisify(execFile)
const directories: string[] = []
const listeners: Server[] = []
const runs: { abort: AbortController; result: Promise<number> }[] = []
afterEach(async () => {
  for (const run of runs.splice(0)) {
    run.abort.abort()
    await run.result
  }
  await Promise.all(
    listeners
      .splice(0)
      .map(
        (server) =>
          new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          ),
      ),
  )
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true })),
  )
})
async function directory() {
  const path = await mkdtemp(join(tmpdir(), 'medivault-startup-'))
  directories.push(path)
  return path
}
async function listen() {
  const server = createServer()
  listeners.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('Expected a test-owned TCP address.')
  return { server, port: address.port }
}
async function freePort() {
  const { server, port } = await listen()
  await new Promise<void>((resolve) => server.close(() => resolve()))
  listeners.splice(listeners.indexOf(server), 1)
  return port
}
async function until(
  predicate: () => boolean | Promise<boolean>,
  label: () => string,
) {
  const end = Date.now() + 20_000
  while (Date.now() < end) {
    if (await predicate()) return
    await delay(100)
  }
  throw new Error(`Timed out waiting: ${label()}`)
}
const quote = (value: string) => `"${value}"`
async function fixture(code: string) {
  const path = join(await directory(), 'fixture.mjs')
  await writeFile(path, code)
  return `${quote(process.execPath)} ${quote(path)}`
}
const fakeHealth = (port: number) => `
  import { createServer } from 'node:http';
  createServer((_req, res) => {
    res.setHeader('X-MediVault-Dev-Startup', process.env.MEDIVAULT_DEV_STARTUP_ID);
    res.end(JSON.stringify({ status: 'ok' }));
  }).listen(${port}, '127.0.0.1');`

function launch(options: Parameters<typeof runDevelopment>[0]) {
  const abort = new AbortController()
  let text = ''
  const output = new Writable({
    write(chunk, _encoding, callback) {
      text += chunk.toString()
      callback()
    },
  })
  const result = runDevelopment({ ...options, signal: abort.signal, output })
  runs.push({ abort, result })
  return { abort, result, log: () => text }
}
async function settings() {
  return {
    apiPort: await freePort(),
    webPort: await freePort(),
    dataDir: join(await directory(), 'storage'),
  }
}
function environment(apiPort: number, dataDir: string) {
  return {
    ...process.env,
    NODE_ENV: 'development',
    HOST: '127.0.0.1',
    PORT: String(apiPort),
    DATA_DIR: dataDir,
  }
}
describe('development address preflight', () => {
  it('rejects a shared API/frontend port before opening storage or starting children', async () => {
    const { apiPort, dataDir } = await settings()
    await expect(
      runDevelopment({
        env: environment(apiPort, dataDir),
        webPort: apiPort,
      }),
    ).rejects.toThrow('API PORT and frontend port cannot both be')
    await expect(access(dataDir)).rejects.toMatchObject({ code: 'ENOENT' })
  })
  it('uses effective environment values and rejects invalid startup configuration', () => {
    expect(apiConfig({}).port).toBe(3001)
    expect(apiConfig({ PORT: '4301', HOST: '0.0.0.0' })).toMatchObject({
      port: 4301,
      host: '0.0.0.0',
    })

    for (const PORT of ['', '0', '65536', '3.5', 'not-a-port'])
      expect(() => apiConfig({ PORT })).toThrow('PORT must be an integer')
    expect(() => apiConfig({ NODE_ENV: 'production' })).toThrow(
      'COOKIE_SECURE=true',
    )
  })

  describe('owned full-stack development runtime', () => {
    it('rejects a frontend conflict before creating API storage', async () => {
      const { port } = await listen()
      const { apiPort, dataDir } = await settings()
      await expect(
        runDevelopment({
          env: environment(apiPort, dataDir),
          webPort: port,
        }),
      ).rejects.toThrow('Frontend address')
      await expect(access(dataDir)).rejects.toMatchObject({ code: 'ENOENT' })
    })

    it('stops a failed API watcher instead of waiting indefinitely', async () => {
      const { apiPort, webPort, dataDir } = await settings()
      await writeFile(dataDir, 'not a directory')
      const started = Date.now()
      const run = launch({
        env: environment(apiPort, dataDir),
        webPort,
        commands: [
          {
            name: 'api',
            command: `${quote(process.execPath)} --watch ${quote(resolve('server', 'index.ts'))}`,
          },
          { name: 'web', command: await fixture(fakeHealth(webPort)) },
        ],
      })
      expect(await run.result).toBe(1)
      expect(run.log()).toContain('readiness timed out after 30s')
      expect(Date.now() - started).toBeGreaterThanOrEqual(29_500)
      expect(Date.now() - started).toBeLessThan(35_000)
      expect(run.log()).toContain('Waiting for file changes')
      expect(run.log()).not.toContain('MediVault ready.')
      await checkAddresses([
        { name: 'API', host: '127.0.0.1', port: apiPort },
        { name: 'Frontend', host: '127.0.0.1', port: webPort },
      ])
    }, 40_000)

    it('rejects a competing healthy listener after preflight and leaves it running', async () => {
      const { apiPort, webPort, dataDir } = await settings()
      const run = launch({
        env: environment(apiPort, dataDir),
        webPort,
        timeoutMs: 3000,
        commands: [
          {
            name: 'api',
            command: await fixture(
              `console.log('waiting-api'); setInterval(() => {}, 1000)`,
            ),
          },
          { name: 'web', command: await fixture(fakeHealth(webPort)) },
        ],
      })
      await until(() => run.log().includes('waiting-api'), run.log)
      const incumbent = createHttpServer((_req, res) => {
        res.setHeader(DEV_STARTUP_HEADER, 'another-invocation')
        res.end(JSON.stringify({ status: 'ok' }))
      })
      listeners.push(incumbent)
      await new Promise<void>((resolve) =>
        incumbent.listen(apiPort, '127.0.0.1', resolve),
      )
      expect(await run.result).toBe(1)
      expect(run.log()).toContain('different development invocation')
      expect(run.log()).not.toContain('MediVault ready.')
      expect(
        (await fetch(`http://127.0.0.1:${apiPort}/api/health`)).status,
      ).toBe(200)
      expect(incumbent.listening).toBe(true)
    })

    it('does not announce readiness for a failing frontend proxy', async () => {
      const { apiPort, webPort, dataDir } = await settings()
      const run = launch({
        env: environment(apiPort, dataDir),
        webPort,
        timeoutMs: 1800,
        commands: [
          { name: 'api', command: await fixture(fakeHealth(apiPort)) },
          {
            name: 'web',
            command: await fixture(
              `import { createServer } from 'node:http'; createServer((_req, res) => { res.statusCode = 502; res.end(); }).listen(${webPort}, '127.0.0.1')`,
            ),
          },
        ],
      })
      expect(await run.result).toBe(1)
      expect(run.log()).toContain('Frontend proxy')
      expect(run.log()).toContain('HTTP 502')
      expect(run.log()).not.toContain('MediVault ready.')
      await checkAddresses([
        { name: 'Frontend', host: '127.0.0.1', port: webPort },
      ])
    })

    it('treats an unexpected successful command exit as full-stack failure', async () => {
      const { apiPort, webPort, dataDir } = await settings()
      const run = launch({
        env: environment(apiPort, dataDir),
        webPort,
        commands: [
          {
            name: 'api',
            command: await fixture(
              fakeHealth(apiPort) + '\nsetTimeout(() => process.exit(0), 1200)',
            ),
          },
          { name: 'web', command: await fixture(fakeHealth(webPort)) },
        ],
      })
      expect(await run.result).toBe(1)
      expect(run.log()).toContain('exited unexpectedly')
      await checkAddresses([
        { name: 'Frontend', host: '127.0.0.1', port: webPort },
      ])
    })

    it('handles the launcher SIGINT path and removes owned watcher descendants on Windows', async () => {
      const { apiPort, webPort, dataDir } = await settings()
      const apiCommand = (await fixture(fakeHealth(apiPort))).replace(
        quote(process.execPath),
        quote(process.execPath) + ' --watch',
      )
      const webCommand = await fixture(fakeHealth(webPort))
      const rootDir = await directory()
      const entry = join(rootDir, 'interrupt.mjs')
      const commands = [
        { name: 'api', command: apiCommand },
        { name: 'web', command: webCommand },
      ]
      await writeFile(
        entry,
        `
          import { runDevelopment } from ${JSON.stringify(pathToFileURL(resolve('scripts', 'dev-runtime.ts')).href)};
          process.stdin.on('data', () => process.emit('SIGINT', 'SIGINT'));
          process.exitCode = await runDevelopment({
            webPort: ${webPort},
            commands: ${JSON.stringify(commands)}
          });
          process.stdin.destroy();`,
      )
      const child = spawn(process.execPath, [entry], {
        env: environment(apiPort, dataDir),
        stdio: 'pipe',
      })
      let output = ''
      child.stdout.on('data', (data) => {
        output += data.toString()
      })
      child.stderr.on('data', (data) => {
        output += data.toString()
      })
      const result = once(child, 'close').then(([code]) => {
        if (typeof code !== 'number')
          throw new Error(
            'Launcher was terminated without a numeric exit status.',
          )
        return code
      })
      const abort = new AbortController()
      abort.signal.addEventListener('abort', () => child.stdin.end('stop\n'), {
        once: true,
      })
      runs.push({ abort, result })
      await until(
        () => output.includes('MediVault ready.'),
        () => output,
      )
      abort.abort()
      expect(await result).toBe(0)
      await checkAddresses([
        { name: 'API', host: '127.0.0.1', port: apiPort },
        { name: 'Frontend', host: '127.0.0.1', port: webPort },
      ])
      if (process.platform === 'win32') {
        const paths = [
          entry,
          apiCommand.split('"').at(-2),
          webCommand.split('"').at(-2),
        ]
        const command = `$owned = @(${paths.map((path) => `'${path}'`).join(',')}); @(Get-CimInstance Win32_Process | Where-Object { $line = $_.CommandLine; $_.ProcessId -ne $PID -and $line -and @($owned | Where-Object { $line.Contains($_) }).Count -gt 0 }).Count`
        const check = await execute('powershell.exe', [
          '-NoProfile',
          '-Command',
          command,
        ])
        expect(check.stdout.trim()).toBe('0')
      }
    }, 40_000)

    it('serves standalone and production deep links without requiring development correlation', async () => {
      for (const production of [false, true]) {
        const port = await freePort()
        const dataDir = await directory()
        const entry = join(await directory(), 'smoke.mjs')
        await writeFile(
          entry,
          `
            import { startApi } from ${JSON.stringify(pathToFileURL(resolve('server', 'index.ts')).href)};
            const api = startApi();
            process.stdin.on('data', async () => { await api.shutdown(); process.stdin.destroy(); });`,
        )
        const child = spawn(process.execPath, [entry], {
          env: {
            ...environment(port, dataDir),
            NODE_ENV: production ? 'production' : 'development',
            COOKIE_SECURE: production ? 'true' : 'false',
            MEDIVAULT_DEV_STARTUP_ID: production ? 'must-not-be-exposed' : '',
          },
          stdio: 'pipe',
        })
        let output = ''
        child.stdout.on('data', (data) => {
          output += data.toString()
        })
        child.stderr.on('data', (data) => {
          output += data.toString()
        })
        const result = once(child, 'close').then(([code]) => {
          if (typeof code !== 'number')
            throw new Error('API smoke process did not exit normally.')
          return code
        })
        const abort = new AbortController()
        abort.signal.addEventListener(
          'abort',
          () => child.stdin.end('stop\n'),
          { once: true },
        )
        runs.push({ abort, result })
        await until(
          () => output.includes('Express API listening'),
          () => output,
        )
        const health = await fetch(`http://127.0.0.1:${port}/api/health`)
        expect(await health.json()).toEqual({ status: 'ok' })
        expect(health.headers.get(DEV_STARTUP_HEADER)).toBeNull()
        expect(
          await (
            await fetch(`http://127.0.0.1:${port}/api/auth/session`)
          ).json(),
        ).toBeNull()
        if (production) {
          const page = await fetch(`http://127.0.0.1:${port}/dashboard`)
          expect(page.status).toBe(200)
          expect(await page.text()).toContain('<div id="root">')
        }
        abort.abort()
        expect(await result).toBe(0)
        await checkAddresses([{ name: 'API', host: '127.0.0.1', port }])
      }
    }, 40_000)

    it('runs real API/Vite, rejects duplicates, reloads watched source and preserves sessions and documents after restart', async () => {
      const { apiPort, webPort, dataDir } = await settings()
      const wrapper = join(await directory(), 'api.ts')
      const code = `import { startApi } from ${JSON.stringify(pathToFileURL(resolve('server', 'index.ts')).href)}; startApi()`
      await writeFile(wrapper, code)
      const options = {
        env: environment(apiPort, dataDir),
        webPort,
        commands: [
          {
            name: 'api',
            command: `${quote(process.execPath)} --watch ${quote(wrapper)}`,
          },
          {
            name: 'web',
            command: `${quote(process.execPath)} ${quote(resolve('node_modules', 'vite', 'bin', 'vite.js'))} --host 127.0.0.1 --port ${webPort} --strictPort`,
          },
        ],
      }
      const run = launch(options)
      await until(() => run.log().includes('MediVault ready.'), run.log)
      const base = `http://127.0.0.1:${webPort}`
      expect((await fetch(base)).status).toBe(200)
      const direct = await fetch(`http://127.0.0.1:${apiPort}/api/health`)
      const proxied = await fetch(base + '/api/health')
      expect(await direct.json()).toEqual({ status: 'ok' })
      expect(await proxied.json()).toEqual({ status: 'ok' })
      expect(proxied.headers.get(DEV_STARTUP_HEADER)).toBe(
        direct.headers.get(DEV_STARTUP_HEADER),
      )
      await expect(runDevelopment(options)).rejects.toThrow('already in use')
      const registration = await fetch(base + '/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MediVault-Request': '1',
        },
        body: JSON.stringify({
          full_name: 'Startup Test',
          email: 'startup@example.com',
          password: 'Test-password-123',
          confirm_password: 'Test-password-123',
        }),
      })
      expect(registration.status).toBe(201)
      const cookie = registration.headers.get('set-cookie')?.split(';')[0]
      if (!cookie) throw new Error('Registration must return a session cookie.')
      const headers = { Cookie: cookie, 'X-MediVault-Request': '1' }
      const metricResponse = await fetch(base + '/api/metrics', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weight',
          value: '65',
          secondary_value: '',
          measured_at: new Date(Date.now() - 1000).toISOString(),
          notes: 'Fictional startup fixture',
        }),
      })
      expect(metricResponse.status).toBe(201)
      const metric = metricRow.parse(await metricResponse.json())
      const pdf = '%PDF-1.4\nFictional startup fixture\n%%EOF'
      const form = new FormData()
      form.set('title', 'Startup fixture')
      form.set('category', 'other')
      form.set('provider', '')
      form.set('record_date', localDate())
      form.set(
        'file',
        new Blob([pdf], { type: 'application/pdf' }),
        'fixture.pdf',
      )
      const uploaded = await fetch(base + '/api/records', {
        method: 'POST',
        headers,
        body: form,
      })
      expect(uploaded.status).toBe(201)
      const record = recordRow.parse(await uploaded.json())
      await writeFile(wrapper, code + '\n// Trigger an isolated watch restart.')
      await until(
        () => (run.log().match(/Express API listening/g) ?? []).length >= 2,
        run.log,
      )
      expect(
        (await fetch(base + '/api/auth/session', { headers })).status,
      ).toBe(200)
      run.abort.abort()
      run.abort.abort()
      expect(await run.result).toBe(0)
      await checkAddresses([
        { name: 'API', host: '127.0.0.1', port: apiPort },
        { name: 'Frontend', host: '127.0.0.1', port: webPort },
      ])
      const restarted = launch(options)
      await until(
        () => restarted.log().includes('MediVault ready.'),
        restarted.log,
      )
      const vaultResponse = await fetch(base + '/api/vault', { headers })
      expect(vaultResponse.status).toBe(200)
      const vault = vaultSchema.parse(await vaultResponse.json())
      expect(vault.metrics).toContainEqual(metric)
      expect(vault.records).toContainEqual(record)
      expect(
        await (
          await fetch(`${base}/api/records/${record.id}/file`, { headers })
        ).text(),
      ).toBe(pdf)
    }, 60_000)
  })
  it('preserves inherited PORT precedence over the optional environment file without opening storage', async () => {
    const path = await directory()
    const envFile = join(path, '.env')
    await writeFile(envFile, 'PORT=4301\n')
    const code = `import { apiConfig } from ${JSON.stringify(pathToFileURL(resolve('server', 'config.ts')).href)}; console.log(apiConfig().port)`
    const result = await execute(
      process.execPath,
      ['--env-file=' + envFile, '--input-type=module', '-e', code],
      {
        env: { ...process.env, PORT: '4302' },
      },
    )
    expect(result.stdout.trim()).toBe('4302')
  })

  describe('API startup readiness and cleanup', () => {
    it('keeps health JSON and private access unchanged, with correlation only for combined development', async () => {
      const dataDir = await directory()
      for (const options of [
        {},
        { devStartupId: 'test-invocation' },
        { devStartupId: 'test-invocation', serveFrontend: true },
      ]) {
        const { app, db } = createApp({ dataDir, ...options })
        try {
          const response = await supertest(app).get('/api/health').expect(200)
          expect(response.body).toEqual({ status: 'ok' })
          expect(response.headers[DEV_STARTUP_HEADER.toLowerCase()]).toBe(
            options.devStartupId && !options.serveFrontend
              ? 'test-invocation'
              : undefined,
          )
          await supertest(app).get('/api/vault').expect(401)
        } finally {
          db.close()
        }
      }
    })
    it('closes its listener and database safely on repeated shutdown', async () => {
      const free = await listen()
      await new Promise<void>((resolve) => free.server.close(() => resolve()))
      listeners.splice(listeners.indexOf(free.server), 1)
      const api = startApi({
        PORT: String(free.port),
        DATA_DIR: await directory(),
      })
      await once(api.server, 'listening')
      await Promise.all([api.shutdown(), api.shutdown()])
      expect(api.server.listening).toBe(false)
      expect(() => api.db.prepare('SELECT 1')).toThrow()
      await expect(
        checkAddresses([{ name: 'API', host: '127.0.0.1', port: free.port }]),
      ).resolves.toBeUndefined()
    })
    it('reports bind conflicts without success logging and exposes other startup errors', async () => {
      const occupied = await listen()
      const dataDir = await directory()
      const entry = resolve('server', 'index.ts')
      await expect(
        execute(process.execPath, [entry], {
          env: {
            ...process.env,
            NODE_ENV: 'development',
            HOST: '127.0.0.1',
            PORT: String(occupied.port),
            DATA_DIR: dataDir,
          },
        }),
      ).rejects.toMatchObject({
        code: 1,
        stdout: '',
        stderr: expect.stringContaining(
          `API address 127.0.0.1:${occupied.port} is already in use`,
        ),
      })
      expect(occupied.server.listening).toBe(true)
      await expect(
        execute(process.execPath, [entry], {
          env: { ...process.env, PORT: 'invalid' },
        }),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining('PORT must be an integer'),
      })
    })
  })
  it.each(['API', 'Frontend'])(
    'rejects an occupied %s address without stopping its owner',
    async (name) => {
      const { server, port } = await listen()
      await expect(
        checkAddresses([{ name, host: '127.0.0.1', port }]),
      ).rejects.toThrow(`${name} address 127.0.0.1:${port} is already in use`)
      expect(server.listening).toBe(true)
      if (name === 'API') {
        const dataDir = join(await directory(), 'unopened-storage')
        await expect(
          execute(
            process.execPath,
            [
              '--env-file-if-exists=' + join(dataDir, 'missing.env'),
              resolve('scripts', 'dev.ts'),
            ],
            { env: environment(port, dataDir) },
          ),
        ).rejects.toMatchObject({
          code: 1,
          stderr: expect.stringContaining(
            `API address 127.0.0.1:${port} is already in use`,
          ),
        })
        await expect(access(dataDir)).rejects.toMatchObject({ code: 'ENOENT' })
      }
    },
  )
  it('releases successful probes, including when the other address fails', async () => {
    const occupied = await listen()
    const free = await listen()
    await new Promise<void>((resolve) => free.server.close(() => resolve()))
    listeners.splice(listeners.indexOf(free.server), 1)
    const addresses = [
      { name: 'API', host: '127.0.0.1', port: free.port },
      { name: 'Frontend', host: '127.0.0.1', port: occupied.port },
    ]
    await expect(checkAddresses(addresses)).rejects.toThrow('Frontend address')
    await expect(checkAddresses([addresses[0]])).resolves.toBeUndefined()
  })
})
