import { SITE } from '../../config/site'

export interface Section { h: string; p?: string[]; ul?: string[] }
export interface Doc { title: string; intro: string; sections: Section[] }

// Keep published wording at the level of categories and outcomes.
// Do not add vendor names, system names, paths or technical settings to these pages.

export const PRIVACY: Doc = {
  title: 'Privacy policy',
  intro: `${SITE.company} ("we", "us") provides ${SITE.name}, a website and mobile app for travel planning, tour bookings and visa assistance. This policy explains what personal information we collect, why we use it, and the choices you have.`,
  sections: [
    { h: 'Information we collect', ul: [
      'Account details: your name, email address and, optionally, your location.',
      'Visa applications: each traveller\'s name, passport details, date of birth, nationality and contact details, and the supporting documents you upload.',
      'Booking requests: your name, contact details, nationality, travel dates, group size, emergency contact, and any dietary, accessibility or other notes you choose to give us.',
      'Payments: we record the status and reference of each payment. We do not store full payment card details.',
      'Basic technical information, such as device and browser type, needed to run and protect the service.',
    ] },
    { h: 'How we use it', ul: [
      'To provide what you ask for: show visa rules, prepare and submit visa applications, and send booking requests to tour operators.',
      'To send you messages about your applications, bookings and payments.',
      'To keep the service secure, prevent fraud, and meet our legal and accounting obligations.',
    ] },
    { h: 'Who we share it with', p: ['We do not sell your personal information. We share it only when needed to deliver what you asked for:'], ul: [
      'Tour operators and suppliers, for the bookings you request.',
      'Embassies, government authorities and visa processing partners, for your visa application.',
      'Trusted service providers that help us run the service, such as hosting, data storage, sign-in, email and payment providers. They may use your information only for that purpose.',
      'Authorities or professional advisers, where the law requires it.',
    ] },
    { h: 'Where your information is handled', p: ['Your information may be stored or processed in countries other than your own. Where this happens we take reasonable steps to protect it. Visa applications are necessarily sent to the authorities of the country you plan to visit.'] },
    { h: 'How long we keep it', ul: [
      'Visa application details and documents: only as long as needed to process your application and meet legal requirements. You can ask us to delete them at any time.',
      'Booking and payment records: as long as the law requires for accounting and dispute purposes.',
      'Account details: until you delete your account.',
    ] },
    { h: 'Your choices and rights', p: [`You can ask to access, correct or delete your personal information, or to object to how we use it. You can delete your account yourself from your Profile page. For anything else, email ${SITE.email}. We aim to reply within 30 days.`] },
    { h: 'Security', p: ['We use safeguards such as encryption in transit, access controls and restricted staff access to protect your information. No online service is completely secure, so please keep your sign-in details private.'] },
    { h: 'Cookies and similar technologies', p: ['We use only the cookies and browser storage needed to run the service, for example to remember your preferences. We do not use advertising cookies.'] },
    { h: 'Children', p: ['Our services are for adults making travel arrangements. A booking may include children travelling with them, and their details must be provided by an adult authorised to do so.'] },
    { h: 'Changes to this policy', p: ['We may update this policy from time to time. The year at the top shows when it was last revised.'] },
    { h: 'Contact us', p: [`Questions or requests? Email ${SITE.email}. ${SITE.company}, ${SITE.address}.`] },
  ],
}

export const TERMS: Doc = {
  title: 'Terms of service',
  intro: `These terms apply when you use ${SITE.name}, operated by ${SITE.company} in ${SITE.country}. By creating an account or using the service, you agree to them.`,
  sections: [
    { h: 'What we do', p: [
      'We are a private travel service. We are not a government, embassy or consulate.',
      'We provide travel and visa information, help you prepare and submit visa applications, and send your booking requests to tour operators. The operator delivering your trip is named on every listing.',
    ] },
    { h: 'Visa services', ul: [
      'Visa rules change. Our information is guidance, and the official source always prevails.',
      'Only the issuing authority decides whether a visa is granted. We cannot guarantee approval or processing times.',
      'You must give accurate, complete information and genuine documents. Mistakes or false information can lead to refusal.',
      'You can always apply directly through the official government portal instead of using our service.',
    ] },
    { h: 'Prices and bookings', ul: [
      'Prices shown on the website are confirmed prices, including any fees we charge. They are shown before you submit.',
      'A booking request becomes a confirmed booking when the operator accepts it and you receive confirmation.',
      'Each listing shows its cancellation terms. See our refund and cancellation policy for how refunds work.',
    ] },
    { h: 'Payments', p: ['Amounts are shown in the currency stated. We will tell you how to pay, and your application or booking is processed once payment is confirmed.'] },
    { h: 'Your account', p: ['Keep your sign-in details private and tell us if you think your account was misused. You are responsible for activity on your account. We may suspend accounts that break these terms.'] },
    { h: 'Acceptable use', p: ['Do not submit forged documents or documents belonging to someone else without their permission, try to break or overload the service, or copy our data at scale.'] },
    { h: 'Travel risks', p: ['Travel carries risks, including health, safety and weather. Check official travel advisories, health requirements and insurance before you travel. These are your responsibility.'] },
    { h: 'Our liability', p: ['We provide the service with reasonable care. To the extent the law allows, we are not responsible for decisions made by authorities, for the acts of tour operators, or for indirect losses, and our total liability for a claim is limited to the fees you paid us for the service concerned. Nothing in these terms limits any right or liability that cannot be limited by law.'] },
    { h: 'Governing law', p: [`These terms are governed by the laws of ${SITE.country}. Consumer rights that cannot be excluded still apply.`] },
    { h: 'Changes and contact', p: [`We may update these terms, and the year at the top shows the latest revision. Questions? Email ${SITE.email}.`] },
  ],
}

export const REFUNDS: Doc = {
  title: 'Refund and cancellation policy',
  intro: 'How refunds and cancellations work for visa applications and for journeys and experiences.',
  sections: [
    { h: 'Visa applications', ul: [
      'Draft applications cost nothing. You are asked to pay only after you submit.',
      'Before we submit your application to the authority, you can cancel for a full refund of everything you paid.',
      'After we submit it, the government fee cannot be refunded because it has been paid to the authority, and our service fee covers work already done.',
      'If we cannot process your route, or we fail to submit because of our own error, you receive a full refund.',
      'If the authority refuses your application, fees are not refunded. We will explain the reason where we can.',
    ] },
    { h: 'Journeys and experiences', ul: [
      'Each listing shows its free-cancellation deadline. Cancel before it for a full refund of what you paid.',
      'After the deadline, the cancellation terms shown on the listing apply, and the refund may be partial or none.',
      'If an operator cancels or cannot deliver your trip, you can choose a full refund or a new date.',
      'Missed trips (no-shows) are not refunded.',
    ] },
    { h: 'How to ask for a refund', p: [`Email ${SITE.email} with your booking or application reference. Approved refunds go back to the original payment method, usually within 5 to 10 business days, although your bank may take longer.`] },
    { h: 'Your legal rights', p: ['Nothing in this policy affects rights you have under the law.'] },
  ],
}

export const DELETION: Doc = {
  title: 'Delete your account',
  intro: `You can delete your ${SITE.name} account and personal information at any time.`,
  sections: [
    { h: 'How to delete it', ul: [
      'On the website: sign in, open Profile and choose "Delete my account".',
      'In the mobile app: open Account and choose the delete option.',
      `Cannot sign in? Email ${SITE.email} from the address on your account and we will help.`,
    ] },
    { h: 'What is deleted', ul: [
      'Your profile, sign-in account and saved preferences.',
      'Draft and unpaid visa applications, and every document you uploaded.',
      'Your name, contact details, emergency contact and notes on bookings.',
    ] },
    { h: 'What we may keep', p: ['Records of payments and approved applications may be kept for accounting and legal reasons. We remove your name, email, passport details and documents from them and keep only the reference, amounts and dates.'] },
    { h: 'Before you delete', p: ['We cannot delete an account that has an application under review or an upcoming booking. Cancel the booking or contact us first. Deletion is permanent and cannot be undone.'] },
  ],
}
