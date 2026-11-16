import { z } from 'zod'
import {
  sessionSchema,
  vaultSchema,
  healthProfileRow,
  medicationRow,
  recordRow,
  doseLogRow,
} from './contracts'
import type { ProfileValues, MedicationValues, RecordValues } from './schemas'
import { loginSchema, registerSchema, passwordSchema } from './schemas'

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
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
    if (result.headers.get('content-type')?.includes('application/json')) {
      const body: unknown = await result.json()
      const parsed = z.object({ error: z.string() }).safeParse(body)
      if (parsed.success) message = parsed.data.error
    }
    if (
      result.status === 401 &&
      !['/auth/session', '/auth/login', '/auth/register'].includes(path)
    )
      window.dispatchEvent(new Event('medivault:session-expired'))
    throw new Error(message)
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
      request('/auth/register', sessionSchema, json('POST', values)),
    logout: () => request('/auth/logout', z.void(), { method: 'POST' }),
    password: (values: z.infer<typeof passwordSchema>) =>
      request('/auth/password', z.void(), json('POST', values)),
  },
  vault: () => request('/vault', vaultSchema),
  profile: {
    save: (values: ProfileValues) =>
      request('/health-profile', healthProfileRow, json('PUT', values)),
  },
  records: {
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
