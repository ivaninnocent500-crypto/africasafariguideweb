import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminDb, HttpError, requireUser } from '../../_lib/firebase.js'
import { dodoClient, siteUrl } from '../../_lib/dodo.js'
import { expectedFees } from '../../_lib/pricing.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { uid } = await requireUser(req)
    const id = String(req.body?.applicationId ?? '')
    if (!/^VISA-\d{6,}$/.test(id)) throw new HttpError(400, 'Bad application id')

    const ref = adminDb().collection('visa_applications').doc(id)
    const snap = await ref.get()
    const app = snap.data()
    if (!snap.exists || !app || app.userId !== uid) throw new HttpError(404, 'Application not found')
    if (app.isPaid) throw new HttpError(409, 'This application is already paid.')
    if (app.status !== 'SUBMITTED') throw new HttpError(409, 'Please submit your application before paying.')

    const fees = await expectedFees(app) // price comes from the rules, not from the browser
    const cents = Math.round(fees.total * 100)
    const maxCents = Number(process.env.MAX_PAYMENT_USD ?? 5000) * 100
    if (cents < 100 || cents > maxCents) throw new HttpError(409, 'This amount cannot be paid online. Please contact support.')

    const productId = process.env.DODO_PRODUCT_ID
    if (!productId) throw new Error('DODO_PRODUCT_ID is not set')
    const site = siteUrl()

    const session = await dodoClient().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1, amount: cents }],
      customer: { email: String(app.userEmail), name: String(app.userFullName ?? '') },
      return_url: `${site}/visa/applications/${id}?payment=return`,
      cancel_url: `${site}/visa/applications/${id}?payment=cancelled`,
      feature_flags: { allow_discount_code: false },
      metadata: { applicationId: id, uid },
    })
    if (!session.checkout_url) throw new Error('Dodo did not return a checkout URL')

    await ref.update({
      govFee: fees.gov, serviceFee: fees.service, totalFee: fees.total, // records now match what is charged
      paymentStatus: 'checkout_started', paymentExpectedCents: cents,
      dodoSessionId: session.session_id, checkoutStartedAt: Date.now(),
    })
    return res.status(200).json({ url: session.checkout_url })
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    if (status === 500) console.error('dodo checkout failed', e)
    return res.status(status).json({ error: status === 500 ? 'We could not start the payment. Please try again.' : (e as Error).message })
  }
}
