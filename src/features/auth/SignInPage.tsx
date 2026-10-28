import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthProvider'

function message(e: unknown) {
  const c = (e as { code?: string }).code ?? ''
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(c)) return 'Email or password is incorrect.'
  if (c === 'auth/email-already-in-use') return 'An account with this email already exists. Try signing in.'
  if (c === 'auth/weak-password') return 'Use at least 6 characters for your password.'
  if (c === 'auth/invalid-email') return 'Enter a valid email address.'
  if (c === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.'
  if (c === 'auth/operation-not-allowed') return 'Email sign-in is not enabled in Firebase yet.'
  return 'Something went wrong. Please try again.'
}

export default function SignInPage() {
  const { signIn, signUp, reset } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/visa/applications'

  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null); setInfo(null)
    try {
      if (mode === 'in') { await signIn(email, pw); nav(dest, { replace: true }) }
      else if (mode === 'up') { await signUp(name, email, pw); nav(dest, { replace: true }) }
      else { await reset(email); setInfo('If an account exists for that email, a reset link is on its way.') }
    } catch (x) { setErr(message(x)) } finally { setBusy(false) }
  }

  const input = 'w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-gold'
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">
        {mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create your account' : 'Reset password'}
      </h1>
      <p className="mt-2 text-muted">Use the same account as the Africa Safari Guide app.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === 'up' && <input className={input} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />}
        <input className={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        {mode !== 'reset' && <input className={input} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} required minLength={6}
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />}
        {err && <p className="text-sm text-red-300">{err}</p>}
        {info && <p className="text-sm text-gold">{info}</p>}
        <button disabled={busy} className="w-full rounded-full bg-gold px-6 py-3 font-semibold text-gold-ink disabled:opacity-60">
          {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send reset link'}
        </button>
      </form>
      <div className="mt-6 flex justify-between text-sm text-muted">
        {mode === 'in' ? (<><button onClick={() => setMode('up')} className="hover:text-gold">Create an account</button><button onClick={() => setMode('reset')} className="hover:text-gold">Forgot password?</button></>)
          : <button onClick={() => setMode('in')} className="hover:text-gold">← Back to sign in</button>}
      </div>
    </main>
  )
}
