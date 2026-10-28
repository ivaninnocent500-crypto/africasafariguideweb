import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut as fbSignOut, updateProfile, type User,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'

interface Ctx {
  user: User | null; loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  reset: (email: string) => Promise<void>
  signOut: () => Promise<void>
}
const AuthCtx = createContext<Ctx | null>(null)

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setLoading(false) }), [])

  const value = useMemo<Ctx>(() => ({
    user, loading,
    signIn: async (email, password) => { await signInWithEmailAndPassword(auth, email.trim(), password) },
    signUp: async (name, email, password) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(cred.user, { displayName: name.trim() })
      try {
        await setDoc(doc(db, 'users', cred.user.uid),
          { displayName: name.trim(), email: email.trim(), lastSeenAt: Date.now() }, { merge: true })
      } catch { /* profile sync is best-effort */ }
    },
    reset: async email => { await sendPasswordResetEmail(auth, email.trim()) },
    signOut: async () => { await fbSignOut(auth) },
  }), [user, loading])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
