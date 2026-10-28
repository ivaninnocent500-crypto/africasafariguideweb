import DodoPayments from 'dodopayments'

/** Test mode unless DODO_PAYMENTS_ENVIRONMENT is exactly "live_mode". */
export function dodoClient() {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY
  if (!bearerToken) throw new Error('DODO_PAYMENTS_API_KEY is not set')
  return new DodoPayments({
    bearerToken,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode',
  })
}

export function siteUrl() {
  const u = process.env.SITE_URL ?? process.env.VITE_SITE_URL
  return (u ?? `https://${process.env.VERCEL_URL ?? 'localhost:3000'}`).replace(/\/$/, '')
}
