import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { text } from 'node:stream/consumers'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import {
  LocalDocumentStore,
  S3DocumentStore,
} from '../server/document-store.ts'

const key =
  '00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000002.pdf'
const directories: string[] = []
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true })),
  )
})

describe('document stores', () => {
  it('keeps local documents private, exclusive and contained', async () => {
    const root = await mkdtemp(join(tmpdir(), 'medivault-store-'))
    directories.push(root)
    const store = new LocalDocumentStore(root)
    await store.put(key, Buffer.from('first'))
    await expect(store.put(key, Buffer.from('second'))).rejects.toThrow()
    expect(await readFile(join(root, key), 'utf8')).toBe('first')
    if (process.platform !== 'win32')
      expect((await stat(join(root, key))).mode & 0o777).toBe(0o600)
    const stored = await store.get(key)
    expect(stored?.size).toBe(5)
    expect(await text(stored!.body)).toBe('first')
    await expect(store.get('../outside.pdf')).rejects.toThrow(
      'Invalid stored document path.',
    )
    await store.delete(key)
    await store.delete(key)
    expect(await store.get(key)).toBeNull()
  })

  it('maps bucket put, get, missing and delete to scoped object keys', async () => {
    const objects = new Map<string, Buffer>()
    const sent: unknown[] = []
    const client = {
      send: async (command: unknown) => {
        sent.push(command)
        if (command instanceof PutObjectCommand) {
          objects.set(command.input.Key!, command.input.Body as Buffer)
          return {}
        }
        if (command instanceof GetObjectCommand) {
          const body = objects.get(command.input.Key!)
          if (!body)
            throw Object.assign(new Error('missing'), {
              name: 'NoSuchKey',
              $metadata: { httpStatusCode: 404 },
            })
          return { Body: Readable.from([body]), ContentLength: body.length }
        }
        if (command instanceof DeleteObjectCommand) {
          objects.delete(command.input.Key!)
          return {}
        }
        throw new Error('Unexpected command')
      },
    }
    const store = new S3DocumentStore(
      {
        endpoint: 'https://s3.example-region.example.com',
        bucket: 'test-bucket',
        region: 'example-region',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-value',
      },
      client as never,
    )
    await store.put(key, Buffer.from('bucket'), 'application/pdf')
    expect([...objects.keys()]).toEqual([`documents/${key}`])
    expect((sent[0] as PutObjectCommand).input).toMatchObject({
      Bucket: 'test-bucket',
      ContentType: 'application/pdf',
    })
    const stored = await store.get(key)
    expect(stored?.size).toBe(6)
    expect(await text(stored!.body)).toBe('bucket')
    await expect(store.get('../outside.pdf')).rejects.toThrow(
      'Invalid stored document path.',
    )
    await store.delete(key)
    await store.delete(key)
    expect(await store.get(key)).toBeNull()
  })
})
