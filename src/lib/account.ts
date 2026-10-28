import { EmailAuthProvider, reauthenticateWithCredential, signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function loadProfile(uid: string) {
  const s = await getDoc(doc(db, 'users', uid))
  const d = s.data() ?? {}
  return { name: String(d.name ?? auth.currentUser?.displayName ?? ''), location: String(d.location ?? '') }
}

export async function saveProfile(uid: string, name: string, location: string) {
  await setDoc(doc(db, 'users', uid), { userId: uid, name: name.trim(), location: location.trim() || null }, { merge: true })
  if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name.trim() })
}

export async function deleteMyAccount(password: string) {
  const user = auth.currentUser
  if (!user?.email) throw new Error('Please sign in again.')
  try { await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password)) }
  catch { throw new Error('That password is not correct.') }
  const token = await user.getIdToken(true)
  const res = await fetch('/api/delete-account', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ confirm: 'DELETE' }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? 'We could not delete your account.')
  await signOut(auth)
}
