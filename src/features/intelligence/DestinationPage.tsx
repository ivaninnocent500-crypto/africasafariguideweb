import { Link, useParams } from 'react-router-dom'
import { useClimate, useDestinations } from '../../lib/hooks'
import { rainLabel, seasonLabel } from '../../lib/climate'
import { MONTH_SHORT, formatBestMonths, formatMoney } from '../../lib/format'
import { Img, Pill, SectionHeader, Skeleton } from '../../components/ui'
import OperatorPicker from '../operators/OperatorPicker'


export default function DestinationPage() {
  const { id } = useParams()
  const { data, isLoading } = useDestinations()
  const d = data?.find(x => x.id === id)
  const climate = useClimate(d)
  const month = new Date().getMonth() + 1

  if (isLoading) return <main className="mx-auto max-w-6xl px-4 py-10"><Skeleton className="h-96" /></main>
  if (!d)
    return (
      <main className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-lg font-semibold">Destination not found.</p>
        <Link to="/" className="mt-4 inline-block text-teal underline">Back to intelligence</Link>
      </main>
    )

  const now = climate.data?.months[month - 1]
  const maxRain = Math.max(...(climate.data?.months.map(m => m.rainMm) ?? [1]), 1)

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-8">
      <section className="relative h-80 overflow-hidden rounded-[32px] bg-navy sm:h-[26rem]">
        <Img src={d.heroImageUrl} alt={d.name} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
        <div className="absolute bottom-0 p-6 text-white sm:p-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{d.name}</h1>
          <p className="mt-1 text-white/85">{d.country}</p>
          <p className="mt-3 max-w-2xl text-white/85">{d.shortDescription}</p>
        </div>
      </section>

      <section>
        <SectionHeader title="Conditions this month" subtitle="Typical conditions from past records, not a forecast" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Weather" value={now && !Number.isNaN(now.tMax) ? `${Math.round(now.tMin)}° – ${Math.round(now.tMax)}°C` : climate.isLoading ? '…' : 'Unavailable'}
                sub={now ? rainLabel(now.rainMm) : ''} />
          <Stat label="Season rating" value={seasonLabel(d.seasonal[month - 1])} sub="From our seasonal scoring" />
          <Stat label="Best months" value={formatBestMonths(d.bestMonths)} sub={`${d.bestMonths.length} peak months`} />
        </div>

        {climate.data && (
          <div className="mt-6 rounded-3xl border border-line bg-white p-5">
            <p className="mb-4 font-semibold">Average rainfall by month</p>
            <div className="grid grid-cols-12 items-end gap-2">
              {climate.data.months.map(m => (
                <div key={m.month} className="flex flex-col items-center gap-1">
                  <div className="flex h-32 w-full items-end">
                    <div className={`w-full rounded-t-lg ${m.month === month ? 'bg-teal' : 'bg-teal/35'}`}
                         style={{ height: `${Math.max(4, (m.rainMm / maxRain) * 100)}%` }}
                         title={`${Math.round(m.rainMm)} mm`} />
                  </div>
                  <span className="text-[10px] text-muted sm:text-xs">{MONTH_SHORT[m.month - 1]}</span>
                  <span className="hidden text-xs font-semibold sm:block">{Number.isNaN(m.tMax) ? '' : `${Math.round(m.tMax)}°`}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">
              Averages of daily records {climate.data.fromYear}–{climate.data.toYear}. Temperatures shown are daily highs.
            </p>
          </div>
        )}
      </section>

      {d.topExperiences.length > 0 && (
        <section>
          <SectionHeader title="Top experiences" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.topExperiences.map(x => (
              <div key={x.title} className="overflow-hidden rounded-3xl border border-line bg-white">
                <Img src={x.imageUrl} alt={x.title} className="h-36 w-full" />
                <div className="p-4"><p className="font-bold">{x.title}</p><p className="text-sm text-muted">{x.subtitle}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {d.activities.length > 0 && (
 
        <section>
          <SectionHeader title="Activities" />
          <div className="flex flex-wrap gap-2">
            {d.activities.map(a => <Pill key={a} className="bg-teal-soft text-teal">{a}</Pill>)}
          </div>
        </section>
      )}
<OperatorPicker destinationId={d.id} destinationName={d.name} />
      <section>
        <SectionHeader title="Packages from" subtitle="Per person" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[['Standard', d.budgetPrice], ['Premium', d.basePrice], ['Luxury', d.luxuryPrice], ['VIP', d.ultraLuxuryPrice]].map(([n, p]) => (
            <div key={n as string} className="rounded-3xl border border-line bg-white p-5">
              <p className="text-sm text-muted">{n}</p>
              <p className="text-2xl font-extrabold">{formatMoney(p as number, 'USD')}</p>
            </div>
          ))}
        </div>
        <Link to="/visa" className="mt-6 inline-block rounded-full bg-navy px-6 py-3 font-semibold text-white">
          Check visa requirements
        </Link>
      </section>
    </main>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl bg-teal-soft p-5">
      <p className="text-sm font-semibold text-teal">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  )
}
