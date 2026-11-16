import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { z } from 'zod'
import type { SQLInputValue } from 'node:sqlite'
import {
  profileRow,
  healthProfileRow,
  recordRow,
  doseLogRow,
  metricRow,
  sessionSchema,
} from '../src/lib/contracts.ts'
import {
  loginSchema,
  registerSchema,
  passwordSchema,
  profileSchema,
  recordSchema,
  medicationSchema,
  metricSchema,
  calendarDateSchema,
} from '../src/lib/schemas.ts'
import { MAX_FILE_SIZE, validateDocument } from '../src/lib/utils.ts'
import {
  openDatabase,
  one,
  many,
  transaction,
  storedMedication,
} from './database.ts'
import {
  COOKIE_NAME,
  SESSION_DURATION,
  hashPassword,
  verifyPassword,
  createToken,
  sessionHash,
} from './auth.ts'
import type { Session } from '../src/lib/contracts.ts'
import { DEV_STARTUP_HEADER } from './config.ts'
import { LocalDocumentStore, type DocumentStore } from './document-store.ts'

declare global {
  namespace Express {
    interface Locals {
      user: Session['user']
      sessionHash: string
    }
  }
}
class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success)
    throw new HttpError(
      400,
      parsed.error.issues.map((issue) => issue.message).join(' '),
    )
  return parsed.data
}
function requestId(req: Request) {
  return validate(z.uuid('Invalid record ID.'), req.params.id)
}
type OwnedTable =
  | 'health_profiles'
  | 'medical_records'
  | 'medications'
  | 'medication_logs'
  | 'health_metrics'
export type AppOptions = {
  dataDir: string
  secureCookies?: boolean
  appOrigin?: string
  serveFrontend?: boolean
  authRateLimit?: number
  devStartupId?: string
  trustProxy?: number
  documentStore?: DocumentStore
}

export function createApp(options: AppOptions) {
  const db = openDatabase(options.dataDir)
  const documents =
    options.documentStore ??
    new LocalDocumentStore(resolve(options.dataDir, 'documents'))
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
  const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: options.authRateLimit ?? 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: 'Too many authentication attempts. Try again in 15 minutes.',
    },
  })
  function getSession(req: Request, res: Response) {
    const token: unknown = req.cookies?.[COOKIE_NAME]
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null
    const tokenHash = sessionHash(token)
    const user = one(
      db,
      sessionSchema.shape.user,
      `
      SELECT u.id,u.email,p.full_name FROM sessions s JOIN users u ON u.id=s.user_id
      JOIN profiles p ON p.id=u.id WHERE s.token_hash=? AND s.expires_at>?`,
      [tokenHash, Date.now()],
    )
    if (!user) {
      db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash)
      res.clearCookie(COOKIE_NAME, cookies)
      return null
    }
    res.locals.sessionHash = tokenHash
    return user
  }
  function establishSession(userId: string, res: Response) {
    const token = createToken()
    db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now())
    db.prepare(
      'INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)',
    ).run(sessionHash(token), userId, Date.now() + SESSION_DURATION)
    res.cookie(COOKIE_NAME, token, { ...cookies, maxAge: SESSION_DURATION })
    const user = one(
      db,
      sessionSchema.shape.user,
      'SELECT u.id,u.email,p.full_name FROM users u JOIN profiles p ON p.id=u.id WHERE u.id=?',
      [userId],
    )
    if (!user) throw new Error('The authenticated account profile is missing.')
    return { user }
  }
  function owned<T>(
    table: OwnedTable,
    schema: z.ZodType<T>,
    id: string,
    userId: string,
  ): T {
    const row = one(
      db,
      schema,
      `SELECT * FROM ${table} WHERE id=? AND user_id=?`,
      [id, userId],
    )
    if (!row)
      throw new HttpError(404, 'This entry was not found or is not accessible.')
    return row
  }
  function save<T>(
    table: OwnedTable,
    schema: z.ZodType<T>,
    data: Record<string, SQLInputValue>,
    userId: string,
    id?: string,
  ) {
    const time = new Date().toISOString()
    const keys = Object.keys(data)
    if (id) {
      owned(table, schema, id, userId)
      db.prepare(
        `UPDATE ${table} SET ${keys.map((key) => `${key}=?`).join(',')},updated_at=? WHERE id=? AND user_id=?`,
      ).run(...Object.values(data), time, id, userId)
    } else {
      id = randomUUID()
      const columns = ['id', 'user_id', ...keys, 'created_at', 'updated_at']
      db.prepare(
        `INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
      ).run(id, userId, ...Object.values(data), time, time)
    }
    return owned(table, schema, id, userId)
  }
  function remove<T>(
    table: OwnedTable,
    schema: z.ZodType<T>,
    req: Request,
    res: Response,
  ) {
    const id = requestId(req)
    owned(table, schema, id, res.locals.user.id)
    db.prepare(`DELETE FROM ${table} WHERE id=? AND user_id=?`).run(
      id,
      res.locals.user.id,
    )
    res.status(204).end()
  }
  app.get('/api/health', (_req, res) => {
    db.prepare('SELECT 1').get()
    if (options.devStartupId && !options.serveFrontend)
      res.set(DEV_STARTUP_HEADER, options.devStartupId)
    res.json({ status: 'ok' })
  })
  app.get('/api/auth/session', (req, res) => {
    const user = getSession(req, res)
    res.json(user ? { user } : null)
  })
  app.post('/api/auth/register', authLimit, async (req, res) => {
    const input = validate(registerSchema.strict(), req.body)
    const email = input.email.trim().toLowerCase()
    const passwordHash = await hashPassword(input.password)
    const id = randomUUID(),
      time = new Date().toISOString()
    const result = transaction(db, () => {
      db.prepare(
        'INSERT INTO users(id,email,password_hash,created_at,updated_at) VALUES (?,?,?,?,?)',
      ).run(id, email, passwordHash, time, time)
      db.prepare(
        'INSERT INTO profiles(id,full_name,created_at,updated_at) VALUES (?,?,?,?)',
      ).run(id, input.full_name, time, time)
      return establishSession(id, res)
    })
    res.status(201).json(result)
  })
  const dummyHash = hashPassword(randomUUID())
  app.post('/api/auth/login', authLimit, async (req, res) => {
    const input = validate(loginSchema.strict(), req.body)
    const user = one(
      db,
      z.object({ id: z.uuid(), password_hash: z.string() }),
      'SELECT id,password_hash FROM users WHERE email=?',
      [input.email.trim().toLowerCase()],
    )
    const matches = await verifyPassword(
      input.password,
      user?.password_hash ?? (await dummyHash),
    )
    if (!user || !matches)
      throw new HttpError(401, 'Invalid email or password.')
    // Replace any session presented by this browser rather than retaining old login tokens.
    const token: unknown = req.cookies?.[COOKIE_NAME]
    if (typeof token === 'string')
      db.prepare('DELETE FROM sessions WHERE token_hash=?').run(
        sessionHash(token),
      )
    res.json(establishSession(user.id, res))
  })
  app.post('/api/auth/logout', (req, res) => {
    const token: unknown = req.cookies?.[COOKIE_NAME]
    if (typeof token === 'string')
      db.prepare('DELETE FROM sessions WHERE token_hash=?').run(
        sessionHash(token),
      )
    res.clearCookie(COOKIE_NAME, cookies)
    res.status(204).end()
  })
  app.use('/api', (req, res, next) => {
    const user = getSession(req, res)
    if (!user)
      return next(
        new HttpError(401, 'Your session has expired. Please sign in again.'),
      )
    res.locals.user = user
    next()
  })
  app.post('/api/auth/password', authLimit, async (req, res) => {
    const input = validate(passwordSchema.strict(), req.body)
    const current = one(
      db,
      z.object({ password_hash: z.string() }),
      'SELECT password_hash FROM users WHERE id=?',
      [res.locals.user.id],
    )
    if (
      !current ||
      !(await verifyPassword(input.current_password, current.password_hash))
    )
      throw new HttpError(400, 'Your current password is incorrect.')
    const hash = await hashPassword(input.password)
    transaction(db, () => {
      const result = db
        .prepare(
          'UPDATE users SET password_hash=?,updated_at=? WHERE id=? AND password_hash=?',
        )
        .run(
          hash,
          new Date().toISOString(),
          res.locals.user.id,
          current.password_hash,
        )
      if (!result.changes)
        throw new HttpError(
          409,
          'Your password changed in another session. Try again.',
        )
      db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').run(
        res.locals.user.id,
        res.locals.sessionHash,
      )
    })
    res.status(204).end()
  })
  app.get('/api/vault', (_req, res) => {
    const id = res.locals.user.id
    const profile = one(db, profileRow, 'SELECT * FROM profiles WHERE id=?', [
      id,
    ])
    if (!profile) throw new Error('The account profile is missing.')
    res.json({
      profile,
      healthProfile: one(
        db,
        healthProfileRow,
        'SELECT * FROM health_profiles WHERE user_id=?',
        [id],
      ),
      records: many(
        db,
        recordRow,
        'SELECT * FROM medical_records WHERE user_id=? ORDER BY created_at DESC,id',
        [id],
      ),
      medications: many(
        db,
        storedMedication,
        'SELECT * FROM medications WHERE user_id=? ORDER BY created_at DESC,id',
        [id],
      ),
      logs: many(
        db,
        doseLogRow,
        'SELECT * FROM medication_logs WHERE user_id=? ORDER BY scheduled_date DESC,scheduled_time DESC,id',
        [id],
      ),
      metrics: many(
        db,
        metricRow,
        'SELECT * FROM health_metrics WHERE user_id=? ORDER BY measured_at DESC,id',
        [id],
      ),
    })
  })
  app.put('/api/health-profile', (req, res) => {
    const input = validate(profileSchema.strict(), req.body)
    const userId = res.locals.user.id
    const existing = one(
      db,
      healthProfileRow,
      'SELECT * FROM health_profiles WHERE user_id=?',
      [userId],
    )
    const result = transaction(db, () => {
      const row = save(
        'health_profiles',
        healthProfileRow,
        {
          ...input,
          date_of_birth: input.date_of_birth || null,
          gender: input.gender || null,
          blood_group: input.blood_group || null,
          height_cm: input.height_cm ? Number(input.height_cm) : null,
          weight_kg: input.weight_kg ? Number(input.weight_kg) : null,
        },
        userId,
        existing?.id,
      )
      db.prepare('UPDATE profiles SET full_name=?,updated_at=? WHERE id=?').run(
        input.full_name,
        row.updated_at,
        userId,
      )
      return row
    })
    res.json(result)
  })
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 1,
      fields: 4,
      parts: 5,
      fieldSize: 4096,
    },
  })
  app.post('/api/records', upload.single('file'), async (req, res) => {
    const input = validate(recordSchema.strict(), req.body)
    if (!req.file)
      throw new HttpError(400, 'Choose a PDF, JPG, or PNG document.')
    const file = new File(
      [new Uint8Array(req.file.buffer)],
      req.file.originalname,
      { type: req.file.mimetype },
    )
    try {
      await validateDocument(file)
    } catch (error) {
      throw new HttpError(
        400,
        error instanceof Error ? error.message : 'Invalid document.',
      )
    }
    if (file.name.length > 255)
      throw new HttpError(
        400,
        'The file name must be no longer than 255 characters.',
      )
    const filePath = `${res.locals.user.id}/${randomUUID()}.${file.name.split('.').pop()!.toLowerCase()}`
    try {
      await documents.put(filePath, req.file.buffer, file.type)
    } catch (error) {
      console.error('MediVault document store upload failed:', error)
      throw new HttpError(
        503,
        'The document could not be stored right now. Please try again.',
      )
    }
    try {
      const row = save(
        'medical_records',
        recordRow,
        {
          ...input,
          file_path: filePath,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        },
        res.locals.user.id,
      )
      res.status(201).json(row)
    } catch (error) {
      try {
        await documents.delete(filePath)
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Upload failed and its file could not be cleaned up. Contact the server administrator.',
        )
      }
      throw error
    }
  })
  app.patch('/api/records/:id', (req, res) => {
    res.json(
      save(
        'medical_records',
        recordRow,
        validate(recordSchema.strict(), req.body),
        res.locals.user.id,
        requestId(req),
      ),
    )
  })
  app.get('/api/records/:id/file', async (req, res) => {
    const record = owned(
      'medical_records',
      recordRow,
      requestId(req),
      res.locals.user.id,
    )
    const stored = await documents.get(record.file_path)
    if (!stored)
      throw new HttpError(
        404,
        'The document file could not be found. Contact your server administrator.',
      )
    res.type(record.file_type)
    if (req.query.download === '1') res.attachment(record.file_name)
    else res.set('Content-Disposition', 'inline')
    if (stored.size !== undefined)
      res.set('Content-Length', String(stored.size))
    await pipeline(stored.body, res)
  })
  app.delete('/api/records/:id', async (req, res) => {
    const id = requestId(req)
    const record = owned('medical_records', recordRow, id, res.locals.user.id)
    await documents.delete(record.file_path)
    try {
      remove('medical_records', recordRow, req, res)
    } catch (error) {
      throw new AggregateError(
        [error],
        'The file was removed but its details could not be deleted. Retry deletion to finish.',
      )
    }
  })
  function saveMedication(req: Request, res: Response, id?: string) {
    const input = validate(medicationSchema.strict(), req.body)
    const previous = id
      ? owned('medications', storedMedication, id, res.locals.user.id)
      : null
    if (input.source_record_id)
      owned(
        'medical_records',
        recordRow,
        input.source_record_id,
        res.locals.user.id,
      )
    return save(
      'medications',
      storedMedication,
      {
        ...input,
        form: input.form ?? previous?.form ?? 'unspecified',
        strength: input.strength ?? previous?.strength ?? '',
        source_record_id:
          input.source_record_id === undefined
            ? (previous?.source_record_id ?? null)
            : input.source_record_id || null,
        prescription_text:
          input.prescription_text ?? previous?.prescription_text ?? '',
        times: JSON.stringify(
          input.times
            .split(',')
            .map((time) => time.trim())
            .sort(),
        ),
        end_date: input.end_date || null,
      },
      res.locals.user.id,
      id,
    )
  }
  app.post('/api/medications', (req, res) => {
    res.status(201).json(saveMedication(req, res))
  })
  app.patch('/api/medications/:id', (req, res) => {
    res.json(saveMedication(req, res, requestId(req)))
  })
  app.delete('/api/medications/:id', (req, res) =>
    remove('medications', storedMedication, req, res),
  )
  const logInput = z
    .object({
      medication_id: z.uuid(),
      scheduled_date: calendarDateSchema,
      scheduled_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      status: z.enum(['taken', 'skipped']),
    })
    .strict()
  app.post('/api/dose-logs', (req, res) => {
    const input = validate(logInput, req.body)
    const med = owned(
      'medications',
      storedMedication,
      input.medication_id,
      res.locals.user.id,
    )
    if (
      input.scheduled_date < med.start_date ||
      (med.end_date && input.scheduled_date > med.end_date) ||
      !med.times.includes(input.scheduled_time)
    )
      throw new HttpError(
        400,
        'This dose is not part of the medication schedule.',
      )
    const row = save(
      'medication_logs',
      doseLogRow,
      { ...input, logged_at: new Date().toISOString() },
      res.locals.user.id,
    )
    res.status(201).json(row)
  })
  app.patch('/api/dose-logs/:id', (req, res) => {
    const input = validate(
      z.object({ status: z.enum(['taken', 'skipped']) }).strict(),
      req.body,
    )
    res.json(
      save(
        'medication_logs',
        doseLogRow,
        { ...input, logged_at: new Date().toISOString() },
        res.locals.user.id,
        requestId(req),
      ),
    )
  })
  app.delete('/api/dose-logs/:id', (req, res) =>
    remove('medication_logs', doseLogRow, req, res),
  )
  function saveMetric(req: Request, res: Response, id?: string) {
    const input = validate(metricSchema.strict(), req.body)
    return save(
      'health_metrics',
      metricRow,
      {
        ...input,
        value: Number(input.value),
        secondary_value:
          input.type === 'blood_pressure'
            ? Number(input.secondary_value)
            : null,
        measured_at: new Date(input.measured_at).toISOString(),
      },
      res.locals.user.id,
      id,
    )
  }
  app.post('/api/metrics', (req, res) => {
    res.status(201).json(saveMetric(req, res))
  })
  app.patch('/api/metrics/:id', (req, res) => {
    res.json(saveMetric(req, res, requestId(req)))
  })
  app.delete('/api/metrics/:id', (req, res) =>
    remove('health_metrics', metricRow, req, res),
  )
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
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ERR_SQLITE_ERROR' &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      res.status(409).json({
        error: error.message.includes('users.email')
          ? 'An account with that email already exists.'
          : error.message.includes('medication_logs.')
            ? 'This dose has already been logged. Refresh your schedule.'
            : 'This entry already exists.',
      })
      return
    }
    console.error(`MediVault API error: ${req.method} ${req.path}`, error)
    res.status(500).json({
      error:
        error instanceof AggregateError
          ? error.message
          : 'The server could not complete this request. Please try again.',
    })
  }
  app.use(handleError)
  return { app, db }
}
