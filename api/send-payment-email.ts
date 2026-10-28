import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminDb, HttpError, requireUser } from './_lib/firebase.js'
import { sendEmail } from './_lib/mailer.js'
import { adminNotice, paymentEmail } from './_lib/templates.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { uid } = await requireUser(req)
    const id = String(req.body?.applicationId ?? '')
    if (!/^VISA-\d{6,}$/.test(id)) throw new HttpError(400, 'Bad application id')
    const ref = adminDb().collection('visa_applications').doc(id)

    // Claim the send inside a transaction so double clicks can't send two emails.
    const claimed = await adminDb().runTransaction(async tx => {
      const snap = await tx.get(ref)
      const d = snap.data()
      if (!snap.exists || !d || d.userId !== uid) throw new HttpError(404, 'Application not found')
      if (d.status !== 'SUBMITTED' || d.isPaid) throw new HttpError(409, 'No payment is due for this application.')
      if (Date.now() - Number(d.paymentEmailSentAt ?? 0) < 10 * 60_000) return null
      tx.update(ref, { paymentEmailSentAt: Date.now() })
      return d
    })
    if (!claimed) return res.status(200).json({ ok: true, alreadySent: true })

    const app = { applicationId: id, ...claimed } as Parameters<typeof paymentEmail>[0]
    try {
      const mail = paymentEmail(app)
      await sendEmail({ to: String(claimed.userEmail), toName: claimed.userFullName, ...mail, replyTo: process.env.EMAIL_REPLY_TO })
    } catch (e) {
      await ref.update({ paymentEmailSentAt: 0 }) // allow a retry
      throw e
    }
    await ref.update({ paymentStatus: 'instructions_sent' })

    if (process.env.ADMIN_NOTIFY_EMAIL) {
      try { await sendEmail({ to: process.env.ADMIN_NOTIFY_EMAIL, ...adminNotice(app) }) } catch (e) { console.warn('admin notice failed', e) }
    }
    return res.status(200).json({ ok: true })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    if (status === 500) console.error('send-payment-email failed', e)
    return res.status(status).json({ error: status === 500 ? 'We could not send the email right now.' : (e as Error).message })
  }
}
