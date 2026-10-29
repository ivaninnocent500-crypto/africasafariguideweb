import { Link } from 'react-router-dom'
import { SITE } from '../config/site'

interface FooterLink { label: string; to?: string; href?: string }

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  { title: 'Explore', links: [
    { label: 'Travel intelligence', to: '/' },
    { label: 'Last-minute deals', to: '/live' },
    { label: 'Journeys and experiences', to: '/journeys' },
  ] },
  { title: 'Visa help', links: [
    { label: 'Visa requirements', to: '/visa' },
    { label: 'My applications', to: '/visa/applications' },
    { label: 'Sign in or create account', to: '/signin' },
  ] },
  { title: 'Support and legal', links: [
    { label: 'Contact support', href: `mailto:${SITE.email}` },
    { label: 'Privacy policy', to: '/privacy' },
    { label: 'Terms of service', to: '/terms' },
    { label: 'Refunds and cancellations', to: '/refunds' },
    { label: 'Delete your account', to: '/delete-account' },
  ] },
]

const linkClass =
  'text-sm text-ivory/75 underline-offset-4 decoration-brass transition hover:text-white hover:underline focus-visible:text-white focus-visible:underline'

export default function SiteFooter() {
  return (
    <footer className="footer-contours mt-24 bg-evergreen text-ivory" aria-label="Site footer">
      <div className="mx-auto max-w-6xl px-5 pt-16 sm:px-6">
        {/* Editorial band */}
        <div className="flex flex-col gap-8 border-b border-brass/25 pb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brass">Plan your journey</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-white sm:text-4xl">Africa, planned with care.</h2>
            <p className="mt-3 text-ivory/75">Live travel intelligence, verified local operators and visa help in one place.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/journeys" className="rounded-full bg-ivory px-6 py-3 text-sm font-semibold text-evergreen transition hover:bg-white">
              Explore journeys
            </Link>
            <Link to="/visa" className="rounded-full border border-brass/60 px-6 py-3 text-sm font-semibold text-ivory transition hover:border-brass hover:text-white">
              Check visa requirements
            </Link>
          </div>
        </div>

        {/* Four columns */}
        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3" aria-label={`${SITE.name} home`}>
              <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
                <rect width="64" height="64" rx="14" fill="#0a2c21" />
                <path d="M12 46 32 14l20 32z" fill="#b8a06b" />
                <circle cx="32" cy="40" r="6" fill="#f5efe1" />
              </svg>
              <span className="font-serif text-xl tracking-wide text-white">{SITE.name}</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/75">
              Travel intelligence, verified local operators and visa help for your journey across Africa.
            </p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-brass">Headquartered in Tanzania</p>
            <a href={`mailto:${SITE.infoEmail}`} className={`${linkClass} mt-2 inline-block`}>{SITE.infoEmail}</a>
          </div>

          {COLUMNS.map(col => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-brass">{col.title}</h3>
              <ul className="mt-5 space-y-3">
                {col.links.map(l => (
                  <li key={l.label}>
                    {l.to ? <Link to={l.to} className={linkClass}>{l.label}</Link>
                          : <a href={l.href} className={linkClass}>{l.label}</a>}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Base bar */}
      <div className="bg-charcoal">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-ivory/70 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {SITE.company}. All rights reserved.</p>
          <p>A private travel service, not affiliated with any government.</p>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-fit text-left transition hover:text-white focus-visible:text-white">
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  )
}
