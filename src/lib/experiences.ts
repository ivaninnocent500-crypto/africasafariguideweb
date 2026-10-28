import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { JOperator } from './journeys'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>
const UUID = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
const num = (v: unknown) => (v == null || Number.isNaN(Number(v)) ? null : Number(v))
const GENERATED_DAYS = 14
export const MAX_GUESTS = 30

export interface ExpCategory { id: string; key: string; title: string; subtitle: string | null; sort: number }
export interface ExpCard {
  id: string; categoryKey: string; categoryTitle: string; title: string; tagline: string | null
  location: string | null; hero: string | null; startTimes: string[]; bestMonths: number[]
  price: number; currency: string; badge: string | null; operatorName: string
  rating: number | null; reviews: number
}
export interface ExpSection { category: ExpCategory; items: ExpCard[] }
export interface ExpStop { id: string; title: string; description: string | null; imageUrl: string | null }
export interface ExpReview { id: string; name: string; country: string | null; rating: number; comment: string | null; createdAt: string | null }
export interface ExpSlot { date: string; time: string | null; spots: number | null; price: number | null; priceChild: number | null }
export interface ExpDetail {
  id: string; title: string; tagline: string | null; description: string | null
  location: string | null; countryCode: string | null; gallery: string[]
  durationValue: number; durationUnit: string; startTimes: string[]; bestMonths: number[]
  maxGroup: number | null; minAge: number | null; difficulty: string | null; languages: string[]
  price: number; priceChild: number | null; currency: string; instantBook: boolean
  freeCancelHours: number | null; cancellationPolicy: string | null
  highlights: string[]; included: string[]; excluded: string[]
  meetingPoint: string | null; lat: number | null; lng: number | null; safetyNote: string | null
}
export interface ExpBundle {
  detail: ExpDetail; operator: JOperator | null; stops: ExpStop[]; reviews: ExpReview[]
  slots: ExpSlot[]
  /** True when the dates are generated (no real availability): the operator confirms each request. */
  slotsAreRequests: boolean
  /** False when availability could not be loaded. */
  canBook: boolean
}
export interface ExpBookingResult { reference: string; status: string; total: number; currency: string }

export const localToday = () => new Date().toLocaleDateString('en-CA')
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10)
}

export function dateLabel(iso: string) {
  const d = new Date(iso + 'T00:00')
  return iso === addDays(localToday(), 1)
    ? `Tomorrow, ${d.toLocaleDateString('en', { day: 'numeric', month: 'short' })}`
    : d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function slotSummary(slots: ExpSlot[]): string | null {
  const times = [...new Set(slots.map(s => s.time).filter(Boolean))] as string[]
  const spots = slots.map(s => s.spots).filter((v): v is number => v != null)
  const total = spots.reduce((a, b) => a + b, 0)
  if (spots.length && total <= 8) return `${total} spot${total === 1 ? '' : 's'} left`
  return times.length ? times.slice(0, 3).join(' · ') : null
}

export function quote(d: ExpDetail, slot: ExpSlot | undefined, adults: number, children: number) {
  const a = slot?.price ?? d.price
  const c = slot?.priceChild ?? d.priceChild ?? a
  return Math.round((a * Math.max(0, adults) + c * Math.max(0, children)) * 100) / 100
}

// ── mapping ──
const toCategory = (r: Row): ExpCategory => ({ id: String(r.id), key: r.key ?? '', title: r.title ?? '', subtitle: r.subtitle ?? null, sort: num(r.sort_order) ?? 9999 })
const toCard = (r: Row): ExpCard => ({
  id: String(r.id), categoryKey: r.category_key ?? '', categoryTitle: r.category_title ?? '', title: r.title ?? '',
  tagline: r.tagline ?? null, location: r.location_label ?? null, hero: r.hero_image_url ?? null,
  startTimes: r.start_times ?? [], bestMonths: r.best_months ?? [], price: num(r.price_adult) ?? 0,
  currency: r.currency ?? 'USD', badge: r.badge ?? null, operatorName: r.operator_name ?? '',
  rating: num(r.review_count) ? num(r.rating_avg) : null, reviews: num(r.review_count) ?? 0,
})

export const matches = (c: ExpCard, q: string) =>
  [c.title, c.tagline, c.location, c.categoryTitle, c.operatorName].some(s => s?.toLowerCase().includes(q.toLowerCase()))

/** Category rows. Cards whose category is missing still appear. In-season items come first. */
function buildSections(cats: ExpCategory[], cards: ExpCard[], month: number): ExpSection[] {
  const ordered = (items: ExpCard[]) => [...items].sort((a, b) => Number(b.bestMonths.includes(month)) - Number(a.bestMonths.includes(month)))
  const byKey = new Map<string, ExpCard[]>()
  cards.forEach(c => byKey.set(c.categoryKey, [...(byKey.get(c.categoryKey) ?? []), c]))
  const known = [...cats].sort((a, b) => a.sort - b.sort)
  const out: ExpSection[] = known.filter(c => byKey.get(c.key)?.length).map(c => ({ category: c, items: ordered(byKey.get(c.key)!) }))
  const knownKeys = new Set(known.map(c => c.key))
  for (const [key, items] of byKey)
    if (!knownKeys.has(key)) out.push({ category: { id: key, key, title: items[0].categoryTitle, subtitle: null, sort: 9999 }, items: ordered(items) })
  return out
}

export async function fetchExperienceFeed(): Promise<ExpSection[]> {
  const [cats, cards] = await Promise.all([
    supabase.from('experience_categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('v_experience_cards').select('*').order('sort_order').order('review_count', { ascending: false }).limit(500),
  ])
  if (cards.error) throw cards.error // categories are optional
  return buildSections(((cats.data ?? []) as Row[]).map(toCategory), (cards.data as Row[]).map(toCard), new Date().getMonth() + 1)
}

function buildSlots(d: ExpDetail, rows: Row[], today: string): { slots: ExpSlot[]; requests: boolean } {
  if (rows.length) {
    const real = rows
      .filter(a => a.available_date >= today && (num(a.spots_left) ?? 1) > 0)
      .map(a => ({ date: a.available_date as string, time: a.start_time ? String(a.start_time).slice(0, 5) : null,
        spots: num(a.spots_left), price: num(a.price_adult), priceChild: num(a.price_child) }))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
    return { slots: real, requests: false }
  }
  const times = [...new Set(d.startTimes.map(t => t.slice(0, 5)).filter(Boolean))]
  const list: (string | null)[] = times.length ? times : [null]
  const slots = Array.from({ length: GENERATED_DAYS }, (_, i) => addDays(today, i + 1))
    .flatMap(date => list.map(time => ({ date, time, spots: null, price: null, priceChild: null })))
  return { slots, requests: true }
}

export async function fetchExperience(id: string): Promise<ExpBundle | null> {
  if (!UUID.test(id)) return null
  const { data: b, error } = await supabase.from('experiences').select('*').eq('id', id).eq('is_published', true).maybeSingle()
  if (error) throw error
  if (!b) return null

  const [op, stops, revs, avail] = await Promise.allSettled([
    b.operator_id ? supabase.from('tour_operators').select('*').eq('id', b.operator_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.from('experience_stops').select('*').eq('experience_id', id).order('sort_order'),
    supabase.from('experience_reviews').select('*').eq('experience_id', id).eq('is_published', true).order('created_at', { ascending: false }).limit(50),
    supabase.from('v_experience_availability').select('*').eq('experience_id', id).order('available_date').order('start_time').limit(60),
  ])
  const ok = <T,>(r: PromiseSettledResult<{ data: T | null; error: unknown }>) =>
    r.status === 'fulfilled' && !r.value.error ? r.value.data : null

  const detail: ExpDetail = {
    id: String(b.id), title: b.title ?? '', tagline: b.tagline ?? null, description: b.description ?? null,
    location: b.location_label ?? null, countryCode: b.country_code ?? null,
    gallery: [b.hero_image_url, ...(b.gallery_urls ?? [])].filter((u: string) => !!u).filter((u: string, i: number, a: string[]) => a.indexOf(u) === i),
    durationValue: num(b.duration_value) ?? 1, durationUnit: b.duration_unit ?? 'hours', startTimes: b.start_times ?? [],
    bestMonths: b.best_months ?? [], maxGroup: num(b.max_group), minAge: num(b.min_age), difficulty: b.difficulty ?? null,
    languages: b.languages ?? [], price: num(b.price_adult) ?? 0, priceChild: num(b.price_child), currency: b.currency ?? 'USD',
    instantBook: Boolean(b.instant_book), freeCancelHours: num(b.free_cancellation_hours), cancellationPolicy: b.cancellation_policy ?? null,
    highlights: b.highlights ?? [], included: b.included ?? [], excluded: b.excluded ?? [],
    meetingPoint: b.meeting_point ?? null, lat: num(b.meeting_lat), lng: num(b.meeting_lng), safetyNote: b.safety_note ?? null,
  }
  const o = ok(op) as Row | null
  const availRows = ok(avail) as Row[] | null
  const { slots, requests } = buildSlots(detail, availRows ?? [], localToday())
  return {
    detail, slots, slotsAreRequests: requests, canBook: availRows != null,
    operator: o ? { id: String(o.id), name: o.name ?? '', verified: o.verification_status === 'verified', years: num(o.years_in_operation),
      country: o.headquarters_country ?? null, email: o.contact_email ?? null, phone: o.contact_phone ?? null, website: o.website ?? null } : null,
    stops: ((ok(stops) as Row[] | null) ?? []).map(s => ({ id: String(s.id), title: s.title ?? '', description: s.description ?? null, imageUrl: s.image_url ?? null })),
    reviews: ((ok(revs) as Row[] | null) ?? []).map(r => ({ id: String(r.id), name: r.reviewer_name ?? 'Traveller', country: r.reviewer_country ?? null,
      rating: num(r.rating) ?? 0, comment: r.comment ?? null, createdAt: r.created_at ?? null })),
  }
}

// ── booking request (server function request_experience_booking recomputes the total) ──
const ERRORS: [string, string][] = [
  ['SOLD_OUT', 'Sorry, that time no longer has enough spots. Please pick another.'],
  ['SLOT_UNAVAILABLE', "That date or time isn't available. Please pick another."],
  ['BAD_DATE', 'Please choose a date within the next year.'], ['BAD_TIME', 'Please choose a valid start time.'],
  ['BAD_GUESTS', 'Please check the number of guests.'], ['GROUP_TOO_LARGE', 'That is more guests than this experience allows.'],
  ['BAD_NAME', 'Please check your name and email.'], ['BAD_EMAIL', 'Please check your name and email.'],
  ['LOGIN_REQUIRED', 'Please sign in to send a request.'], ['TOO_MANY', 'Too many requests in a short time. Please try again later.'],
  ['NOT_FOUND', 'This experience is no longer available.'],
]

export async function requestExperienceBooking(p: {
  experienceId: string; userId: string; name: string; email: string; date: string; adults: number
  children: number; whatsapp: string | null; startTime: string | null; notes: string | null
}): Promise<ExpBookingResult> {
  const { data, error } = await supabase.rpc('request_experience_booking', {
    p_experience_id: p.experienceId, p_user_id: p.userId, p_lead_name: p.name, p_lead_email: p.email,
    p_travel_date: p.date, p_adults: p.adults, p_children: p.children, p_whatsapp: p.whatsapp,
    p_start_time: p.startTime, p_special_requests: p.notes,
  })
  if (error) {
    const known = ERRORS.find(([k]) => error.message?.includes(k))
    throw new Error(known?.[1] ?? (error.code === 'PGRST202' ? "Online requests aren't available right now. Please try again later." : "We couldn't send your request. Please try again."))
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error("We couldn't send your request. Please try again.")
  return { reference: row.reference, status: row.status, total: Number(row.total), currency: row.currency }
}

export const useExperienceFeed = () => useQuery({ queryKey: ['experience-feed'], queryFn: fetchExperienceFeed, staleTime: 5 * 60_000 })
export const useExperience = (id?: string) => useQuery({ queryKey: ['experience', id], enabled: !!id, queryFn: () => fetchExperience(id!), staleTime: 2 * 60_000 })
