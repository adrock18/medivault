/**
 * Retained reminder-route implementation, currently not mounted by the
 * application. Its presence does not enable scheduled email delivery.
 */

import { createHash, timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import { notificationPreferencesSchema } from '../../shared/schemas.ts'
import {
  databaseResult,
  HttpError,
  validate,
  type RouteContext,
} from './context.ts'

/**
 * Compare fixed-length hashes of the configured scheduler secret and supplied
 * bearer token.
 */
function authorized(secret: string, header: string | undefined) {
  const supplied = header?.startsWith('Bearer ') ? header.slice(7) : ''
  return timingSafeEqual(
    createHash('sha256').update(secret).digest(),
    createHash('sha256').update(supplied).digest(),
  )
}

/**
 * Build the retained preference router; application composition currently leaves
 * it unmounted.
 */
export function privateNotificationRoutes(context: RouteContext) {
  const router = Router()
  router.put('/notification-preferences', async (req, res) => {
    const input = validate(notificationPreferencesSchema, req.body)
    const row = await databaseResult(
      res.locals.supabase
        .from('notification_preferences')
        .upsert(
          {
            ...input,
            user_id: res.locals.user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single(),
    )
    res.json(context.notificationPreferencesRow.parse(row))
  })
  return router
}

/**
 * Build the retained scheduler router with delivery claims and explicit outcomes;
 * it is not an active app endpoint.
 */
export function publicReminderRoutes(context: RouteContext) {
  const router = Router()
  const { admin, reminderEmail } = context
  router.post('/internal/reminders', async (req, res) => {
    if (!reminderEmail)
      throw new HttpError(503, 'Email reminders are not configured.')
    if (!authorized(reminderEmail.cronSecret, req.get('authorization')))
      throw new HttpError(401, 'Invalid scheduler authorization.')
    const now = new Date().toISOString()
    const candidates = await databaseResult(
      admin.rpc('get_due_reminder_candidates', { p_now: now }),
    )
    if (!candidates)
      throw new HttpError(503, 'Reminder candidates could not be loaded.')
    const groups = new Map<string, typeof candidates>()
    for (const candidate of candidates) {
      const key = `${candidate.user_id}:${candidate.scheduled_date}:${candidate.scheduled_time}`
      const group = groups.get(key) ?? []
      group.push(candidate)
      groups.set(key, group)
    }
    let sent = 0
    let failed = 0
    for (const group of groups.values()) {
      const first = group[0]
      const recipient = await admin.auth.admin.getUserById(first.user_id)
      if (recipient.error || !recipient.data.user.email)
        throw new HttpError(
          503,
          'A reminder recipient could not be resolved. Retry the scheduler.',
        )
      const claims: { id: string; attempted_at: string }[] = []
      for (const candidate of group) {
        const claimed = await databaseResult(
          admin.rpc('claim_reminder_delivery', {
            p_user_id: candidate.user_id,
            p_medication_id: candidate.medication_id,
            p_scheduled_date: candidate.scheduled_date,
            p_scheduled_time: candidate.scheduled_time,
            p_attempted_at: now,
          }),
        )
        if (!claimed)
          throw new HttpError(503, 'Reminder delivery could not be claimed.')
        claims.push(...claimed)
      }
      if (!claims.length) continue
      let delivered: boolean
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${reminderEmail.resendApiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `medivault-${first.user_id}-${first.scheduled_date}-${first.scheduled_time.slice(0, 5).replace(':', '')}`,
          },
          body: JSON.stringify({
            from: reminderEmail.from,
            to: [recipient.data.user.email],
            subject: 'Your MediVault medication reminder',
            text: `You have ${claims.length} scheduled dose${claims.length === 1 ? '' : 's'} to review in MediVault. Sign in to view your schedule. This is a reminder only; follow your clinician's instructions.`,
          }),
          signal: AbortSignal.timeout(10_000),
        })
        delivered = response.ok
      } catch {
        delivered = false
      }
      for (const claim of claims) {
        const completed = await databaseResult(
          admin.rpc('complete_reminder_delivery', {
            p_id: claim.id,
            p_attempted_at: claim.attempted_at,
            p_delivered: delivered,
          }),
        )
        if (!completed)
          throw new HttpError(
            409,
            'A reminder claim expired before completion. Retry the scheduler.',
          )
      }
      if (delivered) sent++
      else failed++
    }
    res.json({ sent, failed })
  })
  return router
}
