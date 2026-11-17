import { Router } from 'express'
import { z } from 'zod'
import { familyMemberSchema, profileSchema } from '../../shared/schemas.ts'
import { many, one, transaction } from '../database.ts'
import { HttpError, validate, type RouteContext } from './context.ts'

/** Register the account's aggregated vault and health-profile endpoints. */
export function vaultRoutes(context: RouteContext) {
  const router = Router()
  const { db } = context

  router.get('/vault', (_req, res) => {
    const id = res.locals.user.id
    const profile = one(
      db,
      context.profileRow,
      'SELECT * FROM profiles WHERE id=?',
      [id],
    )
    if (!profile) throw new Error('The account profile is missing.')
    res.json({
      profile,
      notificationPreferences: one(
        db,
        context.notificationPreferencesRow,
        'SELECT * FROM notification_preferences WHERE user_id=?',
        [id],
      ),
      features: {
        remoteOcrAvailable: !!context.ocrSpaceApiKey,
        emailRemindersConfigured: !!context.reminderEmail,
      },
      familyMembers: many(
        db,
        context.familyMemberRow,
        'SELECT * FROM family_members WHERE user_id=? ORDER BY created_at,id',
        [id],
      ),
      healthProfile: one(
        db,
        context.healthProfileRow,
        'SELECT * FROM health_profiles WHERE user_id=?',
        [id],
      ),
      records: many(
        db,
        context.storedRecord,
        'SELECT * FROM medical_records WHERE user_id=? ORDER BY created_at DESC,id',
        [id],
      ),
      medications: many(
        db,
        context.storedMedication,
        'SELECT * FROM medications WHERE user_id=? ORDER BY created_at DESC,id',
        [id],
      ),
      logs: many(
        db,
        context.doseLogRow,
        'SELECT * FROM medication_logs WHERE user_id=? ORDER BY scheduled_date DESC,scheduled_time DESC,id',
        [id],
      ),
      careTracks: many(
        db,
        context.careTrackRow,
        'SELECT * FROM care_tracks WHERE user_id=? ORDER BY created_at DESC,id',
        [id],
      ),
      visits: many(
        db,
        context.careVisitRow,
        'SELECT * FROM care_visits WHERE user_id=? ORDER BY visit_date DESC,id',
        [id],
      ),
    })
  })

  router.get('/account/export', (_req, res) => {
    const id = res.locals.user.id
    const profile = one(
      db,
      context.profileRow,
      'SELECT * FROM profiles WHERE id=?',
      [id],
    )
    if (!profile) throw new Error('The account profile is missing.')
    res.json({
      exported_at: new Date().toISOString(),
      profile,
      family_members: many(
        db,
        context.familyMemberRow,
        'SELECT * FROM family_members WHERE user_id=? ORDER BY created_at,id',
        [id],
      ),
      health_profile: one(
        db,
        context.healthProfileRow,
        'SELECT * FROM health_profiles WHERE user_id=?',
        [id],
      ),
      medical_records: many(
        db,
        context.storedRecord,
        'SELECT * FROM medical_records WHERE user_id=? ORDER BY record_date DESC,id',
        [id],
      ),
      medications: many(
        db,
        context.storedMedication,
        'SELECT * FROM medications WHERE user_id=? ORDER BY created_at DESC,id',
        [id],
      ),
      medication_logs: many(
        db,
        context.doseLogRow,
        'SELECT * FROM medication_logs WHERE user_id=? ORDER BY scheduled_date DESC,scheduled_time DESC,id',
        [id],
      ),
      care_tracks: many(
        db,
        context.careTrackRow,
        'SELECT * FROM care_tracks WHERE user_id=? ORDER BY created_at DESC,id',
        [id],
      ),
      care_visits: many(
        db,
        context.careVisitRow,
        'SELECT * FROM care_visits WHERE user_id=? ORDER BY visit_date DESC,id',
        [id],
      ),
      archived_health_metrics: many(
        db,
        context.archivedHealthMetricRow,
        'SELECT * FROM health_metrics WHERE user_id=? ORDER BY measured_at DESC,id',
        [id],
      ),
    })
  })

  router.put('/health-profile', (req, res) => {
    const input = validate(profileSchema.strict(), req.body)
    const userId = res.locals.user.id
    const existing = one(
      db,
      context.healthProfileRow,
      'SELECT * FROM health_profiles WHERE user_id=?',
      [userId],
    )
    const result = transaction(db, () => {
      const row = context.save(
        'health_profiles',
        context.healthProfileRow,
        {
          ...input,
          date_of_birth: input.date_of_birth || null,
          gender: input.gender || null,
          blood_group: input.blood_group || null,
          height_cm: input.height_cm ? Number(input.height_cm) : null,
          weight_kg: input.weight_kg ? Number(input.weight_kg) : null,
        },
        userId,
        existing?.id,
      )
      db.prepare('UPDATE profiles SET full_name=?,updated_at=? WHERE id=?').run(
        input.full_name,
        row.updated_at,
        userId,
      )
      db.prepare(
        'UPDATE family_members SET full_name=?,updated_at=? WHERE id=? AND user_id=? AND relationship=?',
      ).run(input.full_name, row.updated_at, userId, userId, 'self')
      return row
    })
    res.json(result)
  })

  router.post('/family-members', (req, res) => {
    const input = validate(familyMemberSchema.strict(), req.body)
    if (input.relationship === 'self')
      throw new HttpError(400, 'The account owner profile already exists.')
    res
      .status(201)
      .json(
        context.save(
          'family_members',
          context.familyMemberRow,
          { ...input, date_of_birth: input.date_of_birth || null },
          res.locals.user.id,
        ),
      )
  })

  router.patch('/family-members/:id', (req, res) => {
    const input = validate(familyMemberSchema.strict(), req.body)
    const id = context.requestId(req)
    const existing = context.owned(
      'family_members',
      context.familyMemberRow,
      id,
      res.locals.user.id,
    )
    if (existing.relationship === 'self')
      throw new HttpError(
        400,
        "Edit the account owner's name in the health profile.",
      )
    res.json(
      context.save(
        'family_members',
        context.familyMemberRow,
        { ...input, date_of_birth: input.date_of_birth || null },
        res.locals.user.id,
        id,
      ),
    )
  })

  router.delete('/family-members/:id', (req, res) => {
    const id = context.requestId(req)
    const userId = res.locals.user.id
    transaction(db, () => {
      const existing = context.owned(
        'family_members',
        context.familyMemberRow,
        id,
        userId,
      )
      if (existing.relationship === 'self')
        throw new HttpError(
          400,
          "The account owner's profile cannot be deleted.",
        )
      const usage = one(
        db,
        z.object({ has_dependents: z.union([z.literal(0), z.literal(1)]) }),
        `SELECT EXISTS(
          SELECT 1 FROM medical_records WHERE family_member_id=? AND user_id=?
          UNION ALL SELECT 1 FROM medications WHERE family_member_id=? AND user_id=?
          UNION ALL SELECT 1 FROM health_metrics WHERE family_member_id=? AND user_id=?
          UNION ALL SELECT 1 FROM care_tracks WHERE family_member_id=? AND user_id=?
          UNION ALL SELECT 1 FROM care_visits WHERE family_member_id=? AND user_id=?
        ) AS has_dependents`,
        [id, userId, id, userId, id, userId, id, userId, id, userId],
      )
      if (usage?.has_dependents)
        throw new HttpError(
          409,
          'This profile still has related health data. Remove its records, medications, care tracks, and visits first. Archived measurements are retained in the account export and prevent profile deletion.',
        )
      db.prepare('DELETE FROM family_members WHERE id=? AND user_id=?').run(
        id,
        userId,
      )
    })
    res.status(204).end()
  })

  return router
}
