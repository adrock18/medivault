import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import supertest from 'supertest'
import { mkdtemp, readdir, rm, mkdir, readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { openDatabase } from '../server/database.ts'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from '../server/app.ts'
import { localDate, MAX_FILE_SIZE } from '../src/lib/utils'
import {
  sessionSchema,
  vaultSchema,
  medicationRow,
  doseLogRow,
  metricRow,
  recordRow,
  healthProfileRow,
} from '../src/lib/contracts'
const protection = { 'X-MediVault-Request': '1' }
const password = 'Test-password-123'
let directory: string
let instance: ReturnType<typeof createApp>
let a: ReturnType<typeof supertest.agent>
let b: ReturnType<typeof supertest.agent>
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'medivault-api-test-'))
  instance = createApp({ dataDir: directory, authRateLimit: 1000 })
  a = supertest.agent(instance.app)
  b = supertest.agent(instance.app)
  await a
    .post('/api/auth/register')
    .set(protection)
    .send({
      full_name: 'Alex Test',
      email: 'alex@example.com',
      password,
      confirm_password: password,
    })
    .expect(201)
  await b
    .post('/api/auth/register')
    .set(protection)
    .send({
      full_name: 'Sam Test',
      email: 'sam@example.com',
      password,
      confirm_password: password,
    })
    .expect(201)
})
afterEach(async () => {
  instance.db.close()
  await rm(directory, { recursive: true, force: true })
})
const medicationInput = () => ({
  name: 'Test medication',
  dosage: 'Example only',
  frequency: 'twice_daily',
  times: '20:00, 08:00',
  start_date: localDate(),
  end_date: '',
  instructions: '',
})
const metricInput = () => ({
  type: 'blood_pressure',
  value: '120',
  secondary_value: '80',
  measured_at: new Date(Date.now() - 60_000).toISOString(),
  notes: '',
})
async function createMedication() {
  return medicationRow.parse(
    (
      await a
        .post('/api/medications')
        .set(protection)
        .send(medicationInput())
        .expect(201)
    ).body,
  )
}
describe('real Express + persistent SQLite + private filesystem integration', () => {
  it('upgrades an existing database without losing medication logs, sessions, or historical measurements', async () => {
    const legacyDir = join(directory, 'legacy')
    await mkdir(legacyDir)
    const old = new DatabaseSync(join(legacyDir, 'medivault.sqlite'))
    old.exec(
      await readFile(
        new URL('../server/migrations/001_initial.sql', import.meta.url),
        'utf8',
      ),
    )
    old.exec(`
      INSERT INTO users VALUES ('u','legacy@example.com','test-hash','2025-01-01','2025-01-01');
      INSERT INTO profiles VALUES ('u','Legacy user','2025-01-01','2025-01-01');
      INSERT INTO sessions VALUES ('existing-session','u',9999999999999);
      INSERT INTO medications VALUES ('m','u','Existing medicine','Original dosage','once_daily','["08:00"]','2025-01-01',NULL,'Original instructions','2025-01-01','2025-01-01');
      INSERT INTO medication_logs VALUES ('l','u','m','2025-01-02','08:00','taken','2025-01-02','2025-01-02','2025-01-02');
      INSERT INTO health_metrics VALUES ('h','u','weight',72,NULL,'2025-01-01T08:00:00Z','Existing measurement','2025-01-01','2025-01-01');
    `)
    old.close()
    const upgraded = openDatabase(legacyDir)
    try {
      expect(upgraded.prepare('PRAGMA user_version').get()?.user_version).toBe(
        2,
      )
      expect(upgraded.prepare('SELECT * FROM medications').get()).toMatchObject(
        {
          id: 'm',
          dosage: 'Original dosage',
          form: 'unspecified',
          strength: '',
          source_record_id: null,
          prescription_text: '',
        },
      )
      expect(
        upgraded.prepare('SELECT id,status FROM medication_logs').get(),
      ).toEqual({ id: 'l', status: 'taken' })
      expect(
        upgraded.prepare('SELECT token_hash FROM sessions').get()?.token_hash,
      ).toBe('existing-session')
      expect(
        upgraded.prepare('SELECT value FROM health_metrics').get()?.value,
      ).toBe(72)
      expect(upgraded.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    } finally {
      upgraded.close()
    }
  })
  it('links medication forms and exact prescription wording only to owned records, retaining medication history when a source is deleted', async () => {
    const record = recordRow.parse(
      (
        await a
          .post('/api/records')
          .set(protection)
          .field('title', 'Fictional prescription')
          .field('category', 'prescription')
          .field('provider', '')
          .field('record_date', localDate())
          .attach('file', Buffer.from('%PDF-1.4\nFictional\n%%EOF'), {
            filename: 'prescription.pdf',
            contentType: 'application/pdf',
          })
          .expect(201)
      ).body,
    )
    const input = {
      ...medicationInput(),
      form: 'cream',
      strength: '1%',
      dosage: 'Apply the amount printed on the label.',
      prescription_text:
        'Cream Example 1%\nApply the amount printed on the label.',
      source_record_id: record.id,
    }
    await b.post('/api/medications').set(protection).send(input).expect(404)
    const other = medicationRow.parse(
      (
        await b
          .post('/api/medications')
          .set(protection)
          .send(medicationInput())
          .expect(201)
      ).body,
    )
    await b
      .patch(`/api/medications/${other.id}`)
      .set(protection)
      .send(input)
      .expect(404)
    const med = medicationRow.parse(
      (await a.post('/api/medications').set(protection).send(input).expect(201))
        .body,
    )
    expect(med).toMatchObject({
      form: 'cream',
      strength: '1%',
      dosage: input.dosage,
      prescription_text: input.prescription_text,
      source_record_id: record.id,
    })
    await a
      .post('/api/medications')
      .set(protection)
      .send({ ...input, form: 'invalid' })
      .expect(400)
    await a
      .post('/api/dose-logs')
      .set(protection)
      .send({
        medication_id: med.id,
        scheduled_date: localDate(),
        scheduled_time: '08:00',
        status: 'taken',
      })
      .expect(201)
    expect(() =>
      instance.db
        .prepare('UPDATE medications SET source_record_id=? WHERE id=?')
        .run(record.id, other.id),
    ).toThrow('Prescription must belong')
    const legacyEdit = medicationRow.parse(
      (
        await a
          .patch(`/api/medications/${med.id}`)
          .set(protection)
          .send(medicationInput())
          .expect(200)
      ).body,
    )
    expect(legacyEdit).toMatchObject({
      form: 'cream',
      strength: '1%',
      source_record_id: record.id,
      prescription_text: input.prescription_text,
    })
    await a.delete(`/api/records/${record.id}`).set(protection).expect(204)
    const vault = vaultSchema.parse((await a.get('/api/vault')).body)
    expect(vault.medications.find((item) => item.id === med.id)).toMatchObject({
      source_record_id: null,
      prescription_text: input.prescription_text,
      dosage: medicationInput().dosage,
    })
    expect(vault.logs).toHaveLength(1)
  })
  it('registers with HttpOnly sessions, hashes passwords, rejects duplicate emails and supports login/logout', async () => {
    const session = sessionSchema.parse(
      (await a.get('/api/auth/session').expect(200)).body,
    )
    expect(session.user.email).toBe('alex@example.com')
    const hashes = instance.db.prepare('SELECT password_hash FROM users').all()
    expect(
      hashes.every(
        (row) =>
          row.password_hash !== password &&
          typeof row.password_hash === 'string' &&
          row.password_hash.includes(':'),
      ),
    ).toBe(true)
    await a
      .post('/api/auth/register')
      .set(protection)
      .send({
        full_name: 'Another',
        email: 'ALEX@example.com',
        password,
        confirm_password: password,
      })
      .expect(409)
    await a.post('/api/auth/logout').set(protection).expect(204)
    expect((await a.get('/api/auth/session')).body).toBeNull()
    await a.get('/api/vault').expect(401)
    await a
      .post('/api/auth/login')
      .set(protection)
      .send({ email: 'alex@example.com', password: 'incorrect' })
      .expect(401)
    const login = await a
      .post('/api/auth/login')
      .set(protection)
      .send({ email: 'ALEX@example.com', password })
      .expect(200)
    const cookie = login.headers['set-cookie'].toString()
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/api')
    expect(JSON.stringify(login.body)).not.toContain('token')
  })
  it('persists users, health data, and sessions across reopening the server database', async () => {
    const login = await a
      .post('/api/auth/login')
      .set(protection)
      .send({ email: 'alex@example.com', password })
      .expect(200)
    const cookie = login.headers['set-cookie'].toString().split(';')[0]
    const med = await createMedication()
    instance.db.close()
    instance = createApp({ dataDir: directory, authRateLimit: 1000 })
    const data = vaultSchema.parse(
      (
        await supertest(instance.app)
          .get('/api/vault')
          .set('Cookie', cookie)
          .expect(200)
      ).body,
    )
    expect(data.medications[0].id).toBe(med.id)
    expect(data.profile.full_name).toBe('Alex Test')
  })
  it('creates and updates a private health profile and syncs the display name', async () => {
    const input = {
      full_name: 'Alex Updated',
      date_of_birth: '1990-01-02',
      gender: '',
      blood_group: 'O+',
      height_cm: '172',
      weight_kg: '72',
      allergies: 'None known',
      conditions: '',
      emergency_contact_name: 'Sam',
      emergency_contact_phone: '+1 555 010 0200',
    }
    const profile = healthProfileRow.parse(
      (
        await a
          .put('/api/health-profile')
          .set(protection)
          .send(input)
          .expect(200)
      ).body,
    )
    expect(profile.height_cm).toBe(172)
    expect(profile.gender).toBeNull()
    const updated = healthProfileRow.parse(
      (
        await a
          .put('/api/health-profile')
          .set(protection)
          .send({ ...input, allergies: 'Example allergy' })
          .expect(200)
      ).body,
    )
    expect(updated.id).toBe(profile.id)
    const data = vaultSchema.parse((await a.get('/api/vault')).body)
    expect(data.profile.full_name).toBe('Alex Updated')
    expect(
      vaultSchema.parse((await b.get('/api/vault')).body).healthProfile,
    ).toBeNull()
    await b
      .put('/api/health-profile')
      .set(protection)
      .send({ ...input, user_id: profile.user_id })
      .expect(400)
  })
  it('validates medication schedules and blocks other users from editing or deleting them', async () => {
    const med = await createMedication()
    expect(med.times).toEqual(['08:00', '20:00'])
    expect(med.end_date).toBeNull()
    await a
      .post('/api/medications')
      .set(protection)
      .send({ ...medicationInput(), times: '08:00, 08:00' })
      .expect(400)
    await a
      .post('/api/medications')
      .set(protection)
      .send({ ...medicationInput(), user_id: med.user_id })
      .expect(400)
    expect(
      vaultSchema.parse((await b.get('/api/vault')).body).medications,
    ).toHaveLength(0)
    await b
      .patch(`/api/medications/${med.id}`)
      .set(protection)
      .send(medicationInput())
      .expect(404)
    await b.delete(`/api/medications/${med.id}`).set(protection).expect(404)
    const edited = medicationRow.parse(
      (
        await a
          .patch(`/api/medications/${med.id}`)
          .set(protection)
          .send({ ...medicationInput(), dosage: 'Updated example' })
          .expect(200)
      ).body,
    )
    expect(edited.dosage).toBe('Updated example')
    await a.delete(`/api/medications/${med.id}`).set(protection).expect(204)
    expect(
      vaultSchema.parse((await a.get('/api/vault')).body).medications,
    ).toHaveLength(0)
  })
  it('prevents duplicate/cross-user/unscheduled dose logs and cascades their deletion', async () => {
    const med = await createMedication()
    const input = {
      medication_id: med.id,
      scheduled_date: localDate(),
      scheduled_time: '08:00',
      status: 'taken',
    }
    const log = doseLogRow.parse(
      (await a.post('/api/dose-logs').set(protection).send(input).expect(201))
        .body,
    )
    await a.post('/api/dose-logs').set(protection).send(input).expect(409)
    await a
      .post('/api/dose-logs')
      .set(protection)
      .send({ ...input, scheduled_time: '09:00' })
      .expect(400)
    await b.post('/api/dose-logs').set(protection).send(input).expect(404)
    await b.delete(`/api/dose-logs/${log.id}`).set(protection).expect(404)
    await b
      .patch(`/api/dose-logs/${log.id}`)
      .set(protection)
      .send({ status: 'skipped' })
      .expect(404)
    const changed = doseLogRow.parse(
      (
        await a
          .patch(`/api/dose-logs/${log.id}`)
          .set(protection)
          .send({ status: 'skipped' })
          .expect(200)
      ).body,
    )
    expect(changed.status).toBe('skipped')
    await a.delete(`/api/dose-logs/${log.id}`).set(protection).expect(204)
    await a.post('/api/dose-logs').set(protection).send(input).expect(201)
    await a.delete(`/api/medications/${med.id}`).set(protection).expect(204)
    expect(
      vaultSchema.parse((await a.get('/api/vault')).body).logs,
    ).toHaveLength(0)
  })
  it('validates, persists, edits and deletes measurements with per-user isolation', async () => {
    const metric = metricRow.parse(
      (
        await a
          .post('/api/metrics')
          .set(protection)
          .send(metricInput())
          .expect(201)
      ).body,
    )
    expect(metric.value).toBe(120)
    expect(metric.secondary_value).toBe(80)
    await a
      .post('/api/metrics')
      .set(protection)
      .send({ ...metricInput(), secondary_value: '130' })
      .expect(400)
    await a
      .post('/api/metrics')
      .set(protection)
      .send({ ...metricInput(), measured_at: '2999-01-01T00:00:00Z' })
      .expect(400)
    expect(
      vaultSchema.parse((await b.get('/api/vault')).body).metrics,
    ).toHaveLength(0)
    await b
      .patch(`/api/metrics/${metric.id}`)
      .set(protection)
      .send(metricInput())
      .expect(404)
    await b.delete(`/api/metrics/${metric.id}`).set(protection).expect(404)
    const changed = metricRow.parse(
      (
        await a
          .patch(`/api/metrics/${metric.id}`)
          .set(protection)
          .send({
            type: 'weight',
            value: '72.4',
            secondary_value: '80',
            measured_at: metric.measured_at,
            notes: '',
          })
          .expect(200)
      ).body,
    )
    expect(changed.value).toBe(72.4)
    expect(changed.secondary_value).toBeNull()
    await a.delete(`/api/metrics/${metric.id}`).set(protection).expect(204)
  })
  it('uploads, edits, privately downloads and deletes documents without exposing a public directory', async () => {
    const pdf = Buffer.from('%PDF-1.4\nIntegration document\n%%EOF')
    const result = await a
      .post('/api/records')
      .set(protection)
      .field('title', 'Test report')
      .field('category', 'lab_report')
      .field('provider', 'Test clinic')
      .field('record_date', localDate())
      .attach('file', pdf, {
        filename: 'report.pdf',
        contentType: 'application/pdf',
      })
      .expect(201)
    const record = recordRow.parse(result.body)
    expect(record.file_size).toBe(pdf.length)
    const file = await a
      .get(`/api/records/${record.id}/file?download=1`)
      .expect(200)
    expect(file.headers['content-type']).toContain('application/pdf')
    expect(file.headers['content-disposition']).toContain('attachment')
    expect(file.body).toEqual(pdf)
    await b.get(`/api/records/${record.id}/file`).expect(404)
    await supertest(instance.app)
      .get(`/api/records/${record.id}/file`)
      .expect(401)
    await supertest(instance.app)
      .get(`/documents/${record.file_path}`)
      .expect(404)
    await b
      .patch(`/api/records/${record.id}`)
      .set(protection)
      .send({
        title: 'Bad',
        category: 'other',
        provider: '',
        record_date: localDate(),
      })
      .expect(404)
    await b.delete(`/api/records/${record.id}`).set(protection).expect(404)
    const edited = recordRow.parse(
      (
        await a
          .patch(`/api/records/${record.id}`)
          .set(protection)
          .send({
            title: 'Updated report',
            category: 'other',
            provider: '',
            record_date: localDate(),
          })
          .expect(200)
      ).body,
    )
    expect(edited.title).toBe('Updated report')
    await a.delete(`/api/records/${record.id}`).set(protection).expect(204)
    expect(
      await readdir(join(directory, 'documents', record.user_id)),
    ).toHaveLength(0)
    await a.get(`/api/records/${record.id}/file`).expect(404)
  })
  it('rejects empty, disguised, oversized and unsupported uploads on the server before writing files', async () => {
    const attempt = (buffer: Buffer, filename: string, mime: string) =>
      a
        .post('/api/records')
        .set(protection)
        .field('title', 'Invalid')
        .field('category', 'other')
        .field('provider', '')
        .field('record_date', localDate())
        .attach('file', buffer, { filename, contentType: mime })
    await attempt(
      Buffer.from('not a pdf'),
      'fake.pdf',
      'application/pdf',
    ).expect(400)
    await attempt(Buffer.alloc(0), 'empty.pdf', 'application/pdf').expect(400)
    await attempt(
      Buffer.from('%PDF-1.4'),
      'file.exe',
      'application/pdf',
    ).expect(400)
    await attempt(
      Buffer.alloc(MAX_FILE_SIZE + 1),
      'large.pdf',
      'application/pdf',
    ).expect(413)
    expect(
      vaultSchema.parse((await a.get('/api/vault')).body).records,
    ).toHaveLength(0)
  })
  it('protects unsafe requests and preserves the current session while revoking others on password change', async () => {
    await a.post('/api/medications').send(medicationInput()).expect(403)
    await a
      .post('/api/medications')
      .set(protection)
      .set('Origin', 'https://untrusted.example')
      .send(medicationInput())
      .expect(403)
    const otherSession = supertest.agent(instance.app)
    await otherSession
      .post('/api/auth/login')
      .set(protection)
      .send({ email: 'alex@example.com', password })
      .expect(200)
    await a
      .post('/api/auth/password')
      .set(protection)
      .send({
        current_password: 'wrong',
        password: 'New-password-123',
        confirm_password: 'New-password-123',
      })
      .expect(400)
    await a
      .post('/api/auth/password')
      .set(protection)
      .send({
        current_password: password,
        password: 'New-password-123',
        confirm_password: 'New-password-123',
      })
      .expect(204)
    await a.get('/api/vault').expect(200)
    await otherSession.get('/api/vault').expect(401)
    await otherSession
      .post('/api/auth/login')
      .set(protection)
      .send({ email: 'alex@example.com', password })
      .expect(401)
    await otherSession
      .post('/api/auth/login')
      .set(protection)
      .send({ email: 'alex@example.com', password: 'New-password-123' })
      .expect(200)
  })
  it('accepts a file at the exact 10 MB upload limit', async () => {
    const file = Buffer.alloc(MAX_FILE_SIZE)
    file.write('%PDF-1.4\n')
    const result = await a
      .post('/api/records')
      .set(protection)
      .field('title', 'Boundary file')
      .field('category', 'other')
      .field('provider', '')
      .field('record_date', localDate())
      .attach('file', file, {
        filename: 'boundary.pdf',
        contentType: 'application/pdf',
      })
      .expect(201)
    expect(recordRow.parse(result.body).file_size).toBe(MAX_FILE_SIZE)
  })
  it('rejects impossible dates, preserves concurrent dose uniqueness and retains logs after schedule edits', async () => {
    const med = medicationRow.parse(
      (
        await a
          .post('/api/medications')
          .set(protection)
          .send({ ...medicationInput(), start_date: '2025-01-01' })
          .expect(201)
      ).body,
    )
    const input = {
      medication_id: med.id,
      scheduled_date: localDate(),
      scheduled_time: '08:00',
      status: 'taken',
    }
    await a
      .post('/api/dose-logs')
      .set(protection)
      .send({ ...input, scheduled_date: '2026-02-30' })
      .expect(400)
    const results = await Promise.all([
      a.post('/api/dose-logs').set(protection).send(input),
      a.post('/api/dose-logs').set(protection).send(input),
    ])
    expect(results.map((result) => result.status).sort()).toEqual([201, 409])
    const original = vaultSchema.parse((await a.get('/api/vault')).body).logs
    await a
      .patch(`/api/medications/${med.id}`)
      .set(protection)
      .send({
        ...medicationInput(),
        start_date: '2025-01-02',
        times: '09:00, 21:00',
      })
      .expect(200)
    const updated = vaultSchema.parse((await a.get('/api/vault')).body)
    expect(updated.medications[0].times).toEqual(['09:00', '21:00'])
    expect(updated.logs).toEqual(original)
    expect(updated.logs[0].scheduled_time).toBe('08:00')
    expect(updated.logs[0].scheduled_date).toBe(input.scheduled_date)
  })
})
