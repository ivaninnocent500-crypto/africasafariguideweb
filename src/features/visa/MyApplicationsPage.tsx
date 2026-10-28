import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { statusMeta, useMyApplications } from '../../lib/applications'
import { toneClass } from '../../lib/visa'
import { Pill, Skeleton } from '../../components/ui'

export default function MyApplicationsPage() {
  const { user } = useAuth()
  const list = useMyApplications(user?.uid)
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">My applications</h1>
        <Link to="/visa" className="text-sm font-semibold text-gold">New application →</Link>
      </div>
      {list === undefined && <Skeleton className="h-32" />}
      {list && list.length === 0 && <p className="rounded-3xl border border-line bg-card p-8 text-center text-muted">You haven't started an application yet.</p>}
      {list?.map(a => {
        const m = statusMeta[a.status]
        return (
          <Link key={a.id} to={a.status === 'DRAFT' ? `/visa/applications/${a.id}/documents` : `/visa/applications/${a.id}`}
            className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-card p-5 transition hover:border-gold/60">
            <div className="min-w-0">
              <p className="truncate font-bold">{a.destinationCountry}</p>
              <p className="text-sm text-muted">{a.id} · {new Date(a.createdAt).toLocaleDateString('en', { dateStyle: 'medium' })}</p>
            </div>
            <Pill className={toneClass[m.tone]}>{a.status === 'DRAFT' ? 'Continue' : m.label}</Pill>
          </Link>
        )
      })}
    </main>
  )
}
