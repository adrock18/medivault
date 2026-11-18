/**
 * Authentication HTTP endpoints. Validate browser input, delegate identity work
 * to the gateway and expose only public session summaries.
 */

import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
  confirmationEmailSchema,
  loginSchema,
  passwordSchema,
  registerSchema,
} from '../../shared/schemas.ts'
import { validate, type RouteContext } from './context.ts'

/** Mounted before the private API session guard; mutations still validate and protect requests. */
export function publicAuthRoutes(context: RouteContext) {
  const router = Router()
  const { auth, authLimit } = context
  const resendLimit = rateLimit({
    windowMs: 60_000,
    limit: 1,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error:
        'Please wait one minute before requesting another confirmation email.',
    },
  })
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
  router.post(
    '/auth/resend-confirmation',
    authLimit,
    resendLimit,
    async (req, res) => {
      await auth.resendConfirmation(
        req,
        res,
        validate(confirmationEmailSchema.strict(), req.body),
      )
      res.status(204).end()
    },
  )
  router.get('/auth/callback', async (req, res) => {
    const code = typeof req.query.code === 'string' ? req.query.code : undefined
    const providerError =
      typeof req.query.error_code === 'string'
        ? req.query.error_code
        : typeof req.query.error === 'string'
          ? req.query.error
          : undefined
    const { location } = await auth.callback(req, res, code, providerError)
    res.redirect(303, location)
  })
  router.post('/auth/logout', async (req, res) => {
    await auth.logout(req, res)
    res.status(204).end()
  })
  return router
}

/**
 * Register password changes behind session middleware. Account export belongs
 * to the vault router, not this authentication router.
 */
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
