import type { JourneyDetail, Slot } from './journeys'

export interface Promo { code: string; percentOff: number }
export type Plan = 'full' | 'deposit' | 'pay_later'
export interface Quote { adultUnit: number; childUnit: number; adults: number; children: number; subtotal: number; discount: number; serviceFee: number; total: number }

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const ymd = (d: Date, zone?: string) => d.toLocaleDateString('en-CA', zone ? { timeZone: zone } : undefined)
const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

export function quote(j: JourneyDetail, slot: Slot | undefined, adults: number, children: number, promo: Promo | null): Quote {
  const a = Math.max(0, adults), c = Math.max(0, children)
  const adultUnit = slot?.price ?? j.price
  const childUnit = slot?.priceChild ?? j.priceChild ?? adultUnit
  const subtotal = r2(adultUnit * a + childUnit * c)
  const discount = promo ? r2((subtotal * Math.min(100, Math.max(0, promo.percentOff))) / 100) : 0
  const serviceFee = r2(((subtotal - discount) * Math.max(0, j.serviceFeePercent)) / 100)
  return { adultUnit, childUnit, adults: a, children: c, subtotal, discount, serviceFee, total: Math.max(0, r2(subtotal - discount + serviceFee)) }
}

function zonedToDate(date: string, time: string, zone: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const guess = new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0))
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(guess)
    const g = (t: string) => Number(parts.find(p => p.type === t)?.value)
    const asLocal = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'))
    return new Date(guess.getTime() - (asLocal - guess.getTime()))
  } catch { return guess }
}

/** Free-cancellation cut-off in the operator's time zone. null = no free cancellation. */
export function cancelDeadline(j: JourneyDetail, date: string, time: string | null): Date | null {
  if (j.freeCancelHours == null) return null
  return new Date(zonedToDate(date, time ?? '00:00', j.timezone).getTime() - j.freeCancelHours * 3_600_000)
}

export function depositDueDate(j: JourneyDetail, date: string): string | null {
  if (j.depositPercent == null) return null
  const due = addDays(date, -j.balanceDueDays)
  return due > ymd(new Date()) ? due : null
}

export const payLaterOk = (j: JourneyDetail, deadline: Date | null) => j.payLaterAllowed && !!deadline && deadline > new Date()

export function split(j: JourneyDetail, plan: Plan, date: string, total: number, deadline: Date | null) {
  if (plan === 'full') return { dueNow: total, balance: 0, balanceDate: null as string | null }
  if (plan === 'deposit') {
    const now = r2((total * Math.min(100, Math.max(0, j.depositPercent ?? 100))) / 100)
    return { dueNow: now, balance: r2(total - now), balanceDate: addDays(date, -j.balanceDueDays) }
  }
  return { dueNow: 0, balance: total, balanceDate: deadline ? ymd(deadline, j.timezone) : null }
}
