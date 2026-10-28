import { SITE } from '../../config/site'

export interface Section { h: string; p?: string[]; ul?: string[] }
export interface Doc { title: string; intro: string; sections: Section[] }

// IMPORTANT: these are starting defaults, not legal advice. Edit every statement so it matches what
// you really do (retention periods, refund rules, governing law), then have a lawyer review them.

export const PRIVACY: Doc = {
  title: 'Privacy policy',
  intro: `${SITE.company} ("we", "us") runs ${SITE.name}, a website and Android app for travel planning, tour bookings and visa assistance. This policy explains what personal data we collect, why, and the choices you have.`,
  sections: [
    { h: 'What we collect', ul: [
      'Account: your name, email address, optional location, and sign-in details. Passwords are handled by Google Firebase Authentication and we never see them.',
      'Visa applications: each traveller\'s full name, passport number, date of birth, passport expiry date, nationality, email, and the documents you upload (for example a passport scan, proof of address, or a previous visa).',
      'Booking requests: your name, email, nationality, WhatsApp number, emergency contact, names and ages of other travellers, travel dates and group size. Dietary and accessibility notes you give us may reveal health information.',
      'Payments: when online payment is available it is processed by Dodo Payments. We do not see or store full card details. Until then you pay following instructions we email you.',
      'Technical: your browser stores preferences (such as your chosen passport) and cached data on your device. We do not use advertising cookies. Our hosting providers keep standard server logs, including IP addresses.',
    ] },
    { h: 'Why we use it', ul: [
      'To provide the services you ask for: show visa rules, prepare and submit visa applications, and send booking requests to tour operators.',
      'To email you about your applications and bookings, including payment instructions and decisions.',
      'To keep the service secure, prevent fraud and meet our legal obligations.',
    ] },
    { h: 'Who we share it with', p: ['We do not sell your personal data. We share it only as needed with:'], ul: [
      'Tour operators, for the bookings and experiences you request.',
      'Embassies, consulates, government portals and visa processing partners, to handle your visa application.',
      'Service providers that run our platform: Google Firebase (sign-in and application records), Supabase (bookings and document storage), Vercel (hosting), our email provider (Brevo or Resend) and Dodo Payments (payments).',
      'Third-party content services. When your browser loads images, flags or weather data from services such as wsrv.nl, flagcdn.com or Open-Meteo, those services can see your IP address.',
      'Authorities or advisers when the law requires it.',
    ] },
    { h: 'International transfers', p: ['Our providers may process data in countries other than yours. We choose providers that use recognised safeguards, and visa applications are by nature sent to the destination country\'s authorities.'] },
    { h: 'How long we keep it', ul: [
      'Visa application details and uploaded documents: up to 12 months after the application is completed, unless you delete your account sooner.',
      'Payment and booking records: for as long as tax and accounting law requires. When you delete your account we remove your personal details from these records where the law allows.',
      'Account details: until you delete your account.',
    ] },
    { h: 'Your rights', p: ['You can ask us to access, correct, export or delete your personal data, and to stop processing it. You can delete your account yourself at any time from your Profile page. See "Delete your account" for what is removed and what we must keep. To use any other right, email us at ' + SITE.email + '. We reply within 30 days. You can also complain to your local data protection authority.'] },
    { h: 'Security', p: ['Data travels over HTTPS. Uploaded documents are stored in private storage and access is limited to our team. No system is perfectly secure, so please keep your password private.'] },
    { h: 'Children', p: ['Our services are not directed at children under 16. Parents and guardians may add a child as a traveller on their own application.'] },
    { h: 'Changes and contact', p: [`We may update this policy and will change the date above when we do. Questions? Email ${SITE.email} or write to ${SITE.company}, ${SITE.address}.`] },
  ],
}

export const TERMS: Doc = {
  title: 'Terms of service',
  intro: `These terms govern your use of ${SITE.name}, operated by ${SITE.company}. By creating an account or using the service you agree to them.`,
  sections: [
    { h: 'What we are', p: [
      'We are a private travel service. We are not a government, embassy or consulate. We give visa information, help you prepare and submit visa applications, and pass your booking requests to independent tour operators.',
      'Tour operators are independent businesses. Your booking contract for a journey or experience is with the operator, not with us.',
    ] },
    { h: 'Visa services', ul: [
      'Visa rules change. Our information is guidance, and the official source always prevails.',
      'Only the issuing authority decides whether a visa is granted. We cannot guarantee approval or processing times.',
      'You must give accurate, complete information and genuine documents. Mistakes or false information can lead to refusal, and refused fees are usually not recoverable.',
      'You can always apply directly through the official portal instead of using our service.',
    ] },
    { h: 'Bookings and experiences', ul: [
      'Prices shown are estimates until the operator confirms. A request is not a confirmed booking until the operator confirms it.',
      'Each operator sets its own cancellation terms, shown on the listing and at checkout.',
    ] },
    { h: 'Fees and payment', p: ['Visa fees consist of the government fee and our service fee, shown before you submit. Amounts are in US dollars unless stated. We send payment instructions by email, and your application is processed once payment is confirmed.'] },
    { h: 'Your account', p: ['Keep your sign-in details private and tell us if you think your account was misused. You are responsible for activity under your account. We may suspend accounts that break these terms.'] },
    { h: 'Acceptable use', p: ['Do not submit forged or someone else\'s documents without permission, attempt to break or overload the service, or copy our data at scale.'] },
    { h: 'Travel risks', p: ['Travel carries risks, including health, safety and weather. Check official travel advisories, vaccination requirements and insurance before you travel. These are your responsibility.'] },
    { h: 'Liability', p: ['We provide the service with reasonable care. To the extent the law allows, we are not liable for decisions of authorities, acts of tour operators, or indirect losses, and our total liability for any claim is limited to the fees you paid us for the service concerned. Nothing limits liability that cannot be limited by law.'] },
    { h: 'Governing law and changes', p: [`These terms are governed by the laws of ${SITE.country}. We may update them and will change the date above. Questions: ${SITE.email}.`] },
  ],
}

export const REFUNDS: Doc = {
  title: 'Refund and cancellation policy',
  intro: 'How refunds work for visa applications and for journeys and experiences.',
  sections: [
    { h: 'Visa applications', ul: [
      'Draft applications cost nothing. You are only asked to pay after you submit.',
      'Before we submit your application to the authority: you can cancel for a full refund of everything you paid.',
      'After we submit: the government fee is non-refundable because it has been paid to the authority. Our service fee is non-refundable because the work is done.',
      'If we cannot process your route, or we fail to submit because of our own error, you get a full refund.',
      'If the authority refuses your application, fees are not refunded. We will explain the reason where we can.',
    ] },
    { h: 'Journeys and experiences', ul: [
      'Each listing shows its free-cancellation deadline in the operator\'s time zone. Cancel before it for a full refund of what you paid, including our fee.',
      'After the deadline, the operator\'s stated policy applies and the refund may be partial or none.',
      'If the operator cancels or cannot deliver the trip, you are offered a full refund or a new date.',
      'No-shows are not refunded.',
    ] },
    { h: 'How to ask for a refund', p: [`Email ${SITE.email} with your booking or application reference. Approved refunds go back to the original payment method, usually within 5 to 10 business days, although your bank may take longer.`] },
  ],
}

export const DELETION: Doc = {
  title: 'Delete your account',
  intro: `You can delete your ${SITE.name} account and personal data at any time.`,
  sections: [
    { h: 'How to delete it', ul: [
      'On the website: sign in, open Profile, and choose "Delete my account".',
      'In the Android app: open Account and choose "Delete Account Permanently".',
      `Cannot sign in? Email ${SITE.email} from the address on your account and we will do it for you.`,
    ] },
    { h: 'What is deleted', ul: [
      'Your profile, sign-in account, and saved preferences.',
      'Draft and unpaid visa applications, and every document you uploaded.',
      'Your name, contact details, emergency contact and notes on bookings.',
    ] },
    { h: 'What we may keep', p: ['Records of payments and approved applications may be kept for accounting and legal reasons. We remove your name, email, passport details and documents from them and keep only the reference, amounts and dates.'] },
    { h: 'Before you delete', p: ['We cannot delete an account that has an application under review or an upcoming booking. Cancel the booking, or contact us, and then try again. Deletion is permanent and cannot be undone.'] },
  ],
}
