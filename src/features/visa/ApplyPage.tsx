import { useMemo, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getNat, passportName, targetForCountry, targetForGroup, useVisaRules } from '../../lib/visa'
import { createApplication, updateApplicationDetails, useApplication, type Traveller } from '../../lib/applications'
import { Skeleton } from '../../components/ui'

const MAX = 6
const blank = (): Traveller => ({ fullName: '', passportNumber: '', dateOfBirth: '', passportExpiry: '' })
const today = () => new Date().toISOString().slice(0, 10)

const vName = (v: string) => v.trim().length < 4 ? 'Enter your full name as on your passport' : !v.trim().includes(' ') ? 'Include first and last name' : null
const vPassport = (v: string) => /^[A-Z0-9]{6,9}$/.test(v.trim().toUpperCase()) ? null : 'Passport numbers are 6–9 letters or numbers, no spaces'
const vDob = (v: string) => !v ? 'Select the date of birth' : v >= today() ? 'Date of birth must be in the past' : new Date().getFullYear() - Number(v.slice(0, 4)) > 120 ? 'Please check the year' : null
const vExpiry = (v: string) => !v ? 'Select the passport expiry date' : v < today() ? 'This passport has expired' : null
const vEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : 'Enter a valid email address'
const sixMonths = (v: string) => { const d = new Date(); d.setMonth(d.getMonth() + 6); return !!v && v >= today() && v < d.toISOString().slice(0, 10) }

function Field({ label, error, hint, ...p }: { label: string; error?: string | null; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <input {...p} aria-invalid={!!error}
        className={`w-full rounded-2xl border bg-card px-4 py-3 outline-none focus:border-gold ${error ? 'border-red-400' : 'border-line'}`} />
      {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : hint ? <span className="mt-1 block text-xs text-amber">{hint}</span> : null}
    </label>
  )
}

interface FormTarget { name: string; flag: string; nationality: string; govFee: number; serviceFee: number; officialSource: string }

function DetailsForm({ target, email0, travellers0, submitLabel, onSubmit }: {
  target: FormTarget; email0: string; travellers0: Traveller[]; submitLabel: string
  onSubmit: (email: string, t: Traveller[]) => Promise<void>
}) {
  const [email, setEmail] = useState(email0)
  const [ts, setTs] = useState<Traveller[]>(travellers0.length ? travellers0 : [blank()])
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const set = (i: number, patch: Partial<Traveller>) => setTs(a => a.map((t, j) => (j === i ? { ...t, ...patch } : t)))
  const errs = ts.map(t => ({ name: vName(t.fullName), pass: vPassport(t.passportNumber), dob: vDob(t.dateOfBirth), exp: vExpiry(t.passportExpiry) }))
  const emailErr = vEmail(email)
  const valid = !emailErr && errs.every(e => !e.name && !e.pass && !e.dob && !e.exp)
  const total = (target.govFee + target.serviceFee) * ts.length
  const official = target.officialSource.startsWith('http') ? target.officialSource : null

  async function go(e: FormEvent) {
    e.preventDefault(); setShow(true)
    if (!valid) return
    setBusy(true); setErr(null)
    try {
      await onSubmit(email.trim(), ts.map(t => ({ ...t, fullName: t.fullName.trim(), passportNumber: t.passportNumber.trim().toUpperCase() })))
    } catch { setErr("We couldn't save your details. Please try again."); setBusy(false) }
  }

  return (
    <form onSubmit={go} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-line bg-card p-5 text-sm">
          <p className="font-semibold text-gold">Third-party service, not a government website</p>
          <p className="mt-1 text-muted">
            We prepare and submit your application for a service fee on top of the official government fee.
            {official && <> You can apply directly on the <a className="text-gold underline" href={official} target="_blank" rel="noopener noreferrer">official portal</a>.</>}
          </p>
        </div>

        {ts.map((t, i) => (
          <section key={i} className="space-y-4 rounded-3xl border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{i === 0 ? 'Traveller 1 (you)' : `Traveller ${i + 1}`}</h2>
              {i > 0 && <button type="button" onClick={() => setTs(a => a.filter((_, j) => j !== i))} className="text-sm text-red-300">Remove</button>}
            </div>
            <Field label="Full name (as on passport)" value={t.fullName} autoComplete={i === 0 ? 'name' : 'off'}
              onChange={e => set(i, { fullName: e.target.value })} error={show ? errs[i].name : null} />
            <Field label="Passport number" value={t.passportNumber} maxLength={9}
              onChange={e => set(i, { passportNumber: e.target.value.toUpperCase() })} error={show ? errs[i].pass : null} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date of birth" type="date" max={today()} value={t.dateOfBirth}
                onChange={e => set(i, { dateOfBirth: e.target.value })} error={show ? errs[i].dob : null} />
              <Field label="Passport expiry" type="date" min={today()} value={t.passportExpiry}
                onChange={e => set(i, { passportExpiry: e.target.value })} error={show ? errs[i].exp : null}
                hint={sixMonths(t.passportExpiry) ? 'Many countries need 6 months of validity beyond your travel date.' : undefined} />
            </div>
          </section>
        ))}

        {ts.length < MAX && (
          <button type="button" onClick={() => setTs(a => [...a, blank()])}
            className="w-full rounded-full border border-dashed border-line px-6 py-3 font-semibold text-muted hover:border-gold hover:text-gold">
            + Add another traveller ({ts.length}/{MAX})
          </button>
        )}
        <p className="text-xs text-muted">All travellers must hold a {passportName(target.nationality)} passport.</p>

        <section className="space-y-3 rounded-3xl border border-line bg-card p-6">
          <h2 className="text-lg font-bold">Contact</h2>
          <Field label="Email address" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            error={show ? emailErr : null} hint={undefined} />
          <p className="text-xs text-muted">Your decision and payment instructions are sent here.</p>
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-3xl border border-gold/30 bg-card p-6 lg:sticky lg:top-24">
        <p className="text-4xl">{target.flag}</p>
        <p className="font-bold">{target.name}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted">Government fee × {ts.length}</span><span>${(target.govFee * ts.length).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Service fee × {ts.length}</span><span>${(target.serviceFee * ts.length).toFixed(2)}</span></div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span className="text-gold">${total.toFixed(2)}</span></div>
        </div>
        {err && <p className="text-sm text-red-300">{err}</p>}
        {show && !valid && <p className="text-sm text-red-300">Please fix the highlighted fields.</p>}
        <button disabled={busy} className="w-full rounded-full bg-gold px-6 py-3 font-semibold text-gold-ink disabled:opacity-60">{busy ? 'Saving…' : submitLabel}</button>
        <p className="text-xs text-muted">Your progress is saved to your account, so you can continue later.</p>
      </aside>
    </form>
  )
}

const shell = (title: string, body: React.ReactNode) => (
  <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>{body}
  </main>
)

/** Routes: /visa/apply/:countryId and /visa/apply/group/:groupId */
export function ApplyPage() {
  const { countryId, groupId } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const { data: rules, isLoading } = useVisaRules()
  const nat = getNat()

  const target = useMemo(() => {
    if (!rules || !nat) return null
    return groupId ? targetForGroup(rules, groupId, nat) : targetForCountry(rules, Number(countryId), nat)
  }, [rules, nat, countryId, groupId])

  if (!nat) return <Navigate to={groupId ? '/visa' : `/visa/${countryId}`} replace />
  if (isLoading) return shell('Apply', <Skeleton className="h-96" />)
  if (!target || !user) return shell('Apply', <p className="text-muted">Online application isn't available for this route. <Link to="/visa" className="text-gold underline">Back to visa home</Link></p>)

  return shell(`Apply for ${target.name}`, (
    <DetailsForm target={target} email0={user.email ?? ''} travellers0={[]} submitLabel="Continue to documents"
      onSubmit={async (email, ts) => { const id = await createApplication(user.uid, target, email, ts); nav(`/visa/applications/${id}/documents`) }} />
  ))
}

/** Route: /visa/applications/:id/details */
export function EditDetailsPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const app = useApplication(id)
  if (app === undefined) return shell('Your details', <Skeleton className="h-96" />)
  if (!app) return shell('Your details', <p className="text-muted">Application not found.</p>)
  if (app.status !== 'DRAFT') return <Navigate to={`/visa/applications/${app.id}`} replace />

  const n = Math.max(1, app.travellers.length)
  const per = { govFee: app.govFee / n, serviceFee: app.serviceFee / n, groupId: app.groupVisaId }
  return shell('Your details', (
    <DetailsForm target={{ name: app.destinationCountry, flag: app.groupVisaId ? '🌍' : '🛂', nationality: app.nationality, ...per, officialSource: '' }}
      email0={app.email} travellers0={app.travellers} submitLabel="Save and continue"
      onSubmit={async (email, ts) => { await updateApplicationDetails(app.id, per, email, ts); nav(`/visa/applications/${app.id}/documents`) }} />
  ))
}
