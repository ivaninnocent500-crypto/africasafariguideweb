import type { LiveOpportunity } from '../../lib/githubData'

const LABELS: Record<string, string> = {
  SAFARI: 'Safari', GROUP_TOUR: 'Group tour', BOAT_EXPERIENCE: 'Boat', EXPERIENCE: 'Experience',
  ACCOMMODATION: 'Stay', TRANSFER: 'Transfer', FLIGHT: 'Flight', DAY_HIKE: 'Day hike',
}
export const categoryLabel = (c: string) =>
  LABELS[c] ?? c.toLowerCase().replace(/_/g, ' ').replace(/^\w/, x => x.toUpperCase())

export function seatInfo(o: LiveOpportunity) {
  const noun = o.category === 'ACCOMMODATION' ? 'room' : 'seat'
  const s = o.seatsLeft === 1 ? '' : 's'
  const urgent = o.seatsLeft <= 3 || (o.seatsTotal > 0 && o.seatsLeft / o.seatsTotal <= 0.25)
  return { urgent, text: urgent ? `Only ${o.seatsLeft} ${noun}${s} left` : `${o.seatsLeft} ${noun}s available` }
}

const fmt = (d: Date) => d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })
export function whenLabel(o: LiveOpportunity) {
  if (o.end && o.end.toDateString() !== o.start.toDateString()) return `${fmt(o.start)} – ${fmt(o.end)}`
  return fmt(o.start) + (o.clockTime ? ` · ${o.clockTime}` : '')
}

export const badgeText = (o: LiveOpportunity) =>
  o.badge === 'RARE' ? 'Rare find' : o.badge === 'LAST_MINUTE' ? 'Last minute' : null
