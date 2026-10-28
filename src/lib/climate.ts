import type { Destination } from './githubData'

export interface MonthClimate { month: number; tMax: number; tMin: number; rainMm: number }
export interface ClimateResult { months: MonthClimate[]; fromYear: number; toYear: number }

const TTL_MS = 90 * 86_400_000
const key = (id: string) => `climate:v1:${id}`

export async function fetchClimate(d: Destination): Promise<ClimateResult> {
  try {
    const hit = JSON.parse(localStorage.getItem(key(d.id)) ?? 'null')
    if (hit && Date.now() - hit.at < TTL_MS) return hit.data as ClimateResult
  } catch { /* ignore a corrupt cache */ }

  const toYear = new Date().getFullYear() - 1
  const fromYear = toYear - 4
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${d.latitude}&longitude=${d.longitude}` +
    `&start_date=${fromYear}-01-01&end_date=${toYear}-12-31` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Climate HTTP ${res.status}`)
  const j = await res.json()

  const acc = Array.from({ length: 12 }, () => ({ max: 0, nMax: 0, min: 0, nMin: 0, rain: 0 }))
  ;(j.daily.time as string[]).forEach((t, i) => {
    const a = acc[Number(t.slice(5, 7)) - 1]
    const hi = j.daily.temperature_2m_max[i], lo = j.daily.temperature_2m_min[i], r = j.daily.precipitation_sum[i]
    if (hi != null) { a.max += hi; a.nMax++ }
    if (lo != null) { a.min += lo; a.nMin++ }
    if (r != null) a.rain += r
  })
  const years = toYear - fromYear + 1
  const data: ClimateResult = {
    fromYear, toYear,
    months: acc.map((a, i) => ({
      month: i + 1,
      tMax: a.nMax ? a.max / a.nMax : NaN,
      tMin: a.nMin ? a.min / a.nMin : NaN,
      rainMm: a.rain / years, // average rainfall per month
    })),
  }
  try { localStorage.setItem(key(d.id), JSON.stringify({ at: Date.now(), data })) } catch { /* quota */ }
  return data
}

export const rainLabel = (mm: number) => (mm < 30 ? 'Dry' : mm < 100 ? 'Some rain' : 'Wet season')
export const seasonLabel = (s: number) =>
  s >= 0.75 ? 'Excellent' : s >= 0.5 ? 'Good' : s >= 0.25 ? 'Fair' : 'Low season'
