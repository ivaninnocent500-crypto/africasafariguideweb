import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { deleteMyAccount, loadProfile, saveProfile } from '../../lib/account'
import { useSeo } from '../../lib/seo'

const input = 'w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-teal'

export default function ProfilePage() {
  useSeo({ title: 'Profile', noindex: true })
  const { user } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [saved, setSaved] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle')
  const [confirm, setConfirm] = useState(false)
  const [text, setText] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (user) void loadProfile(user.uid).then(p => { setName(p.name); setLocation(p.location) }).catch(() => undefined) }, [user])
  if (!user) return null

  async function save() {
    setSaved('saving')
    try { await saveProfile(user!.uid, name, location); setSaved('ok') } catch { setSaved('err') }
  }
  async function remove() {
    setBusy(true); setError(null)
    try { await deleteMyAccount(pw); nav('/', { replace: true }) }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); setBusy(false) }
  }

  return (
    <main className="mx-auto max-w-xl space-y-8 px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Your profile</h1>
      <section className="space-y-4 rounded-3xl border border-line bg-card p-6">
        <input className={input} placeholder="Name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
        <input className={input} placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} />
        <input className={`${input} opacity-60`} value={user.email ?? ''} disabled aria-label="Email" />
        <button onClick={() => void save()} disabled={!name.trim() || saved === 'saving'} className="rounded-full bg-teal px-6 py-3 font-semibold text-white disabled:opacity-60">
          {saved === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {saved === 'ok' && <p className="text-sm text-teal">Saved.</p>}
        {saved === 'err' && <p className="text-sm text-red-700">We couldn't save your changes.</p>}
      </section>

      <section className="space-y-3 rounded-3xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-bold text-red-800">Delete my account</h2>
        <p className="text-sm text-red-900/80">This permanently removes your account, drafts and uploaded documents. Records of paid or approved applications are kept without your personal details. It cannot be undone.</p>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-800">Delete my account</button>
        ) : (
          <div className="space-y-3">
            <input className={input} placeholder='Type DELETE to confirm' value={text} onChange={e => setText(e.target.value)} />
            <input className={input} type="password" placeholder="Your password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => void remove()} disabled={busy || text !== 'DELETE' || !pw} className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? 'Deleting…' : 'Permanently delete'}
              </button>
              <button onClick={() => { setConfirm(false); setText(''); setPw(''); setError(null) }} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
