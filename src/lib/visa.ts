import { useQuery } from '@tanstack/react-query'

const RULES_URL = 'https://raw.githubusercontent.com/ivaninnocent500-crypto/rules-visa/refs/heads/main/visa_rules.json'
const CACHE = 'visa:rules:v1'

export type Policy = 'VISA_FREE' | 'VISA_ON_ARRIVAL' | 'E_VISA' | 'EMBASSY_REQUIRED' | 'REFERRAL_REQUIRED'
export type Tone = 'positive' | 'neutral' | 'action' | 'warning'

export interface Override {
  matchGroup?: string | null; matchNationalityCode?: string | null; policy?: Policy | null
  govFee?: number | null; serviceFee?: number | null; documents?: string[] | null
  note?: string | null; canApplyInApp?: boolean; priority?: number
}
export interface CountryRule {
  countryId: number; countryCode: string; countryName: string; region: string; flagEmoji: string
  basePolicy: Policy; baseGovFee: number; baseServiceFee: number; processingTime: string
  validityDays: number; baseDocuments: string[]; officialSource: string; tips?: string[]; overrides?: Override[]
}
export interface NationalityGroup { code: string; name: string; memberNationalityCodes: string[] }
export interface GroupVisa {
  id: string; name: string; memberCountryIds: number[]; govFee: number; serviceFee: number
  processingTime: string; validityDays: number; documents: string[]; officialLink: string; pitch: string
}
export interface RulesBundle { schemaVersion: number; updatedAt: string; countries: CountryRule[]; nationalityGroups: NationalityGroup[]; groupVisas: GroupVisa[] }

export interface VisaDecision {
  country: CountryRule; nationality: string; policy: Policy; canApply: boolean
  govFee: number; serviceFee: number; totalFee: number; documents: string[]
  note: string | null; groupVisa: GroupVisa | null
  headline: string; detail: string; tone: Tone; shortLabel: string
}

export function passportName(code: string) {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) ?? code } catch { return code }
}

export function decide(b: RulesBundle, countryId: number, nationality: string): VisaDecision | null {
  const rule = b.countries.find(c => c.countryId === countryId)
  if (!rule) return null
  const n = nationality.trim().toUpperCase()
  const groups = b.nationalityGroups.filter(g => g.memberNationalityCodes.some(c => c.toUpperCase() === n)).map(g => g.code)
  const m = (rule.overrides ?? [])
    .filter(o => o.matchNationalityCode?.toUpperCase() === n || (o.matchGroup && groups.includes(o.matchGroup)))
    .sort((a, c) => Number(!!c.matchNationalityCode) - Number(!!a.matchNationalityCode) || (c.priority ?? 0) - (a.priority ?? 0))[0]

  const policy = m?.policy ?? rule.basePolicy
  const govFee = m?.govFee ?? rule.baseGovFee
  const serviceFee = m?.serviceFee ?? rule.baseServiceFee
  const days = rule.validityDays
  const who = `${passportName(n)} passport holders`

  const copy: Record<Policy, { headline: string; detail: string; tone: Tone; short: string }> = {
    VISA_FREE: { headline: `Visa-free for up to ${days} days`, detail: `${rule.countryName} lets ${who} enter without a visa for up to ${days} days.`, tone: 'positive', short: 'Visa free' },
    VISA_ON_ARRIVAL: { headline: 'Visa on arrival', detail: `${who} can get a visa at the border or airport on arrival in ${rule.countryName}.`, tone: 'neutral', short: 'On arrival' },
    E_VISA: { headline: 'eVisa required before travel', detail: `Apply online before you fly. Typical processing: ${rule.processingTime}.`, tone: 'action', short: 'eVisa' },
    EMBASSY_REQUIRED: { headline: 'Embassy application required', detail: 'This route needs an embassy or consulate application. Final approval is made by the embassy.', tone: 'warning', short: 'Embassy' },
    REFERRAL_REQUIRED: { headline: 'Referral and security clearance required', detail: 'Your nationality needs an additional clearance step that cannot be handled online. Contact the embassy early.', tone: 'warning', short: 'Referral' },
  }
  const c = copy[policy]
  return {
    country: rule, nationality: n, policy, govFee, serviceFee, totalFee: govFee + serviceFee,
    canApply: (m?.canApplyInApp ?? true) && (policy === 'E_VISA' || policy === 'EMBASSY_REQUIRED'),
    documents: [...new Set(m?.documents ?? rule.baseDocuments)], note: m?.note ?? null,
    groupVisa: b.groupVisas.find(g => g.memberCountryIds.includes(countryId)) ?? null,
    headline: c.headline, detail: c.detail, tone: c.tone, shortLabel: c.short,
  }
}

/** Every ISO region the browser knows, minus the non-country codes. */
export function nationalities() {
  const dn = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' })
  const skip = new Set(['ZZ', 'EU', 'UN', 'EZ', 'XA', 'XB', 'QO', 'AC', 'CP', 'DG', 'EA', 'IC', 'TA'])
  const out: { code: string; name: string }[] = []
  const A = 65
  for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) {
    const code = String.fromCharCode(A + i, A + j)
    if (skip.has(code)) continue
    try { const name = dn.of(code); if (name && name !== code) out.push({ code, name }) } catch { /* invalid */ }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

async function fetchRules(): Promise<RulesBundle> {
  try {
    const res = await fetch(RULES_URL, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`Visa rules: HTTP ${res.status}`)
    const data = (await res.json()) as RulesBundle
    try { localStorage.setItem(CACHE, JSON.stringify(data)) } catch { /* quota */ }
    return data
  } catch (e) {
    const cached = localStorage.getItem(CACHE)
    if (cached) return JSON.parse(cached) as RulesBundle
    throw e
  }
}

export const useVisaRules = () => useQuery({ queryKey: ['visa-rules'], queryFn: fetchRules, staleTime: 10 * 60_000, retry: 1 })

export const toneClass: Record<Tone, string> = {
  positive: 'bg-green-500/15 text-green-300', neutral: 'bg-white/10 text-ink',
  action: 'bg-gold-soft text-gold', warning: 'bg-red-500/15 text-red-300',
}

const NAT_KEY = 'visa:nat'
export const getNat = () => { try { return localStorage.getItem(NAT_KEY) } catch { return null } }
export const setNat = (c: string) => { try { localStorage.setItem(NAT_KEY, c) } catch { /* ignore */ } }

export interface VisaTarget {
  countryId: number; groupId: string | null; name: string; flag: string; nationality: string
  policy: Policy; govFee: number; serviceFee: number; documents: string[]
  processingTime: string; validityDays: number; officialSource: string
}

export function targetForCountry(b: RulesBundle, countryId: number, nat: string): VisaTarget | null {
  const d = decide(b, countryId, nat)
  if (!d || !d.canApply) return null
  return {
    countryId, groupId: null, name: d.country.countryName, flag: d.country.flagEmoji, nationality: d.nationality,
    policy: d.policy, govFee: d.govFee, serviceFee: d.serviceFee, documents: d.documents,
    processingTime: d.country.processingTime, validityDays: d.country.validityDays, officialSource: d.country.officialSource,
  }
}

export function targetForGroup(b: RulesBundle, groupId: string, nat: string): VisaTarget | null {
  const g = b.groupVisas.find(x => x.id === groupId)
  if (!g) return null
  const names = g.memberCountryIds.map(id => b.countries.find(c => c.countryId === id)?.countryName).filter(Boolean) as string[]
  return {
    countryId: -1, groupId: g.id, name: names.join(' + ') || g.name, flag: '🌍', nationality: nat.toUpperCase(),
    policy: 'E_VISA', govFee: g.govFee, serviceFee: g.serviceFee, documents: [...new Set(g.documents)],
    processingTime: g.processingTime, validityDays: g.validityDays, officialSource: g.officialLink,
  }
}
