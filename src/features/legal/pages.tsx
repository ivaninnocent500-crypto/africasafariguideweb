import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'
import { useSeo } from '../../lib/seo'
import { DELETION, PRIVACY, REFUNDS, TERMS, type Doc } from './content'

function LegalPage({ doc, children }: { doc: Doc; children?: ReactNode }) {
  useSeo({ title: doc.title, description: doc.intro })
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{doc.title}</h1>
        <p className="text-sm text-muted">Last updated {SITE.legalUpdated}</p>
        <p className="text-muted">{doc.intro}</p>
      </header>
      {doc.sections.map(s => (
        <section key={s.h} className="space-y-2">
          <h2 className="text-xl font-bold">{s.h}</h2>
          {s.p?.map(t => <p key={t} className="leading-relaxed text-muted">{t}</p>)}
          {s.ul && <ul className="list-disc space-y-1.5 pl-5 text-muted">{s.ul.map(t => <li key={t}>{t}</li>)}</ul>}
        </section>
      ))}
      {children}
    </main>
  )
}

export const Privacy = () => <LegalPage doc={PRIVACY} />
export const Terms = () => <LegalPage doc={TERMS} />
export const Refunds = () => <LegalPage doc={REFUNDS} />
export const DeleteInfo = () => (
  <LegalPage doc={DELETION}>
    <Link to="/profile" className="inline-block rounded-full bg-teal px-6 py-3 font-semibold text-white">Go to my profile</Link>
  </LegalPage>
)
