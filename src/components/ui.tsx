import { useState, type ReactNode } from 'react'

 import { optimize } from '../lib/img'

export function Img({ src, alt, className = '', w = 800, priority = false }:
  { src?: string | null; alt: string; className?: string; w?: number; priority?: boolean }) {
  const [bad, setBad] = useState(false)
  if (!src || bad)
    return <div role="img" aria-label={alt} className={`bg-gradient-to-br from-navy to-teal/60 ${className}`} />
  const srcSet = [Math.round(w / 2), w, w * 2].map(x => `${optimize(src, x)} ${x}w`).join(', ')
  return (
    <img src={optimize(src, w)} srcSet={srcSet} sizes={`(max-width: 640px) 100vw, ${w}px`} alt={alt}
      loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setBad(true)}
      className={`bg-line object-cover ${className}`} />
  )
}


export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-3xl bg-line ${className}`} />
)

export function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      {eyebrow && <p className="text-xs font-bold tracking-widest text-teal">{eyebrow}</p>}
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
  )
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}
