import { Link, useParams } from 'react-router-dom'
import { useDestinations, useLive } from '../../lib/hooks'
import { timeAgo } from '../../lib/format'
import { Img, Pill, Skeleton } from '../../components/ui'
import { badgeText, categoryLabel, seatInfo, whenLabel } from './helpers'

export default function LiveDetailPage() {
  const { id } = useParams()
  const live = useLive()
  const dests = useDestinations()
  const o = live.data?.find(x => x.id === id)

  if (live.isLoading) return <main className="mx-auto max-w-5xl px-4 py-10"><Skeleton className="h-96" /></main>
  if (!o)
    return (
      <main className="mx-auto max-w-5xl px-4 py-24 text-center">
        <p className="text-lg font-semibold">This opportunity is no longer available.</p>
        <Link to="/live" className="mt-4 inline-block text-gold underline">See what's open now</Link>
      </main>
    )

  const seats = seatInfo(o)
  const booked = o.seatsTotal > 0 ? ((o.seatsTotal - o.seatsLeft) / o.seatsTotal) * 100 : 0
  const dest = dests.data?.find(d => d.id === o.destinationId)
  const badge = badgeText(o)

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <Link to="/live" className="text-sm text-muted hover:text-gold">← All live opportunities</Link>

      <section className="relative h-72 overflow-hidden rounded-[32px] border border-gold/25 sm:h-96">
        <Img src={o.imageUrl} alt={o.title} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute bottom-0 p-6 sm:p-10">
          <div className="mb-3 flex gap-2">
            <Pill className="bg-black/60 text-gold backdrop-blur">{categoryLabel(o.category)}</Pill>
            {badge && <Pill className="bg-gold text-gold-ink">{badge}</Pill>}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{o.title}</h1>
          <p className="mt-1 text-white/80">{o.location}, {o.country}</p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['When', whenLabel(o)], ['Duration', o.durationLabel],
              ['Group size', o.partyMin === o.partyMax ? `${o.partyMax}` : `${o.partyMin}–${o.partyMax}`],
              ['Operator', o.operatorName]].map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-line bg-card p-4">
                <p className="text-xs text-muted">{l}</p><p className="mt-1 font-semibold">{v}</p>
              </div>
            ))}
          </div>

          {o.included.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-bold">What's included</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {o.included.map(i => (
                  <li key={i} className="flex gap-2 rounded-2xl bg-gold-soft px-4 py-3">
                    <span className="text-gold">✓</span>{i}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-3xl border border-line bg-card p-5">
            <p className="font-semibold">
              {o.operatorName}
              {o.operatorVerified && <span className="ml-2 text-sm text-gold">✓ Verified operator</span>}
            </p>
            {o.confirmedAt && <p className="mt-1 text-sm text-muted">Availability confirmed {timeAgo(o.confirmedAt)}</p>}
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-gold/30 bg-card p-6 lg:sticky lg:top-24">
          <div>
            <p className="text-sm text-muted">From</p>
            <p className="text-4xl font-extrabold text-gold">{o.symbol}{o.price.toLocaleString()}
              <span className="text-sm font-normal text-muted"> /person</span></p>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className={seats.urgent ? 'font-semibold text-red-300' : 'text-muted'}>{seats.text}</span>
              <span className="text-muted">{o.seatsLeft}/{o.seatsTotal}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-gold" style={{ width: `${booked}%` }} />
            </div>
          </div>

          {o.bookingUrl ? (
            <a href={o.bookingUrl} target="_blank" rel="noopener noreferrer"
              className="block rounded-full bg-gold px-6 py-3 text-center font-semibold text-gold-ink">
              Book this opportunity
            </a>
          ) : (
            <>
              <p className="text-sm text-muted">Online booking isn't open for this listing yet.</p>
              {dest && (
                <Link to={`/destinations/${dest.id}`}
                  className="block rounded-full bg-gold px-6 py-3 text-center font-semibold text-gold-ink">
                  Explore {dest.name}
                </Link>
              )}
            </>
          )}
        </aside>
      </div>
    </main>
  )
}
