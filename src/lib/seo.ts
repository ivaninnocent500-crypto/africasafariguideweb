import { useEffect } from 'react'
import { SITE } from '../config/site'

function meta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

export function useSeo({ title, description, image, noindex }: { title?: string | null; description?: string | null; image?: string | null; noindex?: boolean }) {
  useEffect(() => {
    const full = title ? `${title} | ${SITE.name}` : SITE.name
    const desc = (description ?? SITE.tagline).replace(/\s+/g, ' ').trim().slice(0, 158)
    const origin = SITE.url || window.location.origin
    const url = origin + window.location.pathname
    document.title = full
    meta('name', 'description', desc)
    meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    meta('property', 'og:title', full); meta('property', 'og:description', desc); meta('property', 'og:url', url)
    meta('property', 'og:image', image || `${origin}/og-default.jpg`)
    meta('name', 'twitter:card', 'summary_large_image')
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = url
  }, [title, description, image, noindex])
}
