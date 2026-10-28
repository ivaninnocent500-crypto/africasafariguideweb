import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export const TOP_N = 3
const TTL = 30 * 60_000

export interface Operator {
  id: string; name: string; country: string | null; verified: boolean
  email: string | null; phone: string | null; website: string | null
  years: number | null; fleet: number | null; specialty: string | null
  rating: number | null; reviews: number
  responseMin: number | null; successPct: number | null
  cancelPct: number | null; repeatPct: number | null
  priceFrom: number | null; currency: string
  isDefault: boolean; rank: number | null
}
export interface OperatorResult { top: Operator[]; total: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>
const num = (v: unknown) => (v == null || Number.isNaN(Number(v)) ? null : Number(v))
const pct = (v: unknown) => { const n = num(v); return n == null ? null : n <= 1 ? n * 100 : n }

const COLS =
  'id,name,headquarters_country,verification_status,website,contact_email,contact_phone,' +
  'years_in_operation,fleet_size,specializes_in,rating,review_count,response_time_minutes,' +
  'booking_success_rate,cancellation_rate,repeat_customer_rate,' +
  'tour_operator_destinations!inner(destination_id,price_from,price_currency,is_default,is_active,priority_rank)'

function toOperator(r: Row): Operator {
  const raw = r.tour_operator_destinations
  const link: Row = (Array.isArray(raw) ? raw[0] : raw) ?? {}
  const reviews = num(r.review_count) ?? 0
  const spec = Array.isArray(r.specializes_in) ? r.specializes_in[0] : null
  return {
    id: String(r.id), name: r.name ?? '', country: r.headquarters_country ?? null,
    verified: r.verification_status === 'verified',
    email: r.contact_email ?? null, phone: r.contact_phone ?? null, website: r.website ?? null,
    years: num(r.years_in_operation), fleet: num(r.fleet_size),
    specialty: spec ? String(spec).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : null,
    rating: reviews > 0 ? num(r.rating) : null, reviews,
    responseMin: num(r.response_time_minutes), successPct: pct(r.booking_success_rate),
    cancelPct: pct(r.cancellation_rate), repeatPct: pct(r.repeat_customer_rate),
    priceFrom: (num(link.price_from) ?? 0) > 0 ? num(link.price_from) : null,
    currency: link.price_currency || 'USD',
    isDefault: Boolean(link.is_default), rank: num(link.priority_rank),
  }
}

function score(o: Operator) {
  const sentiment = 35 * (Math.min(5, Math.max(0, o.rating ?? 3.5)) / 5)
  const volume = 20 * Math.min(1, Math.log(1 + o.reviews) / Math.log(501))
  const trust = o.verified ? 20 : 0
  const track = 10 * Math.min(1, (o.years ?? 0) / 20)
  const fast = 15 * (1 - Math.min(1, (o.responseMin ?? 240) / 240))
  return sentiment + volume + trust + track + fast
}

async function load(destId: string): Promise<OperatorResult> {
  const { data, error } = await supabase
    .from('tour_operators').select(COLS)
    .eq('tour_operator_destinations.destination_id', destId)
    .eq('tour_operator_destinations.is_active', true)
  if (error) throw error

  const seen = new Set<string>()
  const list: Operator[] = []
  for (const r of (data ?? []) as Row[]) {
    const o = toOperator(r)
    if (o.verified && !seen.has(o.id)) { seen.add(o.id); list.push(o) }
  }
  list.sort((a, b) =>
    Number(b.isDefault) - Number(a.isDefault) ||
    (a.rank ?? 9999) - (b.rank ?? 9999) ||
    score(b) - score(a))
  return { top: list.slice(0, TOP_N), total: list.length }
}

const key = (id: string) => `ops:v1:${id}`
const readCache = (id: string): { at: number; data: OperatorResult } | null => {
  try { return JSON.parse(localStorage.getItem(key(id)) ?? 'null') } catch { return null }
}

export async function fetchOperators(id: string): Promise<OperatorResult> {
  const cached = readCache(id)
  if (cached && Date.now() - cached.at < TTL) return cached.data
  try {
    const data = await load(id)
    try { localStorage.setItem(key(id), JSON.stringify({ at: Date.now(), data })) } catch { /* quota */ }
    return data
  } catch (e) {
    if (cached) return cached.data // offline: show the last known result
    throw e
  }
}

export const useOperators = (destId?: string) =>
  useQuery({ queryKey: ['operators', destId], enabled: !!destId, queryFn: () => fetchOperators(destId!), staleTime: TTL, retry: 1 })
