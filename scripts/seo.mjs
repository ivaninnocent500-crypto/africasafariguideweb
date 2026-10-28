import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

for (const f of ['.env.local', '.env']) { // lets local builds read your env files
  if (!existsSync(f)) continue
  for (const line of (await readFile(f, 'utf8')).split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const NAME = 'Africa Safari Guide'
const SITE = (process.env.VITE_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '')
const DIST = 'dist'
if (!SITE) { console.warn('[seo] VITE_SITE_URL is not set: skipping sitemap, robots.txt and page meta.'); process.exit(0) }
if (!existsSync(path.join(DIST, 'index.html'))) { console.warn('[seo] dist/index.html not found.'); process.exit(0) }

const SB = process.env.VITE_SUPABASE_URL, KEY = process.env.VITE_SUPABASE_ANON_KEY
const GH = 'https://raw.githubusercontent.com/ivaninnocent500-crypto'
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clip = (s, n = 158) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t }

async function getJson(url, headers, fallback) {
  try {
    const r = await fetch(url, { headers })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return JSON.parse((await r.text()).replace(/([:\[,]\s*)NaN\b/g, '$10'))
  } catch (e) { console.warn('[seo] could not load', url.split('?')[0], e.message); return fallback }
}
const sb = (table, query) => SB && KEY
  ? getJson(`${SB}/rest/v1/${table}?${query}&limit=1000`, { apikey: KEY, Authorization: `Bearer ${KEY}` }, [])
  : Promise.resolve([])
const arr = v => (Array.isArray(v) ? v : [])

const [dests, rules, journeys, experiences] = await Promise.all([
  getJson(`${GH}/africatraveldata/refs/heads/main/destinations.json`, undefined, []),
  getJson(`${GH}/rules-visa/refs/heads/main/visa_rules.json`, undefined, {}),
  sb('v_thematic_cards', 'select=id,title,tagline,hero_image_url,location_label&is_published=eq.true'),
  sb('v_experience_cards', 'select=id,title,tagline,hero_image_url,location_label'),
])

const pages = [
  { p: '/', t: 'Africa travel intelligence', d: 'Trending destinations, best-season picks, events and live last-minute deals across Africa.' },
  { p: '/live', t: 'Last-minute safari deals', d: 'Limited-availability safaris, tours and stays confirmed by verified operators.' },
  { p: '/journeys', t: 'Journeys and experiences in Africa', d: 'Journeys and experiences led by verified local tour operators.' },
  { p: '/visa', t: 'Africa visa requirements by passport', d: 'Pick your passport and see entry rules, fees and documents for every African destination.' },
  { p: '/privacy', t: 'Privacy policy', d: 'How we collect, use and protect your personal data.' },
  { p: '/terms', t: 'Terms of service', d: 'The terms for using Africa Safari Guide.' },
  { p: '/refunds', t: 'Refund and cancellation policy', d: 'How refunds and cancellations work for visa applications and bookings.' },
  { p: '/delete-account', t: 'Delete your account', d: 'How to delete your account and personal data.' },
  ...arr(dests).map(d => ({ p: `/destinations/${d.id}`, t: `${d.name}, ${d.country}`, d: d.shortDescription || d.description, img: d.heroImageUrl })),
  ...arr(journeys).map(j => ({ p: `/journeys/${j.id}`, t: j.title, d: j.tagline || j.location_label, img: j.hero_image_url })),
  ...arr(experiences).map(e => ({ p: `/experiences/${e.id}`, t: e.title, d: e.tagline || e.location_label, img: e.hero_image_url })),
  ...arr(rules.countries).map(c => ({ p: `/visa/${c.countryId}`, t: `${c.countryName} visa requirements`,
    d: `Entry requirements, fees and documents for travelling to ${c.countryName}. Check the rules for your passport.` })),
]

const base = (await readFile(path.join(DIST, 'index.html'), 'utf8'))
  .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
  .replace(/<meta\s+(?:name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\s*/gi, '')
  .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')

function render(pg) {
  const url = SITE + (pg.p === '/' ? '/' : pg.p)
  const title = `${pg.t} | ${NAME}`, desc = clip(pg.d), img = pg.img || `${SITE}/og-default.jpg`
  const head = [
    `<title>${esc(title)}</title>`, `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`, `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${NAME}" />`, `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`, `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`, `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`, `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
  ].join('\n ')
  return base.replace('</head>', ` ${head}\n </head>`)
}

for (const pg of pages) {
  const file = pg.p === '/' ? path.join(DIST, 'index.html') : path.join(DIST, pg.p, 'index.html')
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, render(pg))
}

const today = new Date().toISOString().slice(0, 10)
await writeFile(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map(pg => ` <url><loc>${esc(SITE + (pg.p === '/' ? '/' : pg.p))}</loc><lastmod>${today}</lastmod></url>`).join('\n') + `\n</urlset>\n`)
await writeFile(path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /signin\nDisallow: /profile\nDisallow: /visa/apply/\nDisallow: /visa/applications\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`[seo] wrote ${pages.length} pages, sitemap.xml and robots.txt for ${SITE}`)
