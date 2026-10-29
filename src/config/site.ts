export const SITE = {
  name: 'Africa Safari Guide',
  url: ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, ''),
  tagline: 'Plan your African journey: travel intelligence, verified tour operators, experiences and visa help.',
  company: 'AfricaSafariGuide',
  country: 'Tanzania',
  address: 'Tanzania',
  email: 'support@africasafarisguide.com',
  infoEmail: 'info@africasafarisguide.com',
  whatsapp: (import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined) ?? '',
  legalUpdated: '2026',
}
