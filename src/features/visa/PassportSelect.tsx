import { useMemo } from 'react'
import { nationalities } from '../../lib/visa'

export default function PassportSelect({ value, onChange }: { value: string | null; onChange: (code: string) => void }) {
  const list = useMemo(nationalities, [])
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">Your passport</span>
      <select value={value ?? ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-gold">
        <option value="" disabled>Select your passport…</option>
        {list.map(n => <option key={n.code} value={n.code}>{n.name}</option>)}
      </select>
    </label>
  )
}
