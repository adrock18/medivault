import type { Request, Response } from 'express'
import type { CookieMethodsServer } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import type { SupabaseSettings } from './config.ts'
import type { AuthCookieOptions, AuthGateway } from './auth-gateway.ts'
import {
  createRequestSupabaseClient,
  createVerificationSupabaseClient,
} from './supabase.ts'
import { HttpError } from './routes/context.ts'

function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object')
    return { status: undefined, code: undefined, name: undefined }
  const value = error as {
    status?: unknown
    code?: unknown
    name?: unknown
    message?: unknown
  }
  return {
    status: typeof value.status === 'number' ? value.status : undefined,
    code: typeof value.code === 'string' ? value.code : undefined,
    name: typeof value.name === 'string' ? value.name : undefined,
    message: typeof value.message === 'string' ? value.message : undefined,
  }
}

function isInvalidSession(error: unknown) {
  const { status, code, name, message } = errorDetails(error)
  return (
    status === 401 ||
    (status === 400 &&
      code === 'validation_failed' &&
      /refresh token.*not valid/i.test(message ?? '')) ||
    name === 'AuthSessionMissingError' ||
    [
      'auth_session_missing',
      'invalid_grant',
      'invalid_token',
      'refresh_token_not_found',
      'refresh_token_already_used',
      'session_expired',
      'session_not_found',
      'token_expired',
    ].includes(code ?? '')
  )
}

function isTransportFailure(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      ['AbortError', 'TimeoutError'].includes(error.name))
  )
}

function isUnavailable(error: unknown) {
  const { status } = errorDetails(error)
  return status === undefined || status === 0 || status === 429 || status >= 500
}

async function runAuthRequest<T>(
  request: { discardCookies(): void },
  operation: () => PromiseLike<T>,
) {
  try {
    return await operation()
  } catch (error) {
    request.discardCookies()
    if (isTransportFailure(error)) throw unavailable()
    throw error
  }
}

function unavailable() {
  return new HttpError(
    503,
    'Authentication is temporarily unavailable. Please try again.',
  )
}

function callbackOrigin(req: Request, settings: SupabaseSettings) {
  if (settings.appOrigin) return settings.appOrigin
  let origin: URL
  try {
    origin = new URL(`${req.protocol}://${req.get('host')}`)
  } catch {
    throw new HttpError(
      400,
      'A valid loopback application origin is required for confirmation.',
    )
  }
  if (
    origin.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
  )
    throw new HttpError(
      400,
      'A valid loopback application origin is required for confirmation.',
    )
  return origin.origin
}

function isMissingVerifier(error: unknown) {
  const { code, name, message } = errorDetails(error)
  return (
    code === 'flow_state_not_found' ||
    code === 'code_verifier_not_found' ||
    name === 'AuthPKCECodeVerifierMissingError' ||
    /code verifier.*not found/i.test(message ?? '')
  )
}

export function createSupabaseAuthGateway(
  settings: SupabaseSettings,
  cookieOptions: AuthCookieOptions,
): AuthGateway {
  function createRequest(req: Request, res: Response) {
    let pendingCookies: Parameters<
      NonNullable<CookieMethodsServer['setAll']>
    >[0] = []
    const cookieMethods: CookieMethodsServer = {
      getAll: () =>
        Object.entries(req.cookies ?? {}).map(([name, value]) => ({
          name,
          value,
        })),
      setAll: (cookiesToSet, headers) => {
        pendingCookies = cookiesToSet
        for (const [name, value] of Object.entries(headers))
          res.setHeader(name, value)
      },
    }
    const client = createRequestSupabaseClient(settings, cookieMethods)

    return {
      client,
      commitCookies() {
        for (const { name, value, options } of pendingCookies)
          res.cookie(name, value, {
            ...options,
            ...(options.maxAge === undefined
              ? {}
              : { maxAge: options.maxAge * 1000 }),
          })
      },
      discardCookies() {
        pendingCookies = []
      },
      clearLegacyCookie() {
        if (req.cookies?.medivault_session !== undefined)
          res.clearCookie('medivault_session', cookieOptions)
      },
    }
  }

  async function sessionUser(
    request: ReturnType<typeof createRequest>,
    user: User,
  ) {
    const { data: profile, error } = await runAuthRequest(request, () =>
      request.client
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle(),
    )

    if (error || !profile || !user.email) throw unavailable()
    return { id: user.id, email: user.email, full_name: profile.full_name }
  }

  return {
    async getSession(req, res) {
      const request = createRequest(req, res)
      request.clearLegacyCookie()
      const { data, error } = await runAuthRequest(request, () =>
        request.client.auth.getUser(),
      )
      if (error) {
        if (isInvalidSession(error)) {
          request.commitCookies()
          return null
        }
        request.discardCookies()
        throw unavailable()
      }
      if (!data.user) {
        request.commitCookies()
        return null
      }

      const user = await sessionUser(request, data.user)
      res.locals.supabase = request.client
      request.commitCookies()
      return user
    },

    async register(req, res, input) {
      const request = createRequest(req, res)
      request.clearLegacyCookie()
      const emailRedirectTo = new URL(
        '/api/auth/callback',
        callbackOrigin(req, settings),
      ).toString()
      const { data, error } = await runAuthRequest(request, () =>
        request.client.auth.signUp({
          email: input.email.trim().toLowerCase(),
          password: input.password,
          options: {
            data: { full_name: input.full_name },
            emailRedirectTo,
          },
        }),
      )
      if (error) {
        request.discardCookies()
        const details = errorDetails(error)
        if (details.code === 'over_email_send_rate_limit')
          throw new HttpError(
            429,
            'The confirmation email limit has been reached. Please wait before trying again.',
          )
        if (details.status === 429)
          throw new HttpError(
            429,
            'Too many sign-up attempts. Please wait before trying again.',
          )
        if (isUnavailable(error)) throw unavailable()
        if (details.code === 'user_already_exists')
          throw new HttpError(409, 'An account with that email already exists.')
        if (details.code === 'email_address_invalid')
          throw new HttpError(
            400,
            'Enter a valid email address that can receive confirmation emails.',
          )
        throw new HttpError(
          400,
          'Unable to create an account with those details.',
        )
      }
      if (!data.session || !data.user) {
        request.commitCookies()
        return { confirmation_required: true }
      }

      const user = await sessionUser(request, data.user)
      request.commitCookies()
      return { user }
    },

    async resendConfirmation(req, res, input) {
      const request = createRequest(req, res)
      request.clearLegacyCookie()
      const { error } = await runAuthRequest(request, () =>
        request.client.auth.resend({
          type: 'signup',
          email: input.email.trim().toLowerCase(),
          options: {
            emailRedirectTo: new URL(
              '/api/auth/callback',
              callbackOrigin(req, settings),
            ).toString(),
          },
        }),
      )
      if (error) {
        request.discardCookies()
        const details = errorDetails(error)
        if (
          details.code === 'user_not_found' ||
          details.code === 'email_already_confirmed'
        )
          return
        if (
          details.code === 'over_email_send_rate_limit' ||
          details.code === 'over_request_rate_limit' ||
          details.status === 429
        )
          throw new HttpError(
            429,
            'The confirmation email limit has been reached. Please wait before trying again.',
          )
        if (isUnavailable(error)) throw unavailable()
        throw new HttpError(
          400,
          'Unable to request a confirmation email. Please try again or contact the project administrator.',
        )
      }
      request.commitCookies()
    },

    async login(req, res, input) {
      const request = createRequest(req, res)
      request.clearLegacyCookie()
      const { data, error } = await runAuthRequest(request, () =>
        request.client.auth.signInWithPassword({
          email: input.email.trim().toLowerCase(),
          password: input.password,
        }),
      )
      if (error) {
        request.discardCookies()
        const details = errorDetails(error)
        if (details.code === 'email_not_confirmed')
          throw new HttpError(
            400,
            'Confirm your email before signing in. Use Resend confirmation email if you need a new link.',
          )
        if (isUnavailable(error)) throw unavailable()
        if (
          details.code === 'invalid_credentials' ||
          details.code === 'user_not_found' ||
          details.status === 401
        )
          throw new HttpError(401, 'Invalid email or password.')
        throw new HttpError(400, 'Unable to sign in with those credentials.')
      }
      if (!data.session || !data.user) {
        request.discardCookies()
        throw new HttpError(401, 'Invalid email or password.')
      }

      const user = await sessionUser(request, data.user)
      request.commitCookies()
      return { user }
    },

    async logout(req, res) {
      const request = createRequest(req, res)
      request.clearLegacyCookie()
      const { error } = await runAuthRequest(request, () =>
        request.client.auth.signOut({ scope: 'local' }),
      )
      if (error && !isInvalidSession(error)) {
        request.discardCookies()
        throw unavailable()
      }
      request.commitCookies()
    },

    async changePassword(req, res, input) {
      const request = createRequest(req, res)
      const verifier = createVerificationSupabaseClient(settings)
      const verification = await runAuthRequest(request, () =>
        verifier.auth.signInWithPassword({
          email: res.locals.user.email,
          password: input.current_password,
        }),
      )
      if (verification.error) {
        if (isUnavailable(verification.error)) throw unavailable()
        throw new HttpError(400, 'Your current password is incorrect.')
      }
      const cleanup = await runAuthRequest(request, () =>
        verifier.auth.signOut({ scope: 'local' }),
      )
      if (cleanup.error)
        throw new HttpError(
          503,
          'Password verification could not be completed securely. Please try again.',
        )

      const updated = await runAuthRequest(request, () =>
        request.client.auth.updateUser({ password: input.password }),
      )
      if (updated.error) {
        request.discardCookies()
        if (isUnavailable(updated.error)) throw unavailable()
        throw new HttpError(
          400,
          'The password could not be changed. Use a different password or sign in again.',
        )
      }
      request.commitCookies()
      try {
        const revoked = await request.client.auth.signOut({ scope: 'others' })
        if (!revoked.error) return
      } catch {
        // The password has changed even when revoking other sessions fails.
      }
      throw new HttpError(
        503,
        'Your password changed, but other sessions could not be signed out. Sign in with the new password and try again.',
      )
    },

    async callback(req, res, code, providerError) {
      const origin = callbackOrigin(req, settings)
      const request = createRequest(req, res)
      request.clearLegacyCookie()
      const loginLocation = (authStatus: string) => {
        const url = new URL('/login', origin)
        url.searchParams.set('auth', authStatus)
        return url.toString()
      }
      if (providerError) {
        request.discardCookies()
        return {
          location: loginLocation(
            providerError === 'otp_expired'
              ? 'confirmation-expired'
              : 'confirmation-failed',
          ),
        }
      }
      if (!code) {
        request.commitCookies()
        return { location: loginLocation('confirmation-missing-code') }
      }

      let result: Awaited<
        ReturnType<typeof request.client.auth.exchangeCodeForSession>
      >
      try {
        result = await runAuthRequest(request, () =>
          request.client.auth.exchangeCodeForSession(code),
        )
      } catch (error) {
        if (error instanceof HttpError && error.status === 503)
          return { location: loginLocation('confirmation-unavailable') }
        throw error
      }
      if (result.error) {
        if (isMissingVerifier(result.error)) {
          request.commitCookies()
          return {
            location: loginLocation('confirmation-missing-verifier'),
          }
        }
        if (isUnavailable(result.error)) {
          request.discardCookies()
          return { location: loginLocation('confirmation-unavailable') }
        }
        request.commitCookies()
        return { location: loginLocation('confirmation-expired') }
      }
      if (!result.data.session || !result.data.user) {
        request.commitCookies()
        return { location: loginLocation('confirmation-expired') }
      }

      request.commitCookies()
      return { location: new URL('/dashboard', origin).toString() }
    },
  }
}
