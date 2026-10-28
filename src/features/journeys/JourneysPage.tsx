import { useMemo, useState } from 'react'
import { useJourneys, type JourneyCardData } from '../../lib/journeys'
import { matches, useExperienceFeed } from '../../lib/experiences'
import { Img, SectionHeader, Skeleton } from '../../components/ui'
import JourneyCard from './JourneyCard'
import ExperienceCard from '../experiences/ExperienceCard'

function Row({ eyebrow, title, items }: { eyebrow: string; title: string; items: JourneyCardData[] }) {
  if (!items.length) return null
  return (
    <section>
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {items.map(c => <JourneyCard key={c.id} c={c} className="w-72 shrink-0 snap-start sm:w-80" />)}
      </div>
    </section>
  )
}

export default function JourneysPage() {
  const { data = [], isLoading, isError, refetch } = useJourneys()
  const exp = useExperienceFeed()
  const [q, setQ] = useState('')
  const [theme, setTheme] = useState<string | null>(null)
  const month = new Date().getMonth() + 1
  const monthName = new Date().toLocaleString('en', { month: 'long' })
  const query = q.trim().toLowerCase()
  const browsing = !query && !theme

  const themes = useMemo(() => [...new Map(data.map(c => [c.themeKey, c.themeLabel])).entries()], [data])
  const seasonal = useMemo(() => data.filter(c => c.bestMonths.includes(month)), [data, month])
  const trending = useMemo(() => data.filter(c => c.reviews > 0).sort((a, b) => b.reviews - a.reviews).slice(0, 10), [data])
  const more = useMemo(() => {
    const shown = new Set([...seasonal, ...trending].map(c => c.id))
    return data.filter(c => !shown.has(c.id))
  }, [data, seasonal, trending])
  const results = useMemo(() => data.filter(c =>
    (!theme || c.themeKey === theme) &&
    (!query || [c.title, c.location, c.operatorName, c.themeLabel, c.tagline].some(s => s?.toLowerCase().includes(query)))), [data, theme, query])

  // Theme chips belong to journeys, so experiences are hidden while a chip is selected.
  const sections = useMemo(() => {
    const all = exp.data ?? []
    if (theme) return []
    if (!query) return all
    return all.map(s => ({ ...s, items: s.items.filter(c => matches(c, query)) })).filter(s => s.items.length > 0)
  }, [exp.data, theme, query])

  const nothing = !isLoading && !isError && !exp.isLoading && !exp.isError &&
    (browsing ? data.length === 0 : results.length === 0) && sections.length === 0

  return (
    <main>
      <section className="relative h-[22rem] overflow-hidden bg-navy">
        <Img src={data.find(c => c.hero)?.hero} alt="" className="absolute inset-0 h-full w-full opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-sand via-navy/60 to-navy/30" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end gap-3 px-4 pb-10">
          <p className="text-xs font-bold tracking-widest text-amber">A DIFFERENT WAY TO DISCOVER AFRICA</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">Find your kind of Africa</h1>
          <p className="max-w-xl text-white/80">Journeys and experiences led by verified local tour operators.</p>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Where in Africa?" aria-label="Search journeys and experiences"
            className="mt-2 w-full max-w-xl rounded-full border border-line bg-card px-6 py-3.5 outline-none focus:border-teal" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        {themes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {[[null, 'All'] as const, ...themes].map(([k, l]) => (
              <button key={k ?? 'all'} onClick={() => setTheme(k)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${theme === k ? 'border-teal bg-teal text-white' : 'border-line text-muted hover:text-ink'}`}>{l}</button>
            ))}
          </div>
        )}

        {isLoading && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-96" />)}</div>}
        {isError && <p className="text-muted">Couldn't load journeys. <button onClick={() => refetch()} className="text-teal underline">Try again</button></p>}

        {browsing ? (
          <>
            <Row eyebrow="SEASONAL" title={`Best in ${monthName}`} items={seasonal} />
            <Row eyebrow="JOURNEYS" title="Trending now" items={trending} />
            <Row eyebrow="JOURNEYS" title="More journeys" items={more} />
          </>
        ) : (
          results.length > 0 && (
            <section>
              <SectionHeader eyebrow="JOURNEYS" title={`${results.length} found`} />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{results.map(c => <JourneyCard key={c.id} c={c} />)}</div>
            </section>
          )
        )}

        {exp.isLoading && (
          <section><SectionHeader eyebrow="EXPERIENCES" title="Moments across Africa" />
            <div className="flex gap-4 overflow-hidden">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-60 w-48 shrink-0" />)}</div></section>
        )}
        {exp.isError && !exp.data && <p className="text-muted">Couldn't load experiences. <button onClick={() => void exp.refetch()} className="text-teal underline">Try again</button></p>}
        {sections.length > 0 && (
          <section className="space-y-8">
            <SectionHeader eyebrow="EXPERIENCES" title="Moments across Africa" />
            {sections.map(s => (
              <div key={s.category.id} className="space-y-3">
                <div><h3 className="text-xl font-bold">{s.category.title}</h3>
                  {s.category.subtitle && <p className="line-clamp-2 text-muted">{s.category.subtitle}</p>}</div>
                <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">{s.items.map(c => <ExperienceCard key={c.id} c={c} />)}</div>
              </div>
            ))}
          </section>
        )}

        {nothing && <p className="text-muted">{browsing ? 'No itineraries or experiences are published yet.' : 'Nothing matches that search. Try another place or theme.'}</p>}
      </div>
    </main>
  )
}
