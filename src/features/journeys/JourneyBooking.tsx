import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../../lib/supabase'
import type { JourneyDetail } from '../../lib/journeys'
import { cancelDeadline, depositDueDate, payLaterOk, quote, split, type Plan, type Promo } from '../../lib/pricing'
import { formatMoney } from '../../lib/format'
import { nationalities } from '../../lib/visa'

type Step = 'select' | 'details' | 'review' | 'done'
interface Result { reference: string; status: string; total: number; currency: string; amount_due_now: number; balance_amount: number; balance_due_date: string | null }

const MESSAGES: [string, string][] = [
  ['SOLD_OUT', 'Sorry, that date no longer has enough spots. Please pick another.'],
  ['SLOT_UNAVAILABLE', "That date isn't available. Please pick another."],
  ['BAD_DATE', 'Please choose a date within the next year.'],
  ['BAD_GUESTS', 'Please check the number of guests.'],
  ['GROUP_TOO_LARGE', 'That is more guests than this journey allows.'],
  ['BAD_NAME', 'Please check your name.'], ['BAD_EMAIL', 'Please check your email address.'],
  ['BAD_PLAN', "That payment option isn't available for this date."],
  ['LOGIN_REQUIRED', 'Please sign in to send a request.'],
  ['TOO_MANY', 'Too many requests in a short time. Please try again later.'],
  ['NOT_FOUND', 'This journey is no longer available.'],
]
const friendly = (e: { message?: string; code?: string }) =>
  MESSAGES.find(([k]) => e.message?.includes(k))?.[1] ??
  (e.code === 'PGRST202' ? "Online booking isn't available yet. Please contact the operator." : "We couldn't send your request. Please try again.")

const dateLabel = (iso: string) => new Date(iso + 'T00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const input = 'w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-gold'

function Stepper({ label, hint, value, canMinus, canPlus, onMinus, onPlus }: { label: string; hint: string; value: number; canMinus: boolean; canPlus: boolean; onMinus: () => void; onPlus: () => void }) {
  const b = 'grid h-9 w-9 place-items-center rounded-full border border-line text-lg disabled:opacity-30'
  return (
    <div className="flex items-center justify-between">
      <div><p className="font-medium">{label}</p><p className="text-sm text-muted">{hint}</p></div>
      <div className="flex items-center gap-3">
        <button type="button" className={b} onClick={onMinus} disabled={!canMinus} aria-label={`Fewer ${label}`}>−</button>
        <span className="w-6 text-center font-semibold">{value}</span>
        <button type="button" className={b} onClick={onPlus} disabled={!canPlus} aria-label={`More ${label}`}>+</button>
      </div>
    </div>
  )
}

export default function JourneyBooking({ j, onClose }: { j: JourneyDetail; onClose: () => void }) {
  const { user } = useAuth()
  const loc = useLocation()
  const countries = useMemo(nationalities, [])

  const [step, setStep] = useState<Step>('select')
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(j.startTimes.length === 1 ? j.startTimes[0].slice(0, 5) : null)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [f, setF] = useState({ name: user?.displayName ?? '', email: user?.email ?? '', nat: '', whatsapp: '', emergency: '', others: '', dietary: '', access: '', requests: '' })
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<Promo | null>(null)
  const [promoMsg, setPromoMsg] = useState<string | null>(null)
  const [plan, setPlan] = useState<Plan>('full')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const set = (k: keyof typeof f, v: string) => setF(s => ({ ...s, [k]: v }))
  const hasSlots = j.slots.length > 0
  const slot = j.slots.find(s => s.date === date)
  const cap = Math.min(j.maxGroup ?? 30, slot?.spots ?? 30)
  const q = quote(j, slot, adults, children, promo)
  const clock = time ?? j.startTimes[0]?.slice(0, 5) ?? null
  const deadline = date ? cancelDeadline(j, date, clock) : null
  const depDate = date ? depositDueDate(j, date) : null
  const laterOk = payLaterOk(j, deadline)
  const active: Plan = plan === 'full' || (plan === 'deposit' && depDate) || (plan === 'pay_later' && laterOk) ? plan : 'full'
  const sp = date ? split(j, active, date, q.total, deadline) : null
  const tomorrow = new Date(Date.now() + 86_400_000).toLocaleDateString('en-CA')

  function pickDate(d: string) {
    const s = j.slots.find(x => x.date === d)
    const c = Math.min(j.maxGroup ?? 30, s?.spots ?? 30)
    const a = Math.min(adults, c)
    setDate(d); setAdults(a); setChildren(Math.min(children, Math.max(0, c - a))); setError(null)
  }
  function toDetails() {
    if (!date) return setError('Choose a date.')
    if (j.startTimes.length > 1 && !time) return setError('Choose a start time.')
    setError(null); setStep('details')
  }
  function toReview() {
    if (f.name.trim().length < 2) return setError('Please enter your full name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) return setError('Please enter a valid email address.')
    setError(null); setStep('review')
  }
  async function applyPromo() {
    const code = promoInput.trim().toUpperCase().slice(0, 40)
    if (!code) { setPromo(null); setPromoMsg(null); return }
    const today = new Date().toLocaleDateString('en-CA')
    const { data, error: e } = await supabase.from('promo_codes').select('code,percent_off').eq('code', code).eq('active', true)
      .or(`valid_until.is.null,valid_until.gte.${today}`).maybeSingle()
    if (e || !data) { setPromo(null); setPromoMsg("That code isn't valid.") }
    else { setPromo({ code: data.code, percentOff: Number(data.percent_off) }); setPromoMsg(`${data.percent_off}% off applied`) }
  }
  async function submit() {
    if (!user || !date) return
    setBusy(true); setError(null)
    const nz = (s: string) => (s.trim() ? s.trim() : null)
    const { data, error: e } = await supabase.rpc('request_itinerary_booking', {
      p_itinerary_id: j.id, p_user_id: user.uid, p_lead_name: f.name.trim(), p_lead_email: f.email.trim(),
      p_travel_date: date, p_adults: adults, p_children: children, p_start_time: clock,
      p_nationality: nz(f.nat), p_whatsapp: nz(f.whatsapp), p_emergency_contact: nz(f.emergency),
      p_other_travellers: nz(f.others), p_dietary_needs: nz(f.dietary), p_accessibility_needs: nz(f.access),
      p_special_requests: nz(f.requests), p_promo_code: promo?.code ?? null, p_payment_plan: active, p_payment_method: null,
    })
    setBusy(false)
    const row = Array.isArray(data) ? data[0] : data
    if (e || !row) return setError(friendly(e ?? {}))
    setResult(row as Result); setStep('done')
  }

  const shell = (children: React.ReactNode) => (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Book this journey" onClick={e => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-xl space-y-5 overflow-y-auto rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <p className="font-bold">{j.title}</p>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-muted hover:text-ink">×</button>
        </div>
        {children}
      </div>
    </div>
  )

  if (!user) return shell(
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">Sign in to book</h2>
      <p className="text-muted">We need your account to save the booking and let the operator reply to you. Use the same account as the app.</p>
      <Link to={`/signin?next=${encodeURIComponent(loc.pathname)}`} className="block rounded-full bg-gold px-6 py-3 text-center font-semibold text-gold-ink">Sign in or create account</Link>
    </div>)

  const err = error && <p className="text-sm text-red-700">{error}</p>
  const primary = 'w-full rounded-full bg-gold px-6 py-3 font-semibold text-gold-ink disabled:opacity-60'

  if (step === 'done' && result) return shell(
    <div className="space-y-4 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold text-2xl text-gold-ink">✓</div>
      <h2 className="text-2xl font-extrabold">Request sent</h2>
      <p className="font-semibold">Reference {result.reference}</p>
      <p className="text-muted">Total {formatMoney(result.total, result.currency)}
        {result.amount_due_now > 0 && ` · ${formatMoney(result.amount_due_now, result.currency)} due first`}
        {result.balance_amount > 0 && result.balance_due_date && ` · balance by ${dateLabel(result.balance_due_date)}`}</p>
      <p className="text-sm">{result.status === 'awaiting_payment' ? <>Check your email at <strong>{f.email}</strong> for payment instructions. Nothing has been charged.</>
        : result.status === 'confirmed' ? 'Your booking is confirmed. Nothing is due now.'
        : `${j.operator?.name ?? 'The operator'} will confirm by email or WhatsApp. Nothing has been charged.`}</p>
      <button onClick={onClose} className={primary}>Close</button>
    </div>)

  if (step === 'select') return shell(
    <div className="space-y-5">
      <h2 className="text-2xl font-extrabold">Choose date and guests</h2>
      {hasSlots ? (
        <div className="grid grid-cols-2 gap-2">
          {j.slots.map(s => (
            <button key={s.date} type="button" onClick={() => pickDate(s.date)}
              className={`rounded-2xl border p-3 text-left ${date === s.date ? 'border-gold bg-gold-soft' : 'border-line'}`}>
              <p className="font-semibold">{dateLabel(s.date)}</p>
              <p className={`text-xs ${s.spots != null && s.spots <= 3 ? 'text-red-700' : 'text-muted'}`}>{s.spots != null ? `${s.spots} left` : 'Available'}</p>
            </button>
          ))}
        </div>
      ) : (
        <label className="block"><span className="mb-1 block text-sm text-muted">Preferred date (the operator confirms)</span>
          <input type="date" min={tomorrow} className={input} value={date ?? ''} onChange={e => e.target.value && pickDate(e.target.value)} /></label>
      )}
      {j.startTimes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {j.startTimes.map(t => { const v = t.slice(0, 5); return (
            <button key={v} type="button" onClick={() => setTime(v)}
              className={`rounded-full border px-4 py-2 text-sm ${time === v ? 'border-gold bg-gold text-gold-ink' : 'border-line'}`}>{v}</button>) })}
        </div>
      )}
      <Stepper label="Adults" hint="Age 13+" value={adults} canMinus={adults > 1} canPlus={adults + children < cap} onMinus={() => setAdults(adults - 1)} onPlus={() => setAdults(adults + 1)} />
      <Stepper label="Children" hint="Under 13" value={children} canMinus={children > 0} canPlus={adults + children < cap} onMinus={() => setChildren(children - 1)} onPlus={() => setChildren(children + 1)} />
      {j.maxGroup != null && <p className="text-xs text-muted">Maximum group size: {j.maxGroup}</p>}
      {err}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <div><p className="text-sm text-muted">Estimated total</p><p className="text-2xl font-extrabold">{formatMoney(q.total, j.currency)}</p></div>
        <button onClick={toDetails} className="rounded-full bg-gold px-8 py-3 font-semibold text-gold-ink">Continue</button>
      </div>
    </div>)

  if (step === 'details') return shell(
    <div className="space-y-4">
      <button onClick={() => setStep('select')} className="text-sm text-muted hover:text-gold">← Change date or guests</button>
      <h2 className="text-2xl font-extrabold">Your details</h2>
      <input className={input} placeholder="Full name" value={f.name} onChange={e => set('name', e.target.value)} autoComplete="name" />
      <input className={input} type="email" placeholder="Email" value={f.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
      <select className={input} value={f.nat} onChange={e => set('nat', e.target.value)}>
        <option value="">Nationality (optional)</option>{countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
      </select>
      <input className={input} placeholder="WhatsApp (optional)" value={f.whatsapp} onChange={e => set('whatsapp', e.target.value)} inputMode="tel" />
      <input className={input} placeholder="Emergency contact (optional)" value={f.emergency} onChange={e => set('emergency', e.target.value)} />
      {adults + children > 1 && <textarea className={input} rows={2} placeholder="Names of other travellers (optional)" value={f.others} onChange={e => set('others', e.target.value)} />}
      <input className={input} placeholder="Dietary needs (optional)" value={f.dietary} onChange={e => set('dietary', e.target.value)} />
      <input className={input} placeholder="Accessibility needs (optional)" value={f.access} onChange={e => set('access', e.target.value)} />
      <textarea className={input} rows={2} placeholder="Special requests (optional)" value={f.requests} onChange={e => set('requests', e.target.value)} />

      <div className="flex gap-2">
        <input className={input} placeholder="Promo code" value={promoInput} onChange={e => setPromoInput(e.target.value)} />
        <button type="button" onClick={applyPromo} className="rounded-full border border-line px-5 font-semibold hover:border-gold">Apply</button>
      </div>
      {promoMsg && <p className={`text-sm ${promo ? 'text-gold' : 'text-red-700'}`}>{promoMsg}</p>}

      <fieldset className="space-y-2">
        <legend className="mb-1 font-semibold">Payment plan</legend>
        {([['full', 'Pay in full', `${formatMoney(q.total, j.currency)} in total`, true],
           ['deposit', `Pay a ${j.depositPercent}% deposit`, depDate ? `Balance due by ${dateLabel(depDate)}` : '', !!depDate],
           ['pay_later', 'Pay later', deadline ? `Nothing due until ${deadline.toLocaleDateString('en', { dateStyle: 'medium', timeZone: j.timezone })}` : '', laterOk]] as [Plan, string, string, boolean][])
          .filter(p => p[3]).map(([v, t, s]) => (
          <label key={v} className={`flex cursor-pointer gap-3 rounded-2xl border p-3 ${active === v ? 'border-gold bg-gold-soft' : 'border-line'}`}>
            <input type="radio" name="plan" checked={active === v} onChange={() => setPlan(v)} className="mt-1 accent-[#00796b]" />
            <span><span className="font-semibold">{t}</span><span className="block text-sm text-muted">{s}</span></span>
          </label>))}
        <p className="text-xs text-muted">Nothing is charged online yet. We email payment instructions.</p>
      </fieldset>
      {err}
      <button onClick={toReview} className={primary}>Review request</button>
    </div>)

  return shell(
    <div className="space-y-4">
      <button onClick={() => setStep('details')} className="text-sm text-muted hover:text-gold">← Edit details</button>
      <h2 className="text-2xl font-extrabold">Review your request</h2>
      <div className="space-y-1 rounded-2xl bg-gold-soft p-4 text-sm">
        <p className="font-semibold">{date && dateLabel(date)}{clock && ` · ${clock}`}</p>
        <p>{adults} adult{adults === 1 ? '' : 's'}{children > 0 && `, ${children} child${children === 1 ? '' : 'ren'}`}</p>
        <p className="text-muted">{f.name} · {f.email}</p>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-muted">{adults} × {formatMoney(q.adultUnit, j.currency)}</span><span>{formatMoney(q.adultUnit * adults, j.currency)}</span></div>
        {children > 0 && <div className="flex justify-between"><span className="text-muted">{children} × {formatMoney(q.childUnit, j.currency)}</span><span>{formatMoney(q.childUnit * children, j.currency)}</span></div>}
        {q.discount > 0 && <div className="flex justify-between text-gold"><span>Promo {promo?.code}</span><span>−{formatMoney(q.discount, j.currency)}</span></div>}
        {q.serviceFee > 0 && <div className="flex justify-between"><span className="text-muted">Service fee</span><span>{formatMoney(q.serviceFee, j.currency)}</span></div>}
        <div className="flex justify-between border-t border-line pt-2 text-lg font-bold"><span>Total</span><span>{formatMoney(q.total, j.currency)}</span></div>
        {sp && active !== 'full' && <div className="flex justify-between text-muted"><span>Due first</span><span>{formatMoney(sp.dueNow, j.currency)}</span></div>}
        {sp && sp.balance > 0 && <div className="flex justify-between text-muted"><span>Balance{sp.balanceDate && ` by ${dateLabel(sp.balanceDate)}`}</span><span>{formatMoney(sp.balance, j.currency)}</span></div>}
      </div>
      <p className="text-xs text-muted">
        {deadline ? <>Free cancellation until {deadline.toLocaleString('en', { dateStyle: 'full', timeStyle: 'short', timeZone: j.timezone })} ({j.timezone}).</> : (j.cancellationPolicy ?? 'Cancellation terms are set by the operator.')}
        {' '}Final amounts are confirmed by our server when you send the request.
      </p>
      {err}
      <button onClick={() => void submit()} disabled={busy} className={primary}>{busy ? 'Sending…' : 'Send booking request'}</button>
    </div>)
}
