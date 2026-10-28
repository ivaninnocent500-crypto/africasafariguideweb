import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { docKey, useApplication } from '../../lib/applications'
import { uploadDocument } from '../../lib/docUpload'
import { Skeleton } from '../../components/ui'

export default function DocumentsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const app = useApplication(id)
  const [state, setState] = useState<Record<string, string>>({}) // key -> 'uploading' | error text

  if (app === undefined) return <main className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-96" /></main>
  if (!app || !user || app.userId !== user.uid) return <main className="mx-auto max-w-3xl px-4 py-24 text-center text-muted">Application not found.</main>
  if (app.status !== 'DRAFT') return <Navigate to={`/visa/applications/${app.id}`} replace />

  const n = Math.max(1, app.travellers.length)
  const groups = Array.from({ length: n }, (_, i) => ({
    name: app.travellers[i]?.fullName || `Traveller ${i + 1}`,
    docs: app.requiredDocs.map(d => ({ label: d, key: docKey(i, d) })),
  }))
  const all = groups.flatMap(g => g.docs)
  const done = all.filter(d => app.uploadedDocs[d.key]).length
  const complete = all.length > 0 && done === all.length

  async function pick(key: string, file?: File) {
    if (!file || !user || !app) return
    setState(s => ({ ...s, [key]: 'uploading' }))
    try { await uploadDocument(user.uid, app.id, key, file); setState(s => { const c = { ...s }; delete c[key]; return c }) }
    catch (e) { setState(s => ({ ...s, [key]: e instanceof Error ? e.message : 'Upload failed' })) }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <Link to={`/visa/applications/${app.id}/details`} className="text-sm text-muted hover:text-gold">← Edit details</Link>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Upload your documents</h1>
        <p className="mt-1 text-muted">{app.destinationCountry} · {done} of {all.length} uploaded</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line"><div className="h-full bg-gold transition-all" style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} /></div>
      </header>

      {groups.map(g => (
        <section key={g.name} className="space-y-3">
          {n > 1 && <h2 className="font-bold">{g.name}</h2>}
          {g.docs.map(d => {
            const s = state[d.key]
            const uploaded = !!app.uploadedDocs[d.key]
            return (
              <div key={d.key} className="flex items-center gap-4 rounded-3xl border border-line bg-card p-4">
                <span className={`grid h-9 w-9 place-items-center rounded-full ${uploaded ? 'bg-gold text-gold-ink' : 'bg-line text-muted'}`}>{uploaded ? '✓' : '↑'}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{d.label}</p>
                  <p className={`text-sm ${s && s !== 'uploading' ? 'text-red-300' : 'text-muted'}`}>
                    {s === 'uploading' ? 'Uploading…' : s ?? (uploaded ? 'Uploaded' : 'JPG, PNG or PDF, up to 8 MB')}
                  </p>
                </div>
                <label className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-gold">
                  {uploaded ? 'Replace' : 'Choose file'}
                  <input type="file" className="hidden" accept="image/jpeg,image/png,application/pdf" disabled={s === 'uploading'}
                    onChange={e => { void pick(d.key, e.target.files?.[0]); e.target.value = '' }} />
                </label>
              </div>
            )
          })}
        </section>
      ))}

      <p className="text-xs text-muted">Files are sent over HTTPS and stored privately. We check the file type and size here; our team reviews the content.</p>
      <Link to={complete ? `/visa/applications/${app.id}/review` : '#'} aria-disabled={!complete}
        className={`block rounded-full px-6 py-3 text-center font-semibold ${complete ? 'bg-gold text-gold-ink' : 'pointer-events-none bg-line text-muted'}`}>
        Review application
      </Link>
    </main>
  )
}
