import { Link } from 'react-router-dom'
import type { LiveOpportunity } from '../../lib/githubData'
import { Img, Pill } from '../../components/ui'
import { badgeText, categoryLabel, seatInfo, whenLabel } from './helpers'

export default function LiveCard({ o, className = '' }: { o: LiveOpportunity; className?: string }) {
  const seats = seatInfo(o)
  const badge = badgeText(o)

  return (
    <Link to={`/live/${o.id}`}
      className={`group flex flex-col overflow-hidden rounded-[28px] border border-gold/25 bg-card transition hover:border-gold/60 hover:shadow-[0_0_40px_-12px] hover:shadow-gold/40 ${className}`}>
      
      <div className="relative aspect-[1.6] overflow-hidden">
        <Img src={o.imageUrl} alt={o.title} w={640} className="h-full w-full transition duration-500 group-hover:scale-105" />

        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-black/30" />
        <div className="absolute left-4 top-4 flex gap-2">
          <Pill className="bg-black/60 text-gold backdrop-blur">{categoryLabel(o.category)}</Pill>
          {badge && <Pill className="bg-gold text-gold-ink">{badge}</Pill>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs font-semibold tracking-wide text-muted">{o.location}, {o.country}</p>
        <h3 className="line-clamp-2 min-h-[3rem] text-lg font-bold leading-snug">{o.title}</h3>
        <p className="text-sm text-muted">{whenLabel(o)} · {o.durationLabel}</p>
        
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-xs text-muted">From</p>
            <p className="text-xl font-extrabold text-gold">{o.symbol}{o.price.toLocaleString()}
              <span className="text-xs font-normal text-muted"> /person</span></p>
          </div>
          <Pill className={seats.urgent ? 'bg-red-500/15 text-red-300' : 'bg-gold-soft text-gold'}>{seats.text}</Pill>
        </div>
      </div>
    </Link>
  )
}

