import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { decide, getNat, setNat, toneClass, useVisaRules } from '../../lib/visa'
import { Pill, SectionHeader, Skeleton } from '../../components/ui'
import PassportSelect from './PassportSelect'
import Flag from '../../components/Flag'

export default function VisaHomePage() {
  const { data: rules, isLoading, isError, refetch } = useVisaRules()
  const [nat, setNatState] = useState(getNat())
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('ALL')

  const regions = useMemo(() => ['ALL', ...new Set((rules?.countries ?? []).map(c => c.region))], [rules])
  const list = useMemo(() => (rules?.countries ?? [])
    .filter(c => (region === 'ALL' || c.region === region) && c.countryName.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.countryName.localeCompare(b.countryName)), [rules, q, region])

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-bold tracking-widest text-gold">VISA ASSISTANCE</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Where is your journey taking you?</h1>
        <p className="max-w-2xl text-muted">Pick your passport and see the entry rules, fees and documents for every African destination.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <PassportSelect value={nat} onChange={c => { setNat(c); setNatState(c) }} />
        <label className="block"><span className="mb-1 block text-sm text-muted">Destination</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search any African country…"
            className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-gold" /></label>
      </div>

      {regions.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {regions.map(r => <button key={r} onClick={() => setRegion(r)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${region === r ? 'border-gold bg-gold text-gold-ink' : 'border-line text-muted hover:text-ink'}`}>
            {r === 'ALL' ? 'All regions' : r}</button>)}
        </div>
      )}

      {isLoading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>}
      {isError && <p className="text-muted">Couldn't load the visa rules. <button onClick={() => refetch()} className="text-gold underline">Try again</button></p>}

      {rules && (
        <section>
          <SectionHeader title={nat ? 'Entry requirements' : 'Destinations'} subtitle={nat ? undefined : 'Select your passport to see your requirements'} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(c => {
              const d = nat ? decide(rules, c.countryId, nat) : null
              return (
                <Link key={c.countryId} to={`/visa/${c.countryId}`} className="rounded-3xl border border-line bg-card p-5 transition hover:border-gold/60">
                  <div className="flex items-start justify-between">
                    <Flag code={c.countryCode} emoji={c.flagEmoji} className="h-8 w-12" />
                    {d && <Pill className={toneClass[d.tone]}>{d.shortLabel}</Pill>}
                  </div>
                  <p className="mt-3 font-bold">{c.countryName}</p>
                  <p className="text-sm text-muted">{d ? `${c.processingTime}${d.policy === 'VISA_FREE' ? '' : ` · ${d.govFee === 0 ? 'Free' : `$${d.govFee} gov fee`}`}` : c.region}</p>
                </Link>
              )
            })}
          </div>
          {list.length === 0 && <p className="text-muted">No destination matches that search.</p>}
          <p className="mt-8 text-xs text-muted">
            Rules last updated {new Date(rules.updatedAt).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}.
            Entry rules change, so always confirm with the official source before you travel.
          </p>
        </section>
      )}
    </main>
  )
}

