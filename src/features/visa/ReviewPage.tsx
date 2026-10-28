import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { docKey, submitApplication, useApplication } from '../../lib/applications'
import { getPaymentProvider } from '../../lib/payments'
import { passportName, useVisaRules } from '../../lib/visa'
import { Skeleton } from '../../components/ui'

const mask = (p: string) => (p.length <= 3 ? p : '•'.repeat(p.length - 3) + p.slice(-3))

export default function ReviewPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const app = useApplication(id)
  const { data: rules } = useVisaRules()
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (app === undefined) return <main className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-96" /></main>
  if (!app || !user || app.userId !== user.uid) return <main className="mx-auto max-w-3xl px-4 py-24 text-center text-muted">Application not found.</main>
  if (app.status !== 'DRAFT') return <Navigate to={`/visa/applications/${app.id}`} replace />

  const n = Math.max(1, app.travellers.length)
  const missing = Array.from({ length: n }).some((_, i) => app.requiredDocs.some(d => !app.uploadedDocs[docKey(i, d)]))
  if (missing || app.travellers.length === 0) return <Navigate to={`/visa/applications/${app.id}/documents`} replace />

  const processing = app.groupVisaId
    ? rules?.groupVisas.find(g => g.id === app.groupVisaId)?.processingTime
    : rules?.countries.find(c => c.countryId === app.destinationCountryId)?.processingTime

  async function submit() {
    if (!app) return
    setBusy(true); setErr(null)
    try {
      await submitApplication(app.id)
      const out = await getPaymentProvider().start({
        applicationId: app.id, amount: app.totalFee, currency: 'USD',
        description: `${app.destinationCountry} visa application`, customerEmail: app.email, customerName: app.leadName,
      })
      if (out.kind === 'redirect') window.location.assign(out.url)
      else nav(`/visa/applications/${app.id}?submitted=1`)
    } catch { setErr("We couldn't submit your application. Please try again."); setBusy(false) }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link to={`/visa/applications/${app.id}/documents`} className="text-sm text-muted hover:text-gold">← Documents</Link>
      <h1 className="text-3xl font-extrabold tracking-tight">Review your application</h1>

      <section className="rounded-3xl border border-line bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">{app.destinationCountry}</h2>
          <Link to={`/visa/applications/${app.id}/details`} className="text-sm text-gold">Edit</Link>
        </div>
        <p className="mb-4 text-sm text-muted">{passportName(app.nationality)} passport · {app.email}</p>
        <div className="space-y-4">
          {app.travellers.map((t, i) => (
            <div key={i} className="grid gap-1 rounded-2xl bg-gold-soft p-4 text-sm sm:grid-cols-2">
              <p className="font-semibold sm:col-span-2">{t.fullName}</p>
              <p><span className="text-muted">Passport </span>{mask(t.passportNumber)}</p>
              <p><span className="text-muted">Born </span>{t.dateOfBirth}</p>
              <p><span className="text-muted">Expires </span>{t.passportExpiry}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-card p-6">
        <h2 className="mb-3 font-bold">Documents uploaded</h2>
        <ul className="space-y-1 text-sm">{app.requiredDocs.map(d => <li key={d}><span className="text-gold">✓</span> {d}{n > 1 && <span className="text-muted"> × {n}</span>}</li>)}</ul>
      </section>

      <section className="space-y-2 rounded-3xl border border-line bg-card p-6 text-sm">
        <h2 className="mb-2 font-bold">Cost</h2>
        <div className="flex justify-between"><span className="text-muted">Government fee{n > 1 && ` × ${n}`}</span><span>${app.govFee.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Service fee{n > 1 && ` × ${n}`}</span><span>${app.serviceFee.toFixed(2)}</span></div>
        <div className="flex justify-between border-t border-line pt-2 text-lg font-bold"><span>Total</span><span className="text-gold">${app.totalFee.toFixed(2)}</span></div>
        <p className="pt-2 text-xs text-muted">This is a third-party preparation service. The government fee is paid on to the issuing authority.</p>
      </section>

      <section className="rounded-3xl bg-gold-soft p-6 text-sm">
        <p className="font-semibold text-gold">What happens next</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
          <li>You submit. Your application is saved and visible to our team.</li>
          <li>{getPaymentProvider().id === 'dodo' ? 'You pay securely online after you submit.' : `We email payment instructions to ${app.email}.`}</li>
          <li>{processing ? `Typical processing time is ${processing}.` : 'We update the status on your application page.'}</li>
        </ol>
      </section>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} className="mt-1 h-4 w-4 accent-[#e3b448]" />
        <span>I confirm the details match each traveller's passport. Mismatches are a common reason for rejection.</span>
      </label>
      {err && <p className="text-sm text-red-300">{err}</p>}
      <button onClick={submit} disabled={!ok || busy}
        className="w-full rounded-full bg-gold px-6 py-3.5 font-semibold text-gold-ink disabled:opacity-50">
        {busy ? 'Submitting…' : 'Submit application'}
      </button>
    </main>
  )
}

