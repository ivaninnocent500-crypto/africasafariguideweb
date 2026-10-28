import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { decide, getNat, passportName, setNat, toneClass, useVisaRules } from '../../lib/visa'
import { Pill, Skeleton } from '../../components/ui'
import Flag from '../../components/Flag'
import PassportSelect from './PassportSelect'

const usd = (n: number) => (n === 0 ? 'Free' : `$${n.toFixed(2)}`)
const btn = 'rounded-full px-6 py-3 text-center font-semibold'

export default function VisaEligibilityPage() {
  const { countryId } = useParams()
  const { data: rules, isLoading, isError } = useVisaRules()
  const [nat, setNatState] = useState(getNat())

  if (isLoading) return <main className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-96" /></main>
  if (isError || !rules) return <main className="mx-auto max-w-3xl px-4 py-24 text-center text-muted">Couldn't load the visa rules. Please try again shortly.</main>

  const country = rules.countries.find(c => c.countryId === Number(countryId))
  if (!country) return <main className="mx-auto max-w-3xl px-4 py-24 text-center"><p>Destination not found.</p><Link to="/visa" className="text-teal underline">Back to visa home</Link></main>

  const d = nat ? decide(rules, country.countryId, nat) : null
  const official = country.officialSource?.startsWith('http') ? country.officialSource : null
  const needsVisaStep = d && (d.policy === 'E_VISA' || d.policy === 'EMBASSY_REQUIRED')

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link to="/visa" className="text-sm text-muted hover:text-teal">← All destinations</Link>
      <header className="flex items-center gap-4">
        <Flag code={country.countryCode} emoji={country.flagEmoji} />
        <div><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{country.countryName}</h1><p className="text-muted">{country.region}</p></div>
      </header>

      <PassportSelect value={nat} onChange={c => { setNat(c); setNatState(c) }} />

      {!d && <p className="rounded-3xl border border-line bg-card p-6 text-muted">Select your passport to see the entry rules for {country.countryName}.</p>}

      {d && (
        <>
          <section className="space-y-3 rounded-3xl border border-line bg-card p-6">
            <Pill className={toneClass[d.tone]}>{d.shortLabel}</Pill>
            <h2 className="text-2xl font-extrabold">{d.headline}</h2>
            <p className="text-muted">{d.detail}</p>
            {d.note && <p className="text-sm text-teal">{d.note}</p>}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div><p className="text-xs text-muted">Processing</p><p className="font-bold">{country.processingTime}</p></div>
              <div><p className="text-xs text-muted">Stay allowed</p><p className="font-bold">{country.validityDays} days</p></div>
            </div>
            <p className="text-xs text-muted">For {passportName(d.nationality)} passport holders.</p>
          </section>

          {d.documents.length > 0 && (
            <section className="rounded-3xl border border-line bg-card p-6">
              <h3 className="mb-3 font-bold">Required documents</h3>
              <ul className="space-y-2">{d.documents.map(x => <li key={x}><span className="text-teal">✓</span> {x}</li>)}</ul>
            </section>
          )}

          {country.tips?.[0] && <p className="rounded-3xl bg-teal-soft p-5 text-sm"><span className="font-semibold text-teal">Tip: </span>{country.tips[0]}</p>}

          {d.groupVisa && d.policy !== 'VISA_FREE' && (
            <section className="rounded-3xl border border-teal/40 bg-card p-6">
              <p className="font-bold">Visiting more than one country? {d.groupVisa.name}</p>
              <p className="mt-1 text-sm text-muted">{d.groupVisa.pitch}</p>
              <p className="mt-2 text-sm">{usd(d.groupVisa.govFee)} government fee · {d.groupVisa.processingTime} · valid {d.groupVisa.validityDays} days</p>
              <Link to={`/visa/apply/group/${d.groupVisa.id}`} className="mt-4 inline-block rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white">
                Apply for the combined visa
              </Link>
            </section>
          )}

          {d.policy !== 'VISA_FREE' && d.policy !== 'REFERRAL_REQUIRED' && (
            <section className="rounded-3xl border border-line bg-card p-6">
              <h3 className="mb-3 font-bold">{d.policy === 'VISA_ON_ARRIVAL' ? 'Estimated fee at the border' : 'Estimated fees'}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted">Government fee</span><span>{usd(d.govFee)}</span></div>
                {d.policy !== 'VISA_ON_ARRIVAL' && <div className="flex justify-between"><span className="text-muted">Our service fee</span><span>{usd(d.serviceFee)}</span></div>}
                {d.policy !== 'VISA_ON_ARRIVAL' && <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span className="text-teal">{usd(d.totalFee)}</span></div>}
              </div>
              <p className="mt-3 text-xs text-muted">
                {d.policy === 'VISA_ON_ARRIVAL' ? 'Paid directly at the border, not through us.' : 'Africa Safari Guide is a third-party service, not a government website. The service fee covers preparing and submitting your application, and you can always apply directly through the official portal.'}
              </p>
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            {d.canApply && <Link to={`/visa/apply/${country.countryId}`} className={`${btn} bg-teal text-white`}>Start application</Link>}
            {official && <a href={official} target="_blank" rel="noopener noreferrer" className={`${btn} border border-line hover:border-teal`}>Open official government source</a>}
          </div>

          {needsVisaStep && !d.canApply && (
            <p className="text-sm text-muted">We can't submit this route online for your passport. Please use the official source above.</p>
          )}
        </>
      )}
    </main>
  )
}
