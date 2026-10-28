import { auth } from './firebase'

export async function requestPaymentEmail(applicationId: string): Promise<'sent' | 'already' | 'failed'> {
  try {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch('/api/send-payment-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ applicationId }),
    })
    if (!res.ok) return 'failed'
    return (await res.json()).alreadySent ? 'already' : 'sent'
  } catch { return 'failed' }
}