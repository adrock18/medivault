import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import { z } from 'zod'
import { recordFavouriteSchema, recordSchema } from '../../shared/schemas.ts'
import { validateDocument } from '../../shared/documents.ts'
import { storedRecord } from '../database.ts'
import {
  DocumentOperationError,
  HttpError,
  requestFailure,
  requestId,
  validate,
  type RouteContext,
} from './context.ts'

/** Register owner-scoped record metadata and private-file endpoints. */
export function recordRoutes(context: RouteContext) {
  const router = Router()
  const { db, documents } = context

  router.post('/records/:id/ocr', async (req, res) => {
    validate(
      z.object({ confirm_external_processing: z.literal(true) }).strict(),
      req.body,
    )
    if (!context.ocrSpaceApiKey)
      throw new HttpError(503, 'External OCR is not configured.')
    const record = context.owned(
      'medical_records',
      context.storedRecord,
      requestId(req),
      res.locals.user.id,
    )
    const maxProviderBytes = 1024 * 1024
    if (record.file_size > maxProviderBytes)
      throw new HttpError(
        413,
        'OCR.Space free processing accepts files up to 1 MB. Use local OCR for this document.',
      )
    let stored: Awaited<ReturnType<RouteContext['documents']['get']>>
    try {
      stored = await documents.get(record.file_path)
    } catch {
      throw new DocumentOperationError(
        'download',
        500,
        requestFailure,
        record.id,
      )
    }
    if (!stored)
      throw new DocumentOperationError(
        'download-missing',
        404,
        'The document file could not be found.',
        record.id,
      )
    const chunks: Buffer[] = []
    let size = 0
    try {
      for await (const chunk of stored.body) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        size += bytes.length
        if (size > maxProviderBytes) {
          stored.body.destroy()
          throw new HttpError(
            413,
            'OCR.Space free processing accepts files up to 1 MB. Use local OCR for this document.',
          )
        }
        chunks.push(bytes)
      }
    } catch (error) {
      if (error instanceof HttpError) throw error
      throw new DocumentOperationError(
        'download-stream',
        500,
        requestFailure,
        record.id,
      )
    }
    const form = new FormData()
    form.set(
      'file',
      new File([Buffer.concat(chunks)], record.file_name, {
        type: record.file_type,
      }),
    )
    form.set('language', 'eng')
    form.set('isOverlayRequired', 'false')
    form.set('OCREngine', '2')
    let response: Response
    try {
      response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { apikey: context.ocrSpaceApiKey },
        body: form,
        signal: AbortSignal.timeout(30_000),
      })
    } catch {
      throw new HttpError(
        502,
        'The external OCR service could not be reached. Try local OCR instead.',
      )
    }
    if (!response.ok)
      throw new HttpError(
        502,
        'The external OCR service could not process this document. Try local OCR instead.',
      )
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new HttpError(
        502,
        'The external OCR service returned an unreadable response.',
      )
    }
    const result = z
      .object({
        IsErroredOnProcessing: z.union([z.boolean(), z.string()]).optional(),
        ParsedResults: z
          .array(z.object({ ParsedText: z.string().optional() }).passthrough())
          .optional(),
      })
      .passthrough()
      .safeParse(payload)
    if (
      !result.success ||
      result.data.IsErroredOnProcessing === true ||
      result.data.IsErroredOnProcessing === 'true'
    )
      throw new HttpError(
        502,
        'The external OCR service could not read this document. Check the provider limits or use local OCR.',
      )
    const text = result.data.ParsedResults?.map((item) => item.ParsedText ?? '')
      .join('\n\n')
      .trim()
    if (!text)
      throw new HttpError(
        422,
        'No readable text was returned. Try local OCR or enter the details manually.',
      )
    res.json({ text })
  })

  router.post('/records', context.upload.single('file'), async (req, res) => {
    const input = validate(recordSchema.strict(), req.body)
    if (!req.file)
      throw new HttpError(400, 'Choose a PDF, JPG, or PNG document.')
    const file = new File(
      [new Uint8Array(req.file.buffer)],
      req.file.originalname,
      { type: req.file.mimetype },
    )
    try {
      await validateDocument(file)
    } catch (error) {
      throw new HttpError(
        400,
        error instanceof Error ? error.message : 'Invalid document.',
      )
    }
    if (file.name.length > 255)
      throw new HttpError(
        400,
        'The file name must be no longer than 255 characters.',
      )
    context.owned(
      'family_members',
      context.familyMemberRow,
      input.family_member_id,
      res.locals.user.id,
    )
    if (input.visit_id) {
      const visit = context.owned(
        'care_visits',
        context.careVisitRow,
        input.visit_id,
        res.locals.user.id,
      )
      if (visit.family_member_id !== input.family_member_id)
        throw new HttpError(
          400,
          'Choose a visit for the selected family profile.',
        )
    }
    const filePath = `${res.locals.user.id}/${randomUUID()}.${file.name.split('.').pop()!.toLowerCase()}`
    try {
      await documents.put(filePath, req.file.buffer, file.type)
    } catch {
      throw new DocumentOperationError(
        'upload',
        503,
        'The document could not be stored right now. Please try again.',
      )
    }
    try {
      const row = context.save(
        'medical_records',
        context.storedRecord,
        {
          ...input,
          category: legacyCategory(input.document_kind),
          visit_id: input.visit_id || null,
          file_path: filePath,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        },
        res.locals.user.id,
      )
      res.status(201).json(row)
    } catch {
      try {
        await documents.delete(filePath)
      } catch {
        throw new DocumentOperationError(
          'upload-cleanup',
          500,
          'Upload failed and its file could not be cleaned up. Contact the server administrator.',
        )
      }
      throw new DocumentOperationError('upload-metadata', 500, requestFailure)
    }
  })

  router.patch('/records/:id', (req, res) => {
    const input = validate(recordSchema.strict(), req.body)
    context.owned(
      'family_members',
      context.familyMemberRow,
      input.family_member_id,
      res.locals.user.id,
    )
    if (input.visit_id) {
      const visit = context.owned(
        'care_visits',
        context.careVisitRow,
        input.visit_id,
        res.locals.user.id,
      )
      if (visit.family_member_id !== input.family_member_id)
        throw new HttpError(
          400,
          'Choose a visit for the selected family profile.',
        )
    }
    res.json(
      context.save(
        'medical_records',
        context.storedRecord,
        {
          ...input,
          category: legacyCategory(input.document_kind),
          visit_id: input.visit_id || null,
        },
        res.locals.user.id,
        requestId(req),
      ),
    )
  })

  router.put('/records/:id/favourite', (req, res) => {
    const input = validate(recordFavouriteSchema, req.body)
    const id = requestId(req)
    const userId = res.locals.user.id
    context.owned('medical_records', context.storedRecord, id, userId)
    const desired = input.is_favourite ? 1 : 0
    db.prepare(
      'UPDATE medical_records SET is_favourite=?,updated_at=? WHERE id=? AND user_id=? AND is_favourite<>?',
    ).run(desired, new Date().toISOString(), id, userId, desired)
    res.json(context.owned('medical_records', context.storedRecord, id, userId))
  })

  router.get('/records/:id/file', async (req, res) => {
    const record = context.owned(
      'medical_records',
      context.storedRecord,
      requestId(req),
      res.locals.user.id,
    )
    let stored: Awaited<ReturnType<RouteContext['documents']['get']>>
    try {
      stored = await documents.get(record.file_path)
    } catch {
      throw new DocumentOperationError(
        'download',
        500,
        requestFailure,
        record.id,
      )
    }
    if (!stored)
      throw new DocumentOperationError(
        'download-missing',
        404,
        'The document file could not be found. Contact your server administrator.',
        record.id,
      )
    res.type(record.file_type)
    if (req.query.download === '1') res.attachment(record.file_name)
    else res.set('Content-Disposition', 'inline')
    if (stored.size !== undefined)
      res.set('Content-Length', String(stored.size))
    try {
      await pipeline(stored.body, res)
    } catch {
      throw new DocumentOperationError(
        'download-stream',
        500,
        requestFailure,
        record.id,
      )
    }
  })

  router.delete('/records/:id', async (req, res) => {
    const id = requestId(req)
    const record = context.owned(
      'medical_records',
      storedRecord,
      id,
      res.locals.user.id,
    )
    try {
      await documents.delete(record.file_path)
    } catch {
      throw new DocumentOperationError('delete-object', 500, requestFailure, id)
    }
    try {
      context.remove('medical_records', storedRecord, req, res)
    } catch {
      throw new DocumentOperationError(
        'delete-metadata',
        500,
        'The file was removed but its details could not be deleted. Retry deletion to finish.',
        id,
      )
    }
  })

  return router
}

function legacyCategory(
  kind: import('../../shared/database.types.ts').DocumentKind,
) {
  if (kind === 'prescription' || kind === 'lab_report') return kind
  if (kind === 'imaging_report') return 'scan'
  if (kind === 'discharge_summary') return kind
  return 'other'
}
