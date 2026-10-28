import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import Stepper from '../../components/Stepper'
import { dateLabel, MAX_GUESTS, quote, requestExperienceBooking, slotSummary, type ExpBookingResult, type ExpBundle } from '../../lib/experiences'
import { formatMoney } from '../../lib/format'

type Step = 'select' | 'details' | 'done'
const input = 'w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-teal'

export default function ExperienceBooking({ b, initialDate, onClose }: { b: ExpBundle; initialDate: string | null; onClose: () => void }) {
  const { detail: d, slots, slotsAreRequests } = b
  const { user } = useAuth()
  const loc = useLocation()

  const dates = useMemo(() => [...new Set(slots.map(s => s.date))], [slots])
  const [step, setStep] = useState<Step>('select')
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [name, setName] = useState(user?.displayName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [whatsapp, setWhatsapp] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExpBookingResult | null>(null)

  const times = useMemo(() => [...new Set(slots.filter(s => s.date === date).map(s => s.time).filter(Boolean))] as string[], [slots, date])
  const slot = slots.find(s => s.date === date && s.time === time)
  const cap = Math.max(1, Math.min(d.maxGroup ?? MAX_GUESTS, slot?.spots ?? MAX_GUESTS))

  function pickDate(next: string) {
    const ts = [...new Set(slots.filter(s => s.date === next).map(s => s.time).filter(Boolean))] as string[]
    const t = ts.length === 1 ? ts[0] : null
    const s = slots.find(x => x.date === next && x.time === t)
    const c = Math.max(1, Math.min(d.maxGroup ?? MAX_GUESTS, s?.spots ?? MAX_GUESTS))
    const a = Math.min(adults, c)
    setDate(next); setTime(t); setAdults(a); setChildren(Math.min(children, Math.max(0, c - a))); setError(null)
  }
  function pickTime(t: string) {
    const s = slots.find(x => x.date === date && x.time === t)
    const c = Math.max(1, Math.min(d.maxGroup ?? MAX_GUESTS, s?.spots ?? MAX_GUESTS))
    const a = Math.min(adults, c)
    setTime(t); setAdults(a); setChildren(Math.min(children, Math.max(0, c - a))); setError(null)
  }

  useEffect(() => { if (initialDate && dates.includes(initialDate)) pickDate(initialDate) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function toDetails() {
    if (!date) return setError('Choose a date.')
    if (times.length > 0 && !time) return setError('Choose a start time.')
    setError(null); setStep('details')
  }

  async function submit() {
    if (!user || !date || busy) return
    if (name.trim().length < 2) return setError('Please enter your full name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Please enter a valid email address.')
    setBusy(true); setError(null)
    try {
      setResult(await requestExperienceBooking({
        experienceId: d.id, userId: user.uid, name: name.trim(), email: email.trim(), date, adults, children,
        whatsapp: whatsapp.trim() || null, startTime: time, notes: notes.trim() || null,
      }))
      setStep('done')
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') } finally { setBusy(false) }
  }

  const shell = (body: React.ReactNode) => (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Check availability" onClick={e => e.stopPropagation()}
        className="max-h-[92d
      vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4"><p className="font-bold">{d.title}</p>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-muted hover:text-ink">×</button></div>
        {body}
      </div>
    </div>
  )
  const err = error && <p className="text-sm text-red-700">{error}</p>
  const primary = 'w-full rounded-full bg-teal px-6 py-3 font-semibold text-white disabled:opacity-60'

  if (!user) return shell(
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">Sign in to continue</h2>
      <p className="text-muted">We need your account to save your request and let the operator reply to you.</p>
      <Link to={`/signin?next=${encodeURIComponent(loc.pathname)}`} className="block rounded-full bg-teal px-6 py-3 text-center font-semibold text-white">Sign in or create account</Link>
    </div>)

  if (step === 'done' && result) return shell(
    <div className="space-y-4 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal text-2xl text-white">✓</div>
      <h2 className="text-2xl font-extrabold">Request sent</h2>
      <p className="font-semibold">Reference {result.reference}</p>
      <p className="text-muted">Estimated total {formatMoney(result.total, result.currency)}</p>
      <p className="text-sm text-muted">{b.operator?.name ?? 'The operator'} will confirm your request by email or WhatsApp. Nothing has been charged.</p>
      <button onClick={onClose} className={primary}>Close</button>
    </div>)

  if (step === 'details') return shell(
    <div className="space-y-4">
      <button onClick={() => setStep('select')} className="text-sm text-muted hover:text-teal">← Change date or guests</button>
      <h2 className="text-2xl font-extrabold">Your details</h2>
      <div className="space-y-1 rounded-2xl bg-white p-4 text-sm">
        <p className="font-semibold">{date && dateLabel(date)}{time && ` · ${time}`}</p>
        <p className="text-muted">{adults} adult{adults === 1 ? '' : 's'}{children > 0 && `, ${children} child${children === 1 ? '' : 'ren'}`}</p>
        <p className="font-semibold">Estimated total {formatMoney(quote(d, slot, adults, children), d.currency)}</p>
      </div>
      <input className={input} placeholder="Full name" value={name} onChange={e => setName(e.target.value.slice(0, 100))} autoComplete="name" />
      <input className={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value.slice(0, 200))} autoComplete="email" />
      <input className={input} placeholder="WhatsApp (optional)" inputMode="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value.slice(0, 30))} />
      <textarea className={input} rows={3} placeholder="Special requests (optional)" value={notes} onChange={e => setNotes(e.target.value.slice(0, 1000))} />
      <p className="text-sm text-muted">You won't be charged now. The operator reviews your request and replies by email or WhatsApp.</p>
      {err}
      <button onClick={() => void submit()} disabled={busy} className={primary}>{busy ? 'Sending…' : 'Send request'}</button>
    </div>)

  return shell(
    <div className="space-y-5">
      <h2 className="text-2xl font-extrabold">Choose date and time</h2>
      {slotsAreRequests && <p className="text-sm text-muted">These dates are requests. The operator confirms before you pay anything.</p>}
      {dates.length === 0 ? <p className="text-muted">No dates are open right now. Please check back soon.</p> : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {dates.map(dt => (
            <button key={dt} type="button" onClick={() => pickDate(dt)}
              className={`shrink-0 rounded-2xl border px-4 py-3 text-left ${date === dt ? 'border-teal bg-teal-soft' : 'border-line'}`}>
              <p className="font-semibold">{dateLabel(dt)}</p>
              <p className="text-xs text-muted">{slotSummary(slots.filter(s => s.date === dt)) ?? '\u00a0'}</p>
            </button>
          ))}
        </div>
      )}
      {times.length > 0 && (
        <div><p className="mb-2 font-semibold">Start time</p>
          <div className="flex flex-wrap gap-2">
            {times.map(t => <button key={t} type="button" onClick={() => pickTime(t)}
              className={`rounded-full border px-4 py-2 text-sm ${time === t ? 'border-teal bg-teal text-white' : 'border-line'}`}>{t}</button>)}
          </div></div>
      )}
      <Stepper label="Adults" hint="Age 13+" value={adults} canMinus={adults > 1} canPlus={adults + children < cap} onMinus={() => setAdults(adults - 1)} onPlus={() => setAdults(adults + 1)} />
      <Stepper label="Children" hint="Under 13" value={children} canMinus={children > 0} canPlus={adults + children < cap} onMinus={() => setChildren(children - 1)} onPlus={() => setChildren(children + 1)} />
      {d.maxGroup != null && <p className="text-xs text-muted">Maximum group size: {d.maxGroup}</p>}
      {err}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <div><p className="text-sm text-muted">Estimated total</p><p className="text-2xl font-extrabold">{formatMoney(quote(d, slot, adults, children), d.currency)}</p></div>
        <button onClick={toDetails} disabled={dates.length === 0} className="rounded-full bg-teal px-8 py-3 font-semibold text-white disabled:opacity-60">Continue</button>
      </div>
    </div>)
}
