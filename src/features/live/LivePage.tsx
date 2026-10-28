import { useMemo, useState } from 'react'
import { useLive } from '../../lib/hooks'
import { SectionHeader, Skeleton } from '../../components/ui'
import LiveCard from './LiveCard'
import { categoryLabel } from './helpers'

export default function LivePage() {
  const { data = [], isLoading, isError, refetch } = useLive()
  const [cat, setCat] = useState('ALL')
  const cats = useMemo(() => [...new Set(data.map(d => d.category))], [data])
  const list = data.filter(d => cat === 'ALL' || d.category === cat)

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <SectionHeader eyebrow="LIVE NOW" title="Last-minute opportunities"
        subtitle="Limited availability, confirmed by operators. Updated every minute." />

      {cats.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {['ALL', ...cats].map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                cat === c ? 'border-gold bg-gold text-gold-ink' : 'border-line text-muted hover:text-ink'}`}>
              {c === 'ALL' ? 'All' : categoryLabel(c)}
            </button>
          ))}
        </div>
      )}

      {isLoading && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96" />)}</div>}

      {isError && <p className="text-muted">Couldn't load live opportunities.{' '}
        <button onClick={() => refetch()} className="text-gold underline">Try again</button></p>}

      {!isLoading && !isError && list.length === 0 && (
        <p className="rounded-3xl border border-line bg-card p-8 text-center text-muted">
          Nothing is open right now. New last-minute spots appear here as operators publish them.</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(o => <LiveCard key={o.id} o={o} />)}
      </div>
    </main>
  )
}
