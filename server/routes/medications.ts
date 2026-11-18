import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { calendarDateSchema, medicationSchema } from '../../shared/schemas.ts'
import { doseLogRow } from '../../shared/contracts.ts'
import { HttpError, requestId, validate, type RouteContext } from './context.ts'

/** Register medication CRUD and explicit taken/skipped dose outcomes. */
export function medicationRoutes(context: RouteContext) {
  const router = Router()
  const { storedMedication, storedRecord } = context

  async function saveMedication(req: Request, res: Response, id?: string) {
    const input = validate(medicationSchema.strict(), req.body)
    const previous = id
      ? await context.owned('medications', storedMedication, id, res)
      : null
    await context.owned(
      'family_members',
      context.familyMemberRow,
      input.family_member_id,
      res,
    )
    if (input.source_record_id) {
      const record = await context.owned(
        'medical_records',
        storedRecord,
        input.source_record_id,
        res,
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
        times: input.times
          .split(',')
          .map((time) => time.trim())
          .sort(),
        end_date: input.end_date || null,
      },
      res,
      id,
    )
  }

  router.post('/medications', async (req, res) => {
    res.status(201).json(await saveMedication(req, res))
  })

  router.patch('/medications/:id', async (req, res) => {
    res.json(await saveMedication(req, res, requestId(req)))
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

  router.post('/dose-logs', async (req, res) => {
    const input = validate(logInput, req.body)
    const med = await context.owned(
      'medications',
      storedMedication,
      input.medication_id,
      res,
    )
    if (
      input.scheduled_date < med.start_date ||
      (med.end_date && input.scheduled_date > med.end_date) ||
      !med.times.some((time) => time.slice(0, 5) === input.scheduled_time)
    )
      throw new HttpError(
        400,
        'This dose is not part of the medication schedule.',
      )
    const row = await context.save(
      'medication_logs',
      doseLogRow,
      { ...input, logged_at: new Date().toISOString() },
      res,
    )
    res.status(201).json(row)
  })

  router.patch('/dose-logs/:id', async (req, res) => {
    const input = validate(
      z.object({ status: z.enum(['taken', 'skipped']) }).strict(),
      req.body,
    )
    res.json(
      await context.update(
        'medication_logs',
        doseLogRow,
        { ...input, logged_at: new Date().toISOString() },
        res,
        requestId(req),
      ),
    )
  })

  router.delete('/dose-logs/:id', (req, res) =>
    context.remove('medication_logs', doseLogRow, req, res),
  )

  return router
}
