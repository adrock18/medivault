import { Router } from 'express'
import { careTrackSchema, careVisitSchema } from '../../shared/schemas.ts'
import { transaction } from '../database.ts'
import { HttpError, validate, type RouteContext } from './context.ts'

/** Register owner- and family-profile-scoped care organization mutations. */
export function careRoutes(context: RouteContext) {
  const router = Router()

  function validateProfile(memberId: string, userId: string) {
    context.owned('family_members', context.familyMemberRow, memberId, userId)
  }

  router.post('/care-tracks', (req, res) => {
    const input = validate(careTrackSchema.strict(), req.body)
    const userId = res.locals.user.id
    validateProfile(input.family_member_id, userId)
    res
      .status(201)
      .json(context.save('care_tracks', context.careTrackRow, input, userId))
  })

  router.patch('/care-tracks/:id', (req, res) => {
    const input = validate(careTrackSchema.strict(), req.body)
    const userId = res.locals.user.id
    validateProfile(input.family_member_id, userId)
    res.json(
      context.save(
        'care_tracks',
        context.careTrackRow,
        input,
        userId,
        context.requestId(req),
      ),
    )
  })

  router.delete('/care-tracks/:id', (req, res) => {
    const userId = res.locals.user.id
    const id = context.requestId(req)
    context.owned('care_tracks', context.careTrackRow, id, userId)
    transaction(context.db, () => {
      context.db
        .prepare(
          'UPDATE care_visits SET care_track_id=NULL,updated_at=? WHERE care_track_id=? AND user_id=?',
        )
        .run(new Date().toISOString(), id, userId)
      context.db
        .prepare('DELETE FROM care_tracks WHERE id=? AND user_id=?')
        .run(id, userId)
    })
    res.status(204).end()
  })

  router.post('/care-visits', (req, res) => {
    const input = validate(careVisitSchema.strict(), req.body)
    const userId = res.locals.user.id
    validateProfile(input.family_member_id, userId)
    if (input.care_track_id) {
      const track = context.owned(
        'care_tracks',
        context.careTrackRow,
        input.care_track_id,
        userId,
      )
      if (track.family_member_id !== input.family_member_id)
        throw new HttpError(
          400,
          'Choose a care track for the selected family profile.',
        )
    }
    res
      .status(201)
      .json(
        context.save(
          'care_visits',
          context.careVisitRow,
          { ...input, care_track_id: input.care_track_id || null },
          userId,
        ),
      )
  })

  router.patch('/care-visits/:id', (req, res) => {
    const input = validate(careVisitSchema.strict(), req.body)
    const userId = res.locals.user.id
    validateProfile(input.family_member_id, userId)
    if (input.care_track_id) {
      const track = context.owned(
        'care_tracks',
        context.careTrackRow,
        input.care_track_id,
        userId,
      )
      if (track.family_member_id !== input.family_member_id)
        throw new HttpError(
          400,
          'Choose a care track for the selected family profile.',
        )
    }
    res.json(
      context.save(
        'care_visits',
        context.careVisitRow,
        { ...input, care_track_id: input.care_track_id || null },
        userId,
        context.requestId(req),
      ),
    )
  })

  router.delete('/care-visits/:id', (req, res) =>
    context.remove('care_visits', context.careVisitRow, req, res),
  )

  return router
}
