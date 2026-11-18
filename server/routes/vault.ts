import { Router } from 'express'
import {
  familyHealthProfileSchema,
  familyMemberSchema,
  profileSchema,
} from '../../shared/schemas.ts'
import { accountExportSchema, vaultSchema } from '../../shared/contracts.ts'
import {
  databaseResult,
  HttpError,
  validate,
  type RouteContext,
} from './context.ts'

export function vaultRoutes(context: RouteContext) {
  const router = Router()

  router.get('/vault', async (_req, res) => {
    const data = await databaseResult(
      res.locals.supabase.rpc('get_account_vault_data'),
    )
    res.json(
      vaultSchema.parse({
        ...data,
        features: {
          remoteOcrAvailable: !!context.ocrSpaceApiKey,
          emailRemindersConfigured: !!context.reminderEmail,
        },
      }),
    )
  })

  router.get('/account/export', async (_req, res) => {
    res.json(
      accountExportSchema.parse(
        await databaseResult(
          res.locals.supabase.rpc('get_account_export_data'),
        ),
      ),
    )
  })

  router.put('/health-profile', async (req, res) => {
    const input = validate(profileSchema.strict(), req.body)
    const row = await databaseResult(
      res.locals.supabase
        .from('health_profiles')
        .upsert(
          {
            ...input,
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
