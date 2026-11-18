import { Router } from 'express'
import {
  loginSchema,
  passwordSchema,
  registerSchema,
} from '../../shared/schemas.ts'
import { validate, type RouteContext } from './context.ts'

export function publicAuthRoutes(context: RouteContext) {
  const router = Router()
  const { auth, authLimit } = context
  router.get('/auth/session', async (req, res) => {
    const user = await auth.getSession(req, res)
    res.json(user ? { user } : null)
  })
  router.post('/auth/register', authLimit, async (req, res) => {
    res
      .status(201)
      .json(
        await auth.register(
          req,
          res,
          validate(registerSchema.strict(), req.body),
        ),
      )
  })
  router.post('/auth/login', authLimit, async (req, res) => {
    res.json(
      await auth.login(req, res, validate(loginSchema.strict(), req.body)),
    )
  })
  router.get('/auth/callback', async (req, res) => {
    const code = typeof req.query.code === 'string' ? req.query.code : undefined
    const { location } = await auth.callback(req, res, code)
    res.redirect(303, location)
  })
  router.post('/auth/logout', async (req, res) => {
    await auth.logout(req, res)
    res.status(204).end()
  })
  return router
}

export function accountRoutes(context: RouteContext) {
  const router = Router()
  router.post('/auth/password', context.authLimit, async (req, res) => {
    await context.auth.changePassword(
      req,
      res,
      validate(passwordSchema.strict(), req.body),
    )
    res.status(204).end()
  })
  return router
}
