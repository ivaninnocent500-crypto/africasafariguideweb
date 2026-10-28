import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>
const UUID = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i
const num = (v: unknown) => (v == null || Number.isNaN(Number(v)) ? null : Number(v))

export interface JourneyCardData {
  id: string; themeKey: string; themeLabel: string; title: string; tagline: string | null
  location: string | null; hero: string | null; durationValue: number; durationUnit: string
  maxGroup: number | null; bestMonths: number[]; price: number; compareAt: number | null
  currency: string; instantBook: boolean; freeCancelHours: number | null
  operatorName: string; operatorVerified: boolean; rating: number | null; reviews: number
}
export interface Activity { id: string; name: string; description: string | null; durationText: string | null; imageUrl: string | null }
export interface Day { id: string; n: number; title: string; description: string | null; activities: Activity[] }
export interface Slot { date: string; price: number | null; priceChild: number | null; spots: number | null }
export interface JReview { id: string; name: string; country: string | null; type: string | null; rating: number; comment: string | null; tripDate: string | null; verified: boolean; reply: string | null }
export interface JOperator { id: string; name: string; verified: boolean; years: number | null; country: string | null; email: string | null; phone: string | null; website: string | null }
export interface JourneyDetail {
  id: string; title: string; tagline: string | null; description: string | null; themeLabel: string
  location: string | null; gallery: string[]; durationValue: number; durationUnit: string; maxGroup: number | null
  startTimes: string[]; bestMonths: number[]; highlights: string[]; included: string[]; excluded: string[]
  meetingPoint: string | null; lat: number | null; lng: number | null; accessibility: string | null
  cancellationPolicy: string | null; freeCancelHours: number | null; instantBook: boolean
  price: number; priceChild: number | null; currency: string; taxesIncluded: boolean
  depositPercent: number | null; balanceDueDays: number; payLaterAllowed: boolean
  serviceFeePercent: number; timezone: string
  operator: JOperator | null; days: Day[]; slots: Slot[]; reviews: JReview[]
}

function toCard(r: Row): JourneyCardData {
  return {
    id: String(r.id), themeKey: r.theme_key ?? '', themeLabel: r.theme_label ?? '', title: r.title ?? '',
    tagline: r.tagline ?? null, location: r.location_label ?? null, hero: r.hero_image_url ?? null,
    durationValue: num(r.duration_value) ?? 1, durationUnit: r.duration_unit ?? 'days',
    maxGroup: num(r.max_group), bestMonths: r.best_months ?? [], price: num(r.price_adult) ?? 0,
    compareAt: num(r.compare_at_price), currency: r.currency ?? 'USD', instantBook: Boolean(r.instant_book),
    freeCancelHours: num(r.free_cancellation_hours), operatorName: r.operator_name ?? '',
    operatorVerified: Boolean(r.operator_verified),
    rating: num(r.review_count) ? num(r.rating_avg) : null, reviews: num(r.review_count) ?? 0,
  }
}

export async function fetchJourneys() {
  const { data, error } = await supabase.from('v_thematic_cards').select('*')
    .eq('is_published', true).order('review_count', { ascending: false }).limit(200)
  if (error) throw error
  return (data as Row[]).map(toCard)
}

export async function fetchJourney(id: string): Promise<JourneyDetail | null> {
  if (!UUID.test(id)) return null
  const { data: base, error } = await supabase.from('thematic_itineraries').select('*')
    .eq('id', id).eq('is_published', true).maybeSingle()
  if (error) throw error
  if (!base) return null

  const today = new Date().toISOString().slice(0, 10)
  const [op, days, avail, revs] = await Promise.allSettled([
    base.operator_id ? supabase.from('tour_operators').select('*').eq('id', base.operator_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.from('itinerary_days').select('*, activities:itinerary_activities(*)').eq('itinerary_id', id).order('day_number'),
    supabase.from('itinerary_availability').select('*').eq('itinerary_id', id).gte('available_date', today).order('available_date').limit(30),
    supabase.from('itinerary_reviews').select('*').eq('itinerary_id', id).order('created_at', { ascending: false }).limit(100),
  ])
  const ok = <T,>(r: PromiseSettledResult<{ data: T | null; error: unknown }>) =>
    r.status === 'fulfilled' && !r.value.error ? r.value.data : null

  const o = ok(op) as Row | null
  return {
    id: String(base.id), title: base.title ?? '', tagline: base.tagline ?? null, description: base.description ?? null,
    themeLabel: base.theme_label ?? '', location: base.location_label ?? null,
    gallery: [base.hero_image_url, ...(base.gallery_urls ?? [])].filter((u: string) => !!u).filter((u: string, i: number, a: string[]) => a.indexOf(u) === i),
    durationValue: num(base.duration_value) ?? 1, durationUnit: base.duration_unit ?? 'days', maxGroup: num(base.max_group),
    startTimes: base.start_times ?? [], bestMonths: base.best_months ?? [], highlights: base.highlights ?? [],
    included: base.included ?? [], excluded: base.excluded ?? [], meetingPoint: base.meeting_point ?? null,
    lat: num(base.meeting_lat), lng: num(base.meeting_lng), accessibility: base.accessibility_note ?? null,
    cancellationPolicy: base.cancellation_policy ?? null, freeCancelHours: num(base.free_cancellation_hours),
    instantBook: Boolean(base.instant_book), price: num(base.price_adult) ?? 0, priceChild: num(base.price_child),
    currency: base.currency ?? 'USD', taxesIncluded: Boolean(base.taxes_included),
    depositPercent: num(base.deposit_percent), balanceDueDays: num(base.balance_due_days) ?? 0,
    payLaterAllowed: Boolean(base.pay_later_allowed), serviceFeePercent: num(base.service_fee_percent) ?? 0,
    timezone: base.timezone ?? 'UTC',
    operator: o ? { id: String(o.id), name: o.name ?? '', verified: o.verification_status === 'verified', years: num(o.years_in_operation),
      country: o.headquarters_country ?? null, email: o.contact_email ?? null, phone: o.contact_phone ?? null, website: o.website ?? null } : null,
    days: ((ok(days) as Row[] | null) ?? []).map(d => ({
      id: String(d.id), n: d.day_number, title: d.title ?? '', description: d.description ?? null,
      activities: ((d.activities ?? []) as Row[]).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(a => ({
        id: String(a.id), name: a.name ?? '', description: a.description ?? null, durationText: a.duration_text ?? null, imageUrl: a.image_url ?? null })),
    })),
    slots: ((ok(avail) as Row[] | null) ?? []).filter(s => (num(s.spots_left) ?? 1) > 0)
      .map(s => ({ date: s.available_date, price: num(s.price_adult), priceChild: num(s.price_child), spots: num(s.spots_left) })),
    reviews: ((ok(revs) as Row[] | null) ?? []).map(r => ({
      id: String(r.id), name: r.reviewer_name ?? 'Traveller', country: r.reviewer_country ?? null, type: r.traveller_type ?? null,
      rating: num(r.rating) ?? 0, comment: r.comment ?? null, tripDate: r.trip_date ?? null,
      verified: Boolean(r.verified_booking), reply: r.operator_reply ?? null })),
  }
}

export const useJourneys = () => useQuery({ queryKey: ['journeys'], queryFn: fetchJourneys, staleTime: 5 * 60_000 })
export const useJourney = (id?: string) => useQuery({ queryKey: ['journey', id], enabled: !!id, queryFn: () => fetchJourney(id!), staleTime: 2 * 60_000 })
