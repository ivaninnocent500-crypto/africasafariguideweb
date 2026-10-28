export const SITE = {
  name: 'Africa Safari Guide',
  url: ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, ''),
  tagline: 'Plan your African journey: travel intelligence, verified tour operators, experiences and visa help.',
  company: 'YOUR LEGAL COMPANY NAME', // TODO
  country: 'TANZANIA', // TODO: used for governing law
  address: 'YOUR BUSINESS ADDRESS', // TODO
  email: 'support@yourdomain.com', // TODO: a real mailbox on your domain
  whatsapp: (import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined) ?? '',
  legalUpdated: '25 October 2026',
}