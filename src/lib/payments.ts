import { auth } from './firebase';

import { requestPaymentEmail } from './email'





export interface PaymentRequest {
  applicationId: string; amount: number; currency: 'USD'
  description: string; customerEmail: string; customerName: string
}
export type PaymentOutcome =
  | { kind: 'instructions_by_email' }
  | { kind: 'redirect'; url: string }

export interface PaymentProvider { id: string; start(req: PaymentRequest): Promise<PaymentOutcome> }

/** Active today: no charge, the traveller is told to check their email. */
//const manual: PaymentProvider = { id: 'manual', start: async () => ({ kind: 'instructions_by_email' }) }

const manual: PaymentProvider = {
  id: 'manual',
  start: async req => { void requestPaymentEmail(req.applicationId); return { kind: 'instructions_by_email' } },
}

/**
 * Ready for Dodo. Only the application id is sent. The server reads the amount from Firestore,
 * so the browser can't tamper with the price. Server skeleton is in the notes below.
 */
const dodo: PaymentProvider = {
  id: 'dodo',
  async start(req) {
    const token = await auth.currentUser?.getIdToken()
    const base = import.meta.env.VITE_PAYMENTS_API ?? ''
    const res = await fetch(`${base}/api/payments/dodo/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ applicationId: req.applicationId }),
    })
    if (!res.ok) throw new Error('Payment could not be started')
    const { url } = (await res.json()) as { url: string }
    return { kind: 'redirect', url }
  },
}

export const getPaymentProvider = (): PaymentProvider =>
  import.meta.env.VITE_PAYMENT_PROVIDER === 'dodo' ? dodo : manual
