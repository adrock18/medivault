import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { medicationRow } from '../src/lib/contracts.ts'

export function openDatabase(dataDir: string) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 })
  const db = new DatabaseSync(join(dataDir, 'medivault.sqlite'))
  db.exec(
    'PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;',
  )
  const version = db.prepare('PRAGMA user_version').get()?.user_version
  if (version === 0)
    db.exec(
      readFileSync(
        new URL('./migrations/001_initial.sql', import.meta.url),
        'utf8',
      ),
    )
  else if (version !== 1) {
    db.close()
    throw new Error(`Unsupported SQLite schema version ${version}.`)
  }
  return db
}
export function transaction<T>(db: DatabaseSync, action: () => T): T {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = action()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}
export function one<T>(
  db: DatabaseSync,
  schema: z.ZodType<T>,
  sql: string,
  values: SQLInputValue[] = [],
): T | null {
  const row = db.prepare(sql).get(...values)
  return row ? schema.parse(row) : null
}
export function many<T>(
  db: DatabaseSync,
  schema: z.ZodType<T>,
  sql: string,
  values: SQLInputValue[] = [],
): T[] {
  return db
    .prepare(sql)
    .all(...values)
    .map((row) => schema.parse(row))
}
export const storedMedication = z.preprocess((value) => {
  const row = z.object({ times: z.string() }).passthrough().parse(value)
  return { ...row, times: JSON.parse(row.times) }
}, medicationRow)
