export function formatMoney(amount: number, currency: string) {
  const whole = Number.isInteger(amount)
  const body = whole ? String(amount) : amount.toFixed(2)
  return currency.toUpperCase() === 'USD' ? `$${body}` : `${currency} ${body}`
}

export function durationLabel(value: number, unit: string) {
  const word = unit === 'hours' ? (value === 1 ? 'hour' : 'hours') : (value === 1 ? 'day' : 'days')
  return `${value} ${word}`
}
export const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/** months are 1-12. Handles ranges that wrap the year (Nov – Mar). */
export function formatBestMonths(months: number[]) {
  const set = new Set(months.filter(m => m >= 1 && m <= 12))
  if (set.size === 0) return 'Year round'
  if (set.size === 12) return 'All year'
  const has = (m: number) => set.has(((m - 1 + 12) % 12) + 1)
  const ranges: string[] = []
  for (let m = 1; m <= 12; m++) {
    if (!has(m) || has(m - 1)) continue
    let e = m
    while (has(e + 1)) e++
   ranges.push(e === m ? MONTH_SHORT[m - 1] : `${MONTH_SHORT[m - 1]} – ${MONTH_SHORT[(e - 1) % 12]}`)

  }
  return ranges.join(', ')
}
export function timeAgo(d: Date) {
  const m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60_000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`
}