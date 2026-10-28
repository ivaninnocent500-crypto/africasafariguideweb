import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useJourney } from '../../lib/journeys'
import { durationLabel, formatBestMonths, formatMoney } from '../../lib/format'
import { Img, Pill, Skeleton } from '../../components/ui'
import ContactOperator from '../../components/ContactOperator'
import JourneyBooking from './JourneyBooking'

const when = (iso: string) => new Date(iso + 'T00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })
const countryName = (code: string | null) => { try { return code ? new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) : null } catch { return code } }

export default function JourneyDetailPage() {
  const { id } = useParams()
  const { data: j, isLoading } = useJourney(id)
  const [img, setImg] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [booking, setBooking] = useState(false)

  if (isLoading) return <main className="mx-auto max-w-6xl px-4 py-10"><Skeleton className="h-96" /></main>
  if (!j) return (
    <main className="mx-auto max-w-6xl px-4 py-24 text-center">
      <p className="text-lg font-semibold">This itinerary is no longer available.</p>
      <Link to="/journeys" className="mt-4 inline-block text-teal underline">Browse journeys</Link>
    </main>
  )

  const avg = j.reviews.length ? j.reviews.reduce((s, r) => s + r.rating, 0) / j.reviews.length : null
  const shownReviews = showAll ? j.reviews : j.reviews.slice(0, 3)
  const from = Math.min(j.price, ...j.slots.map(s => s.price ?? Infinity))
  const op = j.operator

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <Link to="/journeys" className="text-sm text-muted hover:text-teal">← All journeys</Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          <section className="space-y-3">
            <div className="relative h-72 overflow-hidden rounded-[32px] bg-navy sm:h-[26rem]">
              <Img src={j.gallery[img]} alt={`${j.title} photo ${img + 1}`} className="h-full w-full" />
            </div>
            {j.gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {j.gallery.map((u, i) => (
                  <button key={u} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-2xl border-2 ${i === img ? 'border-teal' : 'border-transparent opacity-70'}`}>
                    <Img src={u} alt="" className="h-full w-full" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <p className="text-xs font-bold tracking-widest text-teal">{(j.location ?? j.themeLabel).toUpperCase()}</p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{j.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {avg != null && <span className="text-amber">★ {avg.toFixed(1)} <span className="text-muted">({j.reviews.length} reviews)</span></span>}
              {op?.verified && <Pill className="bg-teal-soft text-teal">Verified operator</Pill>}
              {j.instantBook && <Pill className="bg-teal-soft text-teal">Instant book</Pill>}
              {(j.freeCancelHours ?? 0) > 0 && <Pill className="bg-teal-soft text-teal">Free cancellation up to {j.freeCancelHours} h before</Pill>}
            </div>
            {(j.description ?? j.tagline) && <p className="leading-relaxed text-muted">{j.description ?? j.tagline}</p>}
          </section>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['Duration', durationLabel(j.durationValue, j.durationUnit)],
              ['Group size', j.maxGroup ? `Up to ${j.maxGroup}` : null],
              ['Best months', j.bestMonths.length ? formatBestMonths(j.bestMonths) : null],
              ['Start times', j.startTimes.length ? j.startTimes.map(t => t.slice(0, 5)).join(', ') : null]]
              .filter(([, v]) => v).map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-line bg-card p-4"><p className="text-xs text-muted">{l}</p><p className="mt-1 font-semibold">{v}</p></div>
            ))}
          </div>

          {j.highlights.length > 0 && (
            <section><h2 className="mb-3 text-2xl font-bold">Highlights</h2>
              <ul className="space-y-1.5">{j.highlights.map(h => <li key={h}><span className="text-teal">•</span> {h}</li>)}</ul></section>
          )}

          {j.days.length > 0 && (
            <section>
              <h2 className="mb-3 text-2xl font-bold">Itinerary</h2>
              <div className="space-y-3">
                {j.days.map((d, i) => (
                  <details key={d.id} open={i === 0} className="group rounded-3xl border border-line bg-card p-5">
                    <summary className="flex cursor-pointer list-none items-center gap-4">
                      <span className="text-2xl font-extrabold text-teal">{String(d.n).padStart(2, '0')}</span>
                      <span className="flex-1 font-semibold">{d.title}</span>
                      <span className="text-muted transition group-open:rotate-180">⌄</span>
                    </summary>
                    <div className="mt-4 space-y-4">
                      {d.description && <p className="text-muted">{d.description}</p>}
                      {d.activities.map(a => (
                        <div key={a.id} className="flex gap-4">
                          <Img src={a.imageUrl} alt={a.name} className="h-16 w-16 shrink-0 rounded-2xl" />
                          <div><p className="font-medium">{a.name}{a.durationText && <span className="text-sm text-muted"> · {a.durationText}</span>}</p>
                            {a.description && <p className="text-sm text-muted">{a.description}</p>}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {(j.included.length > 0 || j.excluded.length > 0) && (
            <section><h2 className="mb-3 text-2xl font-bold">What's included</h2>
              <ul className="grid gap-2 sm:grid-cols-2">{j.included.map(i => <li key={i} className="rounded-2xl bg-teal-soft px-4 py-3"><span className="text-teal">✓</span> {i}</li>)}</ul>
              {j.excluded.length > 0 && <p className="mt-3 text-sm text-muted">Not included: {j.excluded.join(', ')}</p>}</section>
          )}

          {(j.meetingPoint || j.accessibility) && (
            <section className="space-y-2"><h2 className="text-2xl font-bold">Good to know</h2>
              {j.meetingPoint && <p><span className="text-muted">Meeting point:</span> {j.meetingPoint}</p>}
              {j.lat != null && j.lng != null && (
                <a className="inline-block text-teal underline" target="_blank" rel="noopener noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${j.lat},${j.lng}`}>Get directions</a>)}
              {j.accessibility && <p className="text-muted">{j.accessibility}</p>}</section>
          )}

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Traveller reviews</h2>
            {avg == null ? <p className="text-muted">No reviews yet. They appear once travellers complete this trip.</p> : (
              <>
                <div className="flex items-center gap-6">
                  <p className="text-5xl font-extrabold">{avg.toFixed(1)}</p>
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map(s => {
                      const n = j.reviews.filter(r => r.rating === s).length
                      return <div key={s} className="flex items-center gap-2 text-xs text-muted"><span className="w-3">{s}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><div className="h-full bg-amber" style={{ width: `${(n / j.reviews.length) * 100}%` }} /></div>
                        <span className="w-6 text-right">{n}</span></div>
                    })}
                  </div>
                </div>
                {shownReviews.map(r => (
                  <article key={r.id} className="rounded-3xl border border-line bg-card p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{[r.name, r.country].filter(Boolean).join(', ')}</p>
                      <span className="text-amber">{'★'.repeat(Math.round(r.rating))}</span>
                    </div>
                    <p className="text-sm text-muted">{[r.type, r.tripDate && `Travelled ${r.tripDate}`, r.verified && 'Verified booking'].filter(Boolean).join(' · ')}</p>
                    {r.comment && <p className="mt-2">{r.comment}</p>}
                    {r.reply && <div className="mt-3 rounded-2xl bg-teal-soft p-3 text-sm"><p className="font-semibold">Reply from the operator</p><p className="text-muted">{r.reply}</p></div>}
                  </article>
                ))}
                {j.reviews.length > 3 && <button onClick={() => setShowAll(s => !s)} className="rounded-full border border-line px-5 py-2 text-sm font-semibold hover:border-teal">
                  {showAll ? 'Show fewer' : `Show all ${j.reviews.length} reviews`}</button>}
              </>
            )}
          </section>

          <section><h2 className="mb-2 text-2xl font-bold">Cancellation</h2>
            <p className="text-muted">{j.cancellationPolicy ?? 'Cancellation terms are set by the operator and confirmed before you pay.'}</p></section>
        </div>

        <aside className="h-fit space-y-5 rounded-3xl border border-teal/30 bg-card p-6 lg:sticky lg:top-24">
          <div>
            <p className="text-sm text-muted">From</p>
            <p className="text-4xl font-extrabold text-teal">{formatMoney(from, j.currency)}<span className="text-sm font-normal text-muted"> /person</span></p>
            {j.priceChild != null && <p className="text-sm text-muted">Children {formatMoney(j.priceChild, j.currency)}</p>}
            <p className="text-xs text-muted">{j.taxesIncluded ? 'Taxes included' : 'Taxes may apply'}</p>
          </div>
          {j.slots.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Upcoming dates</p>
              <ul className="space-y-1.5 text-sm">
                {j.slots.slice(0, 5).map(s => (
                  <li key={s.date} className="flex justify-between"><span>{when(s.date)}</span>
                    <span className={s.spots != null && s.spots <= 3 ? 'text-red-700' : 'text-muted'}>{s.spots != null ? `${s.spots} spot${s.spots === 1 ? '' : 's'} left` : 'Available'}</span></li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={() => setBooking(true)} className="w-full rounded-full bg-teal px-6 py-3 font-semibold text-white">
            {j.instantBook ? 'Check availability' : 'Request to book'}
          </button>
          {op && (
            <div className="space-y-2">
              <p className="text-xs text-muted">Questions first?</p>
              <ContactOperator c={op} label="Ask" subject={`Question: ${j.title}`}
                message={`Hello ${op.name}, I have a question about "${j.title}" on Africa Safari Guide.`} />
            </div>
          )}

          {op && (
            <div className="border-t border-line pt-4 text-sm">
              <p className="font-semibold">{op.name}{op.verified && <span className="ml-2 text-teal">✓ Verified</span>}</p>
              <p className="text-muted">{[countryName(op.country) && `Based in ${countryName(op.country)}`, op.years && `${op.years} years operating`].filter(Boolean).join(' · ')}</p>
            </div>
          )}
        </aside>
      </div>

      {booking && <JourneyBooking j={j} onClose={() => setBooking(false)} />}
    </main>
  )
}
