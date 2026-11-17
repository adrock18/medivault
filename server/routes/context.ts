import type { Request, Response } from 'express'
import type { RequestHandler } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import type { SQLInputValue } from 'node:sqlite'
import { z } from 'zod'
import {
  doseLogRow,
  careTrackRow,
  careVisitRow,
  archivedHealthMetricRow,
  familyMemberRow,
  healthProfileRow,
  notificationPreferencesRow,
  profileRow,
  sessionSchema,
} from '../../shared/contracts.ts'
import { MAX_FILE_SIZE } from '../../shared/documents.ts'
import {
  one,
  openDatabase,
  storedMedication,
  storedRecord,
} from '../database.ts'
import {
  COOKIE_NAME,
  SESSION_DURATION,
  createToken,
  sessionHash,
} from '../auth.ts'
import type { DocumentStore } from '../document-store.ts'
import type { ReminderEmailSettings } from '../config.ts'

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const requestFailure =
  'The server could not complete this request. Please try again.'

type DocumentOperation =
  | 'upload'
  | 'upload-metadata'
  | 'upload-cleanup'
  | 'download'
  | 'download-missing'
  | 'download-stream'
  | 'delete-object'
  | 'delete-metadata'

export class DocumentOperationError extends HttpError {
  operation: DocumentOperation
  recordId?: string

  constructor(
    operation: DocumentOperation,
    status: number,
    message: string,
    recordId?: string,
  ) {
    super(status, message)
    this.operation = operation
    this.recordId = recordId
  }
}

type OwnedTable =
  | 'health_profiles'
  | 'family_members'
  | 'medical_records'
  | 'medications'
  | 'medication_logs'
  | 'care_tracks'
  | 'care_visits'

type CookieOptions = {
  readonly httpOnly: true
  readonly sameSite: 'lax'
  readonly secure: boolean
  readonly path: '/api'
}

export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success)
    throw new HttpError(
      400,
      parsed.error.issues.map((issue) => issue.message).join(' '),
    )
  return parsed.data
}

export function requestId(req: Request) {
  return validate(z.uuid('Invalid record ID.'), req.params.id)
}

/** Share one session, validation, and owner-scoped persistence boundary across routes. */
export function createRouteContext(options: {
  db: ReturnType<typeof openDatabase>
  documents: DocumentStore
  cookies: CookieOptions
  authLimit: RequestHandler
  ocrSpaceApiKey?: string
  reminderEmail?: ReminderEmailSettings
}) {
  const { db, documents, cookies, authLimit, ocrSpaceApiKey, reminderEmail } =
    options

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
  ) {
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

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 1,
      fields: 6,
      parts: 7,
      fieldSize: 4096,
    },
  })

  return {
    db,
    documents,
    cookies,
    authLimit,
    ocrSpaceApiKey,
    reminderEmail,
    getSession,
    establishSession,
    owned,
    save,
    remove,
    upload,
    requestId,
    profileRow,
    familyMemberRow,
    notificationPreferencesRow,
    healthProfileRow,
    doseLogRow,
    careTrackRow,
    careVisitRow,
    archivedHealthMetricRow,
    storedMedication,
    storedRecord,
  }
}

export type RouteContext = ReturnType<typeof createRouteContext>
