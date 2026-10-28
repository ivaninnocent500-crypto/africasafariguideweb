import { useOperators, TOP_N, type Operator } from '../../lib/operators'
import { formatMoney } from '../../lib/format'
import { Pill, SectionHeader, Skeleton } from '../../components/ui'
import ContactOperator from '../../components/ContactOperator'

const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
const mins = (n: number) => (n < 60 ? `${Math.round(n)} min` : `${(n / 60).toFixed(n % 60 ? 1 : 0)} h`)

function highlights(o: Operator) {
  const h = ['Verified operator']
  if ((o.years ?? 0) >= 5) h.push(`${o.years} years operating`)
  if ((o.fleet ?? 0) > 0) h.push(`Fleet of ${o.fleet}`)
  if ((o.rating ?? 0) >= 4.5 && o.reviews >= 10) h.push(`Rated ${o.rating!.toFixed(1)} by ${o.reviews.toLocaleString()} travellers`)
  return h.slice(0, 3)
}

const ROWS: { label: string; get: (o: Operator) => number | null; fmt: (n: number, o: Operator) => string; better: 'high' | 'low' }[] = [
  { label: 'Rating', get: o => o.rating, fmt: n => `${n.toFixed(1)} / 5`, better: 'high' },
  { label: 'Reviews', get: o => (o.reviews > 0 ? o.reviews : null), fmt: n => n.toLocaleString(), better: 'high' },
  { label: 'Price from', get: o => o.priceFrom, fmt: (n, o) => `${formatMoney(n, o.currency)} pp`, better: 'low' },
  { label: 'Years operating', get: o => o.years, fmt: n => `${n} yrs`, better: 'high' },
  { label: 'Fleet size', get: o => (o.fleet && o.fleet > 0 ? o.fleet : null), fmt: n => `${n}`, better: 'high' },
  { label: 'Response time', get: o => o.responseMin, fmt: n => mins(n), better: 'low' },
  { label: 'Booking success', get: o => o.successPct, fmt: n => `${Math.round(n)}%`, better: 'high' },
  { label: 'Cancellations', get: o => o.cancelPct, fmt: n => `${Math.round(n)}%`, better: 'low' },
  { label: 'Repeat travellers', get: o => o.repeatPct, fmt: n => `${Math.round(n)}%`, better: 'high' },
]

export default function OperatorPicker({ destinationId, destinationName }: { destinationId: string; destinationName: string }) {
  const { data, isLoading, isError, refetch } = useOperators(destinationId)

  return (
    <section>
      <SectionHeader eyebrow="OPERATORS" title={`Safari operators for ${destinationName}`}
        subtitle={data && data.total > 0 ? `Top ${data.top.length} of ${data.total} verified operators for this destination` : 'Verified local operators'} />

      {isLoading && <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-64" />)}</div>}
      {isError && <p className="text-muted">Couldn't load operators. <button onClick={() => refetch()} className="text-gold underline">Try again</button></p>}
      {data && data.top.length === 0 && (
        <p className="rounded-3xl border border-line bg-card p-6 text-muted">No verified operators are listed for {destinationName} yet.</p>
      )}

      {data && data.top.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {data.top.map((o, i) => (
              <article key={o.id} className={`flex flex-col gap-4 rounded-3xl border bg-card p-5 ${i === 0 ? 'border-gold/60' : 'border-line'}`}>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold font-extrabold text-gold-ink">{initials(o.name)}</div>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{o.name}</p>
                    <p className="text-sm text-muted">
                      {o.rating != null ? `★ ${o.rating.toFixed(1)} · ${o.reviews.toLocaleString()} reviews` : 'New on the platform'}
                    </p>
                  </div>
                </div>
                {i === 0 && <Pill className="w-fit bg-gold text-gold-ink">Best match</Pill>}
                <ul className="space-y-1 text-sm text-muted">
                  {highlights(o).map(h => <li key={h}><span className="text-gold">✓</span> {h}</li>)}
                </ul>
                <p className="mt-auto text-lg font-extrabold text-gold">
                  {o.priceFrom != null ? <>{formatMoney(o.priceFrom, o.currency)}<span className="text-xs font-normal text-muted"> /person</span></> : <span className="text-base font-semibold text-muted">Price on request</span>}
                </p>
                <ContactOperator c={o} subject={`Safari quote: ${destinationName}`}
                  message={`Hello ${o.name}, I found you on Africa Safari Guide and I'd like a quote for ${destinationName}.`} />
              </article>
            ))}
          </div>

          {data.top.length >= 2 && (
            <div className="overflow-x-auto rounded-3xl border border-line bg-card">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line"><th className="p-4 font-medium text-muted">Side by side</th>
                    {data.top.map(o => <th key={o.id} className="p-4 font-bold">{o.name}</th>)}</tr>
                </thead>
                <tbody>
                  {ROWS.map(r => {
                    const vals = data.top.map(o => r.get(o))
                    const known = vals.filter((v): v is number => v != null)
                    if (known.length === 0) return null
                    const best = r.better === 'high' ? Math.max(...known) : Math.min(...known)
                    const mark = known.length >= 2 && new Set(known).size > 1
                    return (
                      <tr key={r.label} className="border-b border-line last:border-0">
                        <td className="p-4 text-muted">{r.label}</td>
                        {data.top.map((o, i) => {
                          const v = vals[i]
                          return <td key={o.id} className={`p-4 ${v != null && mark && v === best ? 'font-bold text-gold' : ''}`}>
                            {v == null ? '—' : <>{mark && v === best && '✓ '}{r.fmt(v, o)}</>}</td>
                        })}
                      </tr>
                    )
                  })}
                  {data.top.some(o => o.specialty) && (
                    <tr><td className="p-4 text-muted">Specialises in</td>
                      {data.top.map(o => <td key={o.id} className="p-4">{o.specialty ?? '—'}</td>)}</tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted">Showing the {TOP_N} best matches. Ranking uses rating, review volume, years operating and response time.</p>
        </div>
      )}
    </section>
  )
}
