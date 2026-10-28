import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { statusMeta, useApplication, type VisaApplication } from '../../lib/applications'
import { toneClass, useVisaRules } from '../../lib/visa'
import { Pill, Skeleton } from '../../components/ui'

import { useState } from 'react' 
import { requestPaymentEmail } from '../../lib/email'
import { getPaymentProvider } from '../../lib/payments'

const STAGES = [
  { label: 'Submitted', detail: 'Your application has been received by our team.' },
  { label: 'Under review', detail: 'Your documents and details are being checked.' },
  { label: 'Decision', detail: 'The decision is issued and your visa appears here.' },
]

export default function ApplicationPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const app = useApplication(id)
  const { data: rules } = useVisaRules()

  if (app === undefined) return <main className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-96" /></main>
  if (!app || !user || app.userId !== user.uid) return <main className="mx-auto max-w-3xl px-4 py-24 text-center text-muted">Application not found. <Link to="/visa/applications" className="text-gold underline">My applications</Link></main>

  const meta = statusMeta[app.status]
  const stage = app.status === 'SUBMITTED' ? 0 : app.status === 'UNDER_REVIEW' ? 1 : app.status === 'DRAFT' ? -1 : 2
  const processing = app.groupVisaId
    ? rules?.groupVisas.find(g => g.id === app.groupVisaId)?.processingTime
    : rules?.countries.find(c => c.countryId === app.destinationCountryId)?.processingTime
  const pdf = app.visaPdfUrl?.startsWith('https://') ? app.visaPdfUrl : null
  const wa = (import.meta.env.VITE_SUPPORT_WHATSAPP ?? '').replace(/\D/g, '')
  const help = `Hello, I need help with my ${app.destinationCountry} visa application (Ref: ${app.id})`

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link to="/visa/applications" className="text-sm text-muted hover:text-gold">← My applications</Link>

      {params.get('submitted') && app.status === 'SUBMITTED' && !app.isPaid && (
        <PaymentNotice app={app} confirming={params.get('confirming') === '1'} />
      )}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-gold">REFERENCE</p>
          <h1 className="text-2xl font-extrabold">{app.id}</h1>
          <p className="text-muted">{app.destinationCountry}</p>
        </div>
        <div className="flex gap-2">
          <Pill className={toneClass[meta.tone]}>{meta.label}</Pill>
          {app.status !== 'DRAFT' && <Pill className={app.isPaid ? 'bg-green-500/15 text-green-300' : 'bg-white/10 text-ink'}>{app.isPaid ? 'Paid' : 'Awaiting payment'}</Pill>}
        </div>
      </header>

      {app.status === 'DRAFT' ? (
        <Link to={`/visa/applications/${app.id}/documents`} className="block rounded-full bg-gold px-6 py-3 text-center font-semibold text-gold-ink">Continue application</Link>
      ) : (
        <section className="rounded-3xl border border-line bg-card p-6">
          <h2 className="mb-4 font-bold">Application progress</h2>
          <ol className="space-y-5">
            {STAGES.map((s, i) => {
              const passed = i <= stage
              const current = i === stage
              return (
                <li key={s.label} className="flex gap-4">
                  <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${passed ? 'bg-gold text-gold-ink' : 'bg-line text-muted'}`}>{i < stage ? '✓' : i + 1}</span>
                  <div>
                    <p className={current ? 'font-extrabold' : passed ? '' : 'text-muted'}>
                      {i === 2 && app.status === 'REJECTED' ? 'Needs attention' : s.label}
                      {i === 0 && app.submittedAt && <span className="ml-2 text-sm font-normal text-muted">{new Date(app.submittedAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                    </p>
                    {current && <p className="text-sm text-muted">{s.detail}{i === 1 && processing ? ` Typical processing: ${processing}.` : ''}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {app.status === 'REJECTED' && (
        <div className="rounded-3xl bg-red-500/10 p-5 text-sm">
          <p className="font-semibold text-red-300">Action required</p>
          <p className="mt-1 text-muted">Your application needs attention. Check your email for the specific reason or contact support below. Most issues are fixable.</p>
        </div>
      )}

      {app.status === 'APPROVED' && (pdf
        ? <a href={pdf} target="_blank" rel="noopener noreferrer" className="block rounded-full bg-gold px-6 py-3 text-center font-semibold text-gold-ink">Download approved visa (PDF)</a>
        : <p className="rounded-3xl bg-gold-soft p-5 text-sm text-gold">Approved. Your PDF is being prepared and will appear here shortly.</p>)}

      {app.status !== 'DRAFT' && (
        <section className="rounded-3xl border border-line bg-card p-6 text-sm">
          <div className="flex justify-between"><span className="text-muted">Total</span><span className="font-bold text-gold">${app.totalFee.toFixed(2)}</span></div>
          {app.travellers.length > 0 && <p className="mt-2 text-muted">Travellers: {app.travellers.map(t => t.fullName).join(', ')}</p>}
        </section>
      )}

      {wa.length >= 7 && (
        <a href={`https://wa.me/${wa}?text=${encodeURIComponent(help)}`} target="_blank" rel="noopener noreferrer"
          className="block rounded-full border border-line px-6 py-3 text-center font-semibold hover:border-gold">Chat with support</a>
      )}
    </main>
  )
}

function PaymentNotice({ app, confirming }: { app: VisaApplication; confirming: boolean }) {
  const provider = getPaymentProvider()
  const [s, setS] = useState<'idle' | 'sending' | 'sent' | 'already' | 'failed' | 'paying'>('idle')

  async function resend() { setS('sending'); setS(await requestPaymentEmail(app.id)) }
  async function payNow() {
    setS('paying')
    try {
      const out = await provider.start({ applicationId: app.id, amount: app.totalFee, currency: 'USD',
        description: `${app.destinationCountry} visa application`, customerEmail: app.email, customerName: app.leadName })
      if (out.kind === 'redirect') { window.location.assign(out.url); return }
      setS('idle')
    } catch { setS('failed') }
  }

  if (confirming) return (
    <div className="rounded-3xl border border-teal/40 bg-teal-soft p-6">
      <p className="text-lg font-bold text-teal">Thank you. We're confirming your payment.</p>
      <p className="mt-1 text-sm text-muted">This page updates by itself, usually within a minute. If it still says "Awaiting payment" after a few minutes, contact support with your reference.</p>
    </div>
  )

  return (
    <div className="rounded-3xl border border-teal/40 bg-teal-soft p-6">
      <p className="text-lg font-bold text-teal">Next step: payment</p>
      {provider.id === 'dodo' ? (
        <>
          <p className="mt-1">Pay securely online with our payment partner, Dodo Payments.</p>
          <button onClick={() => void payNow()} disabled={s === 'paying'} className="mt-3 rounded-full bg-teal px-6 py-3 font-semibold text-white disabled:opacity-60">
            {s === 'paying' ? 'Opening checkout…' : `Pay $${app.totalFee.toFixed(2)} now`}
          </button>
          {app.paymentStatus === 'failed' && <p className="mt-2 text-sm text-red-700">Your last payment did not go through. You can try again.</p>}
        </>
      ) : (
        <>
          <p className="mt-1">Check your email at <strong>{app.email}</strong> for payment instructions.</p>
          <p className="mt-1 text-sm text-muted">Can't find it? Look in your spam folder, or send it again.</p>
          <button onClick={() => void resend()} disabled={s === 'sending'} className="mt-3 rounded-full border border-teal px-5 py-2 text-sm font-semibold text-teal disabled:opacity-60">
            {s === 'sending' ? 'Sending…' : 'Send it again'}
          </button>
          {s === 'sent' && <p className="mt-2 text-sm text-teal">Sent. Please check your inbox.</p>}
          {s === 'already' && <p className="mt-2 text-sm text-muted">We sent it a few minutes ago. Check your spam folder, or wait 10 minutes to resend.</p>}
        </>
      )}
      {s === 'failed' && <p className="mt-2 text-sm text-red-700">We couldn't do that. Please try again or contact support with your reference.</p>}
    </div>
  )
}

