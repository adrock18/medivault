import type { Request, Response, RequestHandler } from 'express'
import multer from 'multer'
import { z } from 'zod'
import * as contracts from '../../shared/contracts.ts'
import { MAX_FILE_SIZE } from '../../shared/documents.ts'
import type { TablesInsert, TablesUpdate } from '../supabase.types.ts'
import type { DocumentStore } from '../document-store.ts'
import type { ReminderEmailSettings } from '../config.ts'
import type { AuthGateway } from '../auth-gateway.ts'
import type { createAdminSupabaseClient } from '../supabase.ts'

export class HttpError extends Error {
  status: number
  code?: string
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const requestFailure =
  'The server could not complete this request. Please try again.'

type DocumentOperation =
  | 'upload'
  | 'upload-metadata'
  | 'upload-cleanup'
  | 'download'
  | 'download-missing'
  | 'download-stream'
  | 'delete-object'
  | 'delete-metadata'

export class DocumentOperationError extends HttpError {
  operation: DocumentOperation
  recordId?: string
  constructor(
    operation: DocumentOperation,
    status: number,
    message: string,
    recordId?: string,
  ) {
    super(status, message)
    this.operation = operation
    this.recordId = recordId
  }
}

type OwnedTable =
  | 'health_profiles'
  | 'family_members'
  | 'medical_records'
  | 'medications'
  | 'medication_logs'
  | 'care_tracks'
  | 'care_visits'
  | 'visit_follow_ups'
type OwnedInput = {
  [K in OwnedTable]: Omit<TablesInsert<K>, 'user_id'>
}[OwnedTable]

export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success)
    throw new HttpError(
      400,
      parsed.error.issues.map((issue) => issue.message).join(' '),
    )
  return parsed.data
}

export function requestId(req: Request) {
  return validate(z.uuid('Invalid record ID.'), req.params.id)
}

export async function databaseResult<T>(
  operation: PromiseLike<{ data: T; error: { code?: string } | null }>,
): Promise<T> {
  let result: Awaited<typeof operation>
  try {
    result = await operation
  } catch {
    throw new HttpError(
      503,
      'The data service is unavailable. Please try again.',
    )
  }
  if (result.error) {
    const code = result.error.code
    if (code === '23505')
      throw new HttpError(
        409,
        'This entry already exists. Refresh to see the latest data.',
      )
    if (code === '23503')
      throw new HttpError(
        409,
        'This change conflicts with linked health data. Check the selected profile, documents and visits first.',
      )
    if (code === '23514' || code === '22023' || code === 'P0001')
      throw new HttpError(
        409,
        'This change would invalidate related health data. Check the schedule, follow-up dates and profile links.',
      )
    if (code === '42501')
      throw new HttpError(
        403,
        'You do not have permission to change this entry.',
      )
    if (code === 'PGRST116' || code === 'P0002')
      throw new HttpError(404, 'This entry was not found or is not accessible.')
    throw new HttpError(
      503,
      'The data service could not complete this request. Please try again.',
    )
  }
  return result.data
}

export function createRouteContext(options: {
  documents: DocumentStore
  admin: ReturnType<typeof createAdminSupabaseClient>
  auth: AuthGateway
  authLimit: RequestHandler
  ocrSpaceApiKey?: string
  reminderEmail?: ReminderEmailSettings
}) {
  async function owned<T>(
    table: OwnedTable,
    schema: z.ZodType<T>,
    id: string,
    res: Response,
  ) {
    const row = await databaseResult(
      res.locals.supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .eq('user_id', res.locals.user.id)
        .maybeSingle(),
    )
    if (!row)
      throw new HttpError(404, 'This entry was not found or is not accessible.')
    return schema.parse(row)
  }

  async function save<T>(
    table: OwnedTable,
    schema: z.ZodType<T>,
    data: OwnedInput,
    res: Response,
    id?: string,
  ) {
    const query = res.locals.supabase.from(table)
    const result = id
      ? query
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', res.locals.user.id)
      : query.insert({ ...data, user_id: res.locals.user.id })
    return schema.parse(await databaseResult(result.select('*').single()))
  }

  async function update<T>(
    table: OwnedTable,
    schema: z.ZodType<T>,
    data: TablesUpdate<OwnedTable>,
    res: Response,
    id: string,
  ) {
    return schema.parse(
      await databaseResult(
        res.locals.supabase
          .from(table)
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', res.locals.user.id)
          .select('*')
          .single(),
      ),
    )
  }

  async function remove<T>(
    table: OwnedTable,
    schema: z.ZodType<T>,
    req: Request,
    res: Response,
  ) {
    const id = requestId(req)
    await owned(table, schema, id, res)
    await databaseResult(
      res.locals.supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('user_id', res.locals.user.id)
        .select('id')
        .single(),
    )
    res.status(204).end()
  }

  return {
    ...options,
    ...contracts,
    storedMedication: contracts.medicationRow,
    storedRecord: contracts.recordRow,
    owned,
    save,
    update,
    remove,
    requestId,
    upload: multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
        fields: 6,
        parts: 7,
        fieldSize: 4096,
      },
    }),
  }
}

export type RouteContext = ReturnType<typeof createRouteContext>
