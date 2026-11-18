/**
 * Vault/export snapshots, reviewed results, profile writes and family management.
 * Keep account identity separate from the selected managed profile.
 */

import { Router } from 'express'
import {
  familyHealthProfileSchema,
  familyMemberSchema,
  profileSchema,
} from '../../shared/schemas.ts'
import { accountExportSchema, vaultSchema } from '../../shared/contracts.ts'
import { medicalBackgroundText } from '../../shared/medical-background.ts'
import type { MedicalBackgroundEntry } from '../../shared/database.types.ts'
import {
  resultReviewRow,
  reviewResultsSchema,
} from '../../shared/record-results.ts'
import {
  databaseResult,
  HttpError,
  validate,
  type RouteContext,
} from './context.ts'

/**
 * Derive compatibility text only when structured medical-background entries are
 * supplied.
 */
function backgroundFields(entries: MedicalBackgroundEntry[] | undefined) {
  return entries === undefined
    ? {}
    : {
        allergies: medicalBackgroundText(entries, 'allergy'),
        conditions: medicalBackgroundText(entries, 'condition'),
      }
}

/**
 * Register account snapshots and profile/result writes through the authenticated
 * client; family selection never supplies a different authenticated owner.
 */
export function vaultRoutes(context: RouteContext) {
  const router = Router()

  router.get('/vault', async (_req, res) => {
    const [data, resultReviews] = await Promise.all([
      databaseResult(res.locals.supabase.rpc('get_account_vault_data')),
      databaseResult(res.locals.supabase.rpc('get_reviewed_results')),
    ])
    res.json(
      vaultSchema.parse({
        ...data,
        resultReviews,
        features: {
          remoteOcrAvailable: !!context.ocrSpaceApiKey,
          emailRemindersConfigured: false,
        },
      }),
    )
  })

  router.get('/account/export', async (_req, res) => {
    const [data, reviews] = await Promise.all([
      databaseResult(res.locals.supabase.rpc('get_account_export_data')),
      databaseResult(res.locals.supabase.rpc('get_reviewed_results')),
    ])
    res.json(
      accountExportSchema.parse({ ...data, record_result_reviews: reviews }),
    )
  })

  router.post('/records/:id/results', async (req, res) => {
    const input = validate(reviewResultsSchema, req.body)
    const result = await res.locals.supabase.rpc('save_reviewed_results', {
      p_record_id: context.requestId(req),
      p_measured_on: input.measured_on,
      p_results: input.results,
      p_confirm_blood_group_change: input.confirm_blood_group_change,
    })
    if (result.error?.code === '22023')
      throw new HttpError(409, result.error.message)
    const row = await databaseResult(Promise.resolve(result))
    res.status(201).json(resultReviewRow.parse(row))
  })

  router.put('/health-profile', async (req, res) => {
    const input = validate(profileSchema.strict(), req.body)
    const row = await databaseResult(
      res.locals.supabase
        .from('health_profiles')
        .upsert(
          {
            ...input,
            ...backgroundFields(input.medical_background),
            user_id: res.locals.user.id,
            date_of_birth: input.date_of_birth || null,
            gender: input.gender || null,
            blood_group: input.blood_group || null,
            height_cm: input.height_cm ? Number(input.height_cm) : null,
            weight_kg: input.weight_kg ? Number(input.weight_kg) : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single(),
    )
    res.json(context.healthProfileRow.parse(row))
  })

  router.post('/family-members', async (req, res) => {
    const input = validate(familyMemberSchema.strict(), req.body)
    if (input.relationship === 'self')
      throw new HttpError(400, 'The account owner profile already exists.')
    res
      .status(201)
      .json(
        await context.save(
          'family_members',
          context.familyMemberRow,
          { ...input, date_of_birth: input.date_of_birth || null },
          res,
        ),
      )
  })

  router.patch('/family-members/:id', async (req, res) => {
    const input = validate(familyMemberSchema.strict(), req.body)
    const id = context.requestId(req)
    const existing = await context.owned(
      'family_members',
      context.familyMemberRow,
      id,
      res,
    )
    if (existing.relationship === 'self' || input.relationship === 'self')
      throw new HttpError(
        400,
        "Edit the account owner's name in the health profile.",
      )
    res.json(
      await context.save(
        'family_members',
        context.familyMemberRow,
        { ...input, date_of_birth: input.date_of_birth || null },
        res,
        id,
      ),
    )
  })

  router.put('/family-members/:id/health-profile', async (req, res) => {
    const input = validate(familyHealthProfileSchema.strict(), req.body)
    const id = context.requestId(req)
    const member = await context.owned(
      'family_members',
      context.familyMemberRow,
      id,
      res,
    )
    if (member.relationship === 'self')
      throw new HttpError(
        400,
        "Edit the account owner's health profile instead.",
      )
    const row = await databaseResult(
      res.locals.supabase
        .from('family_health_profiles')
        .upsert(
          {
            ...input,
            ...backgroundFields(input.medical_background),
            user_id: res.locals.user.id,
            family_member_id: id,
            gender: input.gender || null,
            blood_group: input.blood_group || null,
            height_cm: input.height_cm ? Number(input.height_cm) : null,
            weight_kg: input.weight_kg ? Number(input.weight_kg) : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'family_member_id' },
        )
        .select('*')
        .single(),
    )
    res.json(context.familyHealthProfileRow.parse(row))
  })

  router.delete('/family-members/:id', async (req, res) => {
    const member = await context.owned(
      'family_members',
      context.familyMemberRow,
      context.requestId(req),
      res,
    )
    if (member.relationship === 'self')
      throw new HttpError(400, "The account owner's profile cannot be deleted.")
    await context.remove('family_members', context.familyMemberRow, req, res)
  })

  return router
}
