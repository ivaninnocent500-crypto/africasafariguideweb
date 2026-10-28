import { Link } from 'react-router-dom'
import type { JourneyCardData } from '../../lib/journeys'
import { durationLabel, formatMoney } from '../../lib/format'
import { Img, Pill } from '../../components/ui'

export default function JourneyCard({ c, className = '' }: { c: JourneyCardData; className?: string }) {
  const off = c.compareAt && c.compareAt > c.price ? Math.round((1 - c.price / c.compareAt) * 100) : 0
  return (
    <Link to={`/journeys/${c.id}`} className={`group flex flex-col overflow-hidden rounded-[28px] border border-line bg-card transition hover:border-gold/60 ${className}`}>
      <div className="relative aspect-[1.5] overflow-hidden">
       <Img src={c.hero} alt={c.title} w={640} className="h-full w-full transition duration-500 group-hover:scale-105" />

        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          {c.instantBook && <Pill className="bg-gold text-gold-ink">Instant book</Pill>}
          {off > 0 && <Pill className="bg-black/60 text-gold">-{off}%</Pill>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <div className="flex items-center justify-between text-sm text-muted">
          <span className="truncate">{c.location ?? c.themeLabel}</span>
          {c.rating != null && <span className="shrink-0 text-gold">★ {c.rating.toFixed(1)} <span className="text-muted">({c.reviews})</span></span>}
        </div>
        <h3 className="line-clamp-2 min-h-[3rem] text-lg font-bold leading-snug">{c.title}</h3>
        <p className="text-sm text-muted">{durationLabel(c.durationValue, c.durationUnit)} · {c.operatorVerified && <span className="text-gold">✓ </span>}{c.operatorName}</p>
        <p className="mt-auto pt-3 text-xl font-extrabold text-gold">
          <span className="text-xs font-normal text-muted">From </span>{formatMoney(c.price, c.currency)}
          <span className="text-xs font-normal text-muted"> /person</span>
          {off > 0 && <span className="ml-2 text-sm font-normal text-muted line-through">{formatMoney(c.compareAt!, c.currency)}</span>}
        </p>
      </div>
    </Link>
  )
}
