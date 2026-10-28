import { createHash } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb, HttpError, requireUser } from './_lib/firebase.js'

const BUCKET = 'visa-documents'

// Tables holding a traveller's personal data, keyed by the Firebase uid in user_id.
// TODO: add the table written by request_experience_booking once you know its name.
const BOOKING_TABLES = [
  { table: 'itinerary_bookings', scrub: { lead_name: 'Deleted user', lead_email: 'deleted@invalid.invalid', nationality: null, whatsapp: null,
    emergency_contact: null, other_travellers: null, dietary_needs: null, accessibility_needs: null, special_requests: null } },
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { uid } = await requireUser(req, 600) // must have signed in within 10 minutes
    if (req.body?.confirm !== 'DELETE') throw new HttpError(400, 'Deletion was not confirmed.')
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase server credentials are missing')
    const sb = createClient(url, key, { auth: { persistSession: false } })
    const db = adminDb()
    const today = new Date().toISOString().slice(0, 10)

    // 1. Refuse while something is in progress, so nobody loses a paid booking by accident.
    const apps = await db.collection('visa_applications').where('userId', '==', uid).get()
    if (apps.docs.some(d => ['SUBMITTED', 'UNDER_REVIEW'].includes(d.data().status)))
      throw new HttpError(409, 'You have a visa application in progress. Please contact support to finish or cancel it first.')
    for (const t of BOOKING_TABLES) {
      const { count, error } = await sb.from(t.table).select('id', { count: 'exact', head: true }).eq('user_id', uid)
        .in('status', ['requested', 'confirmed', 'awaiting_payment']).gte('travel_date', today)
      if (error) throw error
      if (count) throw new HttpError(409, 'You have an upcoming booking. Please cancel it or contact support first.')
    }

    // 2. Visa applications: keep a minimal record for paid or approved ones, delete the rest.
    for (const d of apps.docs) {
      const x = d.data()
      if (x.isPaid || x.status === 'APPROVED') {
        await d.ref.update({
          userId: 'deleted', userEmail: 'deleted', userFullName: 'Deleted user', ownerDisplayName: 'Deleted user',
          travellers: FieldValue.delete(), uploadedDocs: {}, visaPdfUrl: null, deletedAt: Date.now(),
        })
      } else await d.ref.delete()
    }

    // 3. Uploaded documents.
    const paths: string[] = []
    const { data: top } = await sb.storage.from(BUCKET).list(uid, { limit: 1000 })
    for (const f of top ?? []) {
      if (f.id) { paths.push(`${uid}/${f.name}`); continue }
      const { data: files } = await sb.storage.from(BUCKET).list(`${uid}/${f.name}`, { limit: 1000 })
      for (const x of files ?? []) paths.push(`${uid}/${f.name}/${x.name}`)
    }
    if (paths.length) await sb.storage.from(BUCKET).remove(paths)

    // 4. Bookings: anonymise, keep amounts and dates.
    const anon = `deleted-${createHash('sha256').update(uid).digest('hex').slice(0, 12)}`
    for (const t of BOOKING_TABLES) {
      const { error } = await sb.from(t.table).update({ ...t.scrub, user_id: anon }).eq('user_id', uid)
      if (error) throw error
    }

    // 5. Profile (with subcollections) and follow lists.
    await db.recursiveDelete(db.doc(`users/${uid}`))
    for (const field of ['followers', 'following']) {
      const q = await db.collection('users').where(field, 'array-contains', uid).get()
      await Promise.all(q.docs.map(d => d.ref.update({ [field]: FieldValue.arrayRemove(uid) })))
    }

    // 6. Finally the sign-in account itself.
    await adminAuth().deleteUser(uid)
    return res.status(200).json({ ok: true })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    if (status === 500) console.error('delete-account failed', e)
    return res.status(status).json({ error: status === 500 ? 'We could not finish deleting your account. Please try again or contact support.' : (e as Error).message })
  }
}
