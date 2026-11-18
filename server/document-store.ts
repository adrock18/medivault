/**
 * Private Storage adapter. Validates server-generated object keys and exposes
 * file operations without leaking provider errors.
 */

import { Readable } from 'node:stream'
import type { createAdminSupabaseClient } from './supabase.ts'

export type StoredDocument = { body: Readable; size?: number }
export interface DocumentStore {
  put(key: string, bytes: Buffer, contentType: string): Promise<void>
  get(key: string): Promise<StoredDocument | null>
  delete(key: string): Promise<void>
}

export class SupabaseDocumentStore implements DocumentStore {
  private readonly bucket
  constructor(
    client: ReturnType<typeof createAdminSupabaseClient>,
    bucket: string,
  ) {
    this.bucket = client.storage.from(bucket)
  }
  /**
   * Reject paths outside the expected owner/document filename shape before
   * calling privileged Storage APIs.
   */
  private key(key: string) {
    if (!/^[\da-f-]{36}\/[\da-f-]{36}\.(pdf|jpg|jpeg|png)$/i.test(key))
      throw new Error('Invalid stored document path.')
    return key
  }
  /**
   * Create a private object without overwriting an existing file; surface upload
   * failure to the route.
   */
  async put(key: string, bytes: Buffer, contentType: string) {
    const { error } = await this.bucket.upload(this.key(key), bytes, {
      contentType,
      upsert: false,
      cacheControl: '0',
    })
    if (error) throw new Error('The private document upload failed.')
  }
  /**
   * Return private bytes, distinguish a missing object from provider failure, and
   * keep provider details internal.
   */
  async get(key: string) {
    const { data, error } = await this.bucket.download(this.key(key))
    if (error) {
      if (
        'statusCode' in error &&
        ['404', '400'].includes(String(error.statusCode)) &&
        /not found|does not exist/i.test(error.message)
      )
        return null
      throw new Error('The private document download failed.')
    }
    return {
      body: Readable.from(Buffer.from(await data.arrayBuffer())),
      size: data.size,
    }
  }
  /**
   * Remove the private object or fail explicitly so the route can preserve
   * retryable metadata.
   */
  async delete(key: string) {
    const { error } = await this.bucket.remove([this.key(key)])
    if (error) throw new Error('The private document deletion failed.')
  }
}
