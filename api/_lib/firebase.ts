import type { VercelRequest } from '@vercel/node'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

function init() {
  if (getApps().length) return
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set')
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  initializeApp({ credential: cert(JSON.parse(text)) })
}
export const adminAuth = () => { init(); return getAuth() }
export const adminDb = () => { init(); return getFirestore() }

/** Verifies the Firebase sign-in token sent by the website or the Android app. */
export async function requireUser(req: VercelRequest, maxAgeSeconds?: number) {
  const h = req.headers.authorization ?? ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  if (!token) throw new HttpError(401, 'Please sign in.')
  let decoded
  try { decoded = await adminAuth().verifyIdToken(token) } catch { throw new HttpError(401, 'Your session expired. Please sign in again.') }
  if (maxAgeSeconds && Date.now() / 1000 - decoded.auth_time > maxAgeSeconds)
    throw new HttpError(401, 'Please confirm your password and try again.')
  return { uid: decoded.uid, email: decoded.email }
}
