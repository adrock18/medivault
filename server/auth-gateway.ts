import type { Request, Response } from 'express'
import type { z } from 'zod'
import type { RegistrationResult, Session } from '../shared/contracts.ts'
import {
  loginSchema,
  passwordSchema,
  registerSchema,
} from '../shared/schemas.ts'

export type AuthCookieOptions = {
  readonly httpOnly: true
  readonly sameSite: 'lax'
  readonly secure: boolean
  readonly path: '/api'
}

export type AuthGateway = {
  getSession(req: Request, res: Response): Promise<Session['user'] | null>
  register(
    req: Request,
    res: Response,
    input: z.infer<typeof registerSchema>,
  ): Promise<RegistrationResult>
  login(
    req: Request,
    res: Response,
    input: z.infer<typeof loginSchema>,
  ): Promise<Session>
  logout(req: Request, res: Response): Promise<void>
  changePassword(
    req: Request,
    res: Response,
    input: z.infer<typeof passwordSchema>,
  ): Promise<void>
  callback(
    req: Request,
    res: Response,
    code: string | undefined,
  ): Promise<{ location: string }>
}

export type AuthGatewayFactory = (cookies: AuthCookieOptions) => AuthGateway
