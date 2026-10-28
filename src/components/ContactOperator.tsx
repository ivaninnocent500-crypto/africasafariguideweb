interface Contact { email?: string | null; phone?: string | null; website?: string | null }

export default function ContactOperator({ c, message, subject, label = 'Request a quote' }:
  { c: Contact; message: string; subject: string; label?: string }) {
  const digits = (c.phone ?? '').replace(/\D/g, '')
  const site = c.website ? (c.website.startsWith('http') ? c.website : `https://${c.website}`) : null
  const primary = 'rounded-full bg-gold px-5 py-2.5 text-center text-sm font-semibold text-gold-ink'
  const second = 'rounded-full border border-line px-5 py-2.5 text-center text-sm font-semibold hover:border-gold'

  if (digits.length < 7 && !c.email && !site)
    return <p className="text-sm text-muted">Contact details aren't published yet.</p>

  return (
    <div className="flex flex-wrap gap-2">
      {digits.length >= 7 && (
        <a className={primary} target="_blank" rel="noopener noreferrer"
           href={`https://wa.me/${digits}?text=${encodeURIComponent(message)}`}>{label} on WhatsApp</a>
      )}
      {c.email && (
        <a className={digits.length >= 7 ? second : primary}
           href={`mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}>
          {digits.length >= 7 ? 'Email' : `${label} by email`}
        </a>
      )}
      {site && <a className={second} href={site} target="_blank" rel="noopener noreferrer">Website</a>}
    </div>
  )
}

