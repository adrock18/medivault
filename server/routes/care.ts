import { Router } from 'express'
import {
  careTrackSchema,
  careVisitSchema,
  visitFollowUpSchema,
} from '../../shared/schemas.ts'
import { databaseResult, validate, type RouteContext } from './context.ts'

export function careRoutes(context: RouteContext) {
  const router = Router()

  router.post('/care-tracks', async (req, res) => {
    const input = validate(careTrackSchema.strict(), req.body)
    res
      .status(201)
      .json(await context.save('care_tracks', context.careTrackRow, input, res))
  })
  router.patch('/care-tracks/:id', async (req, res) => {
    const input = validate(careTrackSchema.strict(), req.body)
    res.json(
      await context.save(
        'care_tracks',
        context.careTrackRow,
        input,
        res,
        context.requestId(req),
      ),
    )
  })
  router.delete('/care-tracks/:id', (req, res) =>
    context.remove('care_tracks', context.careTrackRow, req, res),
  )

  router.post('/care-visits', async (req, res) => {
    const input = validate(careVisitSchema.strict(), req.body)
    res
      .status(201)
      .json(
        await context.save(
          'care_visits',
          context.careVisitRow,
          { ...input, care_track_id: input.care_track_id || null },
          res,
        ),
      )
  })
  router.patch('/care-visits/:id', async (req, res) => {
    const input = validate(careVisitSchema.strict(), req.body)
    res.json(
      await context.save(
        'care_visits',
        context.careVisitRow,
        { ...input, care_track_id: input.care_track_id || null },
        res,
        context.requestId(req),
      ),
    )
  })
  router.delete('/care-visits/:id', (req, res) =>
    context.remove('care_visits', context.careVisitRow, req, res),
  )

  router.put('/care-visits/:id/follow-up', async (req, res) => {
    const input = validate(visitFollowUpSchema, req.body)
    const row = await databaseResult(
      res.locals.supabase
        .rpc('save_visit_follow_up', {
          p_visit_id: context.requestId(req),
          p_due_date: input.due_date,
          p_instruction: input.instruction,
          p_status: input.status,
          ...(input.source_record_id
            ? { p_source_record_id: input.source_record_id }
            : {}),
          ...(input.status === 'completed' && input.completed_visit_id
            ? { p_completed_visit_id: input.completed_visit_id }
            : {}),
        })
        .single(),
    )
    res.json(context.visitFollowUpRow.parse(row))
  })

  return router
}
