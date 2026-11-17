import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import {
  loginSchema,
  passwordSchema,
  registerSchema,
} from '../../shared/schemas.ts'
import {
  COOKIE_NAME,
  hashPassword,
  sessionHash,
  verifyPassword,
} from '../auth.ts'
import { one, transaction } from '../database.ts'
import { HttpError, validate, type RouteContext } from './context.ts'

/** Register public session and sign-in endpoints before the private API gate. */
export function publicAuthRoutes(context: RouteContext) {
  const router = Router()
  const { authLimit, db, establishSession, getSession } = context
  const dummyHash = hashPassword(randomUUID())

  router.get('/auth/session', (req, res) => {
    const user = getSession(req, res)
    res.json(user ? { user } : null)
  })

  router.post('/auth/register', authLimit, async (req, res) => {
    const input = validate(registerSchema.strict(), req.body)
    const email = input.email.trim().toLowerCase()
    const passwordHash = await hashPassword(input.password)
    const id = randomUUID()
    const time = new Date().toISOString()
    const result = transaction(db, () => {
      db.prepare(
        'INSERT INTO users(id,email,password_hash,created_at,updated_at) VALUES (?,?,?,?,?)',
      ).run(id, email, passwordHash, time, time)
      db.prepare(
        'INSERT INTO profiles(id,full_name,created_at,updated_at) VALUES (?,?,?,?)',
      ).run(id, input.full_name, time, time)
      db.prepare(
        "INSERT INTO family_members(id,user_id,full_name,relationship,date_of_birth,created_at,updated_at) VALUES (?,?,?,'self',NULL,?,?)",
      ).run(id, id, input.full_name, time, time)
      db.prepare(
        'INSERT INTO notification_preferences(user_id,created_at,updated_at) VALUES (?,?,?)',
      ).run(id, time, time)
      return establishSession(id, res)
    })
    res.status(201).json(result)
  })

  router.post('/auth/login', authLimit, async (req, res) => {
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

    const token: unknown = req.cookies?.[COOKIE_NAME]
    if (typeof token === 'string')
      db.prepare('DELETE FROM sessions WHERE token_hash=?').run(
        sessionHash(token),
      )
    res.json(establishSession(user.id, res))
  })

  router.post('/auth/logout', (req, res) => {
    const token: unknown = req.cookies?.[COOKIE_NAME]
    if (typeof token === 'string')
      db.prepare('DELETE FROM sessions WHERE token_hash=?').run(
        sessionHash(token),
      )
    res.clearCookie(COOKIE_NAME, context.cookies)
    res.status(204).end()
  })

  return router
}

/** Register account mutations that require the private API session gate. */
export function accountRoutes(context: RouteContext) {
  const router = Router()
  const { authLimit, db } = context

  router.post('/auth/password', authLimit, async (req, res) => {
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

  return router
}
