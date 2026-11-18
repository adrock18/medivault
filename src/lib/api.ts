import { z } from 'zod'
import {
  resultReviewRow,
  type ReviewResultsValues,
} from '@shared/record-results'
import {
  sessionSchema,
  registrationResultSchema,
  vaultSchema,
  healthProfileRow,
  medicationRow,
  recordRow,
  doseLogRow,
  familyMemberRow,
  notificationPreferencesRow,
  accountExportSchema,
  careTrackRow,
  careVisitRow,
  visitFollowUpRow,
  familyHealthProfileRow,
} from '@shared/contracts'
import type {
  ProfileValues,
  FamilyHealthProfileValues,
  NotificationPreferencesValues,
  MedicationValues,
  RecordValues,
  CareTrackValues,
  CareVisitValues,
  VisitFollowUpValues,
} from '@shared/schemas'
import type { FamilyMemberValues } from '@shared/schemas'
import {
  confirmationEmailSchema,
  loginSchema,
  registerSchema,
  passwordSchema,
} from '@shared/schemas'

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}
export class ApiError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}
async function response(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  headers.set('X-MediVault-Request', '1')
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json')
  let result: Response
  try {
    result = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: 'same-origin',
    })
  } catch {
    throw new Error(
      'Unable to reach the Express API. Check your connection and start the backend server.',
    )
  }
  if (!result.ok) {
    let message = `The server could not complete this request (${result.status}).`
    let code: string | undefined
    if (result.headers.get('content-type')?.includes('application/json')) {
      const body: unknown = await result.json()
      const parsed = z
        .object({ error: z.string(), code: z.string().optional() })
        .safeParse(body)
      if (parsed.success) {
        message = parsed.data.error
        code = parsed.data.code
      }
    }
    if (
      result.status === 401 &&
      !['/auth/session', '/auth/login', '/auth/register'].includes(path)
    )
      window.dispatchEvent(new Event('medivault:session-expired'))
    throw new ApiError(message, code)
  }
  return result
}
async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: RequestInit,
): Promise<T> {
  const result = await response(path, options)
  if (
    result.status !== 204 &&
    !result.headers.get('content-type')?.includes('application/json')
  )
    throw new Error(
      'Unexpected API response. Make sure the Express server is running and the /api proxy is configured.',
    )
  const body: unknown = result.status === 204 ? undefined : await result.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throw new Error(
      'The API returned unexpected data. Check the backend version and retry.',
    )
  return parsed.data
}
const json = (method: string, values: unknown): RequestInit => ({
  method,
  body: JSON.stringify(values),
})
export const api = {
  auth: {
    session: () => request('/auth/session', sessionSchema.nullable()),
    login: (values: z.infer<typeof loginSchema>) =>
      request('/auth/login', sessionSchema, json('POST', values)),
    register: (values: z.infer<typeof registerSchema>) =>
      request('/auth/register', registrationResultSchema, json('POST', values)),
    resendConfirmation: (values: z.infer<typeof confirmationEmailSchema>) =>
      request('/auth/resend-confirmation', z.void(), json('POST', values)),
    logout: () => request('/auth/logout', z.void(), { method: 'POST' }),
    password: (values: z.infer<typeof passwordSchema>) =>
      request('/auth/password', z.void(), json('POST', values)),
  },
  vault: () => request('/vault', vaultSchema),
  exportData: () => request('/account/export', accountExportSchema),
  ocr: {
    remote: (id: string, signal?: AbortSignal) =>
      request(
        `/records/${encodeURIComponent(id)}/ocr`,
        z.object({ text: z.string() }),
        { ...json('POST', { confirm_external_processing: true }), signal },
      ),
  },
  family: {
    create: (values: FamilyMemberValues) =>
      request('/family-members', familyMemberRow, json('POST', values)),
    update: (id: string, values: FamilyMemberValues) =>
      request(
        `/family-members/${encodeURIComponent(id)}`,
        familyMemberRow,
        json('PATCH', values),
      ),
    remove: (id: string) =>
      request(`/family-members/${encodeURIComponent(id)}`, z.void(), {
        method: 'DELETE',
      }),
    saveHealthProfile: (id: string, values: FamilyHealthProfileValues) =>
      request(
        `/family-members/${encodeURIComponent(id)}/health-profile`,
        familyHealthProfileRow,
        json('PUT', {
          gender: values.gender,
          blood_group: values.blood_group,
          height_cm: values.height_cm,
          weight_kg: values.weight_kg,
          allergies: values.allergies,
          conditions: values.conditions,
          medical_background: values.medical_background,
          emergency_contact_name: values.emergency_contact_name,
          emergency_contact_phone: values.emergency_contact_phone,
        }),
      ),
  },
  notifications: {
    save: (values: NotificationPreferencesValues) =>
      request(
        '/notification-preferences',
        notificationPreferencesRow,
        json('PUT', values),
      ),
  },
  profile: {
    save: (values: ProfileValues) =>
      request('/health-profile', healthProfileRow, json('PUT', values)),
  },
  care: {
    saveFollowUp: (id: string, values: VisitFollowUpValues) =>
      request(
        `/care-visits/${encodeURIComponent(id)}/follow-up`,
        visitFollowUpRow,
        json('PUT', values),
      ),
    createTrack: (values: CareTrackValues) =>
      request('/care-tracks', careTrackRow, json('POST', values)),
    updateTrack: (id: string, values: CareTrackValues) =>
      request(
        `/care-tracks/${encodeURIComponent(id)}`,
        careTrackRow,
        json('PATCH', values),
      ),
    removeTrack: (id: string) =>
      request(`/care-tracks/${encodeURIComponent(id)}`, z.void(), {
        method: 'DELETE',
      }),
    createVisit: (values: CareVisitValues) =>
      request('/care-visits', careVisitRow, json('POST', values)),
    updateVisit: (id: string, values: CareVisitValues) =>
      request(
        `/care-visits/${encodeURIComponent(id)}`,
        careVisitRow,
        json('PATCH', values),
      ),
    removeVisit: (id: string) =>
      request(`/care-visits/${encodeURIComponent(id)}`, z.void(), {
        method: 'DELETE',
      }),
  },
  records: {
    saveResults: (id: string, values: ReviewResultsValues) =>
      request(
        `/records/${encodeURIComponent(id)}/results`,
        resultReviewRow,
        json('POST', values),
      ),
    favourite: (id: string, is_favourite: boolean) =>
      request(
        `/records/${encodeURIComponent(id)}/favourite`,
        recordRow,
        json('PUT', { is_favourite }),
      ),
    upload: (values: RecordValues, file: File) => {
      const form = new FormData()
      Object.entries(values).forEach(([key, value]) => form.append(key, value))
      form.append('file', file)
      return request('/records', recordRow, { method: 'POST', body: form })
    },
    update: (id: string, values: RecordValues) =>
      request(
        `/records/${encodeURIComponent(id)}`,
        recordRow,
        json('PATCH', values),
      ),
    remove: (id: string) =>
      request(`/records/${encodeURIComponent(id)}`, z.void(), {
        method: 'DELETE',
      }),
    file: async (id: string, download = false) =>
      (
        await response(
          `/records/${encodeURIComponent(id)}/file${download ? '?download=1' : ''}`,
        )
      ).blob(),
  },
  medications: {
    save: (values: MedicationValues, id?: string) =>
      request(
        id ? `/medications/${encodeURIComponent(id)}` : '/medications',
        medicationRow,
        json(id ? 'PATCH' : 'POST', values),
      ),
    remove: (id: string) =>
      request(`/medications/${encodeURIComponent(id)}`, z.void(), {
        method: 'DELETE',
      }),
  },
  doses: {
    add: (values: {
      medication_id: string
      scheduled_date: string
      scheduled_time: string
      status: 'taken' | 'skipped'
    }) => request('/dose-logs', doseLogRow, json('POST', values)),
    remove: (id: string) =>
      request(`/dose-logs/${encodeURIComponent(id)}`, z.void(), {
        method: 'DELETE',
      }),
  },
}
