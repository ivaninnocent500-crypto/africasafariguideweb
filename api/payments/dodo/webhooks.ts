import { adminDb } from '../../_lib/firebase.js'
import { dodoClient } from '../../_lib/dodo.js'
import { sendEmail } from '../../_lib/mailer.js'
import { adminAlert, paymentReceivedEmail } from '../../_lib/templates.js'

// Dodo's own Vercel example reads the raw body the same way.
export const config = { api: { bodyParser: false } }

interface PaymentData { payment_id: string; total_amount: number; currency: string; metadata?: Record<string, string> | null }
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function notify(to: string | undefined, mail: { subject: string; html: string; text: string }, toName?: string) {
  if (!to) return
  try { await sendEmail({ to, toName, ...mail }) } catch (e) { console.warn('email failed', e) }
}

export async function POST(req: Request) {
  const raw = await req.text() // exact bytes Dodo signed
  let client
  try { client = dodoClient() } catch (e) { console.error(e); return json({ error: 'Server not configured' }, 500) }

  let event: { type: string; data: unknown }
  try {
    event = client.webhooks.unwrap(raw, {
      headers: {
        'webhook-id': req.headers.get('webhook-id') ?? '',
        'webhook-signature': req.headers.get('webhook-signature') ?? '',
        'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
      },
    }) as unknown as typeof event
  } catch { return json({ error: 'Invalid signature' }, 401) }

  try {
    if (event.type !== 'payment.succeeded' && event.type !== 'payment.failed') return json({ received: true })

    const p = event.data as PaymentData
    const id = String(p.metadata?.applicationId ?? '')
    if (!/^VISA-\d{6,}$/.test(id)) { console.warn('webhook without application id', event.type); return json({ received: true }) }
    const ref = adminDb().collection('visa_applications').doc(id)

    if (event.type === 'payment.failed') {
      const s = await ref.get()
      if (s.exists && !s.data()?.isPaid) await ref.update({ paymentStatus: 'failed', paymentFailedAt: Date.now() })
      return json({ received: true })
    }

    // payment.succeeded: the transaction makes this safe if Dodo retries or sends it twice.
    const out = await adminDb().runTransaction(async tx => {
      const snap = await tx.get(ref)
      const a = snap.data()
      if (!snap.exists || !a) return { kind: 'unknown' as const }
      if (a.isPaid) return { kind: 'already' as const }
      const expected = Number(a.paymentExpectedCents ?? 0)
      const sameCurrency = String(p.currency).toUpperCase() === 'USD'
      const paid = { dodoPaymentId: p.payment_id, paidAmountCents: p.total_amount, paidCurrency: p.currency }
      if (sameCurrency && expected > 0 && p.total_amount < expected) {
        tx.update(ref, { paymentStatus: 'amount_mismatch', ...paid })
        return { kind: 'mismatch' as const, a }
      }
      tx.update(ref, { isPaid: true, paymentStatus: 'paid', paidAt: Date.now(), ...paid })
      return { kind: 'paid' as const, a }
    })

    const amountText = `${(p.total_amount / 100).toFixed(2)} ${p.currency}`
    if (out.kind === 'paid') {
      const a = out.a
      const info = { applicationId: id, userFullName: a.userFullName, destinationCountry: a.destinationCountry }
      await notify(a.userEmail, paymentReceivedEmail(info, amountText), a.userFullName)
      await notify(process.env.ADMIN_NOTIFY_EMAIL, adminAlert(`PAID: ${id}`, `${a.userFullName} paid ${amountText} for ${id} (${a.destinationCountry}). Dodo payment ${p.payment_id}.`))
    } else if (out.kind === 'mismatch') {
      await notify(process.env.ADMIN_NOTIFY_EMAIL, adminAlert(`CHECK PAYMENT: ${id}`, `Payment ${p.payment_id} for ${id} was ${amountText}, which is below the expected amount. The application was NOT marked paid. Please review it in Dodo and Firebase.`))
    } else if (out.kind === 'unknown') console.warn('payment for unknown application', id)

    return json({ received: true })
  } catch (e) {
    console.error('dodo webhook failed', e)
    return json({ error: 'Processing failed' }, 500) // non-2xx makes Dodo retry
  }
}
