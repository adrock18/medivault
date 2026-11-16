import { createReadStream } from 'node:fs'
import { mkdir, open, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type { S3Settings } from './config.ts'

export type StoredDocument = { body: Readable; size?: number }

export interface DocumentStore {
  put(key: string, bytes: Buffer, contentType: string): Promise<void>
  get(key: string): Promise<StoredDocument | null>
  delete(key: string): Promise<void>
}

function missingFile(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

export class LocalDocumentStore implements DocumentStore {
  readonly root: string
  constructor(root: string) {
    this.root = resolve(root)
  }
  private path(key: string) {
    const path = resolve(this.root, key)
    if (!path.startsWith(`${this.root}${sep}`))
      throw new Error('Invalid stored document path.')
    return path
  }
  async put(key: string, bytes: Buffer) {
    const path = this.path(key)
    await mkdir(dirname(path), { recursive: true, mode: 0o700 })
    await writeFile(path, bytes, { flag: 'wx', mode: 0o600 })
  }
  async get(key: string) {
    const path = this.path(key)
    try {
      const handle = await open(path, 'r')
      const { size } = await handle.stat()
      return { body: createReadStream(path, { fd: handle }), size }
    } catch (error) {
      if (missingFile(error)) return null
      throw error
    }
  }
  async delete(key: string) {
    try {
      await unlink(this.path(key))
    } catch (error) {
      if (!missingFile(error)) throw error
    }
  }
}

type S3Sender = Pick<S3Client, 'send'>

export class S3DocumentStore implements DocumentStore {
  private readonly client: S3Sender
  private readonly bucket: string
  constructor(settings: S3Settings, client?: S3Sender) {
    this.bucket = settings.bucket
    this.client =
      client ??
      new S3Client({
        endpoint: settings.endpoint,
        region: settings.region,
        forcePathStyle: true,
        credentials: {
          accessKeyId: settings.accessKeyId,
          secretAccessKey: settings.secretAccessKey,
        },
        // Newer SDK default checksum headers are not accepted by every S3-compatible provider.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      })
  }
  private key(key: string) {
    if (!/^[\w-]+\/[\w-]+\.[a-z0-9]+$/i.test(key))
      throw new Error('Invalid stored document path.')
    return `documents/${key}`
  }
  async put(key: string, bytes: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key(key),
        Body: bytes,
        ContentType: contentType,
        ContentLength: bytes.length,
      }),
    )
  }
  async get(key: string) {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: this.key(key) }),
      )
      if (!(result.Body instanceof Readable))
        throw new Error('The document store returned an unreadable body.')
      return { body: result.Body, size: result.ContentLength }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'NoSuchKey' ||
          ('$metadata' in error &&
            (error.$metadata as { httpStatusCode?: number }).httpStatusCode ===
              404))
      )
        return null
      throw error
    }
  }
  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key(key) }),
    )
  }
}
