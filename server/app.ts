import express, { type ErrorRequestHandler } from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { DEV_STARTUP_HEADER, type SupabaseSettings } from './config.ts'
import type { AuthGatewayFactory } from './auth-gateway.ts'
import { createSupabaseAuthGateway } from './supabase-auth.ts'
import { SupabaseDocumentStore, type DocumentStore } from './document-store.ts'
import {
  createAdminSupabaseClient,
  type createRequestSupabaseClient,
} from './supabase.ts'
import {
  DocumentOperationError,
  HttpError,
  requestFailure,
  createRouteContext,
} from './routes/context.ts'
import { accountRoutes, publicAuthRoutes } from './routes/auth.ts'
import { medicationRoutes } from './routes/medications.ts'
import { careRoutes } from './routes/care.ts'
import { recordRoutes } from './routes/records.ts'
import { vaultRoutes } from './routes/vault.ts'

declare global {
  namespace Express {
    interface Locals {
      user: import('../shared/contracts.ts').Session['user']
      supabase: ReturnType<typeof createRequestSupabaseClient>
    }
  }
}

export type AppOptions = {
  secureCookies?: boolean
  appOrigin?: string
  serveFrontend?: boolean
  authRateLimit?: number
  devStartupId?: string
  trustProxy?: number
  documentStore?: DocumentStore
  ocrSpaceApiKey?: string
  supabaseSettings?: SupabaseSettings
  authGatewayFactory?: AuthGatewayFactory
}

/** Assemble middleware and API routes around one database/document-store instance. */
export function createApp(options: AppOptions) {
  if (!options.supabaseSettings)
    throw new Error('Supabase configuration is required.')
  const admin = createAdminSupabaseClient(options.supabaseSettings)
  const documents =
    options.documentStore ??
    new SupabaseDocumentStore(admin, options.supabaseSettings.documentBucket)
  const app = express()
  app.disable('x-powered-by')
  if (options.trustProxy) app.set('trust proxy', options.trustProxy)
  app.use(
    helmet({
      contentSecurityPolicy: options.serveFrontend
        ? {
            directives: {
              scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
              workerSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
            },
          }
        : false,
    }),
  )
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  app.use(express.json({ limit: '64kb' }))
  app.use(cookieParser())
  app.use('/api', (req, _res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (req.get('X-MediVault-Request') !== '1')
        return next(new HttpError(403, 'Missing request protection header.'))
      const origin = req.get('Origin')
      if (origin) {
        let sameHost = false
        try {
          sameHost = new URL(origin).host === req.get('host')
        } catch {
          return next(new HttpError(403, 'Invalid request origin.'))
        }
        if (!sameHost && origin !== options.appOrigin)
          return next(new HttpError(403, 'This origin is not allowed.'))
      }
    }
    next()
  })

  const cookies = {
    httpOnly: true,
    sameSite: 'lax',
    secure: options.secureCookies ?? false,
    path: '/api',
  } as const
  const auth =
    options.authGatewayFactory?.(cookies) ??
    (options.supabaseSettings
      ? createSupabaseAuthGateway(options.supabaseSettings, cookies)
      : undefined)
  if (!auth)
    throw new Error('Supabase authentication configuration is required.')
  const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: options.authRateLimit ?? 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: 'Too many authentication attempts. Try again in 15 minutes.',
    },
  })
  const routes = createRouteContext({
    admin,
    documents,
    auth,
    authLimit,
    ocrSpaceApiKey: options.ocrSpaceApiKey,
  })

  app.get('/api/health', async (_req, res) => {
    if (!(await readiness()))
      throw new HttpError(503, 'The managed database is not ready.')
    if (options.devStartupId && !options.serveFrontend)
      res.set(DEV_STARTUP_HEADER, options.devStartupId)
    res.json({ status: 'ok' })
  })
  app.use('/api', publicAuthRoutes(routes))
  app.use('/api', async (req, res, next) => {
    const user = await routes.auth.getSession(req, res)
    if (!user)
      return next(
        new HttpError(401, 'Your session has expired. Please sign in again.'),
      )
    res.locals.user = user
    next()
  })
  app.use('/api', accountRoutes(routes))
  app.use('/api', vaultRoutes(routes))
  app.use('/api', recordRoutes(routes))
  app.use('/api', medicationRoutes(routes))
  app.use('/api', careRoutes(routes))
  app.use('/api', (_req, _res, next) =>
    next(new HttpError(404, 'API endpoint not found.')),
  )

  if (options.serveFrontend) {
    const frontend = resolve('dist')
    app.use(express.static(frontend, { index: false }))
    app.get('/{*path}', (_req, res) =>
      res.sendFile(resolve(frontend, 'index.html')),
    )
  }

  const handleError: ErrorRequestHandler = (error: unknown, req, res, next) => {
    if (error instanceof DocumentOperationError) {
      const incidentId = randomUUID()
      if (!res.headersSent) res.set('X-MediVault-Incident', incidentId)
      // Provider/SQLite errors can contain private paths, metadata or credentials.
      console.error('MediVault document operation failed.', {
        operation: error.operation,
        recordId: error.recordId ?? null,
        incidentId,
      })
    }
    if (res.headersSent) return next(error)
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    if (error instanceof multer.MulterError) {
      res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
        error:
          error.code === 'LIMIT_FILE_SIZE'
            ? 'Choose a file no larger than 10 MB.'
            : `Upload rejected: ${error.message}`,
      })
      return
    }
    if (
      error instanceof SyntaxError &&
      'status' in error &&
      error.status === 400
    ) {
      res.status(400).json({ error: 'Request body must be valid JSON.' })
      return
    }
    if (
      error instanceof Error &&
      'type' in error &&
      error.type === 'entity.too.large'
    ) {
      res.status(413).json({ error: 'Request body is too large.' })
      return
    }
    console.error('MediVault API request failed.', {
      method: req.method,
      incidentId: randomUUID(),
    })
    res.status(500).json({
      error: requestFailure,
    })
  }
  app.use(handleError)
  async function readiness() {
    try {
      const { data, error } = await admin.rpc('check_app_readiness')
      return !error && data === true
    } catch {
      return false
    }
  }
  return { app, readiness }
}
