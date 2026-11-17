import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { notificationPreferencesSchema } from '../../shared/schemas.ts'
import { many, one, transaction } from '../database.ts'
import { HttpError, validate, type RouteContext } from './context.ts'

const userRow = z.object({
  user_id: z.uuid(),
  email: z.email(),
  timezone: z.string(),
})
const deliveryRow = z.object({
  id: z.uuid(),
  status: z.enum(['sending', 'sent', 'failed']),
  attempted_at: z.string(),
})
const dueRow = z.object({ id: z.uuid() })
function localSlot(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  )
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  }
}

function authorized(secret: string, header: string | undefined) {
  const supplied = header?.startsWith('Bearer ')
    ? header.slice('Bearer '.length)
    : ''
  const expectedHash = createHash('sha256').update(secret).digest()
  const suppliedHash = createHash('sha256').update(supplied).digest()
  return timingSafeEqual(expectedHash, suppliedHash)
}

export function privateNotificationRoutes(context: RouteContext) {
  const router = Router()
  const { db } = context

  router.put('/notification-preferences', (req, res) => {
    const input = validate(notificationPreferencesSchema, req.body)
    const userId = res.locals.user.id
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO notification_preferences(user_id,email_reminders_enabled,timezone,created_at,updated_at)
       VALUES (?,?,?,?,?)
       ON CONFLICT(user_id) DO UPDATE SET
         email_reminders_enabled=excluded.email_reminders_enabled,
         timezone=excluded.timezone,
         updated_at=excluded.updated_at`,
    ).run(
      userId,
      input.email_reminders_enabled ? 1 : 0,
      input.timezone,
      now,
      now,
    )
    res.json(
      one(
        db,
        context.notificationPreferencesRow,
        'SELECT * FROM notification_preferences WHERE user_id=?',
        [userId],
      ),
    )
  })

  return router
}

export function publicReminderRoutes(context: RouteContext) {
  const router = Router()
  const { db, reminderEmail } = context

  router.post('/internal/reminders', async (req, res) => {
    if (!reminderEmail)
      throw new HttpError(503, 'Email reminders are not configured.')
    if (!authorized(reminderEmail.cronSecret, req.get('authorization')))
      throw new HttpError(401, 'Invalid scheduler authorization.')

    const now = new Date()
    const nowText = now.toISOString()
    const users = many(
      db,
      userRow,
      `SELECT p.user_id,u.email,p.timezone
       FROM notification_preferences p JOIN users u ON u.id=p.user_id
       WHERE p.email_reminders_enabled=1`,
    )
    const groups = new Map<
      string,
      {
        userId: string
        email: string
        date: string
        time: string
        medicationIds: Set<string>
      }
    >()

    for (const user of users) {
      for (let minutesAgo = 0; minutesAgo < 5; minutesAgo++) {
        const slot = localSlot(
          new Date(now.getTime() - minutesAgo * 60_000),
          user.timezone,
        )
        const due = many(
          db,
          dueRow,
          `SELECT m.id FROM medications m
           WHERE m.user_id=? AND m.start_date<=?
             AND (m.end_date IS NULL OR m.end_date>=?)
             AND EXISTS(SELECT 1 FROM json_each(m.times) WHERE value=?)
             AND NOT EXISTS(
               SELECT 1 FROM medication_logs l
               WHERE l.medication_id=m.id AND l.scheduled_date=? AND l.scheduled_time=?
             )`,
          [user.user_id, slot.date, slot.date, slot.time, slot.date, slot.time],
        )
        if (!due.length) continue
        const key = `${user.user_id}:${slot.date}:${slot.time}`
        const group = groups.get(key) ?? {
          userId: user.user_id,
          email: user.email,
          date: slot.date,
          time: slot.time,
          medicationIds: new Set<string>(),
        }
        due.forEach(({ id }) => group.medicationIds.add(id))
        groups.set(key, group)
      }
    }

    let sent = 0
    let failed = 0
    for (const group of groups.values()) {
      const deliveryIds = transaction(db, () => {
        const claimed: string[] = []
        for (const medicationId of group.medicationIds) {
          const existing = one(
            db,
            deliveryRow,
            `SELECT id,status,attempted_at FROM reminder_deliveries
             WHERE medication_id=? AND scheduled_date=? AND scheduled_time=?`,
            [medicationId, group.date, group.time],
          )
          if (existing?.status === 'sent') continue
          if (
            existing?.status === 'sending' &&
            now.getTime() - Date.parse(existing.attempted_at) < 55_000
          )
            continue
          if (existing) {
            db.prepare(
              "UPDATE reminder_deliveries SET status='sending',attempted_at=?,updated_at=? WHERE id=?",
            ).run(nowText, nowText, existing.id)
            claimed.push(existing.id)
          } else {
            const id = randomUUID()
            db.prepare(
              `INSERT INTO reminder_deliveries
               (id,user_id,medication_id,scheduled_date,scheduled_time,status,attempted_at,created_at,updated_at)
               VALUES (?,?,?,?,?,'sending',?,?,?)`,
            ).run(
              id,
              group.userId,
              medicationId,
              group.date,
              group.time,
              nowText,
              nowText,
              nowText,
            )
            claimed.push(id)
          }
        }
        return claimed
      })
      if (!deliveryIds.length) continue

      let delivered = false
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${reminderEmail.resendApiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `medivault-${group.userId}-${group.date}-${group.time.replace(':', '')}`,
          },
          body: JSON.stringify({
            from: reminderEmail.from,
            to: [group.email],
            subject: 'Your MediVault medication reminder',
            text: `You have ${deliveryIds.length} scheduled dose${deliveryIds.length === 1 ? '' : 's'} to review in MediVault. Sign in to view your schedule. This is a reminder only; follow your clinician's instructions.`,
          }),
          signal: AbortSignal.timeout(10_000),
        })
        delivered = response.ok
      } catch {
        delivered = false
      }
      const status = delivered ? 'sent' : 'failed'
      const update = db.prepare(
        "UPDATE reminder_deliveries SET status=?,updated_at=? WHERE id=? AND status='sending' AND attempted_at=?",
      )
      transaction(db, () => {
        for (const id of deliveryIds) update.run(status, nowText, id, nowText)
      })
      if (delivered) sent++
      else failed++
    }
    res.json({ sent, failed })
  })

  return router
}
