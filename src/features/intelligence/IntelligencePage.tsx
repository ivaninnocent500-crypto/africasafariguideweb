import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDestinations, useEvents, useLive } from '../../lib/hooks'
import type { Crowd, Destination, EventItem } from '../../lib/githubData'
import { formatBestMonths, formatMoney } from '../../lib/format'
import { Img, Pill, SectionHeader, Skeleton } from '../../components/ui'
import LiveCard from '../live/LiveCard'


const crowdStyle: Record<Crowd, string> = {
  LOW: 'bg-green-100 text-green-800', MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800', VERY_HIGH: 'bg-red-100 text-red-800',
}

function eventWhen(e: EventItem) {
  if (e.isLive) return 'Happening now'
  if (e.daysUntil === 0) return 'Today'
  if (e.daysUntil === 1) return 'Tomorrow'
  return `In ${e.daysUntil} days`
}

export default function IntelligencePage() {
  const dest = useDestinations()
  const ev = useEvents()
  const live = useLive()
  const liveItems = live.data ?? []
  const month = new Date().getMonth() + 1
  const monthName = new Date().toLocaleString('en', { month: 'long' })

  const view = useMemo(() => {
    const all = dest.data ?? []
    const trending = [...all].sort((a, b) => b.popularityScore - a.popularityScore).slice(0, 6)
    const rising = [...all].sort((a, b) => b.trendGrowth - a.trendGrowth).slice(0, 8)
    const seasonal = all.filter(d => d.bestMonths.includes(month))
      .sort((a, b) => b.seasonal[month - 1] - a.seasonal[month - 1]).slice(0, 8)
    const cheapest = [...all].filter(d => d.basePrice > 0).sort((a, b) => a.basePrice - b.basePrice)[0]
    return { all, trending, rising, seasonal, cheapest }
  }, [dest.data, month])

  const events = (ev.data ?? []).slice(0, 6)

  const signals = [
    view.seasonal[0] && { id: 's', title: 'Best season now', value: view.seasonal[0].name,
      sub: `Peak ${formatBestMonths(view.seasonal[0].bestMonths)}`, to: view.seasonal[0].id },
    view.trending[0] && view.trending[0].trendGrowth > 0 && { id: 't', title: 'Strongest momentum',
      value: `+${Math.round(view.trending[0].trendGrowth)}%`, sub: view.trending[0].name, to: view.trending[0].id },
    events[0] && { id: 'e', title: 'Next event', value: events[0].name,
      sub: `${eventWhen(events[0])} · ${events[0].location}`, to: events[0].destinationIds[0] },
    view.cheapest && { id: 'p', title: 'Best value', value: formatMoney(view.cheapest.basePrice, 'USD'),
      sub: `Starting price · ${view.cheapest.name}`, to: view.cheapest.id },
  ].filter(Boolean) as { id: string; title: string; value: string; sub: string; to?: string }[]

  if (dest.isError)
    return (
      <main className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-lg font-semibold">We couldn't load travel data right now.</p>
        <button onClick={() => dest.refetch()} className="mt-4 rounded-full bg-teal px-6 py-3 font-semibold text-white">
          Try again
        </button>
      </main>
    )

  return (
    <main className="mx-auto max-w-6xl space-y-14 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Africa Travel Intelligence</h1>
          <p className="mt-2 text-muted">
            {dest.dataUpdatedAt
              ? `Updated ${new Date(dest.dataUpdatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
              : 'Loading latest data…'}
          </p>
        </div>
        <div className="flex gap-3">
          {[
            ['Destinations', view.all.length],
            ['Upcoming events', events.length],
            ['In season now', view.seasonal.length],
            ...(liveItems.length ? [['Live now', liveItems.length]] : [])
          ].map(([l, n]) => (
            <div key={l} className="rounded-2xl bg-navy px-5 py-3 text-white">
              <p className="text-xl font-bold">{n}</p><p className="text-xs text-white/70">{l}</p>
            </div>
          ))}
        </div>
      </header>

      {liveItems.length > 0 && (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <SectionHeader eyebrow="LIVE NOW" title="Last-minute opportunities"
              subtitle={`${liveItems.length} open right now`} />
            <Link to="/live" className="mb-5 text-sm font-semibold text-gold">View all →</Link>
          </div>
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
            {liveItems.slice(0, 8).map(o => <LiveCard key={o.id} o={o} className="w-80 shrink-0 snap-start" />)}
          </div>
        </section>
      )}

      {dest.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      )}

      {view.trending.length > 0 && (
        <section>
          <SectionHeader eyebrow="TRENDING" title="Trending across Africa" subtitle="Popularity and momentum from our travel data" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {view.trending.map(d => <TrendingCard key={d.id} d={d} />)}
          </div>
        </section>
      )}

      {view.seasonal.length > 0 && (
        <section>
          <SectionHeader eyebrow="SEASONAL" title="Best right now" subtitle={`In season for ${monthName}`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {view.seasonal.map(d => (
              <Link key={d.id} to={`/destinations/${d.id}`} className="group overflow-hidden rounded-3xl border border-line bg-white transition hover:shadow-lg">
                <Img src={d.heroImageUrl} alt={d.name} className="h-40 w-full transition group-hover:scale-105" />
                <div className="space-y-1 p-4">
                  <Pill className="bg-teal-soft text-teal">IN SEASON</Pill>
                  <p className="pt-1 font-bold">{d.name}</p>
                  <p className="text-sm text-muted">{d.country}</p>
                  <p className="text-sm text-muted">Best months: {formatBestMonths(d.bestMonths)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section>
          <SectionHeader eyebrow="EVENTS" title="Events radar" subtitle="Festivals and cultural moments in the next 120 days" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(e => (
              <article key={e.id} className="relative aspect-[1.45] overflow-hidden rounded-[28px] bg-navy text-white">
                <Img src={e.imageUrl} alt={e.name} className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 top-0 flex gap-2 p-4">
                  {e.isLive && <Pill className="bg-red-500 text-white">LIVE</Pill>}
                  {e.tags.slice(0, 2).map(t => <Pill key={t} className="bg-black/40 capitalize text-white">{t}</Pill>)}
                </div>
                <div className="absolute inset-x-0 bottom-0 space-y-2 p-5">
                  <h3 className="line-clamp-2 text-xl font-extrabold leading-tight">{e.name}</h3>
                  <p className="text-sm text-white/80">{e.location} · {eventWhen(e)}</p>
                  <div className="flex items-center justify-between">
                    <Pill className={crowdStyle[e.crowd]}>{e.crowd.replace('_', ' ')}</Pill>
                    {e.interested > 0 && <span className="text-xs text-white/80">{e.interested.toLocaleString()} interested</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {signals.length > 0 && (
        <section>
          <SectionHeader eyebrow="SIGNALS" title="Travel signals" subtitle="Calculated from the data above" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {signals.map(s => {
              const body = (
                <div className="h-full rounded-3xl bg-teal-soft p-5">
                  <p className="text-sm font-semibold text-teal">{s.title}</p>
                  <p className="mt-3 line-clamp-2 text-xl font-extrabold">{s.value}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{s.sub}</p>
                </div>
              )
              return s.to ? <Link key={s.id} to={`/destinations/${s.to}`}>{body}</Link> : <div key={s.id}>{body}</div>
            })}
          </div>
        </section>
      )}

      {view.rising.length > 0 && (
        <section>
          <SectionHeader eyebrow="RISING" title="Rising destinations" subtitle="Fastest growth in our data" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {view.rising.map(d => (
              <Link key={d.id} to={`/destinations/${d.id}`} className="flex items-center gap-3 rounded-3xl border border-line bg-white p-3 transition hover:shadow-md">
                <Img src={d.heroImageUrl} alt={d.name} w={160} className="h-16 w-16 shrink-0 rounded-2xl" />

                <div className="min-w-0">
                  <p className="truncate font-bold">{d.name}</p>
                  <p className="truncate text-sm text-muted">{d.country}</p>
                  <p className="text-xs font-semibold text-green-700">+{Math.round(d.trendGrowth)}% growth</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

function TrendingCard({ d }: { d: Destination }) {
  return (
    <Link to={`/destinations/${d.id}`} className="group relative block aspect-[1.3] overflow-hidden rounded-[28px] bg-navy text-white">
      <Img src={d.heroImageUrl} alt={d.name} className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="mb-2 flex gap-2">
          <Pill className="bg-green-600 text-white">{Math.round(d.popularityScore * 100)}% popularity</Pill>
          {d.trendGrowth > 0 && <Pill className="bg-blue-600 text-white">+{Math.round(d.trendGrowth)}%</Pill>}
        </div>
        <h3 className="text-2xl font-extrabold">{d.name}</h3>
        <p className="text-sm text-white/80">{d.country}</p>
        <p className="mt-1 line-clamp-2 text-sm text-white/80">{d.shortDescription}</p>
      </div>
    </Link>
  )
}

