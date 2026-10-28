import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { SITE } from '../config/site'

const LINKS: [string, string, boolean][] = [['/', 'Intelligence', true], ['/live', 'Live', false], ['/journeys', 'Journeys', false], ['/visa', 'Visa', true]]
const cls = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-teal text-white' : 'text-muted hover:text-ink'}`

export default function SiteHeader() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false) }, [pathname])

  const account = user ? (
    <>
      <NavLink to="/visa/applications" end className={cls}>My applications</NavLink>
      <NavLink to="/profile" className={cls}>Profile</NavLink>
      <button onClick={() => void signOut()} className="rounded-full px-4 py-2.5 text-left text-sm font-medium text-muted hover:text-ink">Sign out</button>
    </>
  ) : <NavLink to="/signin" className={cls}>Sign in</NavLink>

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-sand/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5" aria-label="Main">
        <NavLink to="/" className="text-lg font-bold text-navy">{SITE.name}</NavLink>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={cls}>{label}</NavLink>)}
          {account}
        </div>
        <button className="grid h-11 w-11 place-items-center rounded-full border border-line md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </nav>
      {open && (
        <div className="flex flex-col gap-1 border-t border-line bg-sand px-4 py-3 md:hidden">
          {LINKS.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={cls}>{label}</NavLink>)}
          <div className="mt-2 flex flex-col gap-1 border-t border-line pt-3">{account}</div>
        </div>
      )}
    </header>
  )
}
