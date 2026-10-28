import { HttpError } from './firebase.js'

const RULES_URL = process.env.VISA_RULES_URL ??
  'https://raw.githubusercontent.com/ivaninnocent500-crypto/rules-visa/refs/heads/main/visa_rules.json'

interface Override { matchGroup?: string | null; matchNationalityCode?: string | null; govFee?: number | null; serviceFee?: number | null; priority?: number }
interface Country { countryId: number; baseGovFee: number; baseServiceFee: number; overrides?: Override[] }
interface Rules {
  countries?: Country[]
  nationalityGroups?: { code: string; memberNationalityCodes: string[] }[]
  groupVisas?: { id: string; govFee: number; serviceFee: number }[]
}
const r2 = (x: number) => Math.round(x * 100) / 100

/** Recomputes what an application should cost from the published rules. Never trusts stored fees. */
export async function expectedFees(app: Record<string, unknown>) {
  let rules: Rules
  try {
    const r = await fetch(RULES_URL, { headers: { 'Cache-Control': 'no-cache' } })
    if (!r.ok) throw new Error(String(r.status))
    rules = (await r.json()) as Rules
  } catch { throw new HttpError(503, 'We could not verify the price right now. Please try again shortly.') }

  const n = Math.max(1, Number(app.travellerCount ?? (Array.isArray(app.travellers) ? app.travellers.length : 1)))
  let gov: number, service: number

  if (app.groupVisaId) {
    const g = rules.groupVisas?.find(x => x.id === app.groupVisaId)
    if (!g) throw new HttpError(409, 'This visa is no longer available online. Please contact support.')
    gov = g.govFee; service = g.serviceFee
  } else {
    const c = rules.countries?.find(x => x.countryId === Number(app.destinationCountryId))
    if (!c) throw new HttpError(409, 'This destination is no longer available online. Please contact support.')
    const nat = String(app.userNationality ?? '').toUpperCase()
    const groups = (rules.nationalityGroups ?? [])
      .filter(g => g.memberNationalityCodes?.some(m => m.toUpperCase() === nat)).map(g => g.code)
    const m = (c.overrides ?? [])
      .filter(o => o.matchNationalityCode?.toUpperCase() === nat || (o.matchGroup && groups.includes(o.matchGroup)))
      .sort((a, b) => Number(!!b.matchNationalityCode) - Number(!!a.matchNationalityCode) || (b.priority ?? 0) - (a.priority ?? 0))[0]
    gov = m?.govFee ?? c.baseGovFee
    service = m?.serviceFee ?? c.baseServiceFee
  }
  return { gov: r2(gov * n), service: r2(service * n), total: r2((gov + service) * n) }
}
