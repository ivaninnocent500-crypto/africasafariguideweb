const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const usd = (n: unknown) => `$${Number(n || 0).toFixed(2)}`
const para = (t: string) => t.split(/\n{2,}/).map(p => `<p style="margin:0 0 12px">${esc(p).replace(/\n/g, '<br>')}</p>`).join('')

interface App { applicationId: string; userFullName?: string; userEmail?: string; destinationCountry?: string; travellerCount?: number
  govFee?: number; serviceFee?: number; totalFee?: number; paymentUrl?: string }

const SHELL = (body: string) => `<!doctype html><html><body style="margin:0;background:#faf8f4;font-family:Arial,Helvetica,sans-serif;color:#14202e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e0d8;border-radius:16px;overflow:hidden">
<tr><td style="background:#0e1f36;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:bold">Africa Safari Guide</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.55">${body}</td></tr>
<tr><td style="padding:16px 24px;background:#faf8f4;font-size:12px;color:#5b6673">Africa Safari Guide is a private travel service, not a government website.</td></tr>
</table></td></tr></table></body></html>`

export function paymentEmail(a: App) {
  const instructions = process.env.PAYMENT_INSTRUCTIONS?.trim() ||
    'Our team will reply to this email with the payment details shortly.'
  const link = a.paymentUrl?.startsWith('https://') ? a.paymentUrl : null
  const n = a.travellerCount ?? 1
  const subject = `Payment instructions for your ${a.destinationCountry ?? 'visa'} application (${a.applicationId})`
  const html = SHELL(`
    <p style="margin:0 0 12px">Hello ${esc(a.userFullName ?? 'traveller')},</p>
    <p style="margin:0 0 16px">Thank you. We received your application <strong>${esc(a.applicationId)}</strong> for <strong>${esc(a.destinationCountry)}</strong> (${n} traveller${n === 1 ? '' : 's'}).</p>
    <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="border:1px solid #e4e0d8;border-radius:8px;margin-bottom:16px">
      <tr><td>Government fee</td><td align="right">${usd(a.govFee)}</td></tr>
      <tr><td>Service fee</td><td align="right">${usd(a.serviceFee)}</td></tr>
      <tr><td style="border-top:1px solid #e4e0d8"><strong>Total due</strong></td><td align="right" style="border-top:1px solid #e4e0d8"><strong>${usd(a.totalFee)}</strong></td></tr>
    </table>
    <h3 style="margin:0 0 8px;font-size:16px">How to pay</h3>
    ${para(instructions)}
    ${link ? `<p style="margin:16px 0"><a href="${esc(link)}" style="background:#00796b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">Pay now</a></p>` : ''}
    <p style="margin:0 0 12px">Please quote <strong>${esc(a.applicationId)}</strong> as your reference. Once your payment is confirmed we will start processing, and you can follow progress in your account.</p>`)
  const text = `Hello ${a.userFullName ?? 'traveller'},\n\nWe received application ${a.applicationId} for ${a.destinationCountry} (${n} traveller${n === 1 ? '' : 's'}).\n\nGovernment fee: ${usd(a.govFee)}\nService fee: ${usd(a.serviceFee)}\nTotal due: ${usd(a.totalFee)}\n\nHow to pay:\n${instructions}\n${link ? `\nPay now: ${link}\n` : ''}\nPlease quote ${a.applicationId} as your reference.`
  return { subject, html, text }
}

export function adminNotice(a: App) {
  const subject = `New visa application ${a.applicationId}: ${a.destinationCountry}`
  const text = `${a.userFullName} (${a.userEmail}) submitted ${a.applicationId} for ${a.destinationCountry}. Travellers: ${a.travellerCount ?? 1}. Total: ${usd(a.totalFee)}. Payment instructions were emailed. Open it in the Firebase console, visa_applications.`
  return { subject, text, html: SHELL(`<p>${esc(text)}</p>`) }
}
export function paymentReceivedEmail(a: { applicationId: string; userFullName?: string; destinationCountry?: string }, paidText: string) {
  const subject = `Payment received for ${a.applicationId}`
  const html = SHELL(`
    <p style="margin:0 0 12px">Hello ${esc(a.userFullName ?? 'traveller')},</p>
    <p style="margin:0 0 12px">We received your payment of <strong>${esc(paidText)}</strong> for application <strong>${esc(a.applicationId)}</strong> (${esc(a.destinationCountry)}).</p>
    <p style="margin:0">Our team will now process it. You can follow progress any time in your account.</p>`)
  const text = `Hello ${a.userFullName ?? 'traveller'},\n\nWe received your payment of ${paidText} for application ${a.applicationId} (${a.destinationCountry}).\nOur team will now process it. You can follow progress in your account.`
  return { subject, html, text }
}

export function adminAlert(subject: string, text: string) {
  return { subject, text, html: SHELL(`<p>${esc(text)}</p>`) }
}