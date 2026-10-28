const BASE = 'https://raw.githubusercontent.com/ivaninnocent500-crypto/africatraveldata/refs/heads/main'
const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

// Your app uses Calendar.MONTH (0-based) in this JSON. Set to false if the file is already 1-12.
const MONTHS_ARE_ZERO_BASED = true

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

export interface Destination {
  id: string; name: string; country: string
  heroImageUrl: string; gallery: string[]
  description: string; shortDescription: string
  basePrice: number; budgetPrice: number; luxuryPrice: number; ultraLuxuryPrice: number
  popularityScore: number; trendGrowth: number
  bestMonths: number[] // 1-12
  seasonal: number[] // 12 values, 0..1
  activities: string[]
  topExperiences: { title: string; subtitle: string; imageUrl: string }[]
  visaProcessingDays: number; visaNotes: string
  latitude: number; longitude: number
}

export type Crowd = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'

export interface EventItem {
  id: string; name: string; location: string; description: string
  imageUrl: string; tags: string[]; crowd: Crowd; interested: number
  start: Date; end: Date | null; isLive: boolean
  destinationIds: string[]; daysUntil: number
}

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(`${BASE}/${file}`)
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
  const text = await res.text()
  // Your app tolerates NaN with a lenient parser; plain JSON.parse does not.
  return JSON.parse(text.replace(/([:\[,]\s*)NaN\b/g, '$10'))
}

function normalizeDestination(r: Raw): Destination {
  const scores = MONTH_KEYS.map(k => Number(r.seasonalScores?.[k]) || 0)
  const max = Math.max(...scores, 1)
  return {
    id: String(r.id), name: r.name ?? '', country: r.country ?? '',
    heroImageUrl: r.heroImageUrl ?? '', gallery: r.galleryImages ?? [],
    description: r.description ?? '', shortDescription: r.shortDescription ?? '',
    basePrice: Number(r.basePrice) || 0, budgetPrice: Number(r.budgetPrice) || 0,
    luxuryPrice: Number(r.luxuryPrice) || 0, ultraLuxuryPrice: Number(r.ultraLuxuryPrice) || 0,
    popularityScore: Number(r.popularityScore) || 0, trendGrowth: Number(r.trendGrowth) || 0,
    bestMonths: ((r.bestMonths ?? []) as number[]).map(m => (MONTHS_ARE_ZERO_BASED ? m + 1 : m)),
    seasonal: scores.map(s => s / max),
    activities: r.activities ?? [], topExperiences: r.topExperiences ?? [],
    visaProcessingDays: Number(r.visaProcessingDays) || 0, visaNotes: r.visaNotes ?? '',
    latitude: Number(r.latitude) || 0, longitude: Number(r.longitude) || 0,
  }
}

function resolveDates(startRaw: string, endRaw: string | undefined, recurring: boolean, today: Date) {
  const parse = (s: string) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return { y, m, d } }
  const s = parse(startRaw)
  const e = endRaw ? parse(endRaw) : null
  if (!recurring) return { start: new Date(s.y, s.m - 1, s.d), end: e ? new Date(e.y, e.m - 1, e.d) : null }

  const build = (year: number) => {
    const start = new Date(year, s.m - 1, s.d)
    let end: Date | null = null
    if (e) { end = new Date(year, e.m - 1, e.d); if (end < start) end = new Date(year + 1, e.m - 1, e.d) }
    return { start, end }
  }
  const y = today.getFullYear()
  // An occurrence that began last year and is still running (Dec -> Jan), then this year's, then next year's.
  const prev = build(y - 1)
  if ((prev.end ?? prev.start) >= today) return prev
  const cur = build(y)
  return (cur.end ?? cur.start) >= today ? cur : build(y + 1)
}

function normalizeEvent(r: Raw, today: Date): EventItem {
  const { start, end } = resolveDates(r.date, r.endDate ?? undefined, r.isRecurringAnnual !== false, today)
  const ongoing = start <= today && (end ?? start) >= today
  const media = ((r.media ?? []) as { imageUrl?: string }[]).find(m => m.imageUrl)?.imageUrl
  const crowd = String(r.expectedCrowdLevel ?? 'MEDIUM').toUpperCase() as Crowd
  return {
    id: String(r.id), name: r.name ?? '', location: r.location ?? '',
    description: r.description ?? '', imageUrl: media ?? r.imageUrl ?? '',
    tags: r.tags ?? [], crowd: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'].includes(crowd) ? crowd : 'MEDIUM',
    interested: Number(r.interestedCount) || 0,
    start, end, isLive: Boolean(r.isLive) || ongoing,
    destinationIds: r.destinationIds ?? [],
    daysUntil: Math.max(0, Math.round((start.getTime() - today.getTime()) / 86_400_000)),
  }
}

export async function fetchDestinations() {
  return (await getJson<Raw[]>('destinations.json')).map(normalizeDestination)
}

export async function fetchEvents() {
  const t = new Date()
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate())
  return (await getJson<Raw[]>('events.json')).map(r => normalizeEvent(r, today))
}
export interface LiveOpportunity {
  id: string; destinationId: string; title: string; category: string
  location: string; country: string; imageUrl: string; durationLabel: string
  start: Date; end: Date | null; clockTime: string | null
  partyMin: number; partyMax: number
  price: number; symbol: string
  seatsLeft: number; seatsTotal: number
  badge: 'RARE' | 'LAST_MINUTE' | 'NONE'
  included: string[]; operatorName: string; operatorVerified: boolean
  confirmedAt: Date | null; bookingUrl: string | null
}

function normalizeLive(r: Raw): LiveOpportunity {
  const clock = /\d{1,2}:\d{2}\s?[AaPp][Mm]/.exec(r.departureTimeLabel ?? '')?.[0] ?? null
  const url = typeof r.bookingUrl === 'string' && r.bookingUrl.startsWith('https://') ? r.bookingUrl : null
  const badge = ['RARE', 'LAST_MINUTE'].includes(r.badgeType) ? r.badgeType : 'NONE'
  return {
    id: String(r.id), destinationId: r.destinationId ?? '', title: r.title ?? '',
    category: r.category ?? 'EXPERIENCE', location: r.location ?? '', country: r.country ?? '',
    imageUrl: r.imageUrl ?? '', durationLabel: r.durationLabel ?? '',
    start: new Date(r.startDate), end: r.endDate ? new Date(r.endDate) : null, clockTime: clock,
    partyMin: Number(r.partySizeMin) || 1, partyMax: Number(r.partySizeMax) || 1,
    price: Number(r.pricePerPerson) || 0, symbol: r.currencySymbol ?? '$',
    seatsLeft: Number(r.seatsAvailable) || 0, seatsTotal: Number(r.seatsTotal) || 0,
    badge, included: r.whatsIncluded ?? [],
    operatorName: r.operatorName ?? '', operatorVerified: Boolean(r.operatorVerified),
    confirmedAt: r.availabilityConfirmedAt ? new Date(r.availabilityConfirmedAt) : null,
    bookingUrl: url,
  }
}

export async function fetchLive() {
  const now = new Date()
  return (await getJson<Raw[]>('live_opportunities.json'))
    .map(normalizeLive)
    .filter(o => !Number.isNaN(o.start.getTime()) && o.seatsLeft > 0 && (o.end ?? o.start) >= now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}
