import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from 'node:crypto'
function scrypt(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}
export const COOKIE_NAME = 'medivault_session'
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = await scrypt(password, salt)
  return `${salt}:${Buffer.from(hash).toString('hex')}`
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) throw new Error('Stored password hash is invalid.')
  const expected = Buffer.from(hash, 'hex')
  const actual = await scrypt(password, salt)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
export const sessionHash = (token: string) =>
  createHash('sha256').update(token).digest('hex')
export const createToken = () => randomBytes(32).toString('hex')
