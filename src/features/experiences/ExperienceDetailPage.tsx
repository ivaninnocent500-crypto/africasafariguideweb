import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { dateLabel, slotSummary, useExperience } from '../../lib/experiences'
import { durationLabel, formatBestMonths, formatMoney } from '../../lib/format'
import { Img, Pill, Skeleton } from '../../components/ui'
import ContactOperator from '../../components/ContactOperator'
import ExperienceBooking from './ExperienceBooking'

const countryName = (code: string | null) => { try { return code ? new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) : null } catch { return code } }
const monthYear = (iso: string | null) => { try { return iso ? new Date(iso).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : null } catch { return null } }

export default function ExperienceDetailPage() {
  const { id } = useParams()
  const { data: b, isLoading, refetch } = useExperience(id)
  const [img, setImg] = useState(0)
  const [more, setMore] = useState(false)
  const [allReviews, setAllReviews] = useState(false)
  const [booking, setBooking] = useState<{ open: boolean; date: string | null }>({ open: false, date: null })

  if (isLoading) return <main className="mx-auto max-w-6xl px-4 py-10"><Skeleton className="h-96" /></main>
  if (!b) return (
    <main className="mx-auto max-w-6xl px-4 py-24 text-center">
      <p className="text-lg font-semibold">This experience is no longer available.</p>
      <Link to="/journeys" className="mt-4 inline-block text-teal underline">Browse experiences</Link>
    </main>
  )

  const { detail: d, operator: op, stops, reviews, slots, slotsAreRequests, canBook } = b
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null
  const dates = [...new Set(slots.map(s => s.date))].slice(0, 8)
  const intro = d.description?.trim() || d.tagline
  const facts = [
    ['Duration', durationLabel(d.durationValue, d.durationUnit)],
    d.maxGroup ? ['Group size', `Up to ${d.maxGroup}`] : null,
    d.difficulty ? ['Activity level', d.difficulty.replace(/^\w/, c => c.toUpperCase())] : null,
    d.minAge ? ['Minimum age', `${d.minAge}+`] : null,
  ].filter(Boolean) as string[][]
  const goodToKnow = [
    d.bestMonths.length ? `Best time: ${formatBestMonths(d.bestMonths)}` : null,
    d.minAge ? `Minimum age: ${d.minAge}` : null,
    d.maxGroup ? `Maximum group size: ${d.maxGroup}` : null,
    d.safetyNote?.trim() || null,
  ].filter(Boolean) as string[]
  const open = (date: string | null = null) => canBook ? setBooking({ open: true, date }) : void refetch()
  const shownReviews = allReviews ? reviews : reviews.slice(0, 3)

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <Link to="/journeys" className="text-sm text-muted hover:text-teal">← All journeys and experiences</Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          <section className="space-y-3">
            <div className="h-72 overflow-hidden rounded-[32px] bg-navy sm:h-[26rem]"><Img src={d.gallery[img]} alt={`${d.title} photo ${img + 1}`} className="h-full w-full" /></div>
            {d.gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {d.gallery.map((u, i) => (
                  <button key={u} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-2xl border-2 ${i === img ? 'border-teal' : 'border-transparent opacity-70'}`}><Img src={u} alt="" className="h-full w-full" /></button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            {(d.location ?? d.countryCode) && <p className="text-xs font-bold tracking-widest text-teal">{(d.location ?? d.countryCode)!.toUpperCase()}</p>}
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{d.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {avg != null && <span className="text-amber">★ {avg.toFixed(1)} <span className="text-muted">({reviews.length} review{reviews.length === 1 ? '' : 's'})</span></span>}
              {op?.verified && <Pill className="bg-teal-soft text-teal">Verified operator</Pill>}
            </div>
            {intro && (
              <div>
                <p className={`leading-relaxed ${more ? '' : 'line-clamp-4'}`}>{intro}</p>
                {intro.length > 220 && <button onClick={() => setMore(m => !m)} className="mt-1 font-semibold text-teal">{more ? 'Show less' : 'Show more'}</button>}
              </div>
            )}
          </section>

          {op && (
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-amber font-bold text-navy">{op.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')}</div>
              <div><p className="font-semibold">Hosted by {op.name}</p>
                <p className="text-sm text-muted">{[op.years && op.years > 0 && `${op.years} years operating`, d.languages.length > 0 && `Hosted in ${d.languages.join(', ')}`].filter(Boolean).join(' · ')}</p></div>
            </div>
          )}

          {facts.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{facts.map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-line bg-card p-4"><p className="text-xs text-muted">{l}</p><p className="mt-1 font-semibold">{v}</p></div>))}</div>}

          {stops.length > 0 ? (
            <section><h2 className="mb-3 text-2xl font-bold">What you'll do</h2>
              <div className="space-y-4">{stops.map(s => (
                <div key={s.id} className="flex gap-4">
                  {s.imageUrl && <Img src={s.imageUrl} alt={s.title} className="h-[72px] w-[72px] shrink-0 rounded-2xl" />}
                  <div><p className="font-semibold">{s.title}</p>{s.description && <p className="text-muted">{s.description}</p>}</div>
                </div>))}</div></section>
          ) : d.highlights.length > 0 && (
            <section><h2 className="mb-3 text-2xl font-bold">What you'll do</h2>
              <ul className="space-y-1.5">{d.highlights.map(h => <li key={h}><span className="text-teal">•</span> {h}</li>)}</ul></section>
          )}

          {(d.included.length > 0 || d.excluded.length > 0) && (
            <section><h2 className="mb-3 text-2xl font-bold">What's included</h2>
              <ul className="grid gap-2 sm:grid-cols-2">{d.included.map(i => <li key={i} className="rounded-2xl bg-teal-soft px-4 py-3"><span className="text-teal">✓</span> {i}</li>)}</ul>
              {d.excluded.length > 0 && <p className="mt-3 text-sm text-muted">Not included: {d.excluded.join(', ')}</p>}</section>
          )}

          <section>
            <h2 className="mb-3 text-2xl font-bold">{slotsAreRequests ? 'Pick a date to request' : 'Upcoming availability'}</h2>
            {!canBook ? <p className="text-muted">Couldn't load availability. <button onClick={() => void refetch()} className="text-teal underline">Try again</button></p>
              : dates.length === 0 ? <p className="text-muted">No dates are open right now. Please check back soon.</p> : (
              <>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {dates.map(dt => (
                    <button key={dt} onClick={() => open(dt)} className="shrink-0 rounded-2xl border border-line bg-card px-4 py-3 text-left hover:border-teal">
                      <p className="font-semibold">{dateLabel(dt)}</p><p className="text-xs text-muted">{slotSummary(slots.filter(s => s.date === dt)) ?? '\u00a0'}</p>
                    </button>))}
                </div>
                {slotsAreRequests && <p className="mt-2 text-sm text-muted">Dates are requests. The operator confirms before anything is charged.</p>}
              </>)}
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">{avg == null ? 'Reviews' : `★ ${avg.toFixed(2)} · ${reviews.length} review${reviews.length === 1 ? '' : 's'}`}</h2>
            {reviews.length === 0 && <p className="text-muted">No reviews yet. They appear here once travellers have completed this experience.</p>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shownReviews.map(r => (
                <article key={r.id} className="space-y-2 rounded-3xl border border-line bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-amber font-bold text-navy">{r.name.trim().slice(0, 1).toUpperCase()}</div>
                    <div className="min-w-0"><p className="truncate font-semibold">{r.name}</p>{r.country && <p className="truncate text-sm text-muted">{r.country}</p>}</div>
                  </div>
                  <p className="text-sm text-amber">{'★'.repeat(Math.min(5, Math.max(1, Math.round(r.rating))))}{monthYear(r.createdAt) && <span className="text-muted"> · {monthYear(r.createdAt)}</span>}</p>
                  {r.comment && <p className={allReviews ? '' : 'line-clamp-4'}>{r.comment.trim()}</p>}
                </article>))}
            </div>
            {reviews.length > 3 && <button onClick={() => setAllReviews(a => !a)} className="rounded-full border border-line px-5 py-2 text-sm font-semibold hover:border-teal">
              {allReviews ? 'Show fewer' : `Show all ${reviews.length} reviews`}</button>}
          </section>

          {(d.meetingPoint || (d.lat != null && d.lng != null)) && (
            <section className="space-y-2"><h2 className="text-2xl font-bold">Where we'll meet</h2>
              {d.meetingPoint && <p>{d.meetingPoint}</p>}{d.location && <p className="text-muted">{d.location}</p>}
              {d.lat != null && d.lng != null && <a className="inline-block text-teal underline" target="_blank" rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`}>Get directions</a>}</section>
          )}

          {goodToKnow.length > 0 && <section><h2 className="mb-3 text-2xl font-bold">Good to know</h2>
            <ul className="space-y-1.5">{goodToKnow.map(g => <li key={g}><span className="text-teal">•</span> {g}</li>)}</ul></section>}

          <section><h2 className="mb-2 text-2xl font-bold">Cancellation policy</h2>
            <p className="text-muted">{d.cancellationPolicy ?? 'Cancellation terms are set by the operator and confirmed when they accept your request.'}</p>
            {(d.freeCancelHours ?? 0) > 0 && <p className="mt-1 font-semibold text-teal">Free cancellation up to {d.freeCancelHours} hours before the start time.</p>}</section>

          {op && (
            <section className="space-y-3 rounded-3xl border border-line bg-card p-6">
              <p className="text-xs text-muted">About the host</p>
              <p className="text-lg font-bold">{op.name}{op.verified && <span className="ml-2 text-sm text-teal">✓ Verified operator</span>}</p>
              <p className="text-sm text-muted">{[countryName(op.country) && `Based in ${countryName(op.country)}`, op.years && op.years > 0 && `${op.years} years operating`].filter(Boolean).join(' · ')}</p>
              <ContactOperator c={op} label="Message" subject={`Question: ${d.title}`} message={`Hello ${op.name}, I have a question about "${d.title}" on Africa Safari Guide.`} />
            </section>
          )}
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-teal/30 bg-card p-6 lg:sticky lg:top-24">
          <div><p className="text-sm text-muted">From</p>
            <p className="text-4xl font-extrabold text-teal">{formatMoney(d.price, d.currency)}<span className="text-sm font-normal text-muted"> /guest</span></p>
            {d.priceChild != null && <p className="text-sm text-muted">Children {formatMoney(d.priceChild, d.currency)}</p>}</div>
          {(d.freeCancelHours ?? 0) > 0 && canBook && <p className="text-sm font-semibold text-teal">Free cancellation</p>}
          {!canBook && <p className="text-sm text-muted">Availability didn't load. Tap to retry.</p>}
          <button onClick={() => open()} className="w-full rounded-full bg-teal px-6 py-3 font-semibold text-white">{canBook ? 'Check availability' : 'Retry'}</button>
        </aside>
      </div>

      {booking.open && <ExperienceBooking b={b} initialDate={booking.date} onClose={() => setBooking({ open: false, date: null })} />}
    </main>
  )
}
