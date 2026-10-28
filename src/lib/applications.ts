import { useEffect, useState } from 'react'
import { collection, doc, FieldPath, onSnapshot, query, setDoc, updateDoc, where, type DocumentData } from 'firebase/firestore'
import { db } from './firebase'
import type { Tone, VisaTarget } from './visa'

export type AppStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
export interface Traveller { fullName: string; passportNumber: string; dateOfBirth: string; passportExpiry: string }

export interface VisaApplication {
  id: string; userId: string; status: AppStatus; applicationType: string
  destinationCountry: string; destinationCountryId: number; groupVisaId: string | null
  nationality: string; email: string; leadName: string; travellers: Traveller[]
  govFee: number; serviceFee: number; totalFee: number; isPaid: boolean; paymentStatus: string
  requiredDocs: string[]; uploadedDocs: Record<string, string>
  createdAt: number; submittedAt: number | null; visaPdfUrl: string | null
}

export const statusMeta: Record<AppStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' }, SUBMITTED: { label: 'Submitted', tone: 'action' },
  UNDER_REVIEW: { label: 'Under review', tone: 'action' }, APPROVED: { label: 'Approved', tone: 'positive' },
  REJECTED: { label: 'Needs attention', tone: 'warning' },
}

/** Uploads for traveller 1 use the plain document name (same as the app); others are prefixed. */
export const docKey = (i: number, d: string) => (i === 0 ? d : `Traveller ${i + 1} · ${d}`)

function safeStatus(raw: unknown): AppStatus {
  switch (String(raw ?? '').toUpperCase()) {
    case 'SUBMITTED': case 'PENDING': return 'SUBMITTED'
    case 'UNDER_REVIEW': case 'IN_REVIEW': return 'UNDER_REVIEW'
    case 'APPROVED': return 'APPROVED'
    case 'REJECTED': return 'REJECTED'
    default: return 'DRAFT'
  }
}
const millis = (v: unknown): number | null =>
  typeof v === 'number' ? v
    : v && typeof (v as { toMillis?: unknown }).toMillis === 'function' ? (v as { toMillis(): number }).toMillis() : null

function normalize(id: string, d: DocumentData): VisaApplication {
  return {
    id, userId: d.userId ?? '', status: safeStatus(d.status), applicationType: d.applicationType ?? 'COUNTRY',
    destinationCountry: d.destinationCountry ?? '', destinationCountryId: Number(d.destinationCountryId ?? -1),
    groupVisaId: d.groupVisaId ?? null, nationality: d.userNationality ?? '', email: d.userEmail ?? '',
    leadName: d.userFullName ?? '', travellers: Array.isArray(d.travellers) ? d.travellers : [],
    govFee: Number(d.govFee) || 0, serviceFee: Number(d.serviceFee) || 0, totalFee: Number(d.totalFee) || 0,
    isPaid: Boolean(d.isPaid ?? d.paid), paymentStatus: d.paymentStatus ?? 'unpaid',
    requiredDocs: Array.isArray(d.requiredDocsList) ? d.requiredDocsList : [],
    uploadedDocs: d.uploadedDocs && typeof d.uploadedDocs === 'object' ? d.uploadedDocs : {},
    createdAt: millis(d.createdAt) ?? 0, submittedAt: millis(d.submittedAt),
    visaPdfUrl: typeof d.visaPdfUrl === 'string' ? d.visaPdfUrl : null,
  }
}

const detailFields = (t: VisaTarget | Pick<VisaTarget, 'govFee' | 'serviceFee' | 'groupId'>, email: string, ts: Traveller[]) => {
  const n = ts.length
  return {
    ownerDisplayName: ts[0].fullName, userFullName: ts[0].fullName, userEmail: email,
    applicationType: t.groupId ? 'GROUP_VISA' : n > 1 ? 'GROUP' : 'COUNTRY',
    govFee: t.govFee * n, serviceFee: t.serviceFee * n, totalFee: (t.govFee + t.serviceFee) * n,
    travellerCount: n, travellers: ts,
  }
}

export async function createApplication(userId: string, t: VisaTarget, email: string, ts: Traveller[]) {
  const id = `VISA-${Date.now()}`
  await setDoc(doc(db, 'visa_applications', id), {
    applicationId: id, userId, userNationality: t.nationality,
    destinationCountryId: t.countryId, destinationCountry: t.name, groupVisaId: t.groupId ?? null,
    status: 'DRAFT', isPaid: false, paymentStatus: 'unpaid',
    requiredDocsList: t.documents, uploadedDocs: {}, createdAt: Date.now(), source: 'web',
    submittedAt: null, // ← add
    visaPdfUrl: null, // ← add: the admin fills this in
    ...detailFields(t, email, ts),
  })
  return id
}

export const updateApplicationDetails = (id: string, per: Pick<VisaTarget, 'govFee' | 'serviceFee' | 'groupId'>, email: string, ts: Traveller[]) =>
  updateDoc(doc(db, 'visa_applications', id), detailFields(per, email, ts))

export const submitApplication = (id: string) =>
  updateDoc(doc(db, 'visa_applications', id), { status: 'SUBMITTED', submittedAt: Date.now(), paymentStatus: 'awaiting_instructions' })

export const saveUploadedDoc = (id: string, key: string, path: string) =>
  updateDoc(doc(db, 'visa_applications', id), new FieldPath('uploadedDocs', key), path)

/** undefined = loading, null = missing or not yours. */
export function useApplication(id?: string) {
  const [app, setApp] = useState<VisaApplication | null | undefined>(undefined)
  useEffect(() => {
    if (!id) return
    return onSnapshot(doc(db, 'visa_applications', id),
      s => setApp(s.exists() ? normalize(s.id, s.data()) : null), () => setApp(null))
  }, [id])
  return id ? app : null
}

export function useMyApplications(uid?: string) {
  const [list, setList] = useState<VisaApplication[] | undefined>(undefined)
  useEffect(() => {
    if (!uid) return
    // No orderBy: avoids needing a composite index. Sorted in memory instead.
    return onSnapshot(query(collection(db, 'visa_applications'), where('userId', '==', uid)),
      s => setList(s.docs.map(d => normalize(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt)),
      () => setList([]))
  }, [uid])
  return uid ? list : []
}
