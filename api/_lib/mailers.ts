export interface Mail { to: string; toName?: string; subject: string; html: string; text: string; replyTo?: string }

export async function sendEmail(m: Mail) {
  const provider = (process.env.EMAIL_PROVIDER ?? 'brevo').toLowerCase()
  const fromName = process.env.EMAIL_FROM_NAME ?? 'Africa Safari Guide'
  const fromAddress = process.env.EMAIL_FROM_ADDRESS
  if (!fromAddress) throw new Error('EMAIL_FROM_ADDRESS is not set')

  if (provider === 'resend') {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <${fromAddress}>`, to: [m.to], subject: m.subject, html: m.html, text: m.text, reply_to: m.replyTo }),
    })
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`)
    return
  }

  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY ?? '', 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: fromName, email: fromAddress }, to: [{ email: m.to, name: m.toName }],
      subject: m.subject, htmlContent: m.html, textContent: m.text,
      replyTo: m.replyTo ? { email: m.replyTo } : undefined,
    }),
  })
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${await r.text()}`)
}
