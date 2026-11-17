import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { calendarDateSchema, medicationSchema } from '../../shared/schemas.ts'
import { doseLogRow } from '../../shared/contracts.ts'
import { storedMedication, storedRecord } from '../database.ts'
import { HttpError, requestId, validate, type RouteContext } from './context.ts'

/** Register medication CRUD and explicit taken/skipped dose outcomes. */
export function medicationRoutes(context: RouteContext) {
  const router = Router()

  function saveMedication(req: Request, res: Response, id?: string) {
    const input = validate(medicationSchema.strict(), req.body)
    const previous = id
      ? context.owned('medications', storedMedication, id, res.locals.user.id)
      : null
    context.owned(
      'family_members',
      context.familyMemberRow,
      input.family_member_id,
      res.locals.user.id,
    )
    if (input.source_record_id) {
      const record = context.owned(
        'medical_records',
        storedRecord,
        input.source_record_id,
        res.locals.user.id,
      )
      if (record.family_member_id !== input.family_member_id)
        throw new HttpError(
          400,
          'Link a prescription record from the same family profile.',
        )
    }
    return context.save(
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

  router.post('/medications', (req, res) => {
    res.status(201).json(saveMedication(req, res))
  })

  router.patch('/medications/:id', (req, res) => {
    res.json(saveMedication(req, res, requestId(req)))
  })

  router.delete('/medications/:id', (req, res) =>
    context.remove('medications', storedMedication, req, res),
  )

  const logInput = z
    .object({
      medication_id: z.uuid(),
      scheduled_date: calendarDateSchema,
      scheduled_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      status: z.enum(['taken', 'skipped']),
    })
    .strict()

  router.post('/dose-logs', (req, res) => {
    const input = validate(logInput, req.body)
    const med = context.owned(
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
    const row = context.save(
      'medication_logs',
      doseLogRow,
      { ...input, logged_at: new Date().toISOString() },
      res.locals.user.id,
    )
    res.status(201).json(row)
  })

  router.patch('/dose-logs/:id', (req, res) => {
    const input = validate(
      z.object({ status: z.enum(['taken', 'skipped']) }).strict(),
      req.body,
    )
    res.json(
      context.save(
        'medication_logs',
        doseLogRow,
        { ...input, logged_at: new Date().toISOString() },
        res.locals.user.id,
        requestId(req),
      ),
    )
  })

  router.delete('/dose-logs/:id', (req, res) =>
    context.remove('medication_logs', doseLogRow, req, res),
  )

  return router
}
