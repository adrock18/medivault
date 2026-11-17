import { api } from '@/lib/api'
import { validateDocument } from '@/lib/utils'
import type { MedicalRecord } from '@shared/database.types'
import type { RecordValues } from '@shared/schemas'

export async function uploadRecord(values: RecordValues, file: File) {
  await validateDocument(file)
  if (file.name.length > 255)
    throw new Error('The file name must be no longer than 255 characters.')
  return api.records.upload(values, file)
}
export async function deleteRecord(record: MedicalRecord) {
  await api.records.remove(record.id)
}
export async function viewRecord(record: MedicalRecord) {
  const tab = window.open('about:blank', '_blank')
  if (!tab)
    throw new Error('Allow pop-ups for MediVault to view this document.')
  tab.opener = null
  try {
    const blob = await api.records.file(record.id)
    const url = URL.createObjectURL(blob)
    tab.location.replace(url)
    window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000)
  } catch (error) {
    tab.close()
    throw error
  }
}
export async function downloadRecord(record: MedicalRecord) {
  const blob = await api.records.file(record.id, true)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = record.file_name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
