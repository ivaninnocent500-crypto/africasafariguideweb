import { Link } from 'react-router-dom'
import { SITE } from '../config/site'

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2">
        <div className="space-y-2 text-sm text-muted">
          <p className="text-base font-bold text-navy">{SITE.name}</p>
          <p>A travel service, not a government website or embassy. Entry rules change, so always confirm with the official source before you travel.</p>
          <p>© {new Date().getFullYear()} {SITE.company}</p>
        </div>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          <li><Link className="hover:text-teal" to="/privacy">Privacy policy</Link></li>
          <li><Link className="hover:text-teal" to="/terms">Terms of service</Link></li>
          <li><Link className="hover:text-teal" to="/refunds">Refunds and cancellations</Link></li>
          <li><Link className="hover:text-teal" to="/delete-account">Delete your account</Link></li>
          <li><a className="hover:text-teal" href={`mailto:${SITE.email}`}>Contact us</a></li>
        </ul>
      </div>
    </footer>
  )
}
