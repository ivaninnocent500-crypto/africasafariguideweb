import { Link } from 'react-router-dom'
import type { ExpCard } from '../../lib/experiences'
import { formatMoney } from '../../lib/format'
import { Img, Pill } from '../../components/ui'

export default function ExperienceCard({ c }: { c: ExpCard }) {
  const badge = c.badge?.trim() || c.startTimes[0]?.slice(0, 5) || null
  return (
    <Link to={`/experiences/${c.id}`} className="group block w-44 shrink-0 snap-start space-y-2 sm:w-52">
      <div className="relative aspect-[1.05] overflow-hidden rounded-[20px]">
        <Img src={c.hero} alt={c.title} w={320} className="h-full w-full transition duration-500 group-hover:scale-105" />

        {badge && <Pill className="absolute left-2 top-2 bg-white/90 text-ink">{badge}</Pill>}
      </div>
      <div className="space-y-0.5 px-0.5">
        <p className="line-clamp-2 min-h-[3rem] font-medium leading-snug">{c.title}</p>
        <p className="truncate text-sm text-muted">From {formatMoney(c.price, c.currency)} / guest</p>
        <p className="min-h-[1.25rem] text-sm">{c.rating != null && <><span className="text-amber">★ {c.rating.toFixed(1)}</span> <span className="text-muted">({c.reviews})</span></>}</p>
      </div>
    </Link>
  )
}
